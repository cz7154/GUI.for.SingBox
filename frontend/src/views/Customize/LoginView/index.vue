<script setup lang="ts">
import { ref, watch, useTemplateRef, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const user = ref({
  account: '',
  password: ''
})

const handleLogin = () => {
  console.log(user.value.account, user.value.password);

}
</script>

<template>
  <div class="w-full h-[90%]">
    <div class=" flex flex-col items-center justify-center">欢迎来到Z-VPN，请登录</div>
    <div class="form">
      <div class="flex mt-8">
        <div class="mr-20 form-item">账号:</div>
        <Input v-model="user.account" autofocus class="" />
      </div>
      <div class="flex  mt-8">
        <div class="mr-20 form-item">密码:</div>
        <Input v-model="user.password" type="password" autofocus class="" />

      </div>
      <div class="flex  mt-8">
        <div class="mr-20 form-item">验证码:</div>
        <Input v-model="user.password" type="password" autofocus class="" />

      </div>
    </div>
    <div class="flex items-center justify-center mt-8">

      <Button type="primary" @click="handleLogin">登录</Button>
    </div>



  </div>
</template>
<style lang="less" scoped>
.form {
  
    padding-left: 280px;
  .form-item{
     min-width: 80px;
  }
}
</style>