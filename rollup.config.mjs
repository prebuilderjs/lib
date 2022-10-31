import directives from '@preprocess-directives/rollup-plugin';

export default [
    {
        input: "src/index.js",
        output: {
            format: "cjs",
            strict: false,
            name: "process",
            file: "dist/index.cjs.js",
        },
        plugins: [directives({ defines: ['CJS']})]
    },
    {
        input: "src/index.js",
        output: {
            format: "esm",
            file: "dist/index.esm.js",
        },
        plugins: [directives()]
    }
]