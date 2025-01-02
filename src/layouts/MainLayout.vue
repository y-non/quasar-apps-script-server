<script setup>
import { ref, onMounted, watch } from "vue";
import { useMainStore } from "src/stores/main-store";
import { useAuthenticationStore } from "src/stores/AuthenticationStore";
import { useSupabaseStore } from "src/stores/SupabaseStore";
import { useRouter } from "vue-router";
import { storageUtil } from "src/utils/storageUtil";

const router = useRouter();
const storeMain = useMainStore();
const storeAuthentication = useAuthenticationStore();
const storeSupabase = useSupabaseStore();

const drawer = ref(false);
const isShowLogoutButton = ref(false);
const selfUserData = storageUtil.getLocalStorageData("selfAppInfo");
const isLogin = storageUtil.getLocalStorageData("isLogin") || false;
const role = ref("");
const routerName = ref("");
const listRouter = [
  {
    path: "/admin",
    name: "Quản lý tài khoản",
    icon: "eva-people-outline",
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

function handleGetRouterName(value) {
  try {
    const finder = listRouter.filter((item) => item.path === value)[0];
    routerName.value = finder.name;
  } catch (err) {
    console.error("Internal Server Error: ", err);
  }
}

onMounted(() => {
  isShowLogoutButton.value = localStorage.getItem("isLogin") || false;
  role.value = storageUtil.getLocalStorageData("userAuthInfo")?.role;

  if (isLogin && role.value === "admin") {
    router.push("/admin");
    handleGetRouterName(router.currentRoute.value.fullPath);
  } else if (isLogin && role.value !== "admin") {
    router.push("/data");
  } else {
    router.push("/");
  }
});

watch(
  () => router.currentRoute.value.fullPath,
  (val) => {
    handleGetRouterName(val);
  }
);
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="q-py-sm" elevated>
      <q-toolbar>
        <div
          class="flex justify-between full-width"
          style="align-items: center"
        >
          <q-btn
            v-if="isLogin && role !== 'admin'"
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="drawer = !drawer"
          >
            <span class="q-ml-md">{{ selfUserData.username }} - {{ selfUserData.status_name }}</span>
          </q-btn>

          <div v-if="role !== 'admin'" class="flex justify-end">
            <div v-if="isShowLogoutButton">
              <!-- <div class="active">
                <span class="text-capitalize q-mr-sm">{{
                  storeSupabase.userStatus
                }}</span>

                <q-spinner-hearts
                  v-if="
                    storeSupabase.userStatus === storeSupabase.statusServing
                  "
                  :color="'grey-3'"
                  size="md"
                />
                <q-spinner-hourglass
                  v-if="
                    storeSupabase.userStatus === storeSupabase.statusWaiting
                  "
                  :color="'grey-3'"
                  size="xs"
                />
                <q-icon
                  v-if="
                    storeSupabase.userStatus !== storeSupabase.statusServing &&
                    storeSupabase.userStatus !== storeSupabase.statusWaiting
                  "
                  :name="'eva-wifi-off-outline'"
                  :color="'red'"
                  size="xs"
                />
              </div> -->
              <q-menu auto-close>
                <q-list style="min-width: 150px">
                  <q-item clickable>
                    <q-item-section>
                      <div
                        class="active"
                        @click="
                          storeSupabase.updateUserStatus(
                            storeSupabase.statusServing
                          )
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
                  <q-item clickable>
                    <q-item-section>
                      <div
                        class="active"
                        @click="
                          storeSupabase.updateUserStatus(
                            storeSupabase.statusWaiting
                          )
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
                  <q-item clickable>
                    <q-item-section>
                      <div
                        class="active"
                        @click="
                          storeSupabase.updateUserStatus(
                            storeSupabase.statusOff
                          )
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
            <span class="q-ml-md">{{ selfUserData.username }}</span>
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
          <div v-for="(item, index) in listRouter" :key="index">
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
              <q-icon class="text-red-8 text-bold text-bold" name="logout" />
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
</template>

<style lang="scss" scoped>
* {
  text-decoration: none;
}
</style>
