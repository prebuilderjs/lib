//#if CJS
    const path = require('path');
//#endif

const strRemove = (string, start, end) => {
    return string.slice(0, start) + string.slice(end);
}

const getLineNumber = (string, position) => {
    return [...string.slice(0, position).matchAll(new RegExp(String.fromCharCode(13), 'gi'))].map(l => l.index).length;
}

const noCodeBefore = (code, end) => {
    let lineStart = [...code.slice(0, end).matchAll(new RegExp(String.fromCharCode(13), 'gi'))].map(l => l.index).pop();
    let result = code.slice(lineStart, end);

    result = result.replaceAll(String.fromCharCode(10), ''); // remove newlines
    result = result.replaceAll(String.fromCharCode(13), ''); // remove unquoted chars
    result = result.replaceAll(' ', '');
    
    return !result;
}

/**
 * 
 * @param {string} fileAdress Path or Url of the script. ex: "C:\\myDir\\file.js" or "mysite.com/myscript?myparam"
 * @returns {string} Name with extention.
 */
const getFilename = (fileAdress) => {

    let temp = 'Uknown file';

//#if CJS

    try {

        let url = {};
        try {
            url = new URL(fileAdress);
        } catch {}
        
        temp = path.basename(url.pathname || fileAdress);

    } catch {}
    
//#else

    try {
        
        // get name wether path based slash or backslash
        if (fileAdress.includes('\\')) {
            temp = fileAdress.slice(fileAdress.lastIndexOf('\\') + 1);

        } else {
            temp = fileAdress.slice(fileAdress.lastIndexOf('/') + 1);
        }

        // remove url any parameter
        if (temp.includes('?')) {
            temp = temp.slice(0, temp.indexOf('?'));
        }

    } catch {}

//#endif
    
    return temp;
}

/**
 * @param {string} code     The code that  must be processed.
 * @param {Object} options  
 * ```txt
 * log: boolean             Wether to show this plugin's logs or not, like skipped files and number
 *                          of #if groups found.
 * fileAdress: string       Path or Url of the script (only REQUIRED when logging).
 *                          ex: "C:\\myDir\\file.js" or "mysite.com/myscript?myparam"
 * mode: string             Wether to process when directives are written plainly or used in a comment
 *                          'commented'     -> directives are written plainly
 *                                  ex: "//#if", "//#else", ... and "//#post-code let exampleVar = 5;"
 *                          'plain'         -> directives are written plainly
 *                                  ex: "#if", "#else", ... ("#post-code" not available)
 *                          'both'(default) -> both techniques at the same time
 * ```
 * @returns {string} Processed code.
 */
const preprocess = (code, options = { mode: 'both', log: false }) => {

    // options
    if (typeof code != 'string') {
        throw 'Preprocess directives library: Invalid "code" parameter, a string is expected.';
    } else if (typeof options != 'object') {
        throw 'Preprocess directives library: Invalid "options" parameter, a string is expected.';
    }

    options.defines = options.defines?.constructor.name == 'Array' ? options.defines : [];
    options.mode = ['commented', 'plain'].includes(options.mode) ? options.mode : 'both';

    // utility functions
    const conditionalLog = (message) => {
        if (options.log)
            console.log(message);
        return;
    }
    const generateDirectiveDefinition = (text, commented = false) => {
        let temp = { statement: commented != false ? '//#' + text : '#' + text };
        temp.len = temp.statement.length;
        temp.isPlain = !commented;
        return temp;
    }

    // processing functions
    const getDirectiveInstances = (code, directiveDefinition) => {
        let temp = [...code.matchAll(new RegExp(directiveDefinition.statement, 'gi'))].map(l => l.index);
        temp = temp.filter(a => noCodeBefore(code, a));
        // add details
        for (let i = 0; i < temp.length; i++) {
            temp[i] = { pos: temp[i], len: directiveDefinition.len, isPlain: directiveDefinition.isPlain };
        }
        return temp;
    }

    const generateDirectiveGroups = (code, ifs, elses, endifs, options) => {
        let groups = [];

        if (ifs.length > endifs.length) {
            throw 'An #endif is missing in ' + options.fileAdress;
        } else if (ifs.length < endifs.length) {
            throw 'An #if is missing in ' + options.fileAdress;
        }

        for (let i = 0; i < ifs.length; i++) {

            if (ifs[i].pos > endifs[i].pos) {
                throw '#endif is declared before #if in ' + options.fileAdress + ' line ' + getLineNumber(code, endifs[i].pos);
            } else {

                let elseIndex = -1;

                for (let j = 0; j < elses.length; j++) {
                    if (elses[j].pos > ifs[i].pos && elses[j].pos < endifs[i].pos) {
                        elseIndex = j;
                        break;
                    }
                }

                groups.push({
                    if: ifs[i],
                    else: elseIndex < 0 ? undefined : elses.splice(elseIndex, 1)[0],
                    endif: endifs[i],
                });
            }
        }

        if (elses.length > 0) {
            throw '#else is declared outside #if and #endif in ' + options.fileAdress + ' line ' + getLineNumber(code, elses[0]);
        }
        return groups;
    }

    // check if should run
    let possibleOccurs = ["#if", "#else", "#endif"];
    if (options.mode == 'commented' || options.mode == 'both') {
        possibleOccurs.push("#post-code");
    }
    
    if (!possibleOccurs.some(directive => code.indexOf(directive) >= 0)) {
        conditionalLog('preprocess directives -> skipped: ' + getFilename(options.fileAdress) + " (no directives)");
        return code;
    }

    // Start
    conditionalLog('preprocess directives -> loading: ' + getFilename(options.fileAdress));

    // find directives
    let ifs, elses, endifs;

    if (options.mode == 'plain' || options.mode == 'both') {
        ifs = getDirectiveInstances(code, generateDirectiveDefinition('if ', false));
        elses = getDirectiveInstances(code, generateDirectiveDefinition('else', false));
        endifs = getDirectiveInstances(code, generateDirectiveDefinition('endif', false));
    }

    if (options.mode == 'commented' || options.mode == 'both') {
        ifs = (ifs || []).concat( getDirectiveInstances(code, generateDirectiveDefinition('if ', true)) );
        elses = (elses || []).concat( getDirectiveInstances(code, generateDirectiveDefinition('else', true)) );
        endifs = (endifs || []).concat( getDirectiveInstances(code, generateDirectiveDefinition('endif', true)) );
    }
    
    if (options.mode == 'both') {
        ifs = ifs.sort( (a, b) => a.pos - b.pos );// a < b => false
        elses = elses.sort( (a, b) => a.pos - b.pos );
        endifs = endifs.sort( (a, b) => a.pos - b.pos );
    }

    // retrieve directives groups
    let groups = generateDirectiveGroups(code, ifs, elses, endifs, options);

    conditionalLog('     ' + (groups.length > 0 ? '├' : '└') + '╼╼╼╼╼╼╼➤ found: ' + groups.length + ' #if groups.');

    // process groups (in reverse to avoid updating positions after each iteration)
    for (let i = groups.length - 1; i >= 0; i--) {

        let _ifLineEnd = code.indexOf('\n', groups[i].if.pos);
        let _condStart = groups[i].if.pos + groups[i].if.len - 1;
        let modeComment = groups[i].if.isPlain == true ? '   plain  ' : ' commented';

        // get condition
        let condition = code.slice(_condStart, _ifLineEnd - 1);
        condition = condition.split(' ');
        condition = condition.filter(str => !!str);// remove empty or null
        if (condition.length == 0) {
            throw '#if condition missing. at ' + options.fileAdress + ' line ' + getLineNumber(code, _condStart);
        } else if (condition.length > 1) {
            throw '#if condition cannot have spaces. at ' + options.fileAdress + ' line ' + getLineNumber(code, _condStart);
        } 
        condition = condition[0];

        // prepare condition for check
        let comparisonValue = condition.slice(0,1) != '!';
        if (!comparisonValue)
            condition = condition.slice(1, condition.length);

        // if else found between if & endif
        if (groups[i].else != undefined) {

            // if - else - endif
            if (options.defines.includes(condition) == comparisonValue) {

                conditionalLog(`     ${(i == 0 ? '└' : '├')}╼╼╼╼╼╼╼➤ ${i+1}. ${modeComment} if-else condition (${condition}) fulfilled`);

                // remove else to endif
                code = strRemove(code, groups[i].else.pos, groups[i].endif.pos + groups[i].endif.len);
                // remove if statement
                code = strRemove(code, groups[i].if.pos, _ifLineEnd);

            } else {

                conditionalLog(`     ${(i == 0 ? '└' : '├')}╼╼╼╼╼╼╼➤ ${i+1}. ${modeComment} if-else condition (${condition}) unfulfilled`);

                // remove endif statement
                code = strRemove(code, groups[i].endif.pos, groups[i].endif.pos + groups[i].endif.len);
                // remove if to else
                code = strRemove(code, groups[i].if.pos, groups[i].else.pos + groups[i].else.len);
            }
            
        } else {
            
            // if - endif
            if (options.defines.includes(condition) == comparisonValue) {
                
                conditionalLog(`     ${(i == 0 ? '└' : '├')}╼╼╼╼╼╼╼➤ ${i+1}. ${modeComment} if condition (${condition}) fulfilled`);
                
                // remove endif statement
                code = strRemove(code, groups[i].endif.pos, groups[i].endif.pos + groups[i].endif.len);
                // remove if statement
                code = strRemove(code, groups[i].if.pos, _ifLineEnd);

            } else {

                conditionalLog(`     ${(i == 0 ? '└' : '├')}╼╼╼╼╼╼╼➤ ${i+1}. ${modeComment} if condition (${condition}) unfulfilled`);
                
                // remove all
                code = strRemove(code, groups[i].if.pos, groups[i].endif.pos + groups[i].endif.len);
            }
        }
    }

    if (options.mode == 'commented' || options.mode == 'both') {
        code = code.replaceAll('//#post-code', '');
    }

    return code;
}

export { preprocess as default, getFilename };