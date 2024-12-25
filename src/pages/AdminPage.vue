<script setup>
import { onMounted } from "vue";
import { useAdminStore } from "../stores/AdminStore";

// import loadingVideo from "../assets/video/angry-cute.mp4";
import noData from "../assets/images/nodata.jpg";
import { dateUtil } from "src/utils/dateUtil";

const storeAdmin = useAdminStore();

onMounted(async () => {
  storeAdmin.listDiscount = await storeAdmin.getDiscount();
  console.log(storeAdmin.listDiscount);
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
      <div v-if="storeAdmin.listDiscount?.length">
        <q-card
          v-for="(item, index) in storeAdmin.listDiscount"
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
              <span class="text-bold text-grey-7 text-h6">Giá trị</span>
              <span v-if="item.type === 'none'" class="text-blue text-h4">{{
                dateUtil.formatter.format(item.value)
              }}</span>
              <span v-else class="text-blue text-h4"
                >{{ item.value }} {{ item.type }}</span
              >
            </div>

            <span class="text-grey-6">{{ item.description }}</span>
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
        :disable="storeAdmin.isLoadingMainScreen"
        @click="storeAdmin.showAddDialog = true"
      />
    </q-page-sticky>
  </div>
</template>

<style lang="scss" scoped></style>
