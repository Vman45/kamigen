import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';

export default ['game', 'jumbotron'].map((name, index) => ({
  input: `src/${name}.js`,
  output: {
  	file: `dist/${name}.js`,
    format: `iife`,
    name: name
  },
  plugins: [
    buble()
  ]
}));
