import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import html from "rollup-plugin-html";
import serve from 'rollup-plugin-serve'

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
	serve({
		open: true,
		contentBase: 'dist',
		host: 'localhost',
		port: 9001
	})
  ]
};