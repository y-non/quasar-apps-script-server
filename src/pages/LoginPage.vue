<script setup>
import { useMainStore } from "src/stores/main-store";
import { useAuthenticationStore } from "src/stores/AuthenticationStore";
import { useSupabaseStore } from "src/stores/SupabaseStore";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "src/utils/superbase";

const storeMain = useMainStore();
const storeAuthentication = useAuthenticationStore();
const storeSupabase = useSupabaseStore();
const router = useRouter();
const isShowLogin = ref(true);

onMounted(async () => {
  await storeSupabase.fetchMenuData();

  supabase.auth.onAuthStateChange((_, session) => {
    if (session) {
      // storeAuthentication.getUserList();
    }
  });
});
</script>

<template>
  <q-page class="q-pa-md">
    <div v-if="isShowLogin" class="login-wrapper">
      <q-form
        @submit="
          storeAuthentication.signIn(
            storeAuthentication.username,
            storeAuthentication.password
          )
        "
        style="width: 500px"
      >
        <div class="text-h6 q-mb-md">Vui lòng đăng nhập</div>
        <q-input
          v-model="storeAuthentication.username"
          label="Tên đăng nhập"
          :rules="[(val) => !!val || 'Không được để rỗng']"
          outlined
          @input="storeAuthentication.username = $event.toLowerCase()"
        />
        <q-input
          v-model="storeAuthentication.password"
          label="Mật khẩu"
          type="password"
          :rules="
            ([(val) => !!val || 'Không được để rỗng'],
            [(val) => val.length > 5 || 'Mật khẩu tối thiểu 6 ký tự'])
          "
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

    <div v-else>
      <q-btn
        icon="eva-arrow-ios-back-outline"
        class="text-blue q-pl-none"
        flat
        @click="isShowLogin = true"
      >
        <span class="text-subtitle1">Quay lại</span>
      </q-btn>

      <div class="signup-wrapper">
        <q-form
          @submit="
            storeAuthentication.signUp(
              storeAuthentication.username,
              storeAuthentication.password
            )
          "
          style="width: 500px"
        >
          <div class="text-h6 q-mb-md">Đăng ký</div>
          <q-input
            v-model="storeAuthentication.username"
            label="Email"
            :rules="[(val) => !!val || 'Không được để rỗng']"
            outlined
            @input="storeAuthentication.username = $event.toLowerCase()"
          />
          <q-input
            v-model="storeAuthentication.password"
            label="Mật khẩu"
            type="password"
            :rules="
              ([(val) => !!val || 'Không được để rỗng'],
              [(val) => val.length > 5 || 'Mật khẩu tối thiểu 6 ký tự'])
            "
            outlined
          />

          <q-input
            v-model="storeAuthentication.repassword"
            label="Nhập lại mật khẩu"
            type="password"
            :rules="
              ([(val) => !!val || 'Không được để rỗng'],
              [
                (val) =>
                  val === storeAuthentication.password || 'Mật khẩu không khớp',
              ])
            "
            outlined
          />
          <div class="full-width flex flex-center">
            <q-btn
              label="Đăng ký"
              type="submit"
              color="black"
              class="full-width q-py-md"
            />
          </div>
        </q-form>
      </div>
    </div>

    <div v-if="isShowLogin" class="flex flex-center">
      Chưa có tài khoản?
      <b class="text-blue-8" @click="isShowLogin = false"
        >&nbsp;Đăng ký tại đây</b
      >
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

.signup-wrapper {
  height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
