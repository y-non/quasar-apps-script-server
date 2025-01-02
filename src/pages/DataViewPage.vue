<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthenticationStore } from "src/stores/AuthenticationStore";
import { useSupabaseStore } from "src/stores/SupabaseStore";
import { Dialog, QSpinnerIos } from "quasar";
import { useQuasar } from "quasar";
import { useScanQrStore } from "src/stores/ScanQrStore";

// import loadingVideo from "../assets/video/angry-cute.mp4";
import noData from "../assets/images/nodata.jpg";
import historyImg from "../assets/icons/history.png";
import updateImg from "../assets/icons/update.png";
import deleteImg from "../assets/icons/delete.png";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";
// Make sure to install vue-qrcode-reader

import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from "vue-qrcode-reader";
import ScanQrComponent from "../components/ScanQrComponent.vue";
import ScanQrComponentV2 from "../components/ScanQrComponentV2.vue";

const showQRCodeDialog = ref(false); // Dialog visibility state
const storeScanQr = useScanQrStore();

// Handle the QR Code scan result
const handleQRCodeScan = (decodedString) => {
  // You can handle the decoded data here, for example, set the value to the input
  storeSupabase.newData.giftCard = decodedString;
  showQRCodeDialog.value = false; // Close the dialog after scanning
};

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

const menuVisible = ref(false);
const sortOrder = ref("asc"); // Default sorting order

const sortedUsers = computed(() => {
  return [...storeSupabase.listUserData].sort((a, b) => {
    if (sortOrder.value === "asc") {
      return a.ordernumber - b.ordernumber;
    }
    return b.ordernumber - a.ordernumber;
  });
});

function sortUsers(order) {
  sortOrder.value = order;
}

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
      {},

      {
        label: "Lịch sử chỉnh sửa",
        img: historyImg,
        id: "history",
      },

      // {
      //   label: "Xóa",
      //   avatar: deleteImg,
      //   id: "delete",
      // },
    ],
  })
    .onOk((action) => {
      switch (action.id) {
        case "update":
          storeSupabase.showUpdateDialog = true;

          storeSupabase.updateData = storeSupabase.dataItem.filter(
            (item) => item.id === grid
          )[0];

          storeSupabase.updateData.isCustomerOrder = false;

          storeSupabase.updateData.menuSelected =
            storeSupabase.updateData.menuSelected
              .map((item) => {
                if (item.isMultiSelect) {
                  return {
                    ...item,
                    selectCount: item.quantity,
                  };
                }
                return item;
              })
              .filter((item) => item);

          storeSupabase.updateData.menuMultipleSelect = storeSupabase.menuData
            .map((item) => {
              if (item.isMultiSelect) {
                const quantity = storeSupabase.updateData.menu.filter(
                  (itemMultiSelect) => itemMultiSelect.menu_id === item.id
                )[0];

                return {
                  id: item.id,
                  label: item.label,
                  price: parseFloat(item.value),
                  selectCount: quantity ? quantity.quantity : 0,
                  isMultiSelect: true,
                };
              }
            })
            .filter((item) => item);

          // storeSupabase.updateData.umsatz = storeSupabase.updateData.totalPrice;
          break;

        case "delete":
          storeSupabase.deleteData(grid);
          break;

        case "history":
          storeSupabase.showHistoryDialog = true;
          storeSupabase.fetchHistoryData(grid);
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

const onDetect = (decodedString) => {
  handleQRCodeScan(decodedString);
};
</script>

<template>
  <q-page class="q-pa-sm">
    <!-- Display User Badges -->
    <div v-if="!storeSupabase.isLoadingMainScreen" class="q-my-sm">
      <div v-if="!storeSupabase.isShowMoreUsers">
        <q-btn
          v-for="user in visibleUsers"
          :key="user.userName"
          color="grey-6"
          class="q-mx-xs q-pa-sm q-my-xs"
          outline
          size="md"
          style="min-width: 100px"
        >
          <q-icon
            name="circle"
            :color="getColor(user.status_name)"
            size="xs"
            class="q-mx-xs"
          />
          {{ user.username }} - {{ user.ordernumber }}
        </q-btn>

        <q-btn
          v-if="!storeSupabase.isShowMoreUsers"
          flat
          text-color="grey-4"
          icon-right="unfold_more"
          class="q-ml-sm"
          @click="
            storeSupabase.isShowMoreUsers = !storeSupabase.isShowMoreUsers
          "
        />

        <q-btn
          v-else
          flat
          dense
          text-color="grey-4"
          icon-right="unfold_less"
          class="q-ml-sm"
          @click="
            storeSupabase.isShowMoreUsers = !storeSupabase.isShowMoreUsers
          "
        />
      </div>
      <div class="column" v-else>
        <!-- Filter Icon -->
        <div
          class="filter-icon"
          style="position: absolute; top: 16px; right: 16px"
        >
          <q-btn
            dense
            round
            flat
            icon="filter_list"
            @click="menuVisible.value = !menuVisible.value"
            v-close-popup
          >
            <q-menu v-model="menuVisible">
              <q-list>
                <q-item clickable v-close-popup @click="sortUsers('asc')">
                  <q-item-section>Sắp xếp theo thứ tự bé lớn</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="sortUsers('desc')">
                  <q-item-section>Sắp xếp theo thứ tự lớn bé</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>

        <!-- User List -->
        <div
          v-for="user in sortedUsers"
          :key="user.userName"
          class="flex q-py-none"
          style="align-items: center"
        >
          <div style="width: 30%">
            <q-btn
              :color="
                user.status_name === 'serving'
                  ? 'green-8'
                  : user.status_name === 'waiting'
                  ? 'yellow-8'
                  : 'red-8'
              "
              class="q-pa-sm q-my-xs q-py-none"
              outline
              size="md"
              style="min-width: 100px"
            >
              {{ user.username }}
            </q-btn>
          </div>

          <div class="flex q-py-none" style="align-items: center">
            <q-badge
              v-for="(item, index) in +user.ordernumber"
              :key="index"
              color="primary"
              outline
              class="q-pa-sm q-px-sm q-ml-sm"
              :label="item"
            />
          </div>
        </div>

        <q-btn
          flat
          dense
          text-color="grey-4"
          icon-right="unfold_less"
          class="q-ml-sm"
          @click="
            storeSupabase.isShowMoreUsers = !storeSupabase.isShowMoreUsers
          "
        />
      </div>

      <!-- <q-btn
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
      /> -->
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
              <q-badge
                v-if="item.discountObject.id"
                color="primary"
                outline
                :label="`-${item.discountObject.value}${
                  item.discountObject.type === 'none'
                    ? '€'
                    : item.discountObject.type
                }`"
              >
              </q-badge>

              <q-badge
                v-if="item.giftCardObject.id"
                color="red"
                outline
                :label="`-${item.giftCardObject.value}€`"
                class="q-ml-sm"
              />

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
                dateUtil.formatter.format(item.umsatz)
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
          class="flex justify-between q-py-none q-pr-md bg-white z-max"
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

          <div class="column flex q-pt-lg" style="align-items: end">
            <div style="width: 100%" class="flex justify-between">
              <span class="text-grey-8">Giá gốc: </span>

              <span>
                {{ dateUtil.formatter.format(storeSupabase.newData.umsatz) }}
              </span>
            </div>

            <div
              v-if="storeSupabase.newData.isHaveDiscount"
              class="float-bottom text-subtitle2 flex justify-between"
              style="right: 5%; width: 100%"
            >
              <span>Mã giảm giá: </span>

              <span
                class="text-red-8"
                v-if="storeSupabase.newData.discountObject.type === 'none'"
                >-{{
                  dateUtil.formatter.format(
                    storeSupabase.newData.discountObject.value
                  )
                }}</span
              >

              <span v-else class="text-red-8"
                >-{{ storeSupabase.newData.discountObject.value }}
                {{ storeSupabase.newData.discountObject.type }}</span
              >
            </div>

            <div
              v-if="storeSupabase.newData.isHaveGiftCard"
              class="float-bottom text-subtitle2 flex justify-between"
              style="right: 5%; width: 100%"
            >
              <span>Mã quà tặng: </span>

              <span class="text-red-8"
                >-{{
                  dateUtil.formatter.format(
                    storeSupabase.newData.giftCardObject.value
                  )
                }}</span
              >
            </div>

            <div
              class="float-bottom text-subtitle1 flex justify-between"
              style="right: 5%; width: 100%"
            >
              <span class="text-bold q-pr-md">Tổng cộng:</span>
              <span>
                {{
                  dateUtil.formatter.format(
                    Math.max(
                      (storeSupabase.newData.isHaveDiscount
                        ? storeSupabase.newData.discountObject.type === "none"
                          ? storeSupabase.newData.umsatz -
                            storeSupabase.newData.discountObject.value
                          : storeSupabase.newData.umsatz -
                            (storeSupabase.newData.umsatz / 100) *
                              storeSupabase.newData.discountObject.value
                        : storeSupabase.newData.umsatz) -
                        // Trừ gift card
                        (storeSupabase.newData.isHaveGiftCard
                          ? storeSupabase.newData.giftCardObject.value
                          : 0),
                      0 // Ensure the value is at least 0
                    )
                  )
                }}
              </span>
            </div>
          </div>
        </div>
        <q-card-section>
          <q-form
            class="q-gutter-md q-py-lg flex column"
            @submit="storeSupabase.addData(storeSupabase.newData)"
          >
            <div class="full-width justify-between flex q-px-md">
              <q-badge
                :outline="!item.isSelected"
                color="primary"
                v-for="(item, index) in storeSupabase.listDiscount"
                :key="index"
                :label="`-${item.value}${
                  item.type === 'none' ? '€' : item.type
                }`"
                class="q-pa-sm q-px-lg q-mb-sm"
                style="width: 23%"
                @click="storeSupabase.handleClickDiscount(item.id)"
              />
            </div>

            <span
              v-if="storeSupabase.newData.menuSelected?.length"
              class="text-subtitle1"
              >Dịch vụ đã chọn</span
            >
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
                      <div
                        class="flex justify-between full-width"
                        style="align-items: center"
                      >
                        <div class="flex text-grey-7" style="width: 70%">
                          <div
                            class="column"
                            :style="item.isMultiSelect ? 'width: 30%' : []"
                          >
                            {{ item.label }}
                            <span v-if="item.isMultiSelect" class="text-blue"
                              >x {{ item.selectCount }}</span
                            >
                          </div>

                          <div v-if="item.isMultiSelect" class="flex">
                            <q-btn
                              color="grey-6"
                              icon="eva-minus-outline"
                              @click="
                                storeSupabase.clickMultiSelectInAddDataMinus(
                                  item
                                )
                              "
                              outline
                            />

                            <q-btn
                              color="grey-6"
                              icon="eva-plus-outline"
                              @click="
                                storeSupabase.clickMultiSelectInAddData(item)
                              "
                              class="q-ml-sm"
                              outline
                            />
                          </div>
                        </div>
                        <div
                          v-if="item.isMultiSelect"
                          class="text-blue text-bold"
                        >
                          {{
                            dateUtil.formatter.format(
                              item.value * item.selectCount
                            )
                          }}
                        </div>

                        <div v-else class="text-blue text-bold">
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
                    >
                      <q-badge color="red" :label="item.selectCount" floating />
                    </q-btn>
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

            <div>
              <span class="text-subtitle1">Gift card</span>

              <q-input
                v-model="storeSupabase.newData.giftCard"
                placeholder="Vui lòng nhập gift card tại đây..."
                outlined
                debounce="500"
                @update:model-value="
                  storeSupabase.validateGiftCard(storeSupabase.newData.giftCard)
                "
              >
                <template v-slot:append>
                  <!-- QR Code Icon with click event to show QR Scanner dialog -->
                  <q-icon
                    name="qr_code_scanner"
                    @click="showQRCodeDialog = true"
                  />
                </template>
              </q-input>

              <!-- QR Code Scan Dialog -->
              <q-dialog v-model="showQRCodeDialog">
                <q-card style="min-width: 90vw">
                  <q-card-section>
                    <div class="text-h6">Scan QR Code</div>
                  </q-card-section>

                  <q-card-section class="q-pa-md flex flex-center">
                    <!-- QR Scanner Component, make sure to install and use a QR scanning library -->
                    <!-- <qrcode-stream @detect="onDetect"></qrcode-stream> -->
                    <ScanQrComponent
                      :height="500"
                      :detect-func="storeScanQr.scanData"
                    ></ScanQrComponent>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn
                      flat
                      dense
                      label="Đóng"
                      color="grey"
                      @click="showQRCodeDialog = false"
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>

              <q-card
                v-if="storeSupabase.newData.isHaveGiftCard"
                class="my-card"
              >
                <q-card-section>
                  <div class="flex justify-between">
                    <div class="text-h6">Thẻ quà tặng</div>
                    <q-icon
                      name="eva-trash-2-outline"
                      size="md"
                      color="red-8"
                      @click="
                        Dialog.create({
                          title: 'Xác nhận',
                          message:
                            'Bạn có chắc chắn muốn xoá thẻ quà tặng này?',
                          ok: true,
                          cancel: true,
                        }).onOk(() => {
                          storeSupabase.newData.isHaveGiftCard = false;
                          storeSupabase.newData.giftCardObject = {};
                          storeSupabase.newData.giftCard = '';
                        })
                      "
                    />
                  </div>
                  <div class="text-subtitle2">
                    Giá trị:
                    <span class="text-primary">{{
                      storeSupabase.newData.giftCardObject.value
                    }}</span>
                  </div>
                </q-card-section>
                <q-card-section>
                  <div class="full-width text-grey-6 flex justify-between">
                    <span>
                      Từ ngày:
                      {{
                        new Date(
                          storeSupabase.newData.giftCardObject.date_from
                        ).toLocaleDateString("vi-VN")
                      }}
                    </span>
                    <span>
                      Đến ngày:
                      {{
                        new Date(
                          storeSupabase.newData.giftCardObject.date_expired
                        ).toLocaleDateString("vi-VN")
                      }}
                    </span>
                  </div>
                </q-card-section>
              </q-card>
            </div>

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
      :maximized="storeSupabase.showHistoryDialog"
      v-model="storeSupabase.showHistoryDialog"
    >
      <q-card
        v-if="!storeSupabase.isLoadingHistory"
        class="full-width full-height"
      >
        <div
          class="flex justify-between q-py-md q-pr-md bg-white z-max"
          style="position: sticky; top: 0"
        >
          <q-btn
            icon="eva-arrow-ios-back-outline"
            class="text-blue"
            flat
            @click="storeSupabase.showHistoryDialog = false"
          >
            <span class="text-subtitle1">Quay lại</span>
          </q-btn>
        </div>
        <q-card-section>
          <span class="text-h6 text-bold">Lịch sử chỉnh sửa</span>
          <q-list bordered>
            <!-- <q-item
              v-for="(item, index) in storeSupabase.listOrderHistories"
              :key="index"
              clickable
              v-ripple
              class="column"
            >
              <q-item-section avatar>
                {{ item.operation }}
              </q-item-section>
              <q-item-section>{{ item }}</q-item-section>
            </q-item> -->

            <q-card
              v-for="(item, index) in storeSupabase.listOrderHistories"
              :key="index"
              class="my-card"
            >
              <q-card-section>
                <div class="flex justify-between">
                  <div>
                    <div
                      class="text-h5"
                      :class="
                        item.operation.toLowerCase() === 'insert'
                          ? 'text-green'
                          : ''
                      "
                    >
                      {{
                        item.operation.toLowerCase() === "insert"
                          ? "Tạo mới"
                          : ""
                      }}
                    </div>
                    <div class="text-subtitle2 text-grey-6 q-ml-xs">
                      {{
                        new Date(item.created_at).toLocaleDateString("vi-VN")
                      }}
                    </div>
                  </div>
                  <div>
                    <span class="text-blue text-h4 text-right">{{
                      dateUtil.formatter.format(
                        item.details.menu_items.reduce(
                          (total, item) => total + item.price,
                          0
                        )
                      )
                    }}</span>
                  </div>
                </div>
              </q-card-section>
              <q-card-section>
                <!-- {{ item.details }} -->
                <q-item
                  v-for="(step, stepIndex) in item.details.menu_items"
                  :key="stepIndex"
                  clickable
                  v-ripple
                  class="flex justify-between"
                >
                  <q-item-section style="width: 70%">
                    {{
                      storeSupabase.menuData.filter(
                        (menuItem) => menuItem.id === step.menu_id
                      )[0].label
                    }}
                  </q-item-section>
                  <q-item-section class="flex flex-end text-right"
                    >{{ step.quantity }} x
                    {{ step.price / step.quantity }}</q-item-section
                  >
                </q-item>
              </q-card-section>

              <q-card-section>
                Mô tả: {{ item.details.description }}
              </q-card-section>
            </q-card>
          </q-list>
        </q-card-section>
      </q-card>

      <q-card v-else class="full-width flex flex-center full-height">
        <div style="height: 30vh" class="full-width flex column flex-center">
          Đang tải <q-spinner-ios size="lg" color="blue" />
        </div>
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
          <!--
          <div class="float-bottom text-h6" style="right: 5%">
            <span class="text-bold">Tổng cộng:</span>
            {{ dateUtil.formatter.format(storeSupabase.updateData.umsatz) }}
          </div> -->
          <div class="column flex q-pt-lg" style="align-items: end">
            <div style="width: 100%" class="flex justify-between">
              <span class="text-grey-8">Giá gốc: </span>

              <span>
                {{
                  dateUtil.formatter.format(storeSupabase.updateData.totalPrice)
                }}
              </span>
            </div>

            <div
              v-if="storeSupabase.updateData.isHaveDiscount"
              class="float-bottom text-subtitle2 flex justify-between"
              style="right: 5%; width: 100%"
            >
              <span>Mã giảm giá: </span>

              <span
                class="text-red-8"
                v-if="storeSupabase.updateData.discountObject.type === 'none'"
                >-{{
                  dateUtil.formatter.format(
                    storeSupabase.updateData.discountObject.value
                  )
                }}</span
              >

              <span v-else class="text-red-8"
                >-{{ storeSupabase.updateData.discountObject.value }}
                {{ storeSupabase.updateData.discountObject.type }}</span
              >
            </div>

            <div
              v-if="storeSupabase.updateData.isHaveGiftCard"
              class="float-bottom text-subtitle2 flex justify-between"
              style="right: 5%; width: 100%"
            >
              <span>Mã quà tặng: </span>

              <span class="text-red-8"
                >-{{
                  dateUtil.formatter.format(
                    storeSupabase.updateData.giftCardObject.value
                  )
                }}</span
              >
            </div>

            <div
              class="float-bottom text-subtitle1 flex justify-between"
              style="right: 5%; width: 100%"
            >
              <span class="text-bold q-pr-md">Tổng cộng:</span>
              <span>
                <!-- {{
                  dateUtil.formatter.format(
                    Math.max(
                      (storeSupabase.updateData.isHaveDiscount
                        ? storeSupabase.updateData.discountObject.type ===
                          "none"
                          ? storeSupabase.updateData.umsatz -
                            storeSupabase.updateData.discountObject.value
                          : storeSupabase.updateData.umsatz -
                            (storeSupabase.updateData.umsatz / 100) *
                              storeSupabase.updateData.discountObject.value
                        : storeSupabase.updateData.umsatz) -
                        (storeSupabase.updateData.isHaveGiftCard
                          ? storeSupabase.updateData.giftCardObject.value
                          : 0),
                      0
                    )
                  )
                }} -->

                {{ dateUtil.formatter.format(storeSupabase.updateData.umsatz) }}
              </span>
            </div>
          </div>
        </div>

        <q-card-section>
          <q-form
            class="q-gutter-md q-py-lg flex column"
            @submit="storeSupabase.postUpdateItem(storeSupabase.updateData)"
          >
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
                      <div
                        class="flex justify-between full-width"
                        style="align-items: center"
                      >
                        <div class="flex text-grey-7" style="width: 70%">
                          <div
                            class="column"
                            :style="item.isMultiSelect ? 'width: 30%' : []"
                          >
                            {{ item.label }}
                            <span v-if="item.isMultiSelect" class="text-blue"
                              >x {{ item.selectCount }}</span
                            >
                          </div>

                          <div v-if="item.isMultiSelect" class="flex">
                            <q-btn
                              color="grey-6"
                              icon="eva-minus-outline"
                              @click="
                                storeSupabase.clickMultiSelectInUpdateDataMinus(
                                  item
                                )
                              "
                              outline
                            />

                            <q-btn
                              color="grey-6"
                              icon="eva-plus-outline"
                              @click="
                                storeSupabase.clickMultiSelectInUpdateData(item)
                              "
                              class="q-ml-sm"
                              outline
                            />
                          </div>
                        </div>
                        <div
                          v-if="item.isMultiSelect"
                          class="text-blue text-bold"
                        >
                          {{
                            dateUtil.formatter.format(
                              item.value * item.selectCount
                            )
                          }}
                        </div>

                        <div v-else class="text-blue text-bold">
                          {{ dateUtil.formatter.format(item.value) }}
                        </div>
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-slide-item>
            </q-list>

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

                  <div
                    style="display: grid; grid-template-columns: 1fr 1fr 1fr"
                    class="q-mb-md full-width"
                  >
                    <q-btn
                      v-for="(
                        item, index
                      ) in storeSupabase.updateData.menuMultipleSelect.sort(
                        (a, b) => a.price - b.price
                      )"
                      :key="index"
                      class="q-mr-sm"
                      outline
                      color="white"
                      text-color="primary"
                      :label="item.label"
                      @click="storeSupabase.clickMultiSelectInUpdateData(item)"
                    >
                      <q-badge color="red" :label="item.selectCount" floating />
                    </q-btn>
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

            <!-- <q-list
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
            </q-list> -->

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

<style lang="scss" scoped>
.filter-icon {
  position: absolute;
  top: 16px;
  right: 16px;
}
</style>
