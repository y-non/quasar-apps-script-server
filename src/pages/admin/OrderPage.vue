<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthenticationStore } from "src/stores/AuthenticationStore";
import { useAdminStore } from "src/stores/AdminStore";

import { QSpinnerIos } from "quasar";
import { useQuasar } from "quasar";

// import loadingVideo from "../assets/video/angry-cute.mp4";
import noData from "../../assets/images/nodata.jpg";
import historyImg from "../../assets/icons/history.png";
import updateImg from "../../assets/icons/update.png";
import deleteImg from "../../assets/icons/delete.png";
import { dateUtil } from "src/utils/dateUtil";
import { storageUtil } from "src/utils/storageUtil";
import { supabase } from "src/utils/superbase";

const $q = useQuasar();
const router = useRouter();

const storeAdmin = useAdminStore();
const storeAuthentication = useAuthenticationStore();
const selectMenuRef = ref(null);
const selectMenuRefUpdate = ref(null);

const optionsMenuData = ref([]);

/* state for handle reactive in UI */
const slideItems = ref(storeAdmin.slideItems);
const slideItemsUpdate = ref(storeAdmin.slideItemsUpdate);

onMounted(async () => {
  await storeAdmin.getInit();

  supabase.auth.onAuthStateChange(async (_, session) => {
    if (session) {
      storeAuthentication.validateSession();
    }
  });
});

onUnmounted(() => {
  supabase.removeAllChannels();
});

function showAction(grid) {
  $q.bottomSheet({
    message: "Hành động",
    grid,
    actions: [
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
      switch (action.id) {
        case "update":
          storeAdmin.showUpdateDialog = true;

          storeAdmin.updateData = storeAdmin.listOrder.filter(
            (item) => item.id === grid
          )[0];

          storeAdmin.updateData.isCustomerOrder = false;

          /* test */
          storeAdmin.updateData.menuSelected =
            storeAdmin.updateData.menuSelected
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

          storeAdmin.updateData.menuMultipleSelect = storeAdmin.menuData
            .map((item) => {
              if (item.isMultiSelect) {
                const quantity = storeAdmin.updateData.menu.filter(
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

          // storeAdmin.updateData.umsatz = storeAdmin.updateData.totalPrice;
          break;

        case "delete":
          storeAdmin.deleteData(grid);
          break;

        case "history":
          storeAdmin.showHistoryDialog = true;
          storeAdmin.fetchHistoryData(grid);
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
      optionsMenuData.value = storeAdmin.menuData.filter(
        (item) => !item.isMultiSelect
      );

      // here you have access to "ref" which
      // is the Vue reference of the QSelect
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    optionsMenuData.value = storeAdmin.menuData.filter(
      (v) =>
        v.filterSearch.toLowerCase().indexOf(needle) > -1 && !v.isMultiSelect
    );
  });
};
</script>

<template>
  <q-page class="q-pa-sm">
    <div
      v-if="storeAdmin.isLoadingMainScreen"
      style="height: 30vh"
      class="full-width flex column flex-center"
    >
      Đang tải <q-spinner-ios size="lg" color="blue" />
    </div>

    <q-list class="q-mt-md" v-else>
      <q-pull-to-refresh @refresh="storeAdmin.getInit()" color="primary">
        <div class="flex full-width justify-end">
          <!-- <q-btn class="q-mb-md" icon="event" round color="primary">
          <q-popup-proxy
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date v-model="storeAdmin.datePicker" range >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn label="Cancel" color="primary" flat v-close-popup />
                <q-btn
                  label="OK"
                  color="primary"
                  flat
                  @click="save"
                  v-close-popup
                />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-btn> -->
        </div>
        <div v-if="storeAdmin.listOrder?.length">
          <span class="text-h6 t-default q-py-sm text-bold"
            >Danh sách đơn hàng</span
          >
          <q-card
            v-for="(item, index) in storeAdmin.listOrder"
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
                <div
                  class="flex text-subtitle2 text-grey flex"
                  style="align-items: center"
                >
                  <q-icon name="eva-person-outline" size="xs" />
                  <span class="q-ml-sm">{{ item.users.display_name }}</span>
                </div>

                <div
                  class="flex text-subtitle2 text-grey flex"
                  style="align-items: center"
                >
                  <q-icon name="eva-home-outline" size="xs" />
                  <span class="q-ml-sm text-capitalize">
                    {{ item.siteName }}</span
                  >
                </div>
              </div>

              <div class="flex flex-center">
                <!-- <q-badge
                v-if="item.discountObject?.id"
                color="primary"
                outline
                :label="`-${item.discountObject.value}${
                  item.discountObject.type === 'none'
                    ? '€'
                    : item.discountObject.type
                }`"
              /> -->

                <q-icon
                  v-if="item.is_edit"
                  name="eva-edit-2-outline"
                  size="sm"
                  color="grey-5"
                  class="text-bold"
                />
                <q-icon
                  name="more_vert"
                  size="sm"
                  :color="storeAdmin.loadingSelect ? 'grey-3' : 'grey-5'"
                  @click="!storeAdmin.loadingSelect ? showAction(item.id) : []"
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
                <!-- <span class="text-blue text-h4">{{
                dateUtil.formatter.format(item.totalPrice)
              }}</span> -->
                <span v-if="!item.showQList" class="text-blue text-h4">{{
                  dateUtil.formatter.format(item.totalPrice)
                }}</span>

                <div
                  v-else
                  class="column flex q-pt-lg"
                  style="align-items: end"
                >
                  <div style="width: 100%" class="flex justify-between">
                    <span class="text-grey-8">Giá gốc: </span>

                    <span>
                      {{ dateUtil.formatter.format(item.totalPrice) }}
                    </span>
                  </div>

                  <div
                    v-if="item.isHaveDiscount"
                    class="float-bottom text-subtitle2 flex justify-between"
                    style="right: 5%; width: 100%"
                  >
                    <span>Mã giảm giá: </span>

                    <span
                      class="text-red-8"
                      v-if="item.discountObject.type === 'none'"
                      >-{{
                        dateUtil.formatter.format(item.discountObject.value)
                      }}</span
                    >

                    <span v-else class="text-red-8"
                      >-{{ item.discountObject.value }}
                      {{ item.discountObject.type }}</span
                    >
                  </div>

                  <div
                    v-if="item.isHaveGiftCard"
                    class="float-bottom text-subtitle2 flex justify-between"
                    style="right: 5%; width: 100%"
                  >
                    <span>Mã quà tặng: </span>

                    <span class="text-red-8"
                      >-{{
                        dateUtil.formatter.format(item.giftCardObject.value)
                      }}</span
                    >
                  </div>

                  <div
                    class="float-bottom text-subtitle1 flex justify-between"
                    style="right: 5%; width: 100%"
                  >
                    <span class="text-bold q-pr-md">Tổng cộng:</span>
                    <span class="text-blue text-bold">
                      {{
                        dateUtil.formatter.format(
                          Math.max(
                            (item.isHaveDiscount
                              ? item.discountObject.type === "none"
                                ? item.totalPrice - item.discountObject.value
                                : item.totalPrice -
                                  (item.totalPrice / 100) *
                                    item.discountObject.value
                              : item.totalPrice) -
                              // Trừ gift card
                              (item.isHaveGiftCard
                                ? item.giftCardObject.value
                                : 0),
                            0 // Ensure the value is at least 0
                          )
                        )
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <q-list v-if="item.showQList" class="q-mb-md" bordered separator>
                <q-item v-for="(menu, index) in item.menuSelected" :key="index">
                  <q-item-section>
                    <div
                      class="flex justify-between"
                      style="align-items: center"
                    >
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
      </q-pull-to-refresh>
    </q-list>

    <q-page-sticky position="bottom-right" :offset="[18, 48]">
      <q-btn icon="event" round color="primary" class="q-pa-md">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="storeAdmin.datePicker" range>
            <div class="row items-center justify-end q-gutter-sm">
              <q-btn
                @click="
                  storeAdmin.listOrder = storeAdmin.listOrderOriginal;
                  storeAdmin.datePicker = [];
                "
                label="Hủy chọn"
                color="primary"
                flat
                v-close-popup
              />
              <q-btn
                label="OK"
                color="primary"
                @click="
                  storeAdmin.clickSelectDateRangeOrder(storeAdmin.datePicker)
                "
                v-close-popup
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-btn>
    </q-page-sticky>

    <q-dialog
      transition-show="slide-left"
      transition-hide="slide-right"
      :maximized="storeAdmin.showHistoryDialog"
      v-model="storeAdmin.showHistoryDialog"
    >
      <q-card
        v-if="!storeAdmin.isLoadingHistory"
        class="full-width full-height"
      >
        <div
          class="flex justify-between q-pr-md bg-white z-max q-py-lg"
          style="position: sticky; top: 0"
        >
          <q-btn
            icon="eva-arrow-ios-back-outline"
            class="text-blue"
            flat
            @click="storeAdmin.showHistoryDialog = false"
          >
            <span class="text-subtitle1">Quay lại</span>
          </q-btn>
          <span class="text-h6 text-bold">Lịch sử chỉnh sửa</span>
        </div>
        <q-card-section>
          <q-list>
            <!-- <q-item
              v-for="(item, index) in storeAdmin.listOrderHistories"
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
              v-for="(item, index) in storeAdmin.listOrderHistories"
              :key="index"
              class="my-card q-mb-lg"
            >
              <q-card-section>
                <div class="flex justify-between">
                  <div>
                    <div
                      class="text-h5"
                      :class="
                        item.operation.toLowerCase() === 'insert'
                          ? 'text-green'
                          : 'text-orange'
                      "
                    >
                      {{
                        item.operation.toLowerCase() === "insert"
                          ? "Tạo mới"
                          : "Cập nhập"
                      }}
                    </div>
                    <div class="text-subtitle2 text-grey-6 q-ml-xs">
                      {{ item.dateFormat }}
                    </div>
                  </div>

                  <div class="column flex q-pt-lg" style="align-items: end">
                    <div style="width: 100%" class="flex justify-between">
                      <span class="text-grey-8">Giá gốc: </span>

                      <span>
                        {{ dateUtil.formatter.format(item.totalPrice) }}
                      </span>
                    </div>

                    <div
                      v-if="item.isHaveDiscount"
                      class="float-bottom text-subtitle2 flex justify-between"
                      style="right: 5%; width: 100%"
                    >
                      <span>Mã giảm giá: </span>

                      <span
                        class="text-red-8"
                        v-if="item.discountObject.type === 'none'"
                        >-{{
                          dateUtil.formatter.format(item.discountObject.value)
                        }}</span
                      >

                      <span v-else class="text-red-8"
                        >-{{ item.discountObject.value }}
                        {{ item.discountObject.type }}</span
                      >
                    </div>

                    <div
                      v-if="item.isHaveGiftCard"
                      class="float-bottom text-subtitle2 flex justify-between"
                      style="right: 5%; width: 100%"
                    >
                      <span>Mã quà tặng: </span>

                      <span class="text-red-8"
                        >-{{
                          dateUtil.formatter.format(item.giftCardObject.value)
                        }}</span
                      >
                    </div>

                    <div
                      class="float-bottom text-subtitle1 flex justify-between"
                      style="right: 5%; width: 100%"
                    >
                      <span class="text-bold q-pr-md">Tổng cộng:</span>
                      <span class="text-blue text-bold">
                        {{
                          dateUtil.formatter.format(
                            Math.max(
                              (item.isHaveDiscount
                                ? item.discountObject.type === "none"
                                  ? item.totalPrice - item.discountObject.value
                                  : item.totalPrice -
                                    (item.totalPrice / 100) *
                                      item.discountObject.value
                                : item.totalPrice) -
                                // Trừ gift card
                                (item.isHaveGiftCard
                                  ? item.giftCardObject.value
                                  : 0),
                              0 // Ensure the value is at least 0
                            )
                          )
                        }}
                      </span>
                    </div>
                  </div>
                  <!-- test -->

                  <!-- <div
                    class="right-history column flex"
                    style="align-items: end"
                  >
                    <div class="flex justify-end" style="align-items: center">
                      <q-badge
                        v-if="item.discountObject.id"
                        color="primary"
                        outline
                        :label="`-${item.discountObject.value}${
                          item.discountObject.type === 'none'
                            ? '€'
                            : item.discountObject.type
                        }`"
                        class="q-mr-sm"
                      >
                      </q-badge>

                      <q-badge
                        v-if="item.giftCardObject.id"
                        color="red"
                        outline
                        :label="`-${item.giftCardObject.value}€`"
                        class="q-mr-sm"
                      />

                      <span class="text-right text-subtitle1">{{
                        dateUtil.formatter.format(
                          item.details.menu_items.reduce(
                            (total, item) => total + item.price,
                            0
                          )
                        )
                      }}</span>
                    </div>

                    <div class="text-blue text-h5">
                      = {{ dateUtil.formatter.format(item.umsatz.toFixed(2)) }}
                    </div>
                  </div> -->
                </div>
              </q-card-section>
              <q-card-section>
                <q-list class="q-mb-md" bordered separator>
                  <q-item
                    v-for="(step, stepIndex) in item.details.menu_items"
                    :key="stepIndex"
                    clickable
                    v-ripple
                    class="flex justify-between"
                  >
                    <q-item-section>
                      <div class="flex justify-between">
                        <span style="width: 80%">
                          {{
                            storeAdmin.menuData.filter(
                              (menuItem) => menuItem.id === step.menu_id
                            )[0].label
                          }}
                        </span>

                        <span
                          >{{ step.quantity }} x
                          {{ step.price / step.quantity }}</span
                        >
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>

              <!-- khách đặt -->
              <div
                class="flex full-width justify-end q-px-lg"
                style="align-items: center"
                v-if="item.details.is_customer_order"
              >
                <span class="text-blue text-bold">
                  Khách đặt
                  <q-icon
                    name="eva-checkmark-circle-outline"
                    size="sm"
                    color="primary"
                  />
                </span>
              </div>

              <q-card-section>
                <span class="q-px-md"
                  >Mô tả: {{ item.details.description }}</span
                >
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
      :maximized="storeAdmin.showUpdateDialog"
      v-model="storeAdmin.showUpdateDialog"
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
            @click="storeAdmin.handleClickBackButtonShowAlert"
          >
            <span class="text-subtitle1">Quay lại</span>
          </q-btn>

          <div class="float-bottom text-h6" style="right: 5%">
            <span class="text-bold">Tổng cộng:</span>
            {{ dateUtil.formatter.format(storeAdmin.updateData.umsatz) }}
          </div>
        </div>
        <q-card-section>
          <q-form
            class="q-gutter-md q-py-lg flex column"
            @submit="storeAdmin.postUpdateItem(storeAdmin.updateData)"
          >
            <span
              v-if="storeAdmin.updateData.menuSelected?.length"
              class="text-subtitle1"
              >Dịch vụ đã chọn</span
            >

            <q-list
              v-if="storeAdmin.updateData.menuSelected?.length"
              bordered
              separator
            >
              <!-- test -->
              <q-slide-item
                v-for="(item, index) in storeAdmin.updateData.menuSelected"
                :key="index"
                ref="slideItems"
                @right="storeAdmin.onRightSlide(item.id, index)"
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
                                storeAdmin.clickMultiSelectInUpdateDataMinus(
                                  item
                                )
                              "
                              outline
                            />

                            <q-btn
                              color="grey-6"
                              icon="eva-plus-outline"
                              @click="
                                storeAdmin.clickMultiSelectInUpdateData(item)
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
              v-model="storeAdmin.updateData.menuSelected"
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
                storeAdmin.updateData.umsatz =
                  storeAdmin.updateData.menuSelected
                    .map((item) => item.value)
                    .reduce((acc, current) => acc + current, 0);

                storeAdmin.isHaveNotSaveDataYet = true;
              "
              :disable="storeAdmin.loadingSelect"
              hide-selected
            >
              <template v-slot:selected>
                <!-- <div>
                  Already checked
                  <span class="text-bold">{{
                    storeAdmin.updateData.menuSelected?.length
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
                      ) in storeAdmin.updateData.menuMultipleSelect.sort(
                        (a, b) => a.price - b.price
                      )"
                      :key="index"
                      class="q-mr-sm"
                      outline
                      color="white"
                      text-color="primary"
                      :label="item.label"
                      @click="storeAdmin.clickMultiSelectInUpdateData(item)"
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
                        @click="storeAdmin.clickToggleUpdateMenuItem(scope)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <!-- notizen -->
            <div
              v-if="!storeAdmin.showNotizen"
              @click="storeAdmin.showNotizen = true"
              class="flex flex-center text-blue"
            >
              <q-icon name="add" size="sm" rounded />Hiện ghi chú
            </div>

            <q-input
              v-if="storeAdmin.showNotizen"
              v-model="storeAdmin.updateData.notizen"
              label="Thêm ghi chú"
              @update:model-value="storeAdmin.isHaveNotSaveDataYet = true"
              outlined
            />

            <div
              v-if="storeAdmin.showNotizen"
              @click="storeAdmin.showNotizen = false"
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
