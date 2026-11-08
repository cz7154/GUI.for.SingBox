<script setup lang="ts">
import { computed, h, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NButton, NCard, NList, NListItem, NThing, NModal, NTag, NSpace, NScrollbar, NPopover, NQrCode, NDropdown, NIcon, NImage, NBadge, NTooltip } from 'naive-ui'
import type { Component } from 'vue'
import {
  Pencil as EditIcon,
  LogOutOutline as LogoutIcon,
  PersonCircleOutline as UserIcon,
  Settings as SettingsIcon,
} from '@vicons/ionicons5'
import vipYear from '@/assets/img/vip-year.svg'
import vip1 from '@/assets/img/vip1.svg'
import { getProxyDelay } from '@/api/kernel'
import { DefaultTestTimeout, DefaultTestURL } from '@/constant/app'
import { useAppSettingsStore, useKernelApiStore, useSubscribesStore, useProfilesStore } from '@/stores'
import { formatBytes, formatDate, message, APP_CZ_NAME, handleUseProxy, buildSmartRegExp, sleep } from '@/utils'
import type { Subscription } from '@/types/app'
const kernelApiStore = useKernelApiStore()
const appSettingsStore = useAppSettingsStore()
const subscribeStore = useSubscribesStore()
const profilesStore = useProfilesStore()
const { t } = useI18n()
const router = useRouter()

const showLogoutConfirm = ref(false)
const showTechnicalSupportConfirm = ref(false)
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

const countryIcons = import.meta.glob('@/assets/img/country/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const countryRules = [
  { aliases: ['US', '美国'], file: 'US.svg' },
  { aliases: ['TH', '泰国'], file: 'TH.svg' },
  { aliases: ['JP', '日本'], file: 'JP.svg' },
  { aliases: ['SG', '新加坡'], file: 'SG.svg' },
  { aliases: ['MY', '马来西亚'], file: 'MY.svg' },
  { aliases: ['DE', '德国'], file: 'DE.svg' },
  { aliases: ['KR', '韩国'], file: 'KR.svg' },
  { aliases: ['TW', '台湾'], file: 'TW.svg' },
  { aliases: ['FR', '法国'], file: 'FR.svg' },
  { aliases: ['GB', '英国'], file: 'GB.svg' },
  { aliases: ['CA', '加拿大'], file: 'CA.svg' },
  { aliases: ['AU', '澳大利亚'], file: 'AU.svg' },
  { aliases: ['RU', '俄罗斯'], file: 'RU.svg' },
  { aliases: ['NL', '荷兰'], file: 'NL.svg' },
  { aliases: ['SE', '瑞典'], file: 'SE.svg' },
  { aliases: ['CH', '瑞士'], file: 'CH.svg' },
  { aliases: ['ES', '西班牙'], file: 'ES.svg' },
  { aliases: ['IT', '意大利'], file: 'IT.svg' },
  { aliases: ['BR', '巴西'], file: 'BR.svg' },
  { aliases: ['IN', '印度'], file: 'IN.svg' },
  { aliases: ['ID', '印度尼西亚'], file: 'ID.svg' },
  { aliases: ['VN', '越南'], file: 'VN.svg' },
  { aliases: ['HK', '香港'], file: 'HK.svg' },
]

const countryIconCache = new Map<string, string>()

// 根据节点标签名称获取国家图标
const getCountryIcon = (tagName: string): string | undefined => {
  const cached = countryIconCache.get(tagName)
  if (cached) return cached

  const prefix = [...tagName].slice(0, 4).join('')
  const country = countryRules.find(({ aliases }) =>
    aliases.some((alias) => prefix.includes(alias)),
  )
  const getIconByFile = (file: string) =>
    Object.entries(countryIcons).find(([path]) => path.endsWith(`/${file}`))?.[1]
  const icon = (country && getIconByFile(country.file)) || getIconByFile('US.svg')

  if (icon) countryIconCache.set(tagName, icon)
  return icon
}

const userName = computed(() => appSettingsStore.app.userInfo.userName || '用户')

const userSubUrl = computed(() => appSettingsStore.app.userInfo.userSubUrl || '')

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

const toHome = () => {
  router.push('/Overview')
}

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
    // 重置实时流量
    statistics.value.upload = 0
    statistics.value.download = 0
    stopTimer
    clearInterval(timer)
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
  }
}
const timer = setInterval(() => {
  kernelApiStore.refreshProviderProxies()
}, 5000)
const handleToggleKernel = async () => {
  if (kernelApiStore.running) {
    handleStopKernel()
    return
  }
  await handleStartKernel()
  timer
}
onUnmounted(() => clearInterval(timer))
const handleUpdateSub = async (s: Subscription) => {
  updateLoading.value = true
  // 更新订阅时清空测速结果，避免上次测速结果影响本次测速
  proxyDelayMap.value = {}
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
    console.log('eeeeeeeee:', proxyTag)
    let tip = `已选择: ${proxyTag} 节点，启动 VPN 后生效`
    message.success(tip)
    return
  }

  await applySelectedProxy()
}

const isSelectedProxy = (_subscribeId: string, _proxyId: string, proxyTag: string) => {
  const currentProxyTag = selectedProxyTag.value || firstProxyGroup.value?.now
  return currentProxyTag === proxyTag
}

const getProxyDelayText = computed(() => (proxyTag: string) => {
  const delay = proxyDelayMap.value[proxyTag]
  if (delay && delay >= 3000) {
    return '超时'
  }
  return delay ? `${delay}ms` : '--'
})

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
    proxyDelayMap.value[proxyTag] = 3000
    // proxyDelayMap.value[proxyTag] = ''
    // message.error(error + ': ' + proxyTag)
  } finally {
    proxyDelayLoadingMap.value[proxyTag] = false
  }
}

const handleAllProxyDelay = (s: Subscription) => {
  if (!kernelApiStore.running) {
    message.info('请先启动 VPN 后测速')
    return
  }

  proxyDelayAllLoading.value = true
  try {
    for (const proxy of s.proxies) {
      handleProxyDelay(proxy.tag)
    }
  } finally {
    proxyDelayAllLoading.value = false
  }
}

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const handleConfirmLogout = () => {
  if (kernelApiStore.running) {
    handleStopKernel()
  }
  showLogoutConfirm.value = false
  router.push({ name: 'Login' })
}
function renderIcon(icon: Component) {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon)
    })
  }
}


const options = computed(() =>
  [
    { label: '技术支持', key: 'technicalSupport', icon: renderIcon(UserIcon), show: true },
    { label: '版本更新', key: 'editProfile', icon: renderIcon(EditIcon), show: true },
    { label: '管理后台', key: 'admin', icon: renderIcon(EditIcon), show: appSettingsStore.app.userInfo.authorityId == '1087' ? true : false },
    { label: '退出登录', key: 'logout', icon: renderIcon(LogoutIcon), show: true },
  ]
    .filter(o => o.show)
    .map(({ show, ...rest }) => rest)
)
const handleSelect = (key: string) => {
  console.log('点击了：', key)

  if (key === 'logout') {
    handleLogout()
  }
  if (key === 'admin') {
    toHome()
  }
  if (key === 'technicalSupport') {
    showTechnicalSupportConfirm.value = true
  }
}


// 该函数从GroupsController.vue中复用提取出来，目的能实时显示节点信息
const filterKeywordsMap = ref<Record<string, string>>({})
const groups = computed(() => {
  const { proxies } = kernelApiStore
  const iconMapping = (profilesStore.currentProfile?.outbounds || []).reduce((p, c) => {
    p[c.tag] = c.icon
    return p
  }, {} as Recordable<string>)
  const hiddenList = (profilesStore.currentProfile?.outbounds || []).flatMap((v) =>
    v.hidden ? v.tag : [],
  )
  return Object.values(proxies)
    .filter(
      (v) =>
        ['Selector', 'URLTest'].includes(v.type) &&
        v.name !== 'GLOBAL' &&
        !hiddenList.includes(v.name),
    )
    .concat(proxies.GLOBAL || [])
    .map((group) => {
      const all = (group.all || [])
        .filter((proxy) => {
          const history = proxies[proxy]?.history || []
          const alive = (history[history.length - 1]?.delay ?? 0) > 0
          const condition1 =
            appSettingsStore.app.kernel.unAvailable ||
            ['direct', 'block'].includes(proxy) ||
            proxies[proxy]?.all ||
            alive
          const keywords = filterKeywordsMap.value[group.name]
          const condition2 = keywords ? buildSmartRegExp(keywords, 'i').test(proxy) : true
          return condition1 && condition2
        })
        .map((proxy) => {
          const history = proxies[proxy]?.history || []
          const delay = history[history.length - 1]?.delay || 0
          return { ...proxies[proxy]!, delay }
        })
        .sort((a, b) => {
          if (!appSettingsStore.app.kernel.sortByDelay || a.delay === b.delay) return 0
          if (!a.delay) return 1
          if (!b.delay) return -1
          return a.delay - b.delay
        })

      const chains = [group.now]
      let tmp = proxies[group.now]
      while (tmp) {
        tmp.now && chains.push(tmp.now)
        tmp = proxies[tmp.now]
      }
      return { ...group, all, chains, icon: iconMapping[group.name] }
    })
})


// 连接计时
const elapsedSeconds = ref(0)
let connectTimer: ReturnType<typeof setInterval> | undefined

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    connectTimer = undefined
  }
}

watch(
  () => kernelApiStore.running,
  (running) => {
    stopTimer()
    elapsedSeconds.value = 0

    if (running) {
      connectTimer = setInterval(() => {
        elapsedSeconds.value += 1
      }, 1000)
    }
  },
  { immediate: true },
)

onUnmounted(stopTimer)

const formatElapsedTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

</script>

<template>
  <div class="">
    <div v-for="s in subscribeStore.subscribes" :key="s.id" :bordered="false"
      class="mb-4 overflow-hidden rounded-4 " content-class="p-0!">
      <div class="bg-#93dfb7 px-8 py-4 text-black ">
        <div class="flex items-center">
          <div class="flex-1 m-0 text-3.5 font-semibold">欢迎来到 {{ APP_CZ_NAME }}</div>
          <div class="">
            <n-dropdown trigger="click" :options="options" @select="handleSelect">
              <!-- @click="handleLogout" -->
              <n-button type="info" size="small">
                <template #icon>
                  <SettingsIcon></SettingsIcon>
                </template>
                设置
              </n-button>

            </n-dropdown>
          </div>
        </div>
        <!-- 用户信息 -->
        <div class="mt-3 flex items-center gap-4  ">

          <div class="">
            <div class="flex items-center gap-2">
              <div class="text-lg">👤</div>
              <div>
                <div class=" text-4 font-medium select-text">{{ userName }}</div>
                <n-tooltip trigger="hover" placement="bottom-start"  >
                  <template #trigger>
                    <n-image class="h-3.5 transition-transform duration-300 ease-out hover:scale-110"
                      style=" object-fit: contain" :src="vipYear" preview-disabled />
                  </template>
                  <div class="text-2">VIP年费会员</div>
                </n-tooltip>
              </div>

            </div>
            <div class="py-2 text-3">
              <div><span class="font-semibold"> {{ t('subscribes.expire') }}：</span>{{ s.expire ? formatDate(s.expire, 'YYYY-MM-DD HH:mm:ss') : '--' }}
              </div>
              <div> <span class="font-semibold">实时流量: </span>
                <span>↑ {{ formatBytes(statistics.upload) }}/s</span>
                <span class="mx-2">↓ {{ formatBytes(statistics.download) }}/s</span>
              </div>
              <div>
                <div>
                  <span class="font-semibold">{{ t('subscribes.total') }}：</span>
                  <n-popover trigger="hover">
                    <template #trigger>

                      <n-button secondary strong size="small" class="text-3  ">{{ formatBytes(s.download +
                        s.upload, 2)
                      }}</n-button>

                    </template>
                    <span>↑ {{ s.upload ? formatBytes(s.upload, 2) : '--' }}
                      ↓ {{ s.download ? formatBytes(s.download, 2) : '--' }}</span>
                  </n-popover>
                  <span class="mx-2">/ {{ s.total ? formatBytes(s.total, 2) : '--' }}</span>
                </div>
              </div>
            </div>
            <!-- 手机二维码 -->
            <div>
              <n-popover trigger="click">
                <template #trigger>
                  <n-button size="tiny" type="warning">手机上使用？</n-button>
                </template>
                <div class="max-w-240px ">
                  <div class="text-12px">请使用您的iphone中的Shadowrocket App扫描下面二维码</div>
                  <div class="text-center">
                    <n-qr-code icon-src="@/assets/icon/icon.ico" icon-background-color="red" :value="userSubUrl"
                      error-correction-level="H" />
                  </div>

                </div>
              </n-popover>

            </div>
          </div>
        </div>
      </div>

      <div class="px-10px py-10px">
        <div class="mb-12px flex flex-col gap-10px md:flex-row md:items-center md:justify-between">
          <n-button :type="kernelApiStore.running ? 'error' : 'primary'" size="large" :loading="kernelApiStore.starting"
            class=" rounded-14px px-4 py-7  text-12 font-semibold" @click="handleToggleKernel">

            <div>
              <div class="text-12px font-semibold mb-5px"> {{ kernelApiStore.running ? '停止连接' : '开启连接' }}
              </div>
              <div v-show="kernelApiStore.running" class="ml-8px text-10px opacity-70">
                <div class=" mb-2">当前节点： {{ groups[0]?.chains[0] }}-{{ groups[0]?.chains[1] }}</div>
                <div>连接时长： {{ formatElapsedTime(elapsedSeconds) }}</div>
              </div>
            </div>
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
        <n-card content-style="padding: 0px;max-height: 280px;" :bordered="false"
          header-style="padding: 8px;font-size: 13px;" segmented>
          <template #header>
            <span class="text-12px font-semibold mr-5px">节点列表({{ s.proxies.length }})</span>
            <n-button type="primary" size="tiny" class="text-10px " :loading="proxyDelayAllLoading"
              :disabled="!kernelApiStore.running" @click.stop="handleAllProxyDelay(s)">一键测速</n-button>

          </template>
          <n-scrollbar style="max-height: 280px">
            <n-list hoverable clickable>
              <n-list-item v-for="snode in s.proxies" :key="snode.id" class="cursor-pointer transition-colors"
                :class="isSelectedProxy(s.id, snode.id, snode.tag) ? 'bg-#18a058/10' : ''"
                :aria-selected="isSelectedProxy(s.id, snode.id, snode.tag)"
                @click="handleSelectProxy(s.id, snode.id, snode.tag)">
                <!-- <template #prefix>
                    <n-button>Prefix</n-button> 
                     <GameControllerOutline />
                </template> -->
                <n-thing content-style="margin-top: 5px;">
                  <template #header>
                    <div class="flex items-center gap-2">

                      <n-image style="width: 20px; height: 20px; object-fit: contain" :src="getCountryIcon(snode.tag)"
                        preview-disabled />
                      <div class="text-12px">{{ snode.tag }}</div>
                    </div>

                  </template>
                  <template #description>
                    <n-space size="medium" style="margin-top: 4px;">
                      <n-tag class="text-10px" :bordered="false" type="info" size="small">
                        CN2 GIA
                      </n-tag>
                      <n-tag class="text-10px" :bordered="false" type="success" size="small">
                        独享节点
                      </n-tag>
                      <!-- <n-tag class="text-10px" v-if="getProxyDelayText(snode.tag) != '--'" :bordered="false"
                        type="success" size="small">
                        可用
                      </n-tag>
                      <n-tag class="text-10px" v-if="getProxyDelayText(snode.tag) === '--'" :bordered="false"
                        type="error" size="small">
                        不可用
                      </n-tag> -->
                      <n-tag class="text-10px" :bordered="false"
                        :type="getProxyDelayText(snode.tag) === '超时' ? 'error' : 'success'" size="small"
                        :class="kernelApiStore.running ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
                        @click.stop="handleProxyDelay(snode.tag)">
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
    </div>

    <n-card v-if="!subscribeStore.subscribes.length" :bordered="false" class="rounded-20px text-center">
      <div class="py-42px text-#666">暂无订阅，请先登录或添加订阅。</div>
      <n-button secondary type="primary" class="h-40px rounded-12px px-16px" @click="handleConfirmLogout">返回 </n-button>
    </n-card>

    <n-modal v-model:show="showLogoutConfirm" preset="dialog" title="提示" positive-text="确认" negative-text="取消"
      @positive-click="handleConfirmLogout">
      退出登录后将停止 VPN 连接，是否继续？
    </n-modal>
    <n-modal class="select-text" v-model:show="showTechnicalSupportConfirm" preset="dialog" title="技术支持" positive-text="确认">
      请详细描述你的情况，并附上截图，发送到邮箱：****@gmail.com，技术支持人员会尽快联系你。
    </n-modal>
  </div>
</template>
