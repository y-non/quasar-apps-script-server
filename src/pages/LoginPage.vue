<script setup>
import { useMainStore } from "src/stores/main-store";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const storeMain = useMainStore();
const router = useRouter();

onMounted(async () => {
  storeMain.getInit();

  storeMain.isLogin ? router.push("/data") : [];

  await storeMain.fetchMenuData();
});
</script>

<template>
  <q-page class="q-pa-md">
    <div class="login-wrapper">
      <q-form
        @submit="storeMain.login(storeMain.username, storeMain.password)"
        style="width: 500px"
      >
        <div class="text-h6 q-mb-md">Vui lòng đăng nhập</div>
        <q-input
          v-model="storeMain.username"
          label="Tên đăng nhập"
          :rules="[(val) => !!val || 'Không được để rỗng']"
          outlined
          @input="storeMain.username = $event.toLowerCase()"
        />
        <q-input
          v-model="storeMain.password"
          label="Mật khẩu"
          type="password"
          :rules="[(val) => !!val || 'Không được để rỗng']"
          outlined
        />
        <div class="full-width flex flex-center">
          <q-btn
            label="Đăng nhập"
            type="submit"
            color="black"
            class="full-width q-py-md"
          />
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.login-wrapper {
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
