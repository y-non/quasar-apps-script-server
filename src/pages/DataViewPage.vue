<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthenticationStore } from "src/stores/AuthenticationStore";
import { useSupabaseStore } from "src/stores/SupabaseStore";
import { QSpinnerIos } from "quasar";
import { useQuasar } from "quasar";

// import loadingVideo from "../assets/video/angry-cute.mp4";
import noData from "../assets/images/nodata.jpg";
import historyImg from "../assets/icons/history.png";
import updateImg from "../assets/icons/update.png";
import deleteImg from "../assets/icons/delete.png";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";

const $q = useQuasar();
const router = useRouter();

const storeAuthentication = useAuthenticationStore();
const storeSupabase = useSupabaseStore();
const username = storageUtil.getLocalStorageData("username");
const password = storageUtil.getLocalStorageData("password");
const selectMenuRef = ref(null);
const selectMenuRefUpdate = ref(null);

const optionsMenuData = ref([]);

/* state for handle reactive in UI */
const slideItems = ref(storeSupabase.slideItems);
const slideItemsUpdate = ref(storeSupabase.slideItemsUpdate);

const visibleCount = ref(3);
const visibleUsers = computed(() =>
  storeSupabase.listUserData.slice(0, visibleCount.value)
);
const hasMoreUsers = computed(
  () => visibleCount.value < storeSupabase.listUserData.length
);

onMounted(async () => {
  await storeSupabase.getInit();

  supabase.auth.onAuthStateChange(async (_, session) => {
    if (session) {
      storeAuthentication.validateSession();
    }
  });
});

onUnmounted(() => {
  supabase.removeAllChannels();
});

// FUNCTIONAL METHOD
const showMore = () => {
  visibleCount.value = storeSupabase.listUserData.length;
};
const showLess = () => {
  visibleCount.value = 3;
};

function showAction(grid) {
  $q.bottomSheet({
    message: "Hành động",
    grid,
    actions: [
      {
        label: "Sửa thông tin",
        img: updateImg,
        id: "update",
      },

      {
        label: "Lịch sử chỉnh sửa",
        img: historyImg,
        id: "history",
      },
      // {},
      {
        label: "Xóa",
        avatar: deleteImg,
        id: "delete",
      },
    ],
  })
    .onOk((action) => {
      let listSelectedMenu;
      switch (action.id) {
        case "update":
          storeSupabase.showUpdateDialog = true;

          storeSupabase.updateData = storeSupabase.dataItem.filter(
            (item) => item.id === grid
          )[0];

          listSelectedMenu =
            storeSupabase.updateData.menu.length > 1
              ? storeSupabase.updateData.menu.split(";")
              : storeSupabase.updateData.menu;

          storeSupabase.updateData.menu.length > 1
            ? (storeSupabase.updateData.menuSelected = listSelectedMenu.map(
                (item) => {
                  return storeSupabase.menuData.filter(
                    (menuItem) => item == menuItem.id
                  )[0];
                }
              ))
            : (storeSupabase.updateData.menuSelected =
                storeSupabase.menuData.filter(
                  (menuItem) => storeSupabase.updateData.menu == menuItem.id
                )[0]);
          break;

        case "delete":
          storeSupabase.deleteData(grid);
          break;

        case "history":
          storeSupabase.viewHistory(grid);
          break;

        default:
          break;
      }
    })
    .onCancel(() => {})
    .onDismiss(() => {});
}

const filterFn = (val, update) => {
  if (val === "") {
    update(() => {
      optionsMenuData.value = storeSupabase.menuData.filter(
        (item) => !item.isMultiSelect
      );

      // here you have access to "ref" which
      // is the Vue reference of the QSelect
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    optionsMenuData.value = storeSupabase.menuData.filter(
      (v) =>
        v.filterSearch.toLowerCase().indexOf(needle) > -1 && !v.isMultiSelect
    );
  });
};

const getColor = (status) => {
  switch (status) {
    case "serving":
      return "green-3";
    case "waiting":
      return "yellow-3";
    case "off":
      return "red-3";
    default:
      return "primary";
  }
};
</script>

<template>
  <q-page class="q-pa-sm">
    <!-- Display User Badges -->
    <div v-if="!storeSupabase.isLoadingMainScreen" class="q-my-sm">
      <q-btn
        v-for="user in visibleUsers"
        :key="user.benutzername"
        color="grey-6"
        class="q-mx-xs q-pa-sm q-my-xs"
        outline
        size="md"
        style="min-width: 100px"
      >
        <q-icon
          name="circle"
          :color="getColor(user.status)"
          size="xs"
          class="q-mx-xs"
        />
        {{ user.name }} - {{ user.orderCount }}
      </q-btn>

      <q-btn
        v-if="hasMoreUsers"
        flat
        text-color="grey-4"
        label=""
        icon-right="unfold_more"
        class="q-ml-sm"
        @click="showMore"
      />
      <q-btn
        v-else
        flat
        label=""
        dense
        text-color="grey-4"
        icon-right="unfold_less"
        class="q-ml-sm"
        @click="showLess"
      />
    </div>

    <div
      v-if="storeSupabase.isLoadingMainScreen"
      style="height: 30vh"
      class="full-width flex column flex-center"
    >
      Đang tải <q-spinner-ios size="lg" color="blue" />
    </div>

    <q-list class="q-mt-md" v-else>
      <div v-if="storeSupabase.dataItem?.length">
        <q-card
          v-for="(item, index) in storeSupabase.dataItem"
          :key="index"
          flat
          bordered
          class="my-card q-mb-md"
        >
          <q-card-section
            class="flex flex justify-between q-py-md"
            style="align-items: center"
          >
            <div>
              <div class="text-subtitle2 text-grey">{{ item.datum }}</div>
            </div>

            <div class="flex flex-center">
              <!-- <video
                v-if="loadingSelect"
                autoplay
                loop
                muted
                width="50"
                height="50"
                :src="loadingVideo"
              ></video> -->

              <q-icon
                name="more_vert"
                size="sm"
                :color="storeSupabase.loadingSelect ? 'grey-3' : 'grey-5'"
                @click="!storeSupabase.loadingSelect ? showAction(item.id) : []"
              />
            </div>
          </q-card-section>
          <q-card-section>
            <div
              class="flex justify-between full-width q-py-xs q-px-none q-mx-none"
              @click="item.showQList = !item.showQList"
              style="align-items: center"
            >
              <span class="text-bold text-grey-7 text-h6">Doanh thu</span>
              <span class="text-blue text-h4">{{
                dateUtil.formatter.format(item.totalPrice)
              }}</span>
            </div>

            <q-list v-if="item.showQList" class="q-mb-md" bordered separator>
              <q-item v-for="(menu, index) in item.menuSelected" :key="index">
                <q-item-section>
                  <div class="flex justify-between" style="align-items: center">
                    <div class="flex justify-between full-width">
                      <div style="width: 80%" class="text-grey-7">
                        {{ menu.label }}
                      </div>
                      <div class="text-grey text-bold">
                        <span class="text-blue">{{ menu.quantity }} x</span>

                        {{ dateUtil.formatter.format(menu.value) }}
                      </div>
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <span class="text-grey-6">{{ item.notizen }}</span>
          </q-card-section>
        </q-card>
      </div>

      <div
        class="flex flex-center column full-height"
        style="margin-top: 200px"
        v-else
      >
        <q-img
          :src="noData"
          spinner-color="primary"
          spinner-size="82px"
          width="250px"
        />
        <span class="text-h5 text-grey-7 text-bold">Không có dữ liệu</span>
      </div>
    </q-list>

    <q-page-sticky position="bottom-right" :offset="[18, 48]">
      <q-btn
        icon="add"
        color="green-7"
        class="q-pa-md"
        round
        :disable="storeSupabase.isLoadingMainScreen"
        @click="storeSupabase.showAddDialog = true"
      />
    </q-page-sticky>

    <q-dialog
      :maximized="storeSupabase.showAddDialog"
      class="full-width full-height"
      v-model="storeSupabase.showAddDialog"
    >
      <q-card class="full-width full-height">
        <div
          class="flex justify-between q-py-md q-pr-md bg-white z-max"
          style="position: sticky; top: 0"
        >
          <q-btn
            icon="eva-arrow-ios-back-outline"
            class="text-blue"
            flat
            @click="storeSupabase.showAddDialog = false"
          >
            <span class="text-subtitle1">Quay lại</span>
          </q-btn>

          <div class="float-bottom text-h6" style="right: 5%">
            <span class="text-bold">Tổng cộng:</span>
            {{ dateUtil.formatter.format(storeSupabase.newData.umsatz) }}
          </div>
        </div>
        <q-card-section>
          <q-form
            class="q-gutter-md q-py-lg flex column"
            @submit="storeSupabase.addData(storeSupabase.newData)"
          >
            <span
              v-if="storeSupabase.newData.menuSelected?.length"
              class="text-subtitle1"
              >Dịch vụ đã chọn</span
            >
            <div
              style="display: grid; grid-template-columns: 1fr 1fr 1fr"
              class="q-mb-md"
            >
              <q-btn
                v-for="(
                  item, index
                ) in storeSupabase.newData.menuMultipleSelect.sort(
                  (a, b) => a.price - b.price
                )"
                :key="index"
                class="q-mr-sm"
                outline
                color="white"
                text-color="primary"
                :label="item.label"
                @click="storeSupabase.clickMultiSelectInAddData(item)"
              >
                <q-badge color="orange" floating>
                  {{ item.selectCount }}
                </q-badge>
              </q-btn>
            </div>

            <q-list
              v-if="storeSupabase.newData.menuSelected?.length"
              bordered
              separator
            >
              <q-slide-item
                v-for="(item, index) in storeSupabase.newData.menuSelected"
                :key="index"
                ref="slideItems"
                @right="storeSupabase.onRightSlide(item.id, index)"
                right-color="red-5"
              >
                <template v-slot:right>
                  <q-icon name="delete" /> Xoá...
                </template>

                <q-item>
                  <q-item-section>
                    <div
                      class="flex justify-between"
                      style="align-items: center"
                    >
                      <div class="flex justify-between full-width">
                        <div class="text-grey-7">
                          {{ item.label }}
                        </div>
                        <div class="text-blue text-bold">
                          {{ dateUtil.formatter.format(item.value) }}
                        </div>
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-slide-item>
            </q-list>

            <span class="text-subtitle1">Chọn dịch vụ</span>
            <!-- <div style="display: grid; grid-template-columns: 1fr 1fr 1fr">
              <q-btn
                v-for="(item, index) in storeSupabase.menuData.filter(
                  (item) => item.isMultiSelect
                )"
                :key="index"
                push
                color="white"
                text-color="primary"
                class="q-mx-sm"
                :label="item.label"
              >
                <q-badge color="orange" floating>{{
                  item.selectCount
                }}</q-badge>
              </q-btn>
            </div> -->
            <q-select
              ref="selectMenuRef"
              :rules="[(val) => !!val || 'Không được để rỗng']"
              v-model="storeSupabase.newData.menuSelected"
              :options="optionsMenuData"
              option-label="label"
              option-value="id"
              outlined
              multiple
              use-input
              @filter="filterFn"
              input-debounce="300"
              @update:model-value="
                storeSupabase.newData.umsatz =
                  storeSupabase.newData.menuSelected
                    .map((item) => item.value)
                    .reduce((acc, current) => acc + current, 0)
              "
              :disable="storeSupabase.loadingSelect"
              hide-selected
              behavior="menu"
              style="position: relative"
            >
              <template v-slot:before-options>
                <div
                  class="q-pt-md q-px-md bg-white"
                  style="position: sticky; top: 0; z-index: 10"
                >
                  <div class="flex">
                    <q-btn
                      text-color="grey-5"
                      icon="close"
                      flat
                      label="Đóng menu"
                      class="full-width q-mb-md"
                      @click="selectMenuRef.hidePopup()"
                    ></q-btn>
                  </div>
                  <div
                    style="display: grid; grid-template-columns: 1fr 1fr 1fr"
                    class="q-mb-md"
                  >
                    <!-- v-for="(item, index) in storeSupabase.menuData
                    .filter((item) => item.isMultiSelect) .sort((a, b) =>
                    a.value - b.value)" -->
                    <q-btn
                      v-for="(
                        item, index
                      ) in storeSupabase.newData.menuMultipleSelect.sort(
                        (a, b) => a.price - b.price
                      )"
                      :key="index"
                      class="q-mr-sm"
                      outline
                      color="white"
                      text-color="primary"
                      :label="item.label"
                      @click="storeSupabase.clickMultiSelectInAddData(item)"
                    ></q-btn>
                    <!-- <q-btn
                      v-for="(item, index) in storeSupabase.menuData.filter(
                        (item) => item.isMultiSelect
                      )"
                      :key="index"
                      push
                      color="white"
                      text-color="primary"
                      class="q-mx-sm"
                      :label="item.label"
                    >

                    </q-btn> -->
                  </div>
                </div>
              </template>

              <template v-slot:after-options>
                <div class="flex">
                  <q-btn
                    text-color="grey-5"
                    icon="close"
                    flat
                    label="Đóng menu"
                    class="full-width q-my-md"
                    @click="selectMenuRef.hidePopup()"
                  ></q-btn>
                </div>
              </template>

              <template v-slot:option="scope">
                <q-item
                  clickable="false"
                  v-bind="scope.itemProps"
                  :class="[
                    scope.selected
                      ? 'bg-blue-1'
                      : scope.index % 2 === 0
                      ? 'bg-grey-1'
                      : 'bg-grey-2',
                  ]"
                >
                  <q-item-section avatar>
                    <!-- <q-icon name="eva-pricetags-outline" /> -->
                    <q-icon
                      name="eva-pricetags-outline"
                      v-bind:class="{
                        'text-grey-4': !scope.selected,
                        'text-blue': scope.selected,
                      }"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-subtitle2">{{
                      scope.opt.label
                    }}</q-item-label>
                    <q-item-label caption
                      >Preis:
                      <span class="text-bold">{{
                        dateUtil.formatter.format(scope.opt.value)
                      }}</span></q-item-label
                    >
                  </q-item-section>

                  <q-item-section side>
                    <div class="flex justify-end full-width">
                      <q-toggle
                        v-model="scope.selected"
                        color="green"
                        @click="storeSupabase.clickToggleAddMenuItem(scope)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- checkbox customer order -->
            <div class="flex justify-end">
              <q-checkbox
                left-label
                v-model="storeSupabase.newData.isCustomerOrder"
                label="Khách đặt"
              />
            </div>

            <!-- notizen -->
            <div
              v-if="!storeSupabase.showNotizen"
              @click="storeSupabase.showNotizen = true"
              class="flex flex-center text-blue"
            >
              <q-icon name="add" size="sm" rounded />Hiện ghi chú
            </div>

            <q-input
              v-if="storeSupabase.showNotizen"
              v-model="storeSupabase.newData.notizen"
              label="Thêm ghi chú"
              outlined
            />

            <div
              v-if="storeSupabase.showNotizen"
              @click="storeSupabase.showNotizen = false"
              class="flex flex-center text-blue"
            >
              <q-icon name="remove" size="sm" rounded />Ẩn ghi chú
            </div>

            <q-btn
              label="Lưu dữ liệu"
              type="submit"
              color="green-7"
              icon="add"
              class="q-py-sm"
              push
            />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog
      :maximized="storeSupabase.showUpdateDialog"
      v-model="storeSupabase.showUpdateDialog"
    >
      <q-card class="full-width full-height">
        <div
          class="flex justify-between q-py-md q-pr-md bg-white z-max"
          style="position: sticky; top: 0"
        >
          <q-btn
            icon="eva-arrow-ios-back-outline"
            class="text-blue"
            flat
            @click="storeSupabase.handleClickBackButtonShowAlert"
          >
            <span class="text-subtitle1">Quay lại</span>
          </q-btn>

          <div class="float-bottom text-h6" style="right: 5%">
            <span class="text-bold">Tổng cộng:</span>
            {{ dateUtil.formatter.format(storeSupabase.updateData.umsatz) }}
          </div>
        </div>
        <q-card-section>
          <q-form
            class="q-gutter-md q-py-lg flex column"
            @submit="storeSupabase.postUpdateItem(storeSupabase.updateData)"
          >
            <span class="text-subtitle1">Chọn dịch vụ</span>
            <q-select
              ref="selectMenuRefUpdate"
              :rules="[(val) => !!val || 'Không được để rỗng']"
              v-model="storeSupabase.updateData.menuSelected"
              :options="optionsMenuData"
              option-label="label"
              option-value="id"
              outlined
              multiple
              use-input
              @filter="filterFn"
              input-debounce="300"
              behavior="menu"
              @update:model-value="
                storeSupabase.updateData.umsatz =
                  storeSupabase.updateData.menuSelected
                    .map((item) => item.value)
                    .reduce((acc, current) => acc + current, 0);

                storeSupabase.isHaveNotSaveDataYet = true;
              "
              :disable="storeSupabase.loadingSelect"
              hide-selected
            >
              <template v-slot:selected>
                <!-- <div>
                  Already checked
                  <span class="text-bold">{{
                    storeSupabase.updateData.menuSelected?.length
                  }}</span>
                  items
                </div> -->
              </template>

              <template v-slot:before-options>
                <div class="flex q-pt-md">
                  <q-btn
                    text-color="grey-5"
                    icon="close"
                    flat
                    label="Đóng menu"
                    class="full-width q-mb-md"
                    @click="selectMenuRefUpdate.hidePopup()"
                  ></q-btn>
                </div>
              </template>

              <template v-slot:after-options>
                <div class="flex">
                  <q-btn
                    text-color="grey-5"
                    icon="close"
                    flat
                    label="Đóng menu"
                    class="full-width q-my-md"
                    @click="selectMenuRefUpdate.hidePopup()"
                  ></q-btn>
                </div>
              </template>

              <template v-slot:option="scope">
                <q-item
                  v-bind="scope.itemProps"
                  :class="[
                    scope.selected
                      ? 'bg-blue-1'
                      : scope.index % 2 === 0
                      ? 'bg-grey-1'
                      : 'bg-grey-2',
                  ]"
                >
                  <q-item-section avatar>
                    <!-- <q-icon name="eva-pricetags-outline" /> -->
                    <q-icon
                      name="eva-pricetags-outline"
                      v-bind:class="{
                        'text-grey-4': !scope.selected,
                        'text-blue': scope.selected,
                      }"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-subtitle2">{{
                      scope.opt.label
                    }}</q-item-label>
                    <q-item-label caption
                      >Preis:
                      <span class="text-bold">{{
                        dateUtil.formatter.format(scope.opt.value)
                      }}</span></q-item-label
                    >
                  </q-item-section>

                  <q-item-section side>
                    <div class="flex justify-end full-width">
                      <q-toggle
                        v-model="scope.selected"
                        color="green"
                        @click="storeSupabase.clickToggleUpdateMenuItem(scope)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <span
              v-if="storeSupabase.updateData.menuSelected?.length"
              class="text-subtitle1"
              >Dịch vụ đã chọn</span
            >

            <q-list
              v-if="storeSupabase.updateData.menuSelected?.length"
              bordered
              separator
            >
              <q-slide-item
                v-for="(item, index) in storeSupabase.updateData.menuSelected"
                :key="index"
                ref="slideItemsUpdate"
                @right="storeSupabase.onRightSlideUpdate(item.id, index)"
                right-color="red-5"
              >
                <template v-slot:right>
                  <q-icon name="delete" /> Xoá...
                </template>

                <q-item>
                  <q-item-section>
                    <div
                      class="flex justify-between"
                      style="align-items: center"
                    >
                      <div class="flex justify-between full-width">
                        <div class="text-grey-7">
                          {{ item.label }}
                        </div>
                        <div class="text-blue text-bold">
                          {{ dateUtil.formatter.format(item.value) }}
                        </div>
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-slide-item>
            </q-list>
            <!-- notizen -->
            <div
              v-if="!storeSupabase.showNotizen"
              @click="storeSupabase.showNotizen = true"
              class="flex flex-center text-blue"
            >
              <q-icon name="add" size="sm" rounded />Hiện ghi chú
            </div>

            <q-input
              v-if="storeSupabase.showNotizen"
              v-model="storeSupabase.updateData.notizen"
              label="Thêm ghi chú"
              @update:model-value="storeSupabase.isHaveNotSaveDataYet = true"
              outlined
            />

            <div
              v-if="storeSupabase.showNotizen"
              @click="storeSupabase.showNotizen = false"
              class="flex flex-center text-blue"
            >
              <q-icon name="remove" size="sm" rounded />Ẩn ghi chú
            </div>

            <q-btn
              label="Lưu dữ liệu"
              type="submit"
              color="blue-7"
              icon="save"
              class="q-py-sm"
              push
            />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style lang="scss" scoped></style>
