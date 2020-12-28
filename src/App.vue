<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
  export default {
    name: 'App',

    metaInfo: {
      titleTemplate: '%s - Jmingzi',
    }
  }
</script>

<style lang="less">
@border-color: #eee;
@bg-color: #f2f2f2;
@main-color: #4e9afa;
@import '~v-comment/src/style/index.less';
</style>
<style lang="stylus">
  html, body, #app
    height: 100%

  #app
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"
    -webkit-font-smoothing: antialiased
    -moz-osx-font-smoothing: grayscale
    color: #24292e

  @font-face
    font-family: interface
    src: url('./assets/font/interface.ttf')

  .hover
    &:hover
      background-color: #f7f8f9

  .w700
    width: 850px

  @media (max-width 700px)
    .w700
      width: 80%;

  .link-a
    position relative
    color: #333
    &:hover
      color #333
    &:after
      content: ""
      position: absolute
      z-index: -1
      top: 60%
      left: -0.1em
      right: -0.1em
      bottom: 0
      transition: top 200ms cubic-bezier(0, .8, .13, 1)
      // background-color: rgba(79,192,141,0.5)
      background: linear-gradient(transparent, #47e1a6)
    &:hover:after
      top 0
</style>
