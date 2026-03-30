<script setup lang="ts">
import { ref, h, inject, onMounted } from 'vue'
// import { h, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProfilesStore, useAppSettingsStore, useSubscribesStore, useKernelApiStore } from '@/stores'
import { message, sampleID } from '@/utils'

const kernelApiStore = useKernelApiStore()

const loading = ref(false)







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

</script>

<template>
  <div class="w-full h-[90%]">
    <div class=" flex flex-col items-center justify-center">欢迎来到Z-VPN</div>
    <div class="flex items-center justify-center mt-8">
      <Button v-show="kernelApiStore.running" type="normal">核心启动中</Button>
      <Button v-show="!kernelApiStore.running" type="normal">核心未启动</Button>
    </div>
    <div class="flex items-center justify-center mt-8">
      <Button type="primary" @click="handleStartKernel">启动核心并开启vpn连接</Button>
    </div>
    <div class="flex items-center justify-center mt-8">
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
</style>