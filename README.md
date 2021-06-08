# pug-vue-loader

A loader that compiles [pug](https://github.com/pugjs/pug) templates into HTML specifically for use in Vue component templates. Forked from [yyx990803/pug-plain-loader](https://github.com/yyx990803/pug-plain-loader), added an AST modifying plugin to convert native pug syntax into an AST that Vue will understand

The motivation for this fork is to add first-class pug language support in the context of Vue components. Instead of writing an ugly mish-mash of pug _and_ Vue syntax in your component, eg:

```pug
<template lang="pug">
ul
  li(v-for="item in items")
    a(v-if="item.type == 'link'" :href="item.url") some link title: {{item.title}}
    p(v-else) {{item.content}}
</template>

<script> 
  // ...Vue component JS
```

You can rely on the proper, first-class native pug syntax for iteration and conditionals, as well as var interpolation, eg:

```pug
<template lang="pug">
ul
  for item in items
    if item.type == 'link'
      a(:href="item.url") some link title: #{item.title}
    else
      p= item.content
</template>

<script>
  // ...Vue component JS
```

Note that since pug natively allows `for` and `if`/`else if`/`else` blocks to have multiple children inside them, but Vue's approach of attaching control logic to individual elements is necessarily singular, if your native pug blocks have multiple children, a `template` tag will be inserted to transparently make it Vue-friendly, eg:

```pug
if foo == 1
  h1 Hello
  p It's foo!
```

Gets translated to:

```pug
template(v-if="foo == 1")
  h1 Hello
  p It's foo!
```

## Installation

Note `pug` is a peer dependency, so make sure to install both:

``` sh
npm install -D pug-vue-loader pug
```

## Usage

This loader is mostly intended to be used alongside `vue-loader` v15+, since it now requires using webpack loaders to handle template preprocessors.

If you are only using this loader for templating in single-file Vue components, simply configure it with:

``` js
{
  module: {
    rules: [
      {
        test: /\.pug$/,
        loader: 'pug-vue-loader'
      }
    ]
  }
}
```

This will apply this loader to all `<template lang="pug">` blocks in your Vue components.

If you also intend to use it to import `.pug` files as HTML strings in JavaScript, you will need to chain `raw-loader` after this loader. Note however adding `raw-loader` would break the output for Vue components, so you need to have two rules, one of them excluding Vue components:

``` js
{
  module: {
    rules: [
      {
        test: /\.pug$/,
        oneOf: [
          // this applies to pug imports inside JavaScript
          {
            exclude: /\.vue$/,
            use: ['raw-loader', 'pug-vue-loader']
          },
          // this applies to <template lang="pug"> in Vue components
          {
            use: ['pug-vue-loader']
          }
        ]
      }
    ]
  }
}
```

## Options

See [Pug compiler options](https://pugjs.org/api/reference.html#options).

The `doctype` option is set to `html` by default, since most Vue templates are HTML fragments without explicit doctype.

An additional option `data` can be used to pass locals for the template, although this is typically not recommended when using in Vue components.
