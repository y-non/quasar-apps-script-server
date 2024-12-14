<template>
  <q-page class="q-pa-md">
    <div class="login-wrapper">
      <q-form
        @submit="login"
        style="width: 500px"
      >
        <div class="text-h6 q-mb-md">Vui lòng đăng nhập</div>
        <q-input
          v-model="username"
          label="Tên đăng nhập"
          :rules="[(val) => !!val || 'Field is required']"
          outlined
          @input="username = $event.toLowerCase()"
        />
        <q-input
          v-model="password"
          label="Mật khẩu"
          type="password"
          :rules="[(val) => !!val || 'Field is required']"
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

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Loading } from "quasar";
import { useMainStore } from "src/stores/main-store";


const username = ref("");
const password = ref("");
const router = useRouter();
const storeMain = useMainStore();


const login = async () => {
  try {
    Loading.show({
      message: "Đang đăng nhập...",
    });

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain;charset=utf-8")

    const raw = JSON.stringify({
      action: "login",
      username: username.value,
      password: password.value,
    })

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    const response = await fetch(
      storeMain.urlEndPoint,
      requestOptions
    );

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("username", username.value);
      localStorage.setItem("password", password.value);
      localStorage.setItem("isLogin", true)
      router.push("/data");
    } else {
      alert("Login failed");
    }

    Loading.hide();
    setTimeout(() => {
      window.location.reload();
    }, 200);
  } catch (error) {
    console.error("Error logging in:", error);
    Loading.hide();
  }
};

</script>

<style lang="scss" scoped>
.login-wrapper {
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
