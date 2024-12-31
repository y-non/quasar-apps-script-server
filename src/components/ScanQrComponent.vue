<script setup>
/* IMPORT DATA */
//pinia store
//build in VueJs
import { ref } from "vue";
//lib
import { QrcodeStream } from "vue-qrcode-reader";
//utils
import { QrUtil } from "src/utils/scanQr";

/* DECLARE VARIABLES */
//props
const { height, detectFunc } = defineProps([
  "height",
  "detectFunc",
  "errorFunc",
  "cameraOnFunc",
]);

const trackFunctionOptions = [{ text: "outline", value: QrUtil.paintOutline }];
const trackFunctionSelected = ref(trackFunctionOptions[0]);
</script>

<template>
  <div class="flex items-center justify-center p-5">
    <qrcode-stream
      class="full-width"
      :style="{ height: `${height}px` }"
      :track="trackFunctionSelected.value"
      @error="errorFunc"
      @detect="detectFunc"
      @camera-on="cameraOnFunc"
    >
    </qrcode-stream>

    <div class="text-center q-mt-lg text-bold text-grey-7">
      VUI LÒNG QUÉT MÃ QR CODE
    </div>
  </div>
</template>
