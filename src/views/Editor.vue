<template>
  <div class="editor height-100 px-font-14">
    <div class="position-a px-height-60 width-100 top-0 px-line-60 bd-gray-lighter-b">
      <div class="fr px-margin-r15">
        <el-button
          size="mini"
          @click="saveDraft"
        >
          保存草稿
        </el-button>
        <el-button
          size="mini"
          type="primary"
          @click="submit"
        >
          提交
        </el-button>
      </div>
      <input
        v-model="title"
        class="editor__title width-50 px-line-30 px-font-16 bd-gray-lighter-r ib-middle px-padding-lr15"
        type="text"
        placeholder="请输入标题"
      >
      <input
        v-model="tag"
        class="editor__tag px-line-30 px-font-16 px-margin-l10 ib-middle"
        type="text"
        :placeholder="this.type === 'blog' ? `请输入标签，中文顿号分隔` : '输入图片地址'"
      >
    </div>
    <div class="editor__wrapper-container position-a px-top-60 bottom-0 left-0 width-50">
      <div class="editor__tools--wrap">
        <div class="editor__tools">
          <div class="editor__tools-left px-padding-l15">
            <span class="color-c999">类型: </span>
            <el-select v-model="type" size="mini">
              <el-option name="文章" value="blog" />
              <el-option name="RecordDays" value="record-days" />
            </el-select>
            <el-checkbox v-if="false" v-model="isOuterLink">外链</el-checkbox>
          </div>
          <div class="px-height-40 text-right font-0">
            <div
              v-for="item in editorTools"
              :key="item.id"
              @click="handleTools(item.id)"
              class="editor__tools-item px-font-16 ib-middle px-width-40"
            >
              <i :class="`iconfont icon-${item.icon}`" />
            </div>
          </div>
        </div>
      </div>
      <textarea
        class="editor__wrap editor__textarea bd-gray-lighter-r position-a px-top-40 bottom-0 width-100"
        ref="editor"
        :value="input"
        @input="update"
        @paste="paste"
        @keydown.9.exact.prevent="tab($event, true)"
        @keydown.shift.exact.9.prevent="tab($event, false)"
        placeholder="# hello world"
      />
    </div>
    <div
      class="editor__compile-html position-a px-top-60 bottom-0 right-0 width-50 overflow-a"
    >
      <article-content :content="compileValue" />
    </div>

    <div v-show="showProgress" class="editor__upload-progress position-f top-0 bottom-0">
      <div class="num position-a color-fff">{{ uploadProgress }}%</div>
    </div>
  </div>
</template>

<script>
  import marked from 'marked'
  import { debounce } from 'underscore'
  import { Button, Checkbox, Select, Option } from 'element-ui'
  import { mapActions, mapState } from 'vuex'
  import { uploadImg } from '../api'
  import hljs from 'highlight.js'
  const ArticleContent = () => import('../components/ArticleContent.vue')

  export default {
    name: 'Editor',

    metaInfo() {
      return {
        title: this.editId ? '编辑文章' : '写文章'
      }
    },

    components: {
      ElButton: Button,
      ArticleContent,
      ElCheckbox: Checkbox,
      ElSelect: Select,
      ElOption: Option
    },

    computed: {
      ...mapState('article', ['detail']),

      compileValue() {
        return marked(this.input, {
          sanitize: true,
          smartlists: true,
          smartypants: true,
          highlight: function(code) {
            return hljs.highlightAuto(code).value
          }
        })
      },

      editId() {
        return this.$route.params.id
      }
    },

    data() {
      return {
        input: '',
        title: '',
        tag: '',
        type: 'blog',
        isOuterLink: false,
        editorTools: [
          { icon: 'code', id: 1 },
          { icon: 'code1', id: 2 },
          { icon: 'link', id: 3 },
          { icon: 'image', id: 4 }
        ],
        showProgress: false,
        uploadProgress: 0,
        editor: null
      }
    },

    created() {
    },

    mounted() {
      this.editor = this.$refs.editor

      let localData = localStorage.getItem('draft')
      if (this.editId) {
        if (this.detail) {
          this.fillDetail(this.detail)
        } else if (localData) {
          this.fillDetail(JSON.parse(localData))
        } else {
          this.$message.info('当前文章详情为空')
          history.back()
        }
      } else if (localData) {
        this.fillDetail(JSON.parse(localData))
      }
    },

    // beforeRouteLeave(to, from, next) {
    //   console.log(to)
    //   this.$box.confirm('内容将不会保存，确认离开吗？').then(() => {
    //     next()
    //   }).catch(() => {
    //     next(false)
    //   })
    // },

    methods: {
      ...mapActions('article', ['ADD_ARTICLE']),

      update: debounce(function(e) {
        this.input = e.target.value
      }, 100),

      submit() {
        // validator
        const data = this.getValue()

        if (!data.tag && data.type === 'blog') {
          this.$message.error('请输入标签')
          return
        }

        if (this.editId) {
          data.id = this.editId
        }
        this.ADD_ARTICLE(data).then(() => {
          this.$message.success(`${data.id ? '编辑' : '添加'}成功`)
          localStorage.removeItem('draft')
        })
      },

      getValue() {
        return {
          input: this.input,
          inputCompiled: this.compileValue,
          title: this.title,
          tag: this.tag,
          type: this.type,
          isOuterLink: this.isOuterLink
        }
      },

      saveDraft() {
        localStorage.setItem('draft', JSON.stringify(this.getValue()))
        this.$message.success('保存草稿成功')
      },

      fillDetail(data) {
        const { title, tag, input, isOuterLink, type } = data
        this.title = title
        this.tag = tag
        this.input = input
        this.type = type
        this.isOuterLink = isOuterLink
      },

      tab(e, isAdd) {
        let indent = ''
        let result = ''
        let selectedString = window.getSelection().toString()

        if (isAdd) {
          indent = '  '
          // 每行增加对应的indent
          result = indent + selectedString.replace(/\n/g, '\n' + indent)
        } else {
          // 缩进
          // 替换行首2个tab
          result = selectedString.replace(/^\s{2}/, '')
          // 替换剩余换行前的tab
          result = result.replace(/\n\s{2}/g, '\n')
        }
        this.insertEditorString(result, result.length, !!selectedString)
      },

      // 插入编辑器
      // @params insertString {String}
      // @params focusPosBaseStart {Number} 相对于start的长度
      // @params hasSelection {Boolean} 是否选中了文字
      // @returns
      insertEditorString(
        insertString,
        focusPosBaseStart = 0,
        hasSelection = false
      ) {
        const { selectionStart, selectionEnd } = this.editor
        const startString = this.input.substring(0, selectionStart)
        const endString = this.input.substring(selectionEnd)

        this.input = startString + insertString + endString
        this.$nextTick(() => {
          const startPos = hasSelection ? selectionStart : selectionStart + focusPosBaseStart
          const endPos = selectionStart + focusPosBaseStart
          this.editor.focus()
          this.editor.setSelectionRange(startPos, endPos)
        })
      },

      handleTools(id) {
        switch(id) {
          case 1:
            this.insertEditorString('```\n\n```', 4)
            break
          case 2:
            this.insertEditorString('``', 1)
            break
          case 3:
            this.insertEditorString('[]()', 1)
            break
          case 4:
            this.$message.info('请复制图片后直接粘贴')
            // this.insertEditorString('![]()', 2)
            break
          default:
        }
      },

      paste(e) {
        const pasteItem = e.clipboardData.items[0]
        if (pasteItem && /image/.test(pasteItem.type)) {
          e.preventDefault()
          const blob = pasteItem.getAsFile()
          const rdr = new FileReader()
          rdr.onloadend = () => {
            this.upload(this.title, rdr.result)
          }
          rdr.readAsDataURL(blob)
        } else {
          pasteItem.getAsString(content => {
            console.log(content)
            this.$message.info('复制的是字符串')
          })
        }
      },

      async upload(title, base64) {
        this.showProgress = true
        this.uploadProgress = 50
        const uploadRes = await uploadImg({
          commit: title,
          base64: base64.split(';')[1]
          // cb: (num) => {
          //   this.showProgress = true
          //   this.uploadProgress = num
          // }
        })
        this.uploadProgress = 0
        this.showProgress = false
        const str = `![${uploadRes.sha}](${uploadRes.download_url})`
        this.insertEditorString(str, str.length)
        // let name = title || 'jmingzi'
        // uploadImg({
        //   name,
        //   base64: base64.split(';')[1],
        //   cb: (num) => {
        //     this.showProgress = true
        //     this.uploadProgress = num
        //   }
        // }).then(res => {
        //   this.uploadProgress = 0
        //   this.showProgress = false
        //   const str = `![${res.id}](${res.attributes.url})`
        //   this.insertEditorString(str, str.length)
        // })
      }
    }
  }
</script>

<style lang="stylus">
  .editor__textarea
    font-size: 14px
    line-height: 1.6
    word-wrap: break-word
    background-color: #fafbfc
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"

  .editor__wrap
    padding: 10px
    &:focus
      outline: none

  .editor__tools
    display flex
    justify-content space-between
    align-items center
    border-right: 1px #eceeef solid;
    border-bottom: 1px #eceeef solid;
  .editor__tools-item
    text-align center
    height: 39px
    line-height 39px
    cursor: pointer
    &:hover
      background-color #f7f8f9

  .editor__title,
  .editor__tag
    &:focus
      outline: none

  .editor__tag
    width: 400px

  .editor__tag
    width: 200px
    border: none

  .editor__upload-progress
    width: 100%
    background-color: rgba(0, 0, 0, .5)
    .num
      top: 50%
      left: 50%
      transform: translate(-50%, -50%)
      border-radius: 6px
</style>
