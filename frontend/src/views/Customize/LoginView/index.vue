<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NCheckbox,
  NConfigProvider,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NSpin,
  NPopover
} from 'naive-ui'
import { captcha, login } from '../api/api'
import {
  useAppSettingsStore,
  useProfilesStore,
  useSubscribesStore,
} from '@/stores'
import { message, sampleID, APP_CZ_NAME } from '@/utils'

const router = useRouter()
const subscribeStore = useSubscribesStore()
const profilesStore = useProfilesStore()
const appSettingsStore = useAppSettingsStore()

const url = ref('')
const userSubUrl = ref('')

const name = ref('')
const loading = ref(false)
const isLoading = ref(true)
const picPath = ref('')

const loginForm = ref({
  userName: '',    // test001
  password: '',    // test001
  captcha: '',
  captchaId: '',
  openCaptcha: false,
  remember: true,
})

const toWelcome = () => {
  router.push('/welcome')
}

const handleRegistration = () => {
  message.success('暂未开放注册，敬请期待')
}

const handleForgetPassword = () => {
  message.success('暂未开放找回密码，敬请期待')
}

const handleSave = async () => {
  name.value = 's-ui订阅'
  if (!name.value) {
    name.value = sampleID()
  }
  userSubUrl.value = 'https://hksui.czvps.top/sub/LiuJJ'
  url.value = 'https://hksui.czvps.top/sub/LiuJJ?x-token=' + appSettingsStore.app.userInfo.token
  const sub = subscribeStore.getSubscribeTemplate(name.value, { url: url.value })


  try {
    if (subscribeStore.subscribes.length) {
      const idsToDelete = subscribeStore.subscribes.map((s) => s.id)
      for (let i = idsToDelete.length - 1; i >= 0; i--) {
        await subscribeStore.deleteSubscribe(idsToDelete[i] as string)
      }
    }

    if (profilesStore.profiles.length) {
      const idsProfilesToDelete = profilesStore.profiles.map((s) => s.id)
      for (let i = idsProfilesToDelete.length - 1; i >= 0; i--) {
        await profilesStore.deleteProfile(idsProfilesToDelete[i] as string)
      }
    }

    await subscribeStore.addSubscribe(sub)
    await subscribeStore.updateSubscribe(sub.id)
  } catch (error: any) {
    await subscribeStore.deleteSubscribe(sub.id)
    throw error
  }

  const profile = profilesStore.getProfileTemplate(name.value)

  if (profile.outbounds[0] && profile.outbounds[1]) {
    profile.outbounds[0].outbounds.push({ id: sub.id, tag: sub.id, type: 'Subscription' })
    profile.outbounds[1].outbounds.push({ id: sub.id, tag: sub.id, type: 'Subscription' })
  }

  await profilesStore.addProfile(profile)
  appSettingsStore.app.kernel.profile = profile.id

  message.success('home.initSuccessful')
}

const loginVerify = async () => {
  console.log('正在获取验证码')
  isLoading.value = true
  const result = await captcha()

  if (result.code == 0) {
    picPath.value = result.data.picPath
    loginForm.value.captchaId = result.data.captchaId
  }

  isLoading.value = false
}

const loginIn = async () => {
  loading.value = true

  try {
    const result = await login(loginForm.value)

    if (result.code == 0) {
      appSettingsStore.app.userInfo.token = result.data.token
      appSettingsStore.app.userInfo.userName = result.data.user.userName
      // 记住账户密码
      if (loginForm.value.remember) {
        appSettingsStore.app.userInfo.password = loginForm.value.password
      } else {
        appSettingsStore.app.userInfo.password = ''
      }

      await handleSave()
      toWelcome()
    } else {
      message.error(result.msg)
      await loginVerify()
    }
  } catch (error: any) {
    console.error(error)
    message.error(error.message || error)
  } finally {
    loading.value = false
  }
}

const init = async () => {
  // todo 需要将token验证逻辑放在后端，前端只负责传递token
  // if (appSettingsStore.app.userInfo.token) {
  //     await handleSave()
  //     toWelcome()
  //     return
  //   }

    if (appSettingsStore.app.userInfo.password) {
      loginForm.value.userName = appSettingsStore.app.userInfo.userName
      loginForm.value.password = appSettingsStore.app.userInfo.password
    }

 await loginVerify()
}
init()
</script>

<template>
  <n-config-provider>
    <div class="flex justify-center p-5px">
      <!-- <n-card class=" rounded-25px border-none bg-[rgba(246,246,246,0.85)] shadow-2xl backdrop-blur-12px"
        :bordered="false"> -->
        <div>
        <div class="mb-8px text-center">
          <div class="mb-6px text-24px">🔐</div>
          <h1 class="text-28px text-black font-bold tracking-tight">{{ APP_CZ_NAME }}</h1>
         
        </div>

        <n-form :model="loginForm" label-placement="top">
          <n-form-item label="邮箱地址">
            <n-input v-model:value="loginForm.userName" placeholder="请输入邮箱地址" type="text"  clearable />
          </n-form-item>

          <n-form-item label="密码" >
            <n-input v-model:value="loginForm.password" placeholder="请输入密码" type="password" clearable 
              show-password-on="click" />
          </n-form-item>

          <n-form-item label="验证码">
            <div class="flex gap-8px">
              <n-input v-model:value="loginForm.captcha" placeholder="请输入验证码" clearable class="flex-1" />

              <n-popover trigger="hover">
                <template #trigger>
                  <n-spin size="small" :show="isLoading">
                    <n-image width="100" :preview-disabled="true" :src="picPath" :loading="isLoading"
                      @click="loginVerify()" />
                  </n-spin>
                </template>
                <div>看不清？点击换一张</div>
              </n-popover>

            </div>
          </n-form-item>

          <div class="mb-8px flex items-center justify-between">
            <n-checkbox v-model:checked="loginForm.remember">记住登录</n-checkbox>
            <n-button text type="primary" size="small" class="text-14px" @click="handleForgetPassword">
              忘记密码？
            </n-button>
          </div>

          <n-button type="primary" size="large" block :loading="loading" class="h-52px text-16px font-medium"
            @click="loginIn">
            立即登录
          </n-button>

          <div class="mt-8px text-center text-14px text-gray-400">
            还没有账号？
            <n-button text type="primary" size="small" class="ml-4px" @click="handleRegistration">
              立即注册
            </n-button>
          </div>
        </n-form>
        </div>
      <!-- </n-card> -->
    </div>
  </n-config-provider>
</template>
