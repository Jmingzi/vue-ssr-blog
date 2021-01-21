<template>
  <div class="article-content__wrap markdown-body editor__style" v-html="content.replace(/a href=/g, 'a target=_blank href=')"/>
</template>

<script>
  // import 'highlight.js/styles/default.css'
  import 'highlight.js/styles/github.css'

  export default {
    name: 'ArticleContent',

    props: {
      content: {
        type: String,
        default: ''
      }
    }
  }
</script>

<style lang="stylus">
  @import "../assets/markdown.css"

  .editor__style
    font-size: 16px
    padding: 20px

    blockquote
      margin-left: 0
      margin-right: 0

    a
      color: #0366d6
      text-decoration: none

    ul
      display: block
      list-style-type: disc
      -webkit-margin-before: 1em
      -webkit-margin-after: 1em
      -webkit-margin-start: 0
      -webkit-margin-end: 0

    ul ul, ol ul
      list-style-type: circle

    ol ul, ul ol, ul ul, ol ol
      -webkit-margin-before: 0
      -webkit-margin-after: 0

    pre
      padding: 16px
      overflow: auto
      line-height: 1.45
      background-color: #f6f8fa
      border-radius: 3px
      font-family: "SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace !important
      font-size: 14px

    code
      font-family: "SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace !important
</style>
