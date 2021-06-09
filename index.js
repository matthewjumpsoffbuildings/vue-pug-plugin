const pug = require('pug')
const loaderUtils = require('loader-utils')
const plugin = require('./plugin')

module.exports = function (source)
{
	const options = Object.assign({
		filename: this.resourcePath,
		doctype: 'html',
		compileDebug: this.debug || false
	}, loaderUtils.getOptions(this))
	
	if(!options.plugins) options.plugins = []
	options.plugins.push({
		preCodeGen: plugin
	})

	const template = pug.compile(source, options)
	template.dependencies.forEach(this.addDependency)
	return template(options.data || {})
}