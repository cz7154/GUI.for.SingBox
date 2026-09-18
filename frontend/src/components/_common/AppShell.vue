<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NavigationBar, TitleBar } from '@/components'

const router = useRouter()

// czcz监听路由变化，判断是否显示导航栏
// const hasNav = computed(() => {
//   if(router.currentRoute.value.path === '/Welcome' || router.currentRoute.value.path === '/' ){
//     return false
//   }
//   return true
// }
// )

const hasNav = computed(() => {
  return !router.currentRoute.value.meta.hideNav
})

</script>

<template>
  <TitleBar />
  <div class="flex-1 overflow-y-auto flex flex-col p-8">
    <NavigationBar v-show="hasNav" />
    <div class="flex flex-col overflow-y-auto mt-8 px-8 h-full">
      <RouterView #="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
  </div>
</template>
