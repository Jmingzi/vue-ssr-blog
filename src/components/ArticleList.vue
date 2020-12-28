<template>
  <ul v-if="isIndex">
    <li
      v-for="(item, i) in list"
      :key="i"
    >
      <a
        v-if="item.isOuterLink"
        href="javascript:"
        class="px-font-20 link-a"
        @click="toOuter(item.tag)"
      >
        {{ item.title }}
      </a>
      <template v-else>
        <router-link
          :to="`/detail/${item.id}`"
          class="px-font-20 link-a"
        >
          <span>{{ item.title }}</span>
        </router-link>
      </template>
      <div class="color-c999 px-margin-tb10">
        <span class="ib-middle">{{ item.createdAt | format }}</span>
        <span
          v-if="currentUser"
          class="color-error ib-middle px-margin-l10 cursor-p"
          @click="del(item, i)"
        >
          删除
        </span>
      </div>
      <p v-if="!item.isOuterLink" class="px-font-14 color-c666">{{ item.inputCompiled | summary }}</p>
    </li>
    <ul v-if="false" class="seo-block">
      <li
        v-for="(item, i) in list.slice(3, 5)"
        :key="i"
      >
        <a v-if="item.isOuterLink" :href="item.tag">{{  }}</a>
        <template v-else>
          <router-link :to="`/detail/${item.id}`">{{ item.title }}</router-link>
          <p>{{ item.inputCompiled | summary }}</p>
        </template>
      </li>
    </ul>
  </ul>
  <ul v-else>
    <li
      class="px-line-45 px-padding-lr15 cl bd-gray-lighter-b hover"
      v-for="(item, i) in list"
      :key="i"
    >
      <div class="fr color-c999">
        <span class="ib-middle">{{ item.createdAt | format }}</span>
        <span
          v-if="isAdmin"
          class="color-error ib-middle px-margin-l10 cursor-p"
          @click="del(item, i)"
        >
          删除
        </span>
      </div>
      <a
        v-if="item.isOuterLink"
        href="javascript:"
        class="px-font-14"
        @click="toOuter(item.tag)"
      >
        {{ item.title }}
      </a>
      <router-link
        v-else
        :to="`/detail/${item.id}`"
        class="px-font-14"
      >
        <span>{{ item.title }}</span>
      </router-link>
    </li>
  </ul>
</template>

<script>
  import { mapState, mapActions, mapGetters } from 'vuex'
  import { ago } from '../assets/date'
  import { summary } from '../assets/util'

  export default {
    name: 'ArticleList',

    filters: {
      format(str) {
        let res
        Date.prototype.ago = ago
        res = new Date().ago(str)
        Date.prototype.ago = null
        return res
      },
      summary
    },

    props: {
      from: String,
      list: {
        type: Array,
        default() {
          return []
        }
      }
    },

    computed: {
      ...mapState(['currentUser']),
      ...mapGetters(['isAdmin']),

      isIndex() {
        return this.from === 'index'
      }
    },

    created () {
      console.log('isAdmin: ', this.isAdmin)
    },

    methods: {
      ...mapActions('article', ['DEL_ARTICLE']),

      toOuter(link) {
        window.open(link)
      },

      del(item, i) {
        this.$box.confirm('确认要删除吗？')
          .then(() => this.DEL_ARTICLE({ id: item.id, index: i }))
          .then(() => { this.$message.success('删除成功') })
      }
    }
  }
</script>
