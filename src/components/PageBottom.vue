<template>
  <div
    class="page-bottom__menu width-100"
    :class="{
      'px-margin-t50': isFixed,
      'px-padding-tb50': isFixed,
      'text-center': !isFixed
    }"
  >
    <ul class="font-0 margin-auto">
      <li
        v-for="item in menu"
        :key="item.id"
        class="ib-middle px-font-14"
        style="margin-right: 20px"
      >
        <a
          v-if="item.url"
          :href="item.url"
          target="_blank"
        >
          {{ item.name }}
        </a>
        <router-link
          v-else
          class=""
          :to="item.path"
        >
          {{ item.name }}
        </router-link>
      </li>
      <template v-if="currentUser">
        <li v-if="hasWrite()" class="ib-middle px-font-14 px-width-50">
          <router-link class="" to="/editor">
            <span class="ib-middle">写文章</span>
          </router-link>
        </li>
        <li class="ib-middle px-font-14 px-width-50">
          <a href="javascript:" class="px-margin-l10" @click="logOut">
            <span class="ib-middle">注销</span>
          </a>
        </li>
      </template>
      <li v-else class="ib-middle px-font-14">
        <a class="" href="javascript:" @click="handleGithub">Github 登录</a>
      </li>
      <template v-if="false">
        <li class="ib-middle px-font-14 px-width-50">
          <a href="javascript:" class="px-margin-l10 link-a" @click="signUp">
            <span class="ib-middle">注册</span>
          </a>
        </li>
      </template>
    </ul>
    <p
      v-if="!isFixed"
      class="color-c999 px-margin-t10 px-font-12"
    >
      最后更新：{{ lastModifier }}
    </p >
    <p class="color-c999 px-margin-t10 px-font-12">鄂ICP备18011687号-1</p>

    <el-dialog
      title="登录"
      :visible.sync="showSignIn"
      class="text-left"
      width="30%"
    >
      <el-form :model="form" :rules="rules" ref="form">
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            placeholder="用户名"
            @keyup.13="signIn"
          />
        </el-form-item>
        <el-form-item prop="pwd">
          <el-input
            type="password"
            placeholder="密码"
            v-model="form.pwd"
            @keyup.13="signIn"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="showSignIn = false">取 消</el-button>
        <el-button size="mini" type="primary" @click="signIn">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import { mapActions, mapState, mapGetters } from 'vuex'
  import { Dialog, Button, Form, FormItem, Input } from 'element-ui'
  import AV from 'leancloud-storage'
  import { login, logout } from '../api'
  import { handleGithub, handleLogin } from '../assets/util'

  export default {
    name: 'PageBottom',

    components: {
      ElDialog: Dialog,
      ElButton: Button,
      ElForm: Form,
      ElFormItem: FormItem,
      ElInput: Input
    },

    data() {
      return {
        showSignIn: false,
        form: {
          name: '',
          pwd: ''
        },
        rules: {
          name: [
            { required: true, message: '请输入用户名', trigger: 'blur' },
            { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
          ],
          pwd: [
            { required: true, message: '请输入密码', trigger: 'blur' },
            { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
          ]
        },
        menu: [
          {
            id: 1,
            name: '博客',
            path: '/'
          },
          {
            id: 2,
            name: 'Miss清单',
            url: 'http://pro.iming.work'
          },
          {
            id: 3,
            name: 'RecordDays',
            path: '/record-days'
          }
          // {
          //   id: 4,
          //   name: '关于',
          //   path: '/about'
          // }
        ]
      }
    },

    props: {
      isFixed: {
        type: Boolean,
        default: true
      }
    },

    computed: {
      ...mapState(['currentUser']),
      ...mapGetters(['lastModifier'])
    },

    async mounted() {
      // if (!this.$isServer) {
      this.CURRENT_USER()
      const loginName = document.cookie.match(/_login=([\w-_]+)&?/)
      if (!this.currentUser && loginName && loginName[1]) {
        // 根据用户名查询密码登录
        handleLogin.call(this, loginName[1])
      }
      // }
    },

    methods: {
      ...mapActions(['SIGN_UP', 'CURRENT_USER']),

      signUp() {
        this.$box.confirm('该接口为后门').then(() => {
          this.SIGN_UP()
        })
      },

      signIn() {
        this.$refs.form.validate(ok => {
          if (ok) {
            login(this.form.name, this.form.pwd)
              .then(res => {
                if (res) {
                  this.$message.success('登录成功')
                  this.CURRENT_USER()
                  this.showSignIn = false
                }
              })
              .catch(res => {
                this.$message.error(res.message)
              })
          }
        })
      },

      logOut() {
        logout().then(() => {
          this.CURRENT_USER()
          this.$message.success('注销成功')
        })
      },

      hasWrite () {
        let user = AV.User.current()
        if (user) {
          user = user.toJSON().username
        }
        return user && /^Jmingzi$/i.test(user)
      },

      handleGithub() {
        handleGithub.call(this)
      }
    }
  }
</script>

<style lang="stylus">
  .page-bottom__menu
    @media (max-height: 670px)
      position: static;
      padding: 50px 0 30px 0;
</style>
