const pug = require('pug')
const loaderUtils = require('loader-utils')

module.exports = function (source) {
	const options = Object.assign({
		filename: this.resourcePath,
		doctype: 'html',
		compileDebug: this.debug || false
	}, loaderUtils.getOptions(this))
	
	if(!options.plugins) options.plugins = []
	options.plugins.push({
		preCodeGen(ast, options) {
			ast.nodes = processNodes(ast.nodes)
			return ast
		}
	})

	const template = pug.compile(source, options)
	template.dependencies.forEach(this.addDependency)
	return template(options.data || {})
}

function processNodes(nodes, insideConditional = false) {
	for (let i = 0; i<nodes.length; i++) {
		const node = nodes[i]

		if(!/Each|Conditional/.test(node.type)) {
			if(node.block)
				node.block.nodes = processNodes(node.block.nodes)

			if(node.type == 'Code')
			{
				node.type = 'Text'
				node.val = `{{${node.val}}}`
				delete node.buffer
				delete node.mustEscape
				delete node.isInline
			}
			continue
		}

		if(node.consequent) // if this node is a conditional
		{
			const newNodes = [],
				consequent = processNodes(node.consequent.nodes),
				name = insideConditional? 'v-else-if' : 'v-if',
				vueIfAttr = { name, val: `"${node.test}"`, mustEscape: false }
			newNodes.push(
				processControlNode(consequent, vueIfAttr, `empty ${name}=${node.test}`)
			)

			if(node.alternate){
				if(node.alternate.type == 'Block') {
					const alternate = processNodes(node.alternate.nodes)
					const vueElseAttr = { name: 'v-else', val: true, mustEscape: false }
					newNodes.push(
						processControlNode(alternate, vueElseAttr, `empty v-else`)
					)
				} else
					newNodes.push( ...processNodes([node.alternate], true))
			}
			
			nodes.splice(i, 1, ...newNodes)
			i += newNodes.length-1
		}
		else // its a loop
		{
			const loop = (node.key ? `"(${node.val}, ${node.key})` : `"${node.val}` )+ ` in ${node.obj}"`
			const vueLoopAttr = { name: 'v-for', val: loop, mustEscape: false }
			const children = processNodes(node.block.nodes)
			nodes[i] = processControlNode(children, vueLoopAttr, `empty v-for=${loop}`)
		}

	}
	return nodes
}

function processControlNode(items, vueAttr, emptyStr) {
	if(!items.length)
		return {
			type: 'Comment', val: emptyStr, buffer: true, line: node.line, column: node.column, filename:node.filename 
		}
	else if(items.length > 1)
		return {
			block: { type: 'Block', nodes: items }, attrs: [vueAttr],
			type: 'Tag', name: 'template', selfClosing: false, attributeBlocks: [], isInline: false
		}
	else {
		items[0].attrs.push(vueAttr)
		return items[0]
	}
}

