import Vue from 'vue'
import Vuex from 'vuex'
import article from './modules/article'
import { fetch } from '../api'
import { format } from '../assets/date'

Vue.use(Vuex)

export function createStore() {
  return new Vuex.Store({
    state: {
      currentUser: null
    },

    getters: {
      lastModifier(state) {
        let item
        if (state.article.list.length > 0) {
          // 因为是按时间倒叙，所以取第一个
          item = state.article.list[0].updatedAt
        }
        return format(item, 'yyyy年MM月dd日 hh:mm')
      },

      isAdmin(state) {
        // console.log(state.currentUser)
        return state.currentUser && /^jmingzi$/i.test(state.currentUser.username)
      }
    },

    modules: {
      article: {
        namespaced: true,
        ...article
      }
    },

    actions: {
      SIGN_UP: () => {
        return signUp()
      },
      CURRENT_USER: ({ commit }) => {
        return fetch('currentUser').then(user => {
          commit('SET_CURRENT_USER', user ? user.toJSON() : null)
        })
      }
    },

    mutations: {
      SET_CURRENT_USER: (state, data) => {
        state.currentUser = data
      }
    }
  })
}
