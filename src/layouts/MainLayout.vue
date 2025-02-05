<script setup>
import { ref, onMounted, watch } from "vue";
import { useAuthenticationStore } from "src/stores/AuthenticationStore";
import { useSupabaseStore } from "src/stores/SupabaseStore";
import { storageUtil } from "src/utils/storageUtil";
import { Dialog, useQuasar } from "quasar";
import { useNetwork } from "@vueuse/core";
import { useCounter, useIdle } from "@vueuse/core";
import { supabase } from "src/utils/superbase";

const { inc, count } = useCounter();
const { idle, lastActive, reset } = useIdle(30 * 6 * 1000); // 5 min

const storeAuthentication = useAuthenticationStore();
const storeSupabase = useSupabaseStore();

const drawer = ref(false);
const userStatus = ref("");
const isLogin = storageUtil.getLocalStorageData("isLogin");
const role = ref("");
const routerName = ref("");
const $q = useQuasar();
const { downlink } = useNetwork();

/* in Vue file states */
const currentPassword = ref("");
const newPassword = ref("");
const isShowCurrentPassword = ref(false);
const isShowNewPassword = ref(false);
const isShowInstallApp = ref(false);

/* handle service worker state */
var deferredPrompt;

onMounted(async () => {
  $q.platform.is.android && $q.platform.is.mobile
    ? (isShowInstallApp.value = true)
    : (isShowInstallApp.value = false);

  role.value = storageUtil.getLocalStorageData("userAuthInfo")?.role;

  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("beforeinstallprompt event fired!"); // Debugging log
    e.preventDefault();
    deferredPrompt = e;
    showInstallAppPrompt(e);
  });
});

const showInstallAppPrompt = async () => {
  console.log("Deferred Prompt:", deferredPrompt); // Debugging log

  if (!deferredPrompt) {
    console.warn("No install prompt available.");
    return;
  }

  try {
    await deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log("User choice:", choiceResult);
      deferredPrompt = null;
    });
  } catch (err) {
    console.error("Error in showInstallAppPrompt:", err);
  }
};

watch(
  () => storeSupabase.listUserData,
  (val) => {
    const selfUserData = val.filter(
      (item) =>
        item.userid === storageUtil.getLocalStorageData("selfAppInfo").userid
    )[0];
    userStatus.value = selfUserData;
  }
);

watch(idle, (idleValue) => {
  if (idleValue && isLogin) {
    inc();
    Dialog.create({
      title: "Thông báo",
      message: "Đã hết phiên đăng nhập, vui lòng đăng nhập lại!",
      ok: true,
      cancel: false,
      persistent: true,
    }).onOk(async () => {
      localStorage.clear();

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
        return;
      }
      setTimeout(() => {
        window.location.reload();
      }, 100);
    });
    reset(); // restarts the idle timer. Does not change lastActive value
  }
});

const handleChangePassword = async () => {
  if (!currentPassword.value || !newPassword.value) return;
  await storeAuthentication.changePassword(
    currentPassword.value,
    newPassword.value
  );
};

/* Handle network */
window.addEventListener("online", () => {
  storeSupabase.isOnline = true;
});

window.addEventListener("offline", () => {
  storeSupabase.isOnline = false;
});

//handle weak network
// navigator.connection.addEventListener("change", updateConnectionStatus);
// function updateConnectionStatus() {
//   const connection = navigator.connection;

//   if (connection) {
//     if (connection.downlink < 1) {
//       storeSupabase.isShowWeakNetwork = true;
//     } else {
//       storeSupabase.isShowWeakNetwork = false;
//     }
//   }
// }

watch(downlink, (speed) => {
  // storeSupabase.isShowWeakNetwork = speed < 1;
  if (speed < 1) {
    storeSupabase.isShowWeakNetwork = true;
  } else {
    storeSupabase.isShowWeakNetwork = false;
  }
});
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header
      class="q-py-sm text-white"
      style="background-color: #1f1f1f; color: #c9c9c9"
      elevated
    >
      <q-toolbar>
        <div
          class="flex justify-between full-width"
          style="align-items: center"
        >
          <div>
            <q-btn
              v-if="isLogin && role !== 'admin'"
              flat
              dense
              round
              icon="menu"
              aria-label="Menu"
              @click="drawer = !drawer"
            >
            </q-btn>
            <span class="q-ml-md">{{ userStatus?.username }}</span>
          </div>

          <div
            v-if="role !== 'admin' && role !== 'superadmin'"
            class="flex justify-end"
          >
            <div v-if="isLogin == true">
              <div class="active">
                <span class="text-capitalize q-mr-sm">{{
                  userStatus?.status_name
                }}</span>

                <q-spinner-hearts
                  v-if="userStatus?.status_name === storeSupabase.statusServing"
                  :color="'grey-3'"
                  size="md"
                />
                <q-spinner-hourglass
                  v-if="userStatus?.status_name === storeSupabase.statusWaiting"
                  :color="'grey-3'"
                  size="xs"
                />
                <q-icon
                  v-if="
                    userStatus?.status_name !== storeSupabase.statusServing &&
                    userStatus?.status_name !== storeSupabase.statusWaiting
                  "
                  :name="'eva-wifi-off-outline'"
                  :color="'red'"
                  size="xs"
                />
              </div>
              <q-menu auto-close>
                <q-list auto-close style="min-width: 150px">
                  <q-item
                    v-close-popup
                    clickable
                    :class="
                      userStatus?.status_name === storeSupabase.statusServing
                        ? 'bg-grey-3'
                        : ''
                    "
                  >
                    <q-item-section>
                      <div
                        class="active"
                        @click="
                          userStatus?.status_name !==
                          storeSupabase.statusServing
                            ? storeSupabase.updateUserStatus(
                                storeSupabase.statusServing
                              )
                            : []
                        "
                      >
                        <q-spinner-hearts color="green" />
                        <span class="q-ml-sm text-capitalize">{{
                          storeSupabase.statusServing
                        }}</span>
                      </div>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item
                    v-close-popup
                    :class="
                      userStatus?.status_name === storeSupabase.statusWaiting
                        ? 'bg-grey-3'
                        : ''
                    "
                    clickable
                  >
                    <q-item-section>
                      <div
                        class="active"
                        @click="
                          userStatus?.status_name !==
                          storeSupabase.statusWaiting
                            ? storeSupabase.updateUserStatus(
                                storeSupabase.statusWaiting
                              )
                            : []
                        "
                      >
                        <q-spinner-hourglass color="yellow" size="xs" />
                        <span class="q-ml-sm text-capitalize">{{
                          storeSupabase.statusWaiting
                        }}</span>
                      </div>
                    </q-item-section>
                  </q-item>

                  <q-separator />
                  <q-item
                    v-close-popup
                    :class="
                      userStatus?.status_name === storeSupabase.statusOff
                        ? 'bg-grey-3'
                        : ''
                    "
                    clickable
                  >
                    <q-item-section>
                      <div
                        class="active"
                        @click="
                          userStatus?.status_name !== storeSupabase.statusOff
                            ? storeSupabase.updateUserStatus(
                                storeSupabase.statusOff
                              )
                            : []
                        "
                      >
                        <q-icon
                          name="eva-wifi-off-outline"
                          size="xs"
                          color="red"
                        />
                        <span class="q-ml-sm">{{
                          storeSupabase.statusOff
                        }}</span>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </div>
          </div>

          <div v-else>
            <span class="text-h6">{{ routerName }}</span>
          </div>

          <q-btn
            v-if="isLogin && role === 'admin'"
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="drawer = !drawer"
          >
            <!-- <span class="q-ml-md">{{ userStatus.username }}</span> -->
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer
      :side="role === 'admin' ? 'right' : 'left'"
      v-if="isLogin"
      v-model="drawer"
      :width="200"
      :breakpoint="500"
    >
      <q-scroll-area v-if="role === 'admin'" class="fit">
        <q-list padding class="menu-list">
          <!-- <div v-for="(item, index) in listRouter" :key="index">
            <router-link :to="item.path">
              <q-item clickable v-ripple>
                <q-item-section avatar>
                  <q-icon class="text-primary" :name="item.icon" />
                </q-item-section>

                <q-item-section class="text-grey-9">
                  {{ item.name }}
                </q-item-section>
              </q-item>
            </router-link>
          </div> -->

          <q-item @click="storeAuthentication.signOut" clickable v-ripple>
            <q-item-section avatar>
              <q-icon class="text-red-8 text-bold" name="logout" />
            </q-item-section>

            <q-item-section> Đăng xuất </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <q-scroll-area v-else class="fit">
        <q-list padding class="menu-list">
          <q-item clickable v-ripple @click="storeSupabase.syncMenu">
            <q-item-section avatar>
              <q-icon class="text-green-8" name="sync" />
            </q-item-section>

            <q-item-section class="text-grey-8" style="font-size: 1.1em">
              Đồng bộ Menu
            </q-item-section>
          </q-item>
          <q-linear-progress
            v-if="storeSupabase.isLoadingMenuData"
            indeterminate
            color="secondary"
            class="q-mt-sm"
          />

          <q-item
            clickable
            v-ripple
            @click="storeAuthentication.dialogChangePassword = true"
          >
            <q-item-section avatar>
              <q-icon class="text-grey-8" name="eva-unlock-outline" />
            </q-item-section>

            <q-item-section class="text-grey-8" style="font-size: 1.1em">
              Đổi mật khẩu
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="$q.fullscreen.toggle()">
            <q-item-section avatar>
              <q-icon
                class="text-grey-8"
                :name="
                  $q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'
                "
              />
            </q-item-section>

            <q-item-section class="text-grey-8" style="font-size: 1.1em">
              {{
                $q.fullscreen.isActive ? "Thoát toàn màn hình" : "Toàn màn hình"
              }}
            </q-item-section>
          </q-item>

          <q-item
            v-if="isShowInstallApp"
            clickable
            v-ripple
            @click="showInstallAppPrompt()"
          >
            <q-item-section avatar>
              <q-icon
                class="text-primary"
                name="eva-arrow-circle-down-outline"
              />
            </q-item-section>

            <q-item-section class="text-grey-8" style="font-size: 1.1em">
              Tải app
            </q-item-section>
          </q-item>

          <q-item @click="storeAuthentication.signOut" clickable v-ripple>
            <q-item-section avatar>
              <q-icon class="text-red-8" name="logout" />
            </q-item-section>

            <q-item-section class="text-grey-8" style="font-size: 1.1em">
              Đăng xuất
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>

  <q-dialog v-model="storeAuthentication.dialogChangePassword">
    <q-card style="width: 400px">
      <q-card-section>
        <div class="text-h6">Đổi mật khẩu</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="currentPassword"
          :type="isShowCurrentPassword ? 'text' : 'password'"
          label="Mật khẩu hiện tại"
          filled
        >
          <template v-slot:append>
            <q-icon
              @click="isShowCurrentPassword = !isShowCurrentPassword"
              :name="
                isShowCurrentPassword
                  ? 'eva-eye-off-outline'
                  : 'eva-eye-outline'
              "
              size="sm"
            />
          </template>
        </q-input>
        <q-input
          v-model="newPassword"
          :type="isShowNewPassword ? 'text' : 'password'"
          label="Mật khẩu mới"
          filled
          class="q-mt-md"
        >
          <template v-slot:append>
            <q-icon
              @click="isShowNewPassword = !isShowNewPassword"
              :name="
                isShowNewPassword ? 'eva-eye-off-outline' : 'eva-eye-outline'
              "
              size="sm"
            />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Hủy" v-close-popup />
        <q-btn color="primary" label="Xác nhận" @click="handleChangePassword" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-banner
    v-if="storeSupabase.isOnline === false"
    dense
    class="bg-red-8 text-white full-width"
    style="position: fixed; bottom: 0; z-index: -1"
  >
    <q-icon name="eva-wifi-off-outline" size="xs" />
    <span class="q-pa-sm"
      >Bạn đang ngoại tuyến. Một số tính năng có thể không hoạt động.</span
    >
  </q-banner>

  <q-banner
    v-else-if="storeSupabase.isOnline && storeSupabase.isShowWeakNetwork"
    dense
    class="bg-yellow-10 text-white full-width"
    style="position: fixed; bottom: 0; z-index: -1"
  >
    <q-icon name="eva-wifi-off-outline" size="xs" />
    <span class="q-pa-sm">Cảnh báo kết nối mạng yếu.</span>
  </q-banner>
</template>

<style lang="scss" scoped>
* {
  text-decoration: none;
}
</style>
