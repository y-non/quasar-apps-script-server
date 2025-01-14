<script setup>
import { onMounted, computed, ref, watch } from "vue";
import { useGiftCardStore } from "src/stores/admin/GiftCardStore";
import { useScanQrStore } from "src/stores/ScanQrStore";

import { Notify, Dialog, copyToClipboard } from "quasar";

import QRCodeVue from "src/components/QRCodeVue.vue";
import ScanQrComponent from "../../components/ScanQrComponent.vue";

/* Utils import */
import { generateCode } from "src/utils/generateCode";
import { dateUtil } from "src/utils/dateUtil";

const storeGiftCard = useGiftCardStore();
const storeScanQr = useScanQrStore();

const sortOption = ref("all");
const showQRCodeDialog = ref(false);
const qrCodeData = ref("");

const sortOptions = [
  { label: "Tất cả", value: "all" },
  // { label: "Ngày tạo gần nhất", value: "dateNewest" },
  // { label: "Ngày tạo lâu nhất", value: "dateOldest" },
  { label: "Từ bé đến lớn", value: "valueAsc" },
  { label: "Từ lớn đến bé", value: "valueDesc" },
  { label: "Đã sử dụng", value: "used" },
  { label: "Chưa sử dụng", value: "unused" },
];

const applySort = () => {
  switch (sortOption.value) {
    case "all":
      storeGiftCard.listGiftCards = storeGiftCard.listGiftCardsOriginal;
      break;
    case "valueAsc":
      storeGiftCard.listGiftCards.sort((a, b) => a.value - b.value);
      break;
    case "valueDesc":
      storeGiftCard.listGiftCards.sort((a, b) => b.value - a.value);
      break;
    case "used":
      // storeGiftCard.listGiftCards.sort((a, b) => b.isused - a.isused);
      storeGiftCard.listGiftCards = storeGiftCard.listGiftCardsOriginal.filter(
        (item) => item.isused === true
      );
      break;
    case "unused":
      // storeGiftCard.listGiftCards.sort((a, b) => a.isused - b.isused);
      storeGiftCard.listGiftCards = storeGiftCard.listGiftCardsOriginal.filter(
        (item) => item.isused === false
      );
      break;
  }
};

const openQRCodeDialog = (code) => {
  qrCodeData.value = code;
  showQRCodeDialog.value = true;
};

const downloadQRCode = (index) => {
  const canvas = document.querySelectorAll("canvas")[index];
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "qr-code.png";
  link.click();
};

onMounted(async () => {
  storeGiftCard.isLoadingMainScreen = true;
  await storeGiftCard.getInit();
  storeGiftCard.isLoadingMainScreen = false;
});

const openCreateDialog = () => {
  storeGiftCard.isEditing = false;
  storeGiftCard.showDialog = true;
  storeGiftCard.currentGiftCard = {};
};

const openUpdateDialog = (giftCard) => {
  // storeGiftCard.openUpdateDialog(giftCard);
  storeGiftCard.isEditing = true;
  storeGiftCard.showDialog = true;
  storeGiftCard.currentGiftCard = { ...giftCard };
};

const validateDateRange = (val) => {
  const { date_from, date_expired } = storeGiftCard.currentGiftCard;

  if (!val) {
    return "Không được để trống";
  }

  if (date_expired < date_from) {
    return "Ngày hết hạn phải sau ngày bắt đầu";
  }

  return true;
};

const confirmDelete = (id) => {
  Dialog.create({
    title: "Xác nhận xóa",
    message: "Bạn có chắc chắn muốn xóa thẻ quà tặng này không?",
    ok: {
      color: "red",
      label: "Xóa",
    },
    cancel: {
      flat: true,
      label: "Hủy",
    },
  }).onOk(() => storeGiftCard.deleteGiftCard(id));
};

const copyCode = (code) => {
  copyToClipboard(code).then(() => {
    Notify.create({
      message: "Đã sao chép mã vào clipboard!",
      color: "green",
      timeout: 2000,
      position: "top",
    });
  });
};

watch(
  () => storeGiftCard.filterType,
  (val) => {
    if (val) {
      switch (val) {
        case "all":
          storeGiftCard.listGiftCards = storeGiftCard.listGiftCardsOriginal;
          break;

        case "unused":
          storeGiftCard.listGiftCards =
            storeGiftCard.listGiftCardsOriginal.filter((item) => !item.isused);
          break;

        case "used":
          storeGiftCard.listGiftCards =
            storeGiftCard.listGiftCardsOriginal.filter((item) => item.isused);
          break;

        default:
          storeGiftCard.listGiftCards = storeGiftCard.listGiftCardsOriginal;
          break;
      }
    }
  }
);

watch(
  () => storeGiftCard.filter,
  (val) => {
    if (val) {
      if (isNaN(val)) {
        storeGiftCard.listGiftCards =
          storeGiftCard.listGiftCardsOriginal.filter((item) =>
            item.code.toLowerCase().includes(val.toLowerCase())
          );
      } else {
        storeGiftCard.listGiftCards =
          storeGiftCard.listGiftCardsOriginal.filter((item) =>
            item.value.toString().includes(val)
          );
      }
    } else {
      storeGiftCard.listGiftCards = storeGiftCard.listGiftCardsOriginal;
    }
  }
);
</script>

<template>
  <div class="q-pa-md">
    <div
      v-if="storeGiftCard.isLoadingMainScreen"
      class="flex flex-center column"
      style="height: 50vh"
    >
      Đang tải... <q-spinner-ios size="lg" color="blue" />
    </div>

    <div v-else style="position: relative">
      <div
        style="position: sticky; top: 7%; z-index: 1; background-color: #ffffff"
      >
        <q-input
          v-model="storeGiftCard.filter"
          type="text"
          placeholder="Nhập hoặc scan giftcard để tìm kiếm"
          style="border-radius: 12px"
          class="q-py-sm"
          rounded
          outlined
          bg-color="grey-2"
        >
          <template v-slot:append>
            <q-icon
              name="qr_code_scanner"
              class="cursor-pointer"
              @click="showQRCodeDialog = true"
            />
          </template>
        </q-input>

        <div class="flex flex-start q-py-sm q-gutter-sm">
          <q-btn
            class="text-bold bg-default t-default"
            label="Tất cả"
            :class="
              storeGiftCard.filterType === 'all' ? 'bg-grey text-white' : ''
            "
            rounded
            @click="storeGiftCard.filterType = 'all'"
          />

          <q-btn
            class="bg-default t-default text-bold"
            label="Chưa sử dụng"
            :class="
              storeGiftCard.filterType === 'unused' ? 'bg-grey text-white' : ''
            "
            rounded
            @click="storeGiftCard.filterType = 'unused'"
          />

          <q-btn
            class="bg-default t-default text-bold"
            label="Đã sử dụng"
            :class="
              storeGiftCard.filterType === 'used' ? 'bg-grey text-white' : ''
            "
            rounded
            @click="storeGiftCard.filterType = 'used'"
          />
        </div>
      </div>
      <!--
      <div class="flex full-width justify-end">
        <q-select
          outlined
          dense
          v-model="sortOption"
          label="Sắp xếp"
          :options="sortOptions"
          emit-value
          map-options
          style="min-width: 40vw"
          @update:model-value="applySort"
        />
      </div> -->

      <q-list class="q-my-md" style="padding-bottom: 5em">
        <div class="header flex justify-between q-pa-sm">
          <span class="t-default text-subtitle1 text-bold"
            >Danh sách Gift card</span
          >

          <span class="t-default"
            >SL: {{ storeGiftCard.listGiftCards.length }}</span
          >
        </div>
        <q-card
          v-for="(giftCard, index) in storeGiftCard.listGiftCards"
          :key="index"
          flat
          bordered
          class="my-card q-mb-md bg-default"
        >
          <!-- <q-card-section class="q-pa-md">
            <div class="row justify-between items-center">
              <div class="col">
                <div class="text-h6">{{ giftCard.code }}</div>
                <div class="text-subtitle2 text-grey-7">
                  Từ {{ giftCard.date_from }} đến {{ giftCard.date_expired }}
                </div>
                <div class="text-body2 text-bold text-blue">
                  Giá trị: {{ giftCard.value }}
                </div>
                <div
                  class="text-body2"
                  :class="giftCard.isused ? 'text-red' : 'text-green'"
                >
                  {{ giftCard.isused ? "Đã sử dụng" : "Chưa sử dụng" }}
                </div>

                <div class="flex full-width q-mt-md">
                  <QRCodeVue :value="giftCard.code" size="50" />

                  <q-btn
                    icon="download"
                    color="primary"
                    dense
                    flat
                    @click="downloadQRCode(index)"
                    class="q-ml-md"
                  />
                </div>
              </div>

              <q-btn
                flat
                dense
                icon="content_copy"
                color="blue"
                @click="copyCode(giftCard.code)"
              />
            </div>
          </q-card-section> -->

          <q-card-section class="q-pa-none q-pr-md">
            <div class="row justify-between">
              <div style="width: 30%">
                <div class="flex flex-center full-width q-py-md">
                  <QRCodeVue :value="giftCard.code" size="80" />

                  <!-- <q-btn
                    icon="download"
                    color="primary"
                    dense
                    flat
                    @click="downloadQRCode(index)"
                    class="q-ml-md"
                  /> -->
                </div>
              </div>

              <div class="col q-pa-sm">
                <div class="flex" style="align-items: center">
                  <q-icon
                    v-if="!giftCard.isused"
                    name="eva-checkmark-circle-outline"
                    size="xs"
                    color="green-4"
                    class="q-mr-xs"
                  />
                  <q-icon
                    v-else
                    name="eva-close-circle-outline"
                    size="xs"
                    color="red-4"
                    class="q-mr-xs"
                  />

                  <div
                    class="text-subtitle1 t-default"
                    style="font-size: 1.2em"
                  >
                    {{ giftCard.code }}
                  </div>
                  <q-btn
                    flat
                    dense
                    icon="content_copy"
                    color="grey"
                    size="sm"
                    class="q-ml-xs"
                    @click="copyCode(giftCard.code)"
                  />
                </div>

                <div
                  class="text-bold t-default flex"
                  style="align-items: center"
                >
                  <span class="text-h5">EUR: {{ giftCard.value }}</span>
                </div>
                <div class="q-py-md text-grey-6">
                  {{ dateUtil.formatDateOnly(giftCard.date_from) }} •
                  {{ dateUtil.formatDateOnly(giftCard.date_expired) }}
                </div>
                <!-- <div
                  class="text-body2"
                  :class="giftCard.isused ? 'text-red' : 'text-green'"
                >
                  {{ giftCard.isused ? "Đã sử dụng" : "Chưa sử dụng" }}
                </div> -->
              </div>

              <div class="q-py-md">
                <q-icon
                  name="eva-edit-outline"
                  size="sm"
                  color="grey-7"
                  @click="openUpdateDialog(giftCard)"
                />
              </div>

              <!-- <q-btn
                flat
                dense
                icon="content_copy"
                color="blue"
                @click="copyCode(giftCard.code)"
              /> -->
            </div>
          </q-card-section>

          <!-- <q-card-actions align="right">
            <q-btn
              v-if="!giftCard.isused"
              flat
              dense
              label="Chỉnh sửa"
              color="green"
              @click="openUpdateDialog(giftCard)"
            />
            <q-btn
              v-if="!giftCard.isused"
              flat
              dense
              label="Xóa"
              color="red"
              @click="confirmDelete(giftCard.id)"
            />
          </q-card-actions> -->
        </q-card>
      </q-list>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 38]">
      <q-btn
        icon="add"
        color="green"
        round
        size="lg"
        @click="openCreateDialog"
      />
    </q-page-sticky>

    <!-- Dialogs for Create/Update -->
    <q-dialog
      transition-show="slide-left"
      transition-hide="slide-right"
      :maximized="storeGiftCard.showDialog"
      v-model="storeGiftCard.showDialog"
    >
      <q-card style="min-width: 90vw">
        <q-card-section
          @click="storeGiftCard.showDialog = false"
          class="flex"
          style="align-items: center"
        >
          <q-icon
            name="eva-arrow-ios-back-outline"
            size="sm"
            class="t-default"
          />
          <div class="text-h6 t-default">
            {{
              storeGiftCard.isEditing
                ? "Chỉnh sửa thẻ quà tặng"
                : "Tạo thẻ quà tặng"
            }}
          </div>
        </q-card-section>
        <q-form
          @submit="
            storeGiftCard.isEditing
              ? storeGiftCard.postUpdateGiftCard(storeGiftCard.currentGiftCard)
              : storeGiftCard.postCreateGiftCard(storeGiftCard.currentGiftCard)
          "
          class="q-gutter-md"
        >
          <div>
            <q-card-section>
              <q-input
                v-model="storeGiftCard.currentGiftCard.code"
                label="Mã"
                filled
                :disable="storeGiftCard.isEditing"
                :rules="[(val) => !!val || 'Không được để trống']"
              >
                <template v-slot:append>
                  <div>
                    <q-btn
                      flat
                      label="Tạo mã"
                      color="blue"
                      @click="
                        storeGiftCard.currentGiftCard.code =
                          generateCode.generateGiftCode()
                      "
                      :rules="[(val) => !!val || 'Không được để trống']"
                    />
                  </div>
                </template>
              </q-input>

              <q-input
                v-model="storeGiftCard.currentGiftCard.date_from"
                label="Ngày bắt đầu"
                filled
                type="date"
                :rules="[(val) => !!val || 'Không được để trống']"
              />

              <q-input
                v-model="storeGiftCard.currentGiftCard.date_expired"
                label="Ngày hết hạn"
                filled
                type="date"
                :rules="[validateDateRange]"
              />
              <q-input
                v-model="storeGiftCard.currentGiftCard.value"
                label="Giá trị"
                filled
                type="number"
                :rules="[(val) => !!val || 'Không được để trống']"
              />
            </q-card-section>
            <!-- <q-card-actions align="right">
              <q-btn
                flat
                label="Hủy"
                color="grey"
                @click="storeGiftCard.showDialog = false"
              />
              <q-btn type="submit" label="Lưu" color="green" />
            </q-card-actions> -->

            <q-card-actions align="center">
              <q-btn
                label="Trở về"
                class="t-default q-my-md q-py-sm text-capitalize text-bold q-mx-md"
                flat
                style="padding: 0.7em 2em"
                @click="storeGiftCard.showDialog = false"
              />
              <q-btn
                v-if="storeGiftCard.isEditing"
                type="submit"
                label="Cập nhật"
                flat
                icon-right="update"
                class="t-default bg-default"
                style="border-radius: 8px; padding: 0.7em"
              />
              <q-btn
                v-else
                type="submit"
                label="Thêm mới"
                icon="eva-plus-circle-outline"
                flat
                class="t-default bg-default"
                style="border-radius: 8px; padding: 0.7em"
              />
            </q-card-actions>
          </div>
        </q-form>
      </q-card>
    </q-dialog>

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
  </div>
</template>

<style scoped>
.my-card {
  border-radius: 10px;
}
</style>
