// src/directives/vLoading.ts
import type { Directive } from 'vue'
import Loading from '../Loading/index.vue'
import { createApp } from 'vue'

const vLoading: Directive = {
  mounted(el: HTMLElement, binding) {
    const app = createApp(Loading, {
      text: typeof binding.value === 'string' ? binding.value : undefined, // 只在字符串时显示文字
      fullscreen: !!binding.modifiers.fullscreen,
    })

    const instance = app.mount(document.createElement('div'))

    ;(el as any)._vLoadingApp = app
    ;(el as any)._vLoadingInstance = instance

    // 确保父元素可定位（局部加载必须）
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative'
    }

    // boolean 控制显示：只要是 truthy 就显示
    if (binding.value) {
      el.appendChild(instance.$el)
    }
  },

  updated(el: HTMLElement, binding) {
    const instance = (el as any)._vLoadingInstance
    if (!instance) return

    // 更新文字（如果动态传入字符串）
    if (typeof binding.value === 'string' && instance.component?.props) {
      instance.component.props.text = binding.value
    }

    // 核心：用布尔值的 truthy/falsy 来控制显示/隐藏
    if (binding.value) {
      if (!el.contains(instance.$el)) {
        el.appendChild(instance.$el)
      }
    } else {
      if (el.contains(instance.$el)) {
        el.removeChild(instance.$el)
      }
    }
  },

  unmounted(el: HTMLElement) {
    const app = (el as any)._vLoadingApp
    if (app) {
      app.unmount()
      delete (el as any)._vLoadingApp
      delete (el as any)._vLoadingInstance
    }
  }
}

export default vLoading