<script setup lang="ts">
import { computed, h, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NCard, NList, NListItem, NThing, NModal, NTag,NSpace  } from 'naive-ui'
import { useAppSettingsStore, useKernelApiStore, useSubscribesStore } from '@/stores'
import { formatBytes, formatDate, message,APP_TITLE } from '@/utils'
import type { Subscription } from '@/types/app'
const kernelApiStore = useKernelApiStore()
const appSettingsStore = useAppSettingsStore()
const subscribeStore = useSubscribesStore()
const { t } = useI18n()
const router = useRouter()

const showLogoutConfirm = ref(false)
const updateLoading = ref(false)

const statistics = ref({
  upload: 0,
  download: 0,
})

const userName = computed(() => appSettingsStore.app.userInfo.userName || '用户')

const unregisterTrafficHandler = kernelApiStore.onTraffic((data) => {
  const { up, down } = data
  statistics.value.upload = up
  statistics.value.download = down
})

onUnmounted(() => {
  unregisterTrafficHandler()
})


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
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
  }
}

const handleToggleKernel = () => {
  if (kernelApiStore.running) {
    handleStopKernel()
    return
  }

  handleStartKernel()
}

const handleUpdateSub = async (s: Subscription) => {
  updateLoading.value = true
  try {
    await subscribeStore.updateSubscribe(s.id)
    message.success('更新成功')
  } catch (error: any) {
    console.error('updateSubscribe: ', error)
    message.error(error)
  } finally {
    updateLoading.value = false
  }
}

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const handleConfirmLogout = () => {
  showLogoutConfirm.value = false
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="p-24px">
    <n-card v-for="s in subscribeStore.subscribes" :key="s.id" :bordered="false"
      class="mb-32px overflow-hidden rounded-20px shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]" content-class="p-0!">
      <div class="bg-gradient-to-r from-#6D28D9 to-#18a058 px-32px py-24px text-white ">
        <div class="flex items-center">
          <div class="flex-1 m-0 text-28px font-semibold">欢迎来到 {{ APP_TITLE }}</div>
          <div class="">
            <n-button type="error" size="small" @click="handleLogout">
              <template #icon>
                <Icon icon="settings" />
              </template>
              注销
            </n-button>
          </div>
        </div>
        <!-- 用户信息 -->
        <div class="w-full mt-6 flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4">
          <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
            👤
          </div>
          <div class="">
            <div class="ml-10px pb-5px text-lg font-medium">{{ userName }}</div>
            <div class="rounded-2 bg-white/25 px-12px py-4px text-13px mb-10px">
              <div>{{ t('subscribes.expire') }}：{{ s.expire ? formatDate(s.expire, 'YYYY-MM-DD HH:mm:ss') : '--' }}
              </div>
              <div> <span>{{ t('subscribes.total') }}：{{ formatBytes(s.download + s.upload, 2) }}</span>
                <span class="ml-3px text-10px">( ↑ {{ s.upload ? formatBytes(s.upload, 2) : '--' }}
                  ↓ {{ s.download ? formatBytes(s.download, 2) : '--' }} )</span>
                <span class="mx-2">/ {{ s.total ? formatBytes(s.total, 2) : '--' }}</span>
                <span class="mx-2">实时流量 ：</span>
                <span>↑ {{ formatBytes(statistics.upload) }}/s</span>
                <span>↓ {{ formatBytes(statistics.download) }}/s</span>
              </div>
            </div>

          </div>
        </div>




      </div>

      <div class="px-32px py-32px">
        <div class="mb-24px flex flex-col gap-14px md:flex-row md:items-center md:justify-between">
          <n-button :type="kernelApiStore.running ? 'error' : 'primary'" size="large" :loading="kernelApiStore.starting"
            class="h-50px rounded-14px px-28px text-18px font-semibold" @click="handleToggleKernel">
            {{ kernelApiStore.running ? '停止 VPN 连接' : '开启 VPN 连接' }}
          </n-button>

          <n-button secondary type="primary" :loading="updateLoading" class="h-40px rounded-12px px-16px"
            @click="handleUpdateSub(s)">
            <div>
              <div class="text-12px font-semibold mb-5px">更新订阅</div>
              <div class="ml-8px text-10px opacity-70">
                {{ s.updateTime ? formatDate(s.updateTime, 'YYYY-MM-DD HH:mm:ss') : '--' }}
              </div>
            </div>
          </n-button>
        </div>

        <!-- 节点列表 -->
        <!-- <div>节点列表</div> -->
        <n-card content-style="padding: 0;max-height: 280px;" content-scrollable :bordered="false"
          header-style="padding: 10px;font-size: 15px;" segmented>
          <template #header>
            节点列表({{ s.proxies.length }})
          </template>
          <n-list hoverable clickable>
            <n-list-item v-for="snode in s.proxies" :key="snode.id">
              <!-- <template #prefix>
                    <n-button>Prefix</n-button> 
                     <GameControllerOutline />
                </template> -->
              <n-thing :title="snode.tag" content-style="margin-top: 10px;">
                <template #description>
                  <n-space size="medium" style="margin-top: 4px">
                    <n-tag :bordered="false" type="info" size="small">
                      CN2 GIA
                    </n-tag>
                    <n-tag :bordered="false" type="success" size="small">
                      可用
                    </n-tag>
                    <n-tag :bordered="false" type="success" size="small">
                      延迟：23ms
                    </n-tag>
                  </n-space>
                </template>

              </n-thing>
            </n-list-item>

          </n-list>
        </n-card>
      </div>
    </n-card>

    <n-card v-if="!subscribeStore.subscribes.length" :bordered="false" class="rounded-20px text-center">
      <div class="py-42px text-#666">暂无订阅，请先登录或添加订阅。</div>
      <n-button secondary type="primary" class="h-40px rounded-12px px-16px" @click="handleConfirmLogout">返回 </n-button>
    </n-card>

    <n-modal v-model:show="showLogoutConfirm" preset="dialog" title="提示" positive-text="确认" negative-text="取消"
      @positive-click="handleConfirmLogout">
      是否退出登录
    </n-modal>
  </div>
</template>
