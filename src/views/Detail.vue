<template>
  <div class="detail w700 margin-auto px-padding-b50">
    <div class="detail__head px-padding-t30">
      <h1>{{ detail.title || '标题' }}</h1>
      <p class="px-margin-tb10" v-if="tag">
        <span class="topic-tag" v-if="/http:/.test(detail.tag)">record-days</span>
        <span v-else class="topic-tag" v-for="item in tag" :key="item">{{ item }}</span>
      </p>
    </div>
    <div class="detail__content">
      <div v-if="codeUrl" class="detail__content--qrcode">
        <vue-qrcode :value="codeUrl" tag="img" :options="{ width: 150 }"/>
        <p>扫一扫，分享给别人</p>
      </div>
      <div class="detail__content-head">
        <span
          class="fr cursor-p"
          v-if="isAdmin"
          @click="toEdit"
        >
          编辑
        </span>
        <p>
          <span class="font-bold">Jmingzi</span>
          <span> createdAt at {{ detail ? detail.createdAt : '' | format }}</span>
        </p>
      </div>

      <article-content :content="detail ? detail.inputCompiled : ''"/>

      <div class="detail__options">
        <div
          class="detail__options-item"
          :class="{
            tagged: hasTagged().exist
          }"
          @click="handleVant"
        >
          <img :src="require('../assets/zan.png')" class="ib-middle" width="22px" alt="git">
          <span class="ib-middle px-margin-l10">{{ detail ? detail.vantNum : '0' }}</span>
        </div>
      </div>
    </div>

    <div v-if="false" class="text-center px-margin-t50">
      <img :src="require('../assets/gzh.jpg')" width="200px" alt="">
      <p class="px-margin-tb20">关注公众号，查看更多深度内容</p>
    </div>

    <comment
      v-if="showComment"
      ref="comment"
      :list="comment || []"
      :nums="comment ? comment.length : 0"
      :user="commentUser"
      @submit="submitComment"
      @del="delComment"
      @login="handleLogin"
    />

    <page-bottom class="px-margin-t50" :is-fixed="false" />
  </div>
</template>

<script>
  import AV from 'leancloud-storage'
  import { mapState, mapActions, mapGetters } from 'vuex'
  import { formatDate } from '../assets/date'
  import { handleGithub } from '../assets/util'
  import VueQrcode from '@chenfengyuan/vue-qrcode'
  const PageBottom = () => import('../components/PageBottom.vue')
  const ArticleContent = () => import('../components/ArticleContent.vue')
  const Comment = () => import('v-comment')

  export default {
    name: 'Detail',

    asyncData({ store, route }) {
      return store.dispatch('article/FETCH_DETAIL', route.params.id)
    },

    metaInfo() {
      const detail = this.detail || {}
      return {
        title: detail.title || '文章详情',
        meta: [
          { vmid: 'keywords', name: 'keywords', content: 'jmingzi，前端博客，' + (/http:/.test(detail.tag) ? 'RecordDays' : detail.tag) },
          { vmid: 'description', name: 'description', content: this.filterHtmlTag(detail.inputCompiled).substr(0, 150) },
          { name: 'share_title', content: detail.title },
          { name: 'share_content', content: this.filterHtmlTag(detail.inputCompiled).substr(0, 150) },
          { name: 'share_image', content: /http:/.test(detail.tag) ? detail.tag : detail.img }
        ]
      }
    },

    data () {
      return {
        showComment: false,
        comment: null,
        commentUser: null,
        codeUrl: null
      }
    },

    components: {
      ArticleContent,
      PageBottom,
      Comment,
      VueQrcode
    },

    filters: {
      format: formatDate
    },

    computed: {
      ...mapState('article', ['detail']),
      ...mapState(['currentUser']),
      ...mapGetters(['isAdmin']),

      tag() {
        return this.detail ? this.detail.tag.split('、') : []
      }
    },

    mounted () {
      if (!/iphone|android/i.test(navigator.userAgent)) {
        this.codeUrl = location.href
      }
      // if (!this.$isServer) {
      this.showComment = true
      // todo 登录用户信息在全局不是一个状态
      setTimeout(() => {
        let user = AV.User.current()
        if (user) {
          user = user.toJSON()
          this.commentUser = {
            id: user.objectId,
            name: user.username,
            avatar: user.github && user.github.avatar_url
          }
        }
      }, 1000)
      // 获取评论
      this.getCommentList()
      // }
    },

    methods: {
      ...mapActions('article', ['ADD_ARTICLE']),

      getCommentList () {
        const articalId = this.$route.params.id
        const query = new AV.Query('Comment')
        query.equalTo('articalId', articalId)
        query.greaterThanOrEqualTo('status', 0)
        return query.find().then(res => res.map(x => x.toJSON())).then(data => {
          this.comment = data.map(x => ({
            ...x,
            createdTimeStamp: formatDate(x.createdAt)
          }))
          return data
        })
      },

      submitComment (input, inputCompiler) {
        const comment = new AV.Object('Comment')
        const user = AV.User.current()
        if (!user) {
          this.$message.error('未登录')
          return
        }
        comment.set('input', input)
        comment.set('inputCompiler', inputCompiler)
        comment.set('articalId', this.$route.params.id)
        comment.set('user', this.commentUser)
        const loading = this.$loading()
        return comment.save().then(() => {
          loading.close()
          this.$message.success('评论成功！')
          this.$refs.comment.resetEditor()
          this.getCommentList()
        }).catch(() => {
          this.$message.error('评论失败')
          loading.close()
        })
      },

      delComment (item) {
        this.$box.confirm('确定要删除这条评论吗？').then(() => {
          const comment = AV.Object.createWithoutData('Comment', item.objectId)
          comment.set('status', -1)
          return comment.save()
        }).then(() => {
          this.getCommentList()
        })
      },

      filterHtmlTag(str) {
        if (str) {
          str = str.replace(/\n/g, '').replace(/<\/*[a-z]+.*?>/g, '')
          return str
        }
        return ''
      },

      toEdit() {
        this.$router.push(`/editor/${this.$route.params.id}`)
      },

      hasTagged () {
        let user = AV.User.current()
        if (user) {
          user = user.toJSON().username
        }
        const { vantUser = [] } = this.detail
        const exist = vantUser.some(x => x === user)
        return {
          exist,
          user,
          vantUser
        }
      },

      async handleVant() {
        // 未登录提示去登录
        const { user, exist } = this.hasTagged()
        if (!user) {
          await this.$box.confirm('当前未登录，是否使用 github 登录？')
          handleGithub.call(this)
          return
        }

        const article = AV.Object.createWithoutData('Article', this.detail.id)
        article.increment('vantNum', exist ? -1 : 1)
        article[exist ? 'remove' : 'addUnique']('vantUser', user)
        await article.save()
        if (exist) {
          this.detail.vantNum -= 1
          const i = this.detail.vantUser.findIndex(x => x === user)
          this.detail.vantUser.splice(i, 1)
        } else {
          this.detail.vantNum += 1
          if (!this.detail.vantUser) {
            this.$set(this.detail, 'vantUser', [user])
          } else {
            this.detail.vantUser.push(user)
          }
        }
      },

      handleLogin() {
        handleGithub.call(this)
      }
    }
  }
</script>

<style lang="stylus">
  .detail__content
    background-color: #fff
    border: 1px solid #c0d3eb
    border-radius: 3px
    position: relative
    &--qrcode
      float right
      position sticky
      // right -170px
      top 10px
      margin-right -160px
      border 1px #eee solid
      p
        font-size 12px
        text-align center
        padding-bottom 10px

  .markdown-body
    width 100%
  .markdown-body ol ol
  .markdown-body ul ol
    list-style-type lower-roman
    ul
      list-style square
    ol
      list-style lower-alpha
  .markdown-body ul ul,
  .markdown-body ol ul
    ol
      list-style lower-alpha
  .markdown-body ol
    list-style decimal

  .detail__content-head
    padding: 10px 15px
    color: #586069
    background-color: #f1f8ff
    border-bottom: 1px solid #c0d3eb
    border-top-left-radius: 3px
    border-top-right-radius: 3px
    font-size: 14px

  .detail__options
    border-top: 1px solid #e1e4e8

  .detail__options-item
    display: inline-block
    padding: 9px 15px 7px
    line-height: 18px
    border-right: 1px solid #e1e4e8
    color: #0366d6
    cursor: pointer
    font: normal normal 11px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"
    -webkit-font-smoothing: subpixel-antialiased

    &:first-child
      border-bottom-left-radius: 2px

    &:hover,
    &.tagged
      background-color: #f1f8ff

  .topic-tag
    display: inline-block
    padding: 0.3em 0.9em
    margin: 0 0.5em 0.5em 0
    white-space: nowrap
    background-color: #f1f8ff
    border-radius: 3px
</style>
