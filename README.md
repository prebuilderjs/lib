# Preprocess directives library

<p>
    <a href="https://www.npmjs.com/package/@preprocess-directives/lib" alt="Npm version">
        <img src="https://img.shields.io/npm/v/@preprocess-directives/lib">
    </a>
</p>

 C# like preprocessor directives library for javascript

 NB: 
 - It's recommended to use the cjs version of this library, when using it via NodeJS as it uses the more reliable 'path' tool
 - The esm version needs to be imported from '@preprocess-directives/lib/dist/index.esm.js'

## Install

```sh
npm i @preprocess-directives/lib
```

## Usage Examples
### 1) Browser:
```js
import preprocess from '@preprocess-directives/lib/dist/index.esm.js';

// example of code generated at runtime, for ex with a front-end code editor
let codeName = 'User generated script';
let code = `
class MyClass {

#if MY_DIRECTIVE
    myFunction = (data) => {
        return data;
    }
#else
    myFunction = (differentData) => {
        return differentData;
    }
#endif
`;

code = preprocess(code, {defines: ['MY_DIRECTIVE'], log: false, fileAdress: codeName});

// do whatever with processed code
```
### 2) Node:
```js
const fs = require('fs');
const preprocess = require('@preprocess-directives/lib').default;

// read source file
let filePath = 'src/index.js';
let code = fs.readFileSync(filePath, 'utf-8');

code = preprocess(code, {
    defines: ['MY_DIRECTIVE'],
    log: false,
    fileAdress: filePath,
    mode: 'both',
});

// generate processed file
fs.writeFileSync('dist/app.js', code, 'utf-8');
```

source code:

```js
class MyClass {

// if else directives:
#if MY_DIRECTIVE
    myFunction = (data) => {
        return data;
    }
#else
    myFunction = (differentData) => {
        return differentData;
    }
#endif

// commented mode & negative #if check:
//#if !MY_DIRECTIVE
    myVar = {
        number: 0
    };
//#else
    //#post-code myVar = {
    //#post-code     number: 5
    //#post-code };
//#endif

}
```

output code :

```js
class MyClass {

    myFunction = (data) => {
        return data;
    }

    myVar = {
        number: 5
    };
}
```

## Options

### defines
Required. Type: `Array<string>`

List of defines based on which to validate `#if` statements.

### log
Type: `boolean`

Wether to show this process logs or not, like skipped files and number of #if groups found.

### filePath
Type: `string`

Path, Url or name of the script (only needed when logging).

### mode
Type: `string`

Values: `"plain"|"commented"|"both"`

Wether to preprocess directives written plainly `#if` or in a comment `//#if`. Default value is "both".
```txt
plain     -> "#if", "#else", ... ("#post-code" not available)

commented -> "//#if", "//#else", ... and "//#post-code let exampleVar = 5;"  
             ⚠ No spaces are permitted between comment and directive: "//#if" NOT "// #if"
```

<details>
<summary>
  <h1 style="display:inline-block">Changelog</h1>
  <span style="white-space: pre;">    (click)</span>
</summary>

### v 1.1
- Added negative #if check (#if !value)

### v 1.2
- Added include & exclude files option

### v 1.3
- Added optional debug logging

### v 1.3.1
- Improved log messages

### v1.3.3
Bugfixes:
- Incorrect code output when an if-else statement is unfulfilled

Changes:
- Added debug log info on each processed "if group"
- Better debug log formatting

### v1.4.0

- Separated processing functions from plugin in a separate library.
This allows for use with node & for other plugins.

### v1.5.0

- Browser support (esm version now doesn't use any node dependency)

### v1.6.0

- Added commented directives mode

### v1.6.2

- Lib refactor + log fixes

### v1.6.5

Bugfixes:
- Changed an export name to avoid any conflict with a default variable name
- Fixed bug when preprocessing without options.filename, while logging is disabled

### v1.6.6

- Optimized process by adding check to skip in case no directives is present

### v1.6.8

- 2 minor Bugfixes

</details>