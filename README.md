# pug-vue-loader

A loader that compiles [pug](https://pugjs.org) templates into HTML specifically for use in Vue component templates. Forked from [yyx990803/pug-plain-loader](https://github.com/yyx990803/pug-plain-loader), added an AST modifying plugin to convert native pug syntax into an AST that Vue will understand

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

With `pug-vue-loader` you can rely on the proper, first-class native pug syntax for iteration and conditionals, as well as var interpolation, eg:

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

## Using with Laravel Mix

You can use `vue-pug-loader` in [Laravel Mix](https://laravel-mix.com/) by passing the relevant Webpack rules to Mix's `webpackConfig` method, eg:

``` js
.webpackConfig({
  module: {
    rules: [
      {
        test: /\.pug$/,
        loader: 'pug-vue-loader',
      }
    ],
  }
})
```

## Vue variable interpolation

Any instance of pug [buffered code](https://pugjs.org/language/code.html#buffered-code) will get converted to Vue antlers syntax. For example:

```pug
p= foo
```

Will become:

```pug
p {{foo}}
```

This also applies to pug [string interpolation](https://pugjs.org/language/interpolation.html), for example:

```pug
p some normal text #{foo} hey there
```

Will become:

```pug
p some normal text {{foo}} hey there
```

However, if you use [unbuffered](https://pugjs.org/language/code.html#unbuffered-code) code, that will not be transformed, instead it will be left in the code for _compile-time_. If you want to output a variable from that unbuffered code in your pug template at _compile-time_, you can use [unescaped buffered code](https://pugjs.org/language/code.html#unescaped-buffered-code) and [unescaped string interpolation](https://pugjs.org/language/interpolation.html#string-interpolation-unescaped). For example:

```pug
- var unbuffered = 'foo'

p!= unbuffered // <--- will insert 'foo' at compile-time, not client-side
```

The majority of the time when using pug inside a Vue template, you only really care about _Vue_ data/variables, hence why the more common pug buffered/escaped symbols are transformed into the Vue antlers syntax

## Loops & Vue iteration keys

As expected, you can manually specify the `:key` attribute on the child of a `for` block. For example:

```pug
for item, i in items
  p(:key="i") foo
```

However, if you use `key` as the loop index variable name, `:key="key"` will automatically be inserted on the looping element. For example:

```pug
for item, key in items
  p foo
```

Will translate to:

```pug
p(v-for="(item, key) in items" :key="key") foo
```

Any other loop index variable name (eg `for item, index...`, `for item, i...` etc) will not add the `:key` attribute to the looping element.

Importantly, if a native pug `for` block has multiple children, since a `template` wrapper will be automatically inserted, if you are using [Vue 3](https://v3.vuejs.org/guide/migration/key-attribute.html#with-template-v-for) and need to attach a `:key` attribute to the inserted `template` looping element, you should also use `key` as the name of the loop index variable. For example:

```pug
for item, key in items
  p foo
  p bar
```

Will translate to:

```pug
template(v-for="(item, key) in items" :key="key") 
  p foo
  p bar
```

If you are using Vue 2, you cannot add `:key` to a `template` tag, in which case you should not rely on this automatic behaviour, instead manually add the `:key` attribute to each child element. [See here](https://v3.vuejs.org/guide/migration/key-attribute.html#with-template-v-for) for more information on the difference between Vue 2/3 and the handling of the `:key` attribute on `template` tags

## Options

See [Pug compiler options](https://pugjs.org/api/reference.html#options).

The `doctype` option is set to `html` by default, since most Vue templates are HTML fragments without explicit doctype.

An additional option `data` can be used to pass locals for the template, although this is typically not recommended when using in Vue components.
