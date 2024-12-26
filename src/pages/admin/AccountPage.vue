<script setup>
import { onMounted } from "vue";
import { useAdminStore } from "../../stores/AdminStore";

import noData from "../../assets/images/nodata.jpg";
import { dateUtil } from "src/utils/dateUtil";

const storeAdmin = useAdminStore();

onMounted(async () => {
  storeAdmin.listAccount = await storeAdmin.getListAccount();
});
</script>

<template>
  <div>
    <div
      v-if="storeAdmin.isLoadingMainScreen"
      style="height: 30vh"
      class="full-width flex column flex-center"
    >
      Đang tải <q-spinner-ios size="lg" color="blue" />
    </div>

    <q-list class="q-mt-md" v-else>
      <div v-if="storeAdmin.listAccount?.length">
        <q-card
          v-for="(item, index) in storeAdmin.listAccount"
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
              <span class="text-bold">Provider:</span> {{ item.provider }}
            </div>
            <div class="q-mb-sm">
              <span class="text-bold">Role:</span> {{ item.role }}
            </div>
            <div class="q-mb-sm">
              <span class="text-bold">Status:</span> {{ item.status }}
            </div>
            <div>
              <span class="text-bold">Created At:</span>
              {{ new Date(item.created_at).toDateString("vi-VN") }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              label="Edit"
              color="primary"
              @click="storeAdmin.editAccount(item)"
            />
            <q-btn
              label="Delete"
              color="negative"
              flat
              @click="storeAdmin.deleteAccount(item.id)"
            />
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

    <q-page-sticky position="bottom-right" :offset="[18, 48]">
      <q-btn
        icon="add"
        color="green-7"
        class="q-pa-md"
        round
        :disable="storeAdmin.isLoadingMainScreen"
        @click="storeAdmin.showAddDialog = true"
      />
    </q-page-sticky>
  </div>

  <q-dialog v-model="storeAdmin.showEditDialog">
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section>
        <div class="text-h6">Edit Account</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="storeAdmin.selectedAccount.display_name"
          label="Display Name"
          outlined
        />
        <q-input
          v-model="storeAdmin.selectedAccount.role"
          label="Role"
          outlined
          class="q-mt-md"
        />
        <q-select
          v-model="storeAdmin.selectedAccount.status"
          :options="['serving', 'inactive']"
          label="Status"
          outlined
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="primary"
          @click="storeAdmin.showEditDialog = false"
        />
        <q-btn flat label="Save" color="primary" @click="updateAccount" />
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
