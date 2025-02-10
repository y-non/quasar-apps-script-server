<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md">
      <q-card-section>
        <h5>WebAuthn Authentication</h5>
      </q-card-section>

      <q-card-section>
        <q-btn
          label="Authenticate with Face ID / Fingerprint"
          icon="fingerprint"
          color="primary"
          @click="authenticate"
        />
      </q-card-section>

      <q-card-section>
        <q-banner
          v-if="authResult"
          :class="authResult.success ? 'bg-green' : 'bg-red'"
          class="q-mt-md text-white"
        >
          {{ authResult.message }}
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();
const authResult = ref(null);

const authenticate = async () => {
  if (!window.PublicKeyCredential) {
    authResult.value = {
      success: false,
      message: "WebAuthn is not supported on this device/browser.",
    };
    return;
  }

  try {
    // Show the WebAuthn authentication prompt
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32), // Random challenge (not used in this demo)
        allowCredentials: [], // Empty for testing (real implementation needs user credentials)
        timeout: 60000,
      },
    });

    // If authentication is successful
    if (credential) {
      authResult.value = {
        success: true,
        message: "Authentication Successful! 🎉",
      };
    } else {
      throw new Error("Authentication failed.");
    }
  } catch (error) {
    authResult.value = { success: false, message: `Error: ${error.message}` };
  }
};
</script>
