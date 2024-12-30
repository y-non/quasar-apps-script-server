<script setup>
import { onMounted } from "vue";
import { useAccountManagementStore } from "src/stores/admin/AccountManagementStore";

import noData from "../../assets/images/nodata.jpg";

const storeAccountManagement = useAccountManagementStore();

onMounted(async () => {
  await storeAccountManagement.getInit();

  storeAccountManagement.listAccount =
    await storeAccountManagement.getListAccount();
});
</script>

<template>
  <div>
    <div
      v-if="storeAccountManagement.isLoadingMainScreen"
      style="height: 30vh"
      class="full-width flex column flex-center"
    >
      Đang tải <q-spinner-ios size="lg" color="blue" />
    </div>

    <q-list class="q-mt-md" v-else>
      <div v-if="storeAccountManagement.listAccount?.length">
        <q-card
          v-for="(item, index) in storeAccountManagement.listAccount"
          :key="index"
          flat
          bordered
          class="my-card q-mb-md"
        >
          <q-card-section>
            <div class="text-h6 text-bold">{{ item.display_name }}</div>
            <div class="text-caption text-grey">ID: {{ item.id }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="q-mb-sm">
              <span class="text-bold">Phương thức:</span> {{ item.provider }}
            </div>
            <div class="q-mb-sm">
              <span class="text-bold">Quyền:</span> {{ item.role }}
            </div>
            <div class="q-mb-sm">
              <span class="text-bold">Trạng thái:</span> {{ item.status.name }}
            </div>

            <div class="q-mb-sm">
              <span class="text-bold">Site:</span> {{ item.site?.name }}
            </div>
            <div>
              <span class="text-bold">Ngày tạo:</span>
              {{ new Date(item.created_at).toDateString("vi-VN") }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              label="Sửa"
              color="primary"
              @click="storeAccountManagement.editAccount(item)"
            />
            <!-- <q-btn
              label="Xóa"
              color="negative"
              flat
              @click="storeAccountManagement.deleteAccount(item.id)"
            /> -->
          </q-card-actions>
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

    <!-- <q-page-sticky position="bottom-right" :offset="[18, 48]">
      <q-btn
        icon="add"
        color="green-7"
        class="q-pa-md"
        round
        :disable="storeAccountManagement.isLoadingMainScreen"
        @click="storeAccountManagement.isShowCreateDialog = true"
      />
    </q-page-sticky> -->
  </div>

  <q-dialog v-model="storeAccountManagement.isShowCreateDialog">
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section>
        <div class="text-h6">Tạo tài khoản mới</div>
      </q-card-section>

      <q-card-section>
        <!-- Display Name Input -->
        <q-input
          v-model="storeAccountManagement.newAccount.display_name"
          label="Display Name"
          outlined
          autofocus
        />

        <!-- Role Input -->
        <q-input
          v-model="storeAccountManagement.newAccount.role"
          label="Role"
          outlined
          class="q-mt-md"
        />

        <!-- Status Select -->
        <q-select
          v-model="storeAccountManagement.newAccount.status"
          :options="['serving', 'inactive']"
          label="Status"
          outlined
          class="q-mt-md"
        />

        <!-- Site Select -->
        <q-select
          v-model="storeAccountManagement.newAccount.site"
          :options="siteOptions"
          label="Site"
          outlined
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="primary"
          @click="storeAccountManagement.isShowCreateDialog = false"
        />
        <q-btn flat label="Create" color="primary" @click="createAccount" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="storeAccountManagement.isShowEditDialog">
    <q-card style="min-width: 90vw">
      <q-card-section>
        <div class="text-h6 text-bold text-primary">Cập nhật tài khoản</div>
      </q-card-section>

      <q-card-section>
        <!-- Display Name -->
        <q-input
          v-model="storeAccountManagement.selectedAccount.display_name"
          label="Tên"
          outlined
          dense
          class="q-mb-md"
          placeholder="Enter account's display name"
        />

        <!-- Role -->
        <!-- <q-input
          v-model="storeAccountManagement.selectedAccount.role"
          label="Phân quyền"
          outlined
          dense
          class="q-mb-md"
          placeholder="Vui lòng chọn phân quyền"
        /> -->

        <q-select
          v-model="storeAccountManagement.selectedAccount.role"
          :options="storeAccountManagement.listRole"
          option-label="label"
          option-value="id"
          label="Phân quyền"
          outlined
          dense
          class="q-mb-md"
          placeholder="Vui lòng chọn phân quyền"
        />

        <!-- Status -->
        <q-select
          v-model="storeAccountManagement.selectedAccount.status"
          :options="storeAccountManagement.listStatus"
          option-label="name"
          option-value="id"
          label="Trạng thái"
          outlined
          dense
          class="q-mb-md"
          placeholder="Vui lòng chọn trạng thái"
        />

        <q-select
          v-model="storeAccountManagement.selectedAccount.site"
          :options="storeAccountManagement.listSite"
          option-label="name"
          option-value="id"
          label="Site"
          outlined
          class="q-mb-md"
          dense
        />

        <q-input
          v-model="storeAccountManagement.selectedAccount.provider"
          label="Phương thức"
          outlined
          dense
          class="q-mb-md"
          readonly
        />

        <!-- Creation Date (readonly) -->
        <q-input
          :placeholder="`${new Date(
            storeAccountManagement.selectedAccount.created_at
          ).toLocaleDateString('vi-VN')}`"
          outlined
          dense
          readonly
          class="q-mb-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Hủy"
          color="negative"
          @click="storeAccountManagement.isShowEditDialog = false"
        />
        <q-btn
          label="Lưu"
          color="positive"
          @click="
            storeAccountManagement.postUpdateAccount(
              storeAccountManagement.selectedAccount
            )
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
.my-card {
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
  }
}
</style>
