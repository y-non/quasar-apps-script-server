<script setup>
import { ref, onMounted } from "vue";
import { useMainStore } from "src/stores/main-store";

const storeMain = useMainStore();

const drawer = ref(false);
const isShowLogoutButton = ref(false);
const username = storeMain.getLocalStorageData("username");
const isLogin = storeMain.getLocalStorageData("isLogin") || false;

onMounted(() => {
  isShowLogoutButton.value = localStorage.getItem("isLogin") || false;
});
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
            v-if="isLogin"
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="drawer = !drawer"
          >
            <span class="q-ml-md">{{ username }}</span>
          </q-btn>

          <div class="flex justify-end">
            <div v-if="isShowLogoutButton">
              <div class="active">
                <span class="text-capitalize q-mr-sm">{{
                  storeMain.userStatus
                }}</span>

                <q-spinner-hearts
                  v-if="storeMain.userStatus === storeMain.statusServing"
                  :color="'grey-3'"
                  size="md"
                />
                <q-spinner-hourglass
                  v-if="storeMain.userStatus === storeMain.statusWaiting"
                  :color="'grey-3'"
                  size="xs"
                />
                <q-icon
                  v-if="
                    storeMain.userStatus !== storeMain.statusServing &&
                    storeMain.userStatus !== storeMain.statusWaiting
                  "
                  :name="'eva-wifi-off-outline'"
                  :color="'red'"
                  size="xs"
                />

                <!-- <q-icon
                  :name="storeMain.userStatus === storeMain.statusServing
                    ? 'eva-radio-outline'
                    : storeMain.userStatus === storeMain.statusWaiting
                      ? 'eva-sync-outline'
                      : 'eva-wifi-off-outline'
                    "
                  size="md"
                  :color="storeMain.userStatus === storeMain.statusServing
                    ? 'green'
                    : storeMain.userStatus === storeMain.statusWaiting
                      ? 'yellow'
                      : 'red'
                    "
                /> -->
              </div>
              <q-menu auto-close>
                <q-list style="min-width: 150px">
                  <q-item clickable>
                    <q-item-section>
                      <div
                        class="active"
                        @click="
                          storeMain.updateUserStatus(storeMain.statusServing)
                        "
                      >
                        <!-- <q-icon
                          name="eva-radio-outline"
                          size="xs"
                          color="green"
                        /> -->
                        <q-spinner-hearts color="green" />
                        <span class="q-ml-sm text-capitalize">{{
                          storeMain.statusServing
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
                          storeMain.updateUserStatus(storeMain.statusWaiting)
                        "
                      >
                        <!-- <q-icon
                          name="eva-sync-outline"
                          size="xs"
                          color="yellow"
                        /> -->
                        <q-spinner-hourglass color="yellow" size="xs" />
                        <span class="q-ml-sm text-capitalize">{{
                          storeMain.statusWaiting
                        }}</span>
                      </div>
                    </q-item-section>
                  </q-item>

                  <q-separator />
                  <q-item clickable>
                    <q-item-section>
                      <div
                        class="active"
                        @click="storeMain.updateUserStatus(storeMain.statusOff)"
                      >
                        <q-icon
                          name="eva-wifi-off-outline"
                          size="xs"
                          color="red"
                        />
                        <span class="q-ml-sm">{{ storeMain.statusOff }}</span>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </div>
          </div>
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer v-if="isLogin" v-model="drawer" :width="200" :breakpoint="500">
      <q-scroll-area class="fit">
        <q-list padding class="menu-list">
          <q-item @click="storeMain.syncMenu" clickable v-ripple>
            <q-item-section avatar>
              <q-icon class="text-green-8 text-bold text-bold" name="sync" />
            </q-item-section>

            <q-item-section> Đồng bộ Menu </q-item-section>
          </q-item>
          <q-linear-progress v-if="storeMain.isLoadingMenuData" indeterminate color="secondary" class="q-mt-sm" />

          <q-item @click="storeMain.logout" clickable v-ripple>
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
