# vue-pug-plugin

A plugin that transforms [pug](https://pugjs.org) templates into HTML specifically for use in Vue component templates.

The motivation for this plugin is to add first-class pug language support in the context of Vue components. Instead of writing an ugly mish-mash of pug _and_ Vue syntax in your component, eg:

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

With `vue-pug-plugin` you can rely on the proper, first-class native pug syntax for iteration and conditionals, as well as var interpolation, eg:

```pug
<template lang="pug">
ul
  for item in items
    li
      if item.type == 'link'
        a(:href="item.url") some link title: #{item.title}
      else
        p= item.content
</template>

<script>
  // ...Vue component JS
```

Note that since pug natively allows `for` and `if`/`else if`/`else` blocks with multiple children inside them, but Vue's approach of attaching control logic to individual elements is necessarily singular, if your native pug blocks have multiple children, a `template` tag will be inserted to transparently make it Vue-friendly, eg:

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
npm install -D vue-pug-plugin pug
```

## Usage

You can use `vue-pug-plugin` with any build tool or bundler, long as you can pass [pug compiler options](https://pugjs.org/api/reference.html) through to the pug preprocessor. All that is required is that you pass the default export from `vue-pug-plugin` to the pug options `plugins` array

```ts
// CommonJS require syntax
const vuePugPlugin = require('vue-pug-plugin')

// ES6 import syntax
import vuePugPlugin from 'vue-pug-plugin'
```

### Rollup / Vite

As an example, when using Rollup or Vite, add the imported `vuePugPlugin` to the `vue()` plugins pug template config:

```ts
export default {
  plugins: [
    vue({
      template: {
        preprocessOptions: { // 'preprocessOptions' is passed through to the pug compiler 
          plugins: [
            vuePugPlugin
          ]
        }
      }
    })
  ]
}
```

### Webpack / Laravel Mix

For use with Webpack or Laravel Mix, use [vue-pug-loader](https://npmjs.com/package/vue-pug-loader) instead


## Vue variable interpolation

You can continue to use Vue-style variable interpolation syntax (eg `{{ foo }}`) if you wish, but you may also prefer to use pug interpolation syntax instead.

If you prefer to stick with native pug interpolation syntax, any instance of pug [buffered code](https://pugjs.org/language/code.html#buffered-code) will get be automatically converted to Vue antlers syntax. For example:

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

Note that for Vue _attribute_ variables you should continue to wrap them in string literals, eg:

```pug
//- correct
a(:href="someVueVar + '.com'")

//- incorrect
a(:href=someVueVar + '.com')
```

If you use [unbuffered](https://pugjs.org/language/code.html#unbuffered-code) code, that will not be transformed, instead it will be left in the code for _compile-time_. If you want to output a variable from that unbuffered code in your pug template at _compile-time_, you can use [unescaped buffered code](https://pugjs.org/language/code.html#unescaped-buffered-code) and [unescaped string interpolation](https://pugjs.org/language/interpolation.html#string-interpolation-unescaped). For example:

```pug
- var unbuffered = 'foo'

p!= unbuffered // <--- will insert 'foo' at compile-time, not dynamically via Vue client-side
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

If you are using Vue 2 and a pug `for` block has multiple children, you cannot add `:key` to a `template` tag, in which case you should not rely on this automatic behaviour. Instead, manually add the `:key` attribute to each child element, or use your own wrapper element with something like `:key="index"` specified. [See here](https://v3.vuejs.org/guide/migration/key-attribute.html#with-template-v-for) for more information on the difference between Vue 2/3 and the handling of the `:key` attribute on `template` tags