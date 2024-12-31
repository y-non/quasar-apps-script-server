<script setup>
import { onMounted } from "vue";
import { useUtilsStore } from "src/stores/UtilsStore";
import { useDiscountStore } from "src/stores/admin/DiscountStore";

// import loadingVideo from "../assets/video/angry-cute.mp4";
import noData from "../../assets/images/nodata.jpg";
import { dateUtil } from "src/utils/dateUtil";

import updateImg from "../../assets/icons/update.png";
import deleteImg from "../../assets/icons/delete.png";
import { useQuasar } from "quasar";

const storeDiscount = useDiscountStore();
const storeUtils = useUtilsStore();
const $q = useQuasar();

onMounted(async () => {
  storeDiscount.isLoadingMainScreen = true;
  storeDiscount.listDiscount = await storeUtils.getDiscount();
  storeDiscount.isLoadingMainScreen = false;
});

function showAction(item) {
  $q.bottomSheet({
    message: "Hành động",
    item,
    actions: [
      {
        label: "Sửa thông tin",
        img: updateImg,
        id: "update",
      },
      {},
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
          storeDiscount.showEditDialog = true;
          storeDiscount.editDiscount = { ...item };
          break;

        case "delete":
          storeDiscount.showDeleteDialog = true;
          storeDiscount.deleteObject = { ...item };
          break;

        default:
          break;
      }
    })
    .onCancel(() => {})
    .onDismiss(() => {});
}
</script>

<template>
  <div>
    <div
      v-if="storeDiscount.isLoadingMainScreen"
      style="height: 30vh"
      class="full-width flex column flex-center"
    >
      Đang tải <q-spinner-ios size="lg" color="blue" />
    </div>

    <q-list class="q-mt-md" v-else>
      <div v-if="storeDiscount.listDiscount?.length">
        <q-card
          v-for="(item, index) in storeDiscount.listDiscount"
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
              <div class="text-subtitle2 text-grey">
                {{ new Date(item.created_at).toLocaleDateString("vi-VN") }}
              </div>
            </div>

            <div class="flex flex-center">
              <!-- <q-icon
                name="eva-edit-2-outline"
                size="sm"
                :color="storeDiscount.loadingSelect ? 'grey-3' : 'grey-5'"
                @click="
                  () => {
                    storeDiscount.showEditDialog = true;
                    storeDiscount.editDiscount = { ...item };
                  }
                "
              /> -->

              <q-icon
                v-if="!item.isused"
                name="more_vert"
                size="sm"
                :color="storeDiscount.loadingSelect ? 'grey-3' : 'grey-5'"
                @click="!storeDiscount.loadingSelect ? showAction(item) : []"
              />
            </div>
          </q-card-section>
          <q-card-section>
            <div
              class="flex justify-between full-width q-py-xs q-px-none q-mx-none"
              @click="item.showQList = !item.showQList"
              style="align-items: center"
            >
              <span class="text-bold text-grey-7 text-h6">Giá trị</span>
              <span v-if="item.type === 'none'" class="text-blue text-h4">{{
                dateUtil.formatter.format(item.value)
              }}</span>
              <span v-else class="text-blue text-h4"
                >{{ item.value }} {{ item.type }}</span
              >
            </div>

            <div class="flex justify-between">
              <span class="text-grey-6">{{ item.description }}</span>

              <div
                class="text-body2"
                :class="item.isused ? 'text-red' : 'text-green'"
              >
                {{ item.isused ? "Đã sử dụng" : "Chưa sử dụng" }}
              </div>
            </div>
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
        :disable="storeDiscount.isLoadingMainScreen"
        @click="storeDiscount.showAddDialog = true"
      />
    </q-page-sticky>
  </div>

  <q-dialog v-model="storeDiscount.showAddDialog">
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section>
        <div class="text-h6">Thêm mã giảm giá</div>
      </q-card-section>

      <q-form
        @submit="storeDiscount.postCreateDiscount(storeDiscount.newDiscount)"
        class="q-gutter-md"
      >
        <div>
          <q-card-section>
            <q-input
              v-model="storeDiscount.newDiscount.value"
              type="number"
              label="Giá trị"
              outlined
              :rules="[(val) => !!val || 'Không được để trống']"
            />
            <q-select
              v-model="storeDiscount.newDiscount.type"
              :options="['€', '%']"
              label="Loại giảm giá"
              outlined
              :rules="[(val) => !!val || 'Không được để trống']"
            />
            <q-input
              v-model="storeDiscount.newDiscount.description"
              label="Mô tả"
              outlined
              class="q-mb-md"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Hủy"
              color="primary"
              @click="storeDiscount.showAddDialog = false"
            />
            <q-btn label="Thêm" type="submit" color="primary" />
          </q-card-actions>
        </div>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="storeDiscount.showEditDialog">
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section>
        <div class="text-h6">Edit Discount</div>
      </q-card-section>

      <q-form
        @submit="storeDiscount.postUpdateDiscount(storeDiscount.editDiscount)"
        class="q-gutter-md"
      >
        <div>
          <q-card-section>
            <q-input
              v-model="storeDiscount.editDiscount.value"
              type="number"
              label="Giá trị"
              outlined
              :rules="[(val) => !!val || 'Không được để trống']"
            />
            <q-select
              v-model="storeDiscount.editDiscount.type"
              :options="['none', '%']"
              label="Loại giảm giá"
              outlined
              :rules="[(val) => !!val || 'Không được để trống']"
            />
            <q-input
              v-model="storeDiscount.editDiscount.description"
              label="Mô tả"
              outlined
              class="q-mb-md"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Hủy"
              color="primary"
              @click="storeDiscount.showEditDialog = false"
            />
            <q-btn type="submit" label="Lưu" color="primary" />
          </q-card-actions>
        </div>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="storeDiscount.showDeleteDialog">
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section>
        <div class="text-h6">Xác nhận</div>
        <div>Bạn có chắc chắn muốn xóa mã giảm giá này không?</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Xóa"
          color="red"
          @click="storeDiscount.deleteDiscount(storeDiscount.deleteObject)"
        />
        <q-btn
          label="Hủy"
          color="primary"
          @click="storeDiscount.showDeleteDialog = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped></style>
