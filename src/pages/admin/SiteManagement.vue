<script setup>
import { onMounted } from "vue";
import { useSiteManagement } from "src/stores/admin/SiteManagement";
import { dateUtil } from "src/utils/dateUtil";

const storeSite = useSiteManagement();

onMounted(async () => {
  await storeSite.getInit();
});
</script>

<template>
  <div class="wrapper">
    <div class="wrapper-action q-pa-md flex justify-between">
      <q-btn
        icon="add_business"
        color="green"
        push
        label="Thêm site"
        @click="storeSite.isShowCreateDialog = true"
      />
      <q-icon name="filter_alt" size="md" class="t-default">
        <q-menu transition-show="scale" transition-hide="scale">
          <q-list style="min-width: 100px">
            <q-item clickable @click="storeSite.filterDateNearest()">
              <q-item-section>Ngày tạo gần nhất</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable @click="storeSite.filterDateLatest()">
              <q-item-section>Ngày tạo trễ nhất</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-icon>
    </div>

    <div class="wrapper-content q-px-md q-py-sm">
      <div class="wrapper-content__title">
        <span class="text-h5 t-default text-bold">Danh sách các site</span>
      </div>

      <div class="wrapper-content__list q-py-md">
        <q-card
          v-for="(item, index) in storeSite.listSite"
          :key="index"
          class="my-card q-mb-md bg-default"
          style="border-radius: 18px"
        >
          <q-card-section>
            <div class="flex justify-between" style="align-items: center">
              <div class="flex" style="align-items: center">
                <q-icon name="store" size="md" color="grey-6" />
                <div class="text-h6 q-px-md t-default text-uppercase">
                  {{ item.name }}
                </div>
              </div>

              <q-icon
                name="eva-edit-outline"
                size="sm"
                color="grey"
                @click="
                  storeSite.updateSite = { ...item };
                  storeSite.isShowEditDialog = true;
                "
              />
            </div>
            <div class="text-subtitle2 t-default">
              {{ dateUtil.formatDate(item.created_at) }}
            </div>
          </q-card-section>
          <q-card-section>
            <span class="t-default">{{ item.description }}</span>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>

  <q-dialog
    transition-show="slide-left"
    transition-hide="slide-right"
    :maximized="storeSite.isShowCreateDialog"
    v-model="storeSite.isShowCreateDialog"
  >
    <q-card style="height: 100vh; width: 100vw">
      <q-card-section
        @click="storeSite.isShowCreateDialog = false"
        class="flex"
        style="align-items: center"
      >
        <q-icon name="eva-arrow-ios-back-outline" size="sm" class="t-default" />
        <div class="text-h6 t-default">Thêm mới site</div>
      </q-card-section>
      <q-form
        @submit="storeSite.createSite(storeSite.newSite)"
        class="q-gutter-md"
      >
        <q-card-section>
          <div class="form-group">
            <label class="t-default text-subtitle2" for="">Tên site</label>
            <q-input
              v-model="storeSite.newSite.name"
              :rules="[(val) => !!val || 'Không được để rỗng']"
              filled
            />
          </div>

          <div class="form-group">
            <label class="t-default text-subtitle2" for="">Mô tả</label>
            <q-input
              v-model="storeSite.newSite.description"
              :rules="[(val) => !!val || 'Không được để rỗng']"
              filled
            />
          </div>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn
            label="Trở về"
            class="t-default q-my-md q-py-sm text-capitalize text-bold q-mx-md"
            flat
            style="padding: 0.7em 2em"
            @click="storeSite.isShowCreateDialog = false"
          />
          <q-btn
            type="submit"
            label="Thêm mới"
            icon="eva-plus-circle-outline"
            flat
            class="t-default bg-default"
            style="border-radius: 8px; padding: 0.7em"
            @click="createAccount"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog
    class="t-default"
    v-model="storeSite.isShowEditDialog"
    :maximized="storeSite.isShowEditDialog"
    transition-show="slide-left"
    transition-hide="slide-right"
  >
    <q-card style="min-width: 90vw">
      <q-card-section
        @click="storeSite.isShowEditDialog = false"
        class="flex"
        style="align-items: center"
      >
        <q-icon name="eva-arrow-ios-back-outline" size="sm" class="t-default" />
        <div class="text-h6 text-bold t-default">Cập nhật site</div>
      </q-card-section>
      <q-form
        @submit="storeSite.postUpdateSite(storeSite.updateSite)"
        class="q-gutter-md"
      >
        <div>
          <q-card-section>
            <!-- Display Name -->

            <div class="form-group">
              <label class="t-default text-subtitle2" for="">Tên site</label>
              <q-input
                v-model="storeSite.updateSite.name"
                filled
                class="q-mb-md t-default"
              />
            </div>

            <!-- Display Name -->

            <div class="form-group">
              <label class="t-default text-subtitle2" for="">Mô tả</label>
              <q-input
                v-model="storeSite.updateSite.description"
                filled
                class="q-mb-md t-default"
              />
            </div>
          </q-card-section>

          <q-card-actions align="center">
            <q-btn
              label="Trở về"
              class="t-default q-my-md q-py-sm text-capitalize text-bold q-mx-md"
              flat
              style="padding: 0.7em 2em"
              @click="storeSite.isShowEditDialog = false"
            />
            <q-btn
              class="t-default bg-default q-my-md q-py-sm text-capitalize text-bold q-mx-md"
              label="Cập nhật"
              color="grey-7"
              type="submit"
              glossy
              unelevated
              style="padding: 0.7em 2em; border-radius: 8px"
            />
          </q-card-actions>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>
