<template>
  <div class="record-days height-100">
    <div class="record-days__top">
      <span class="record-days__title">RecordDays</span>
      <span class="record-days__slogan">记录一瞬间的想法</span>
    </div>
    <div class="record-days__content">
      <water
        :items="list"
        :currentUser="currentUser"
        @del="del"
      />
    </div>
    <page-bottom
      :is-fixed="false"
    />
  </div>
</template>

<script>
  import {mapState, mapMutations, mapActions} from 'vuex'
  import water from '../components/waterfall.vue'
  const PageBottom = () => import('../components/PageBottom.vue')

  export default {
    name: 'Index',

    metaInfo: {
      title: 'RecordDays',
      meta: [
        { vmid: 'keywords', name: 'keywords', content: 'idea，灵感，想法' },
        { vmid: 'description', name: 'description', content: '记录一瞬间的想法' },
        { name: 'author', content: 'jmingzi' }
      ]
    },

    asyncData({ store }) {
      return store.dispatch('article/FETCH_LIST', {
        limit: 500,
        field: ['title', 'tag', 'isOuterLink', 'type', 'inputCompiled'],
        condition: [
          {
            field: 'type',
            value: 'record-days'
          }
        ],
        cacheKey: 'record-days'
      })
    },

    components: {
      PageBottom,
      water
    },

    data() {
      return {
        items: null
      }
    },

    computed: {
      ...mapState('article', ['list']),
      ...mapState(['currentUser'])
    },

    created() {
      this.SET_DETAIL(null)
    },

    mounted () {
    },

    methods: {
      ...mapMutations('article', ['SET_DETAIL']),
      ...mapActions('article', ['DEL_ARTICLE']),
      del(item, i) {
        this.$box.confirm('确认要删除吗？')
          .then(() => this.DEL_ARTICLE({ id: item.id, index: i }))
          .then(() => { this.$message.success('删除成功') })
      }
    }
  }
</script>

<style lang="stylus">
.record-days
  .page-bottom__menu
    @media (max-height: 670px) {
      padding-top 10px
    }

  &__top
    line-height 50px
    height 50px
    padding 0 50px
  &__title
    font-weight: bold
    font-size: 30px
    font-family: interface,-webkit-pictograph,serif
  &__slogan
    font-size 12px
    color #999
    margin-left 10px
  &__content
    height calc(100% - 150px)
    margin-bottom 20px
    overflow auto
    // padding 0 50px
    background #f2f2f2
    @media only screen and (max-width: 600px) {
      padding 0
    }
  &__area
    width 800px
    margin 0 auto
    @media only screen and (max-width: 600px) {
      width 100%
    }
  &__item
    display flex
    padding 10px 15px
    // height 100px
    background-color #fff
    margin 10px
    font-size 14px
    .link-a:after
      z-index 1
    &--img
      margin-right 10px
      img
        max-lines 150px
    &--con
      flex-grow 1
    &--title
      display flex
      justify-content space-between
      align-items center
      span
        color #999
        font-size 12px
    &--desc
      color #999
      margin-top 10px
</style>
