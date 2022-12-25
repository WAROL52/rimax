// import { rollup } from 'rollup';
import resolve from "@rollup/plugin-node-resolve"
// import babel from "@rollup/plugin-babel"
// import sourcemaps from 'rollup-plugin-sourcemaps';
// import minify from 'rollup-plugin-babel-minify'
import { terser } from "rollup-plugin-terser"
// import { createPathTransform } from 'rollup-sourcemap-path-transform'
import dts from "rollup-plugin-dts";
// const sourcemapPathTransform = createPathTransform({
//     prefixes: {
//         '*Rimax/': './dist'
//     }
// })

export default [
    {
        input: ["./index.js"],
        output: [{
            file: "./dist/rimax.global.js",
            format: "iife",
            name: "Rimax",
            sourcemap: true,
        }, {
            file: "./dist/rimax.global.min.js",
            format: "iife",
            name: "Rimax",
            sourcemap: true,
            plugins: [terser()]
        }, {
            file: "./dist/rimax.es.js",
            format: "es",
            sourcemap: true,
            name: "Rimax"
        }, {
            file: "./dist/rimax.es.min.js",
            format: "es",
            name: "Rimax",
            sourcemap: true,
            plugins: [terser()]
        }, {
            file: "./bin/dist/rimax.global.js",
            format: "iife",
            sourcemap: true,
            name: "Rimax"
        }, {
            file: "./bin/dist/rimax.global.min.js",
            format: "iife",
            name: "Rimax",
            sourcemap: true,
            plugins: [terser()]
        }, {
            file: "./bin/dist/rimax.es.js",
            format: "es",
            name: "Rimax",
            sourcemap: true,
        }, {
            file: "./bin/dist/rimax.es.min.js",
            format: "es",
            name: "Rimax",
            sourcemap: true,
            plugins: [terser()]
        }
        ],
        plugins: [
            resolve(),
            // sourcemaps(),
            // babel({
            //     babelHelpers: "bundled",
            //     exclude: ['node_modules/**']
            // }),
            // dts(),
        ]
    }, 
    // {
    //     input: "./index.d.ts",
    //     output: [{
    //         file: "./bin/dist/rimax.es.d.ts", format: "es", name: "Rimax"
    //     }, {
    //         file: "./dist/rimax.es.d.ts", format: "es", name: "Rimax"
    //     }, {
    //         file: "dist/rimax.global.d.ts", format: "iife", name: "Rimax"
    //     }, {
    //         file: "./bin/dist/rimax.global.d.ts", format: "iife", name: "Rimax"
    //     }],
    //     plugins: [dts()],
    // },
    // {
    //     input: './Rimax/index.js',
    //     plugins: [sourcemaps()],
    //     output: {
    //       sourcemap: true,
    //       file: 'dist/my-awesome-package.js',
    //     },
    //   }
]