<script setup lang="ts">
import { computed, h, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NCard, NList, NListItem, NThing, NModal, NTag, NSpace, NScrollbar } from 'naive-ui'
import { getProxyDelay } from '@/api/kernel'
import { DefaultTestTimeout, DefaultTestURL } from '@/constant/app'
import { useAppSettingsStore, useKernelApiStore, useSubscribesStore } from '@/stores'
import { formatBytes, formatDate, message, APP_TITLE, handleUseProxy } from '@/utils'
import type { Subscription } from '@/types/app'
const kernelApiStore = useKernelApiStore()
const appSettingsStore = useAppSettingsStore()
const subscribeStore = useSubscribesStore()
const { t } = useI18n()
const router = useRouter()

const showLogoutConfirm = ref(false)
const updateLoading = ref(false)
const selectedProxyIds = ref<Record<string, string>>({})
const selectedProxyTag = ref('')
const proxyDelayMap = ref<Record<string, number>>({})
const proxyDelayLoadingMap = ref<Record<string, boolean>>({})
const proxyDelayAllLoading = ref(false)

const statistics = ref({
  upload: 0,
  download: 0,
})

const userName = computed(() => appSettingsStore.app.userInfo.userName || '用户')

const firstProxyGroup = computed(() => {
  const { proxies } = kernelApiStore
  const groups = Object.values(proxies).filter(
    (v) => v.type === 'Selector' && v.name !== 'GLOBAL',
  )
  return groups[0] || proxies.GLOBAL
})

const unregisterTrafficHandler = kernelApiStore.onTraffic((data) => {
  const { up, down } = data
  statistics.value.upload = up
  statistics.value.download = down
})

onUnmounted(() => {
  unregisterTrafficHandler()
})


const applySelectedProxy = async () => {
  if (!selectedProxyTag.value) return

  const group = firstProxyGroup.value
  if (!group) {
    message.warn('No proxy group available')
    return
  }

  const proxy = kernelApiStore.proxies[selectedProxyTag.value] || { name: selectedProxyTag.value }
  await handleUseProxy(group, proxy).catch((err: any) => message.error(err.message || err))
}

const handleStartKernel = async () => {
  try {
    await kernelApiStore.startCore()
    await applySelectedProxy()
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

const handleSelectProxy = async (subscribeId: string, proxyId: string, proxyTag: string) => {
  selectedProxyIds.value[subscribeId] = proxyId
  selectedProxyTag.value = proxyTag

  if (!kernelApiStore.running) {
    console.log('eeeeeeeee:',proxyTag)
    let tip = '已选择:'+proxyTag+' 节点，启动 VPN 后生效'
    message.success(tip)
    return
  }

  await applySelectedProxy()
}

const isSelectedProxy = (_subscribeId: string, _proxyId: string, proxyTag: string) => {
  const currentProxyTag = selectedProxyTag.value || firstProxyGroup.value?.now
  return currentProxyTag === proxyTag
}

const getProxyDelayText = (proxyTag: string) => {
  const delay = proxyDelayMap.value[proxyTag]
  return delay ? `${delay}ms` : '--'
}

const handleProxyDelay = async (proxyTag: string) => {
  if (!kernelApiStore.running) {
    message.info('请先启动 VPN 后测速')
    return
  }

  proxyDelayLoadingMap.value[proxyTag] = true
  try {
    const { delay = 0 } = await getProxyDelay(
      encodeURIComponent(proxyTag),
      appSettingsStore.app.kernel.testUrl || DefaultTestURL,
      appSettingsStore.app.kernel.testTimeout || DefaultTestTimeout,
    )
    proxyDelayMap.value[proxyTag] = delay

    const proxy = kernelApiStore.proxies[proxyTag]
    proxy && proxy.history.push({ delay })
  } catch (error: any) {
    proxyDelayMap.value[proxyTag] = 0
    message.error(error + ': ' + proxyTag)
  } finally {
    proxyDelayLoadingMap.value[proxyTag] = false
  }
}

const handleAllProxyDelay = async (s: Subscription) => {
  if (!kernelApiStore.running) {
    message.info('请先启动 VPN 后测速')
    return
  }

  proxyDelayAllLoading.value = true
  try {
    for (const proxy of s.proxies) {
      await handleProxyDelay(proxy.tag)
    }
  } finally {
    proxyDelayAllLoading.value = false
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
                <Icon icon="close" />
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
              <div> <span >实时流量 ：</span>
                <span>↑ {{ formatBytes(statistics.upload) }}/s</span>
                <span class="mx-2">↓ {{ formatBytes(statistics.download) }}/s</span>
              </div>
              <div> <span>{{ t('subscribes.total') }}：{{ formatBytes(s.download + s.upload, 2) }}</span>
                <span class="ml-3px text-10px">( ↑ {{ s.upload ? formatBytes(s.upload, 2) : '--' }}
                  ↓ {{ s.download ? formatBytes(s.download, 2) : '--' }} )</span>
                <span class="mx-2">/ {{ s.total ? formatBytes(s.total, 2) : '--' }}</span>

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
        <n-card content-style="padding: 0;max-height: 280px;" :bordered="false"
          header-style="padding: 10px;font-size: 15px;" segmented>
          <template #header>
            节点列表({{ s.proxies.length }})
            <n-button
              type="primary"
              size="small"
              round tertiary 
              :loading="proxyDelayAllLoading"
              :disabled="!kernelApiStore.running"
              @click.stop="handleAllProxyDelay(s)"
            >一键测速</n-button>
          </template>
          <n-scrollbar style="max-height: 280px">
            <n-list hoverable clickable>
              <n-list-item
                v-for="snode in s.proxies"
                :key="snode.id"
                class="cursor-pointer transition-colors"
                :class="isSelectedProxy(s.id, snode.id, snode.tag) ? 'bg-#18a058/10' : ''"
                :aria-selected="isSelectedProxy(s.id, snode.id, snode.tag)"
                @click="handleSelectProxy(s.id, snode.id, snode.tag)"
              >
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
                      <n-tag
                        :bordered="false"
                        type="success"
                        size="small"
                        :class="kernelApiStore.running ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
                        @click.stop="handleProxyDelay(snode.tag)"
                      >
                        延迟：{{ proxyDelayLoadingMap[snode.tag] ? '测试中...' : getProxyDelayText(snode.tag) }}
                      </n-tag>
                    </n-space>
                  </template>

                </n-thing>
              </n-list-item>

            </n-list>
          </n-scrollbar>
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
