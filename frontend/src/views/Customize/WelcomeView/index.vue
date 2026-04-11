<script setup lang="ts">
import { ref, h, inject, onMounted,onUnmounted } from 'vue'
// import { h, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProfilesStore, useAppSettingsStore, useSubscribesStore, useKernelApiStore } from '@/stores'
import { message, sampleID,  formatBytes,formatDate } from '@/utils'

const kernelApiStore = useKernelApiStore()
const appSettingsStore = useAppSettingsStore()
const subscribeStore = useSubscribesStore()
const loading = ref(false)
const { t } = useI18n()

import type { Subscription } from '@/types/app'




//  onMounted(handleSave)

onMounted(() => {
  console.log('Component is mounted!2222')
  // 你的初始化逻辑
})


console.log('Component is mounted!')


const handleStartKernel = async () => {
  try {
    await kernelApiStore.startCore()

    
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
  }
}

const handleStopKernel = async () => {
  try {
    await kernelApiStore.stopCore()
   
  //  console.log('status.value:',status.value);
  } catch (error: any) {
    console.error(error)
    message.error(error)
  }
}
const handleUpdateSub = async (s: Subscription) => {
  try {
    await subscribeStore.updateSubscribe(s.id)
  } catch (error: any) {
    console.error('updateSubscribe: ', error)
    message.error(error)
  }
}
const statistics = ref({
  upload: 0,
  download: 0,
  downloadTotal: 0,
  uploadTotal: 0,
  connections: [] as any[],
  inuse: 0,
  memUsage: 0,
})

const unregisterTrafficHandler = kernelApiStore.onTraffic((data) => {
  const { up, down } = data
  statistics.value.upload = up
  statistics.value.download = down

})
onUnmounted(() => {
  // unregisterMemoryHandler()
  unregisterTrafficHandler()
 // unregisterConnectionsHandler()
})
</script>

<template>
  <div class="w-full h-[90%]">
    <div class=" flex flex-col items-center justify-center">欢迎来到Z-VPN</div>
    <div class=" flex flex-col items-center justify-center">您好: {{ appSettingsStore.app.userInfo.userName }}</div>
          <Card :title="t('home.overview.realtimeTraffic')" class="flex-1">
        <div class="py-8 text-12">
          ↑ {{ formatBytes(statistics.upload) }}/s ↓ {{ formatBytes(statistics.download) }}/s
        </div>
      </Card>
    <div class="flex flex-col items-center "       v-for="s in subscribeStore.subscribes"
      :key="s.id">
                    <Button
                :disabled="s.disabled"
                :loading="s.updating"
                :type="s.disabled ? 'text' : 'text'"
                @click="handleUpdateSub(s)"
              >
                {{ t('common.update') }}
              </Button>
        <div>{{ s.name }}</div>
         <div>
          {{ t('subscribes.proxyCount') }}
          :
          {{ s.proxies.length }}
        </div>
        <div>
          {{ t('subscribes.upload') }}
          :
          {{ s.upload ? formatBytes(s.upload, 2) : '--' }}
          /
          {{ t('subscribes.download') }}
          :
          {{ s.download ? formatBytes(s.download, 2) : '--' }}
          /
          {{ t('subscribes.total') }}
          :
          {{ s.total ? formatBytes(s.total, 2) : '--' }}
        </div>
        <div>
          {{ t('subscribes.expire') }}
          :
          {{ s.expire ? formatDate(s.expire, 'YYYY-MM-DD HH:mm:ss') : '--' }}
          /
          {{ t('common.updateTime') }}
          :
          {{ s.updateTime ? formatDate(s.updateTime, 'YYYY-MM-DD HH:mm:ss') : '--' }}
        </div>
    </div>

    <div class="flex items-center justify-center mt-8">
      <!-- <Button v-show="kernelApiStore.running" type="normal"> -->
        <div v-show="kernelApiStore.running" class="bg-transparent run">核心启动中</div>
      <!-- </Button> -->
      <!-- <Button v-show="!kernelApiStore.running" type="normal">
        <div class="bg-red">核心未启动</div> -->
        <div v-show="!kernelApiStore.running" class="bg-transparent run">核心未启动</div>
      <!-- </Button> -->
    </div>
    <div v-show="!kernelApiStore.running" class="flex items-center justify-center mt-8">
      <Button :loading="kernelApiStore.starting" type="primary" @click="handleStartKernel">启动核心并开启vpn连接</Button>
    </div>
    <div v-show="kernelApiStore.running" class="flex items-center justify-center mt-8">
      <Button type="primary" @click="handleStopKernel">停止核心</Button>
    </div>
  </div>
</template>
<style lang="less" scoped>
.form {

  padding-left: 280px;

  .form-item {
    min-width: 80px;
  }
}
.run{
  background-color: greenyellow;
  color: rgb(7, 7, 6);
}
</style>