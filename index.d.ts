declare module 'vue-pug-plugin' {
	interface AST {
		nodes: any[]
		[key: string]: any
	}
	interface Options {
		[key: string]: any
	}
	function preCodeGen(ast: AST, options: Options): AST

	const plugin = {
		preCodeGen: typeof preCodeGen
	}
	export default plugin
}