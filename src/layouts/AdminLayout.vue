<script setup>
import { ref, onMounted, onBeforeMount, watch } from "vue";
import { useMainStore } from "src/stores/main-store";
import { useAuthenticationStore } from "src/stores/AuthenticationStore";
import { useSupabaseStore } from "src/stores/SupabaseStore";
import { useRouter } from "vue-router";
import { storageUtil } from "src/utils/storageUtil";
import { Dialog, useQuasar } from "quasar";
import { useNetwork } from "@vueuse/core";
import { useCounter, useIdle } from "@vueuse/core";
import { supabase } from "src/utils/superbase";

import InputOtp from "primevue/inputotp";

const { inc, count } = useCounter();
const { idle, lastActive, reset } = useIdle(300 * 6 * 1000); // 5 min

const router = useRouter();
const storeMain = useMainStore();
const storeAuthentication = useAuthenticationStore();
const storeSupabase = useSupabaseStore();

const drawer = ref(false);
const isShowLogoutButton = ref(false);
const userStatus = ref("");
const isLogin = storageUtil.getLocalStorageData("isLogin") || false;
const role = ref("");
const routerName = ref("");
const listRouter = [
  {
    path: "/admin",
    name: "Báo cáo",
    icon: "eva-pie-chart-outline",
  },
  {
    path: "/admin/account",
    name: "Quản lý tài khoản",
    icon: "eva-people-outline",
  },

  {
    path: "/admin/site",
    name: "Quản lý site",
    icon: "eva-home-outline",
  },

  {
    path: "/admin/order",
    name: "Quản lý đơn hàng",
    icon: "eva-file-text-outline",
  },

  {
    path: "/admin/discount",
    name: "Quản lý mã giảm giá",
    icon: "eva-credit-card-outline",
  },

  {
    path: "/admin/giftcard",
    name: "Quản lý mã quà tặng",
    icon: "eva-gift-outline",
  },
];
const $q = useQuasar();
const { downlink } = useNetwork();
const isShowInstallApp = ref(false);

/* handle service worker state */
var deferredPrompt;

function handleGetRouterName(value) {
  try {
    const finder = listRouter.filter((item) => item.path === value)[0];
    routerName.value = finder.name;
  } catch (err) {
    console.error("Internal Server Error: ", err);
  }
}

onMounted(async () => {
  $q.platform.is.android && $q.platform.is.mobile
    ? (isShowInstallApp.value = true)
    : (isShowInstallApp.value = false);

  isShowLogoutButton.value = localStorage.getItem("isLogin") || false;
  role.value = storageUtil.getLocalStorageData("userAuthInfo")?.role;
  const routerPath = router.currentRoute.value.fullPath;

  if ((isLogin && role.value === "admin") || role.value === "superadmin") {
    handleGetRouterName(routerPath);
    if (role.value === "superadmin") {
      listRouter.shift();
    }
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallAppPrompt(e);
  });
});

const showInstallAppPrompt = async () => {
  if (!deferredPrompt) {
    console.warn("No install prompt available.");
    return;
  }

  try {
    await deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      deferredPrompt = null;
    });
  } catch (err) {
    console.error("Error in showInstallAppPrompt:", err);
  }
};

onBeforeMount(() => {});

// watch(
//   () => storeSupabase.listUserData,
//   (val) => {
//     const selfUserData = val.filter(
//       (item) =>
//         item.userid === storageUtil.getLocalStorageData("selfAppInfo").userid
//     )[0];
//     userStatus.value = selfUserData;
//   }
// );

watch(
  () => router.currentRoute.value.fullPath,
  (val) => {
    handleGetRouterName(val);
  }
);

watch(idle, (idleValue) => {
  if (idleValue && isLogin) {
    inc();

    const isHaveOtp = storageUtil.getLocalStorageData("isHaveOtp");

    if (isHaveOtp) {
      storageUtil.setLocalStorageData("isLogin", false);
      storeAuthentication.dialogConfirmSessionExpired = true;
    } else {
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
    }

    reset(); // restarts the idle timer. Does not change lastActive value
  }
});

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
//     // connection.effectiveType === "slow-2g"
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
      class="q-py-sm"
      style="background-color: #1f1f1f; color: #c9c9c9"
      elevated
    >
      <q-toolbar>
        <div
          class="flex justify-between full-width"
          style="align-items: center"
        >
          <q-btn
            v-if="isLogin && role !== 'admin' && role !== 'superadmin'"
            flat
            dense
            round
            icon="view_cozy"
            aria-label="Menu"
            @click="drawer = !drawer"
          >
            <span class="q-ml-md"
              >{{ userStatus?.username }} - {{ userStatus?.status_name }}</span
            >
          </q-btn>

          <div
            v-if="role !== 'admin' && role !== 'superadmin'"
            class="flex justify-end"
          >
            <div v-if="isShowLogoutButton">
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
            v-if="(isLogin && role === 'admin') || role === 'superadmin'"
            flat
            dense
            round
            icon="menu"
            color="t-default"
            aria-label="Menu"
            @click="drawer = !drawer"
          >
            <!-- <span class="q-ml-md">{{ userStatus.username }}</span> -->
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer
      :side="role === 'admin' || role === 'superadmin' ? 'right' : 'left'"
      v-if="isLogin"
      v-model="drawer"
      :width="200"
      :breakpoint="500"
    >
      <q-scroll-area
        v-if="role === 'admin' || role === 'superadmin'"
        class="fit"
      >
        <q-list padding class="menu-list">
          <div v-for="(item, index) in listRouter" :key="index">
            <router-link :to="item.path">
              <q-item clickable v-ripple>
                <q-item-section avatar>
                  <q-icon class="t-default" :name="item.icon" />
                </q-item-section>

                <q-item-section class="text-grey-9">
                  {{ item.name }}
                </q-item-section>
              </q-item>
            </router-link>
          </div>

          <!-- <router-link to="/admin/discount">
            <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon
                  class="text-primary text-bold"
                  name="eva-file-text-outline"
                />
              </q-item-section>

              <q-item-section class="text-grey-9">
                Danh sách giảm giá
              </q-item-section>
            </q-item>
          </router-link> -->

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
            @click="
              async () => {
                await storeAuthentication.checkHaveOtp();
                storeAuthentication.dialogOtp = true;
              }
            "
            clickable
            v-ripple
          >
            <q-item-section avatar>
              <q-icon class="text-grey-8" name="eva-settings-outline" />
            </q-item-section>

            <q-item-section class="text-grey-8" style="font-size: 1.1em">
              Thiết lập OTP
            </q-item-section>
          </q-item>

          <q-item @click="storeAuthentication.signOut" clickable v-ripple>
            <q-item-section avatar>
              <q-icon class="text-red-10 text-bold" name="logout" />
            </q-item-section>

            <q-item-section> Đăng xuất </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <q-scroll-area v-else class="fit">
        <q-list padding class="menu-list">
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon class="text-green-8 text-bold text-bold" name="sync" />
            </q-item-section>

            <q-item-section> Đồng bộ Menu </q-item-section>
          </q-item>
          <q-linear-progress
            v-if="storeSupabase.isLoadingMenuData"
            indeterminate
            color="secondary"
            class="q-mt-sm"
          />

          <q-item @click="storeAuthentication.signOut" clickable v-ripple>
            <q-item-section avatar>
              <q-icon class="text-red-10 text-bold text-bold" name="logout" />
            </q-item-section>

            <q-item-section> Đăng xuất </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>

  <q-dialog v-model="storeAuthentication.dialogOtp" persistent>
    <q-card style="width: 400px">
      <q-card-section>
        <div class="text-h6">Thiết lập mã OTP đăng nhập</div>
      </q-card-section>

      <!-- cập nhật mã otp nếu đã có rối -->
      <q-card-section v-if="storeAuthentication.isAlreadyHaveOtp">
        <div
          v-if="storeAuthentication.isShowChangeOtpStep === false"
          class="column"
        >
          <span class="text-subtitle1">Mã otp của bạn là: ****</span>
          <span
            class="q-py-md text-subtitle1 text-blue"
            @click="
              storeAuthentication.isShowChangeOtpStep =
                !storeAuthentication.isShowChangeOtpStep
            "
            >Đổi mã khác</span
          >
        </div>

        <div v-else>
          <q-btn
            color="primary"
            icon="eva-arrow-ios-back-outline"
            label="Trở về"
            flat
            @click="
              storeAuthentication.isShowChangeOtpStep =
                !storeAuthentication.isShowChangeOtpStep
            "
          />

          <div
            v-if="storeAuthentication.isAlreadyConfirmTrueOldOtp === false"
            class="flex flex-center q-py-lg"
          >
            <label for="" class="q-mb-md">Vui lòng nhập mã OTP hiện tại</label>
            <InputOtp
              integerOnly
              v-model="storeAuthentication.otpCodeConfirm"
            />
          </div>

          <div v-else class="flex flex-center q-py-lg">
            <label for="" class="q-mb-md">Vui lòng nhập mã OTP mới</label>
            <InputOtp integerOnly v-model="storeAuthentication.otpCodeUpdate" />
          </div>
        </div>
      </q-card-section>

      <!-- tạo mới OTP -->
      <q-card-section v-else class="flex flex-center">
        <InputOtp integerOnly v-model="storeAuthentication.otpCode" />
      </q-card-section>

      <!-- tạo mới -->
      <q-card-actions
        v-if="storeAuthentication.isAlreadyHaveOtp === false"
        align="right"
      >
        <q-btn
          @click="storeAuthentication.resetStateOtp()"
          flat
          label="Hủy"
          v-close-popup
        />
        <q-btn
          color="black"
          label="Xác nhận"
          @click="storeAuthentication.updateOtp(storeAuthentication.otpCode)"
        />
      </q-card-actions>

      <!-- update -->
      <q-card-actions v-if="storeAuthentication.isAlreadyHaveOtp" align="right">
        <div v-if="storeAuthentication.isShowChangeOtpStep">
          <q-btn
            @click="storeAuthentication.resetStateOtp()"
            flat
            label="Hủy"
            v-close-popup
          />
          <q-btn
            color="black"
            :label="
              storeAuthentication.isAlreadyConfirmTrueOldOtp
                ? 'Xác nhận'
                : 'Tiếp tục'
            "
            @click="
              storeAuthentication.isAlreadyConfirmTrueOldOtp
                ? storeAuthentication.updateOtp(
                    storeAuthentication.otpCodeUpdate
                  )
                : storeAuthentication.clickCheckMatchOtpUpdate(
                    storeAuthentication.otpCodeConfirm
                  )
            "
          />
        </div>

        <div v-else>
          <q-btn
            @click="storeAuthentication.resetStateOtp()"
            flat
            label="Thoát"
            v-close-popup
          />
        </div>
      </q-card-actions>

      <!-- otherwise -->
      <!-- <q-card-actions v-else align="right">
        <q-btn
          @click="storeAuthentication.resetStateOtp()"
          flat
          label="Thoát"
          v-close-popup
        />
      </q-card-actions> -->
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="storeAuthentication.dialogConfirmSessionExpired"
    persistent
  >
    <q-card style="width: 400px" class="q-pa-sm">
      <q-card-section>
        <div class="text-subtitle1 text-bold">
          Vui lòng nhập mã OTP để tiếp tục phiên
        </div>
      </q-card-section>

      <q-card-section class="flex flex-center q-my-md q-mb-lg">
        <InputOtp
          integerOnly
          v-model="storeAuthentication.otpSession"
          @update:model-value="
            storeAuthentication.otpSession?.length === 4
              ? storeAuthentication.checkSessionViaOtp(
                  storeAuthentication.otpSession
                )
              : []
          "
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-banner
    v-if="storeSupabase.isOnline === false"
    dense
    class="bg-red-8 text-white full-width"
    style="position: fixed; bottom: 0; z-index: 1"
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
    style="position: fixed; bottom: 0; z-index: 1"
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
