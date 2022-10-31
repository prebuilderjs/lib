

class MyClass {
    
// commented mode & negative check:
//#if !MY_DIRECTIVE
myVar = {
    number: 0
};
//#else
    //#post-code myVar = {
    //#post-code     number: 5
    //#post-code };
//#endif

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

}

class MyClassDuplicate {
    
    // commented mode & negative check:
    //#if !MY_DIRECTIVE
    myVar = {
        number: 0
    };
    //#else
        //#post-code myVar = {
        //#post-code     number: 5
        //#post-code };
    //#endif
    
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
    
}