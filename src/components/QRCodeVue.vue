<!-- QRCodeVue.vue -->
<template>
  <div class="qrcode">
    <QRCodeVue :value="value" :size="size" />
  </div>
</template>

<script setup>
import { defineProps } from "vue";
import QRCodeVue from "qrcode.vue"; // Import the qrcode.vue library

// Define props for the component
const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 200,
  },
});
</script>

<style scoped>
.qrcode {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
