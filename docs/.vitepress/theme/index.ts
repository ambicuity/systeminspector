import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'
import NpmStats from './components/NpmStats.vue'
import CodePlayground from './components/CodePlayground.vue'
import AIChatbot from './components/AIChatbot.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-after': () => h(NpmStats),
      'layout-bottom': () => h(AIChatbot)
    })
  },
  enhanceApp({ app }) {
    app.component('NpmStats', NpmStats)
    app.component('CodePlayground', CodePlayground)
    app.component('AIChatbot', AIChatbot)
  }
}
