<script setup lang="ts">
import { ref, watch, useTemplateRef, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const user = ref({
  account: '',
  password: ''
})

const handleLogin = () =>{
  console.log(user.value.account,user.value.password);
  
}
</script>

<template>
  <div class="w-full h-[90%]">
    <div class=" flex flex-col items-center justify-center">欢迎来到Z-VPN，请登录</div>
    <div class="flex items-center justify-center mt-8">
      <div class="mr-20">账号:</div>
      <Input v-model="user.account" autofocus class="" />
    </div>
    <div class="flex items-center justify-center mt-8">
      <div class="mr-20">密码:</div>
      <Input v-model="user.password" type="password" autofocus class="mr-20" />
      <div>验证码位置</div>
    </div>
    <div class="flex items-center justify-center mt-8">
       
      <Button type="primary" @click="handleLogin">登录</Button>
    </div>
      


  </div>
</template>
