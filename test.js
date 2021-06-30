const pug = require('pug')
const plugin = require('./index')
const util = require('util')

const template = pug.compileFile('test.pug', {

	plugins: [{
		preParse(code, options) {
			// console.log(code)
			return code
		},
		postParse(ast, options) {
			// console.log(util.inspect(ast, {
			// 	compact: 2,
			// 	breakLength: 200,
			// 	depth: null,
			// 	colors: true,
			// 	maxStringLength: null,
			// 	maxArrayLength: 10,
			// }))
			return plugin(ast, options)
		}
	}]
})

console.log(template({}))