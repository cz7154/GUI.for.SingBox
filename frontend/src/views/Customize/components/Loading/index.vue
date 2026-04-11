<!-- components/Loading.vue -->

<script setup lang="ts">
defineProps<{
  text?: string
  fullscreen?: boolean
}>()
</script>

<template>
  <div class="loading-mask" :class="{ fullscreen }">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<style scoped>
.loading-mask {
  position: absolute;
  inset: 0;                    /* top:0 left:0 right:0 bottom:0 */
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-mask.fullscreen {
  position: fixed;
}

.spinner {
  width: 42px;
  height: 42px;
  border: 5px solid #f0f0f0;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.loading-text {
  margin-top: 16px;
  color: #666;
  font-size: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>