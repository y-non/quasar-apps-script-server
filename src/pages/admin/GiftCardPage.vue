<script setup>
import { onMounted, computed, ref } from "vue";
import { useGiftCardStore } from "src/stores/admin/GiftCardStore";
import { Notify, Dialog, copyToClipboard } from "quasar";

import QRCodeVue from "src/components/QRCodeVue.vue";

/* Utils import */
import { generateCode } from "src/utils/generateCode";

const storeGiftCard = useGiftCardStore();
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

    <div v-else>
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
      </div>

      <q-list class="q-my-md" style="padding-bottom: 5em">
        <q-card
          v-for="(giftCard, index) in storeGiftCard.listGiftCards"
          :key="index"
          flat
          bordered
          class="my-card q-mb-md"
        >
          <q-card-section class="q-pa-md">
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

              <!-- <q-btn
                flat
                dense
                icon="qr_code"
                color="blue"
                @click="openQRCodeDialog(giftCard.code)"
              /> -->
              <q-btn
                flat
                dense
                icon="content_copy"
                color="blue"
                @click="copyCode(giftCard.code)"
              />

              <!-- <q-btn
                flat
                dense
                icon="share"
                color="blue"
                @click="copyCode(giftCard.code)"
              /> -->
            </div>
          </q-card-section>
          <q-card-actions align="right">
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
          </q-card-actions>
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

    <!-- QR Code Dialog -->
    <q-dialog v-model="showQRCodeDialog">
      <q-card style="min-width: 90vw">
        <q-card-section>
          <div class="text-h6">QR Code</div>
        </q-card-section>
        <q-card-section class="q-pa-md flex flex-center">
          <QRCodeVue :value="qrCodeData" size="300" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Đóng"
            color="grey"
            @click="showQRCodeDialog = false"
          />
          <q-btn label="Tải xuống" color="green" @click="downloadQRCode" />
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
