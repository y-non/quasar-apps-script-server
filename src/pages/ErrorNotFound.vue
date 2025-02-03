<template>
  <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
    <div>
      <!-- Animated 404 -->
      <div class="animated-404">
        <span class="digit">4</span>
        <span class="digit">0</span>
        <span class="digit">4</span>
      </div>

      <!-- Cute message -->
      <div class="text-h2 q-my-md" style="opacity: 0.8">
        Oops! It looks like you're lost in the void...
      </div>
      <div class="text-subtitle1" style="opacity: 0.6">
        Don't worry, we'll help you find your way back!
      </div>

      <!-- Home button -->
      <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Take Me Home"
        no-caps
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "ErrorNotFound",
});
</script>

<style lang="scss">
/* Animation for 404 digits */
.animated-404 {
  font-size: 15vh;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;

  .digit {
    animation: bounce 1.5s infinite ease-in-out;
    display: inline-block;
    margin: 0 0.2em;
  }

  .digit:nth-child(1) {
    animation-delay: 0s;
  }

  .digit:nth-child(2) {
    animation-delay: 0.2s;
  }

  .digit:nth-child(3) {
    animation-delay: 0.4s;
  }
}

/* Bounce animation */
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>
