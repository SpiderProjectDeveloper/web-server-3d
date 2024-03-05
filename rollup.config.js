import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import html from "rollup-plugin-html";

export default {
  input: 'src/index.js',
  output: [
    {
      format: 'esm',
      file: 'dist/bundle.js'
    },
  ],
  plugins: [
	postcss( { extensions: [ '.css' ] } ),
	html(),
    resolve(),
  ]
};