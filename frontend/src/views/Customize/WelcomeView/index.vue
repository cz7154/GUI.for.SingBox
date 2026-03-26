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
    <div class=" flex flex-col items-center justify-center">欢迎来到Z-VPN</div>

 



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