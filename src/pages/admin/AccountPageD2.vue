<script setup>
import { onMounted, ref } from "vue";
import { useAccountManagementStore } from "src/stores/admin/AccountManagementStore";

import noData from "../../assets/images/nodata.jpg";
import { dateUtil } from "src/utils/dateUtil";

const storeAccountManagement = useAccountManagementStore();
const tab = ref("user");
// Password visibility toggle
const showPassword = ref(false);

// Methods
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

onMounted(async () => {
  await storeAccountManagement.getInit();

  storeAccountManagement.listAccount =
    await storeAccountManagement.getListAccount();
});

const validateDateRange = (val) => {
  const { dayoff_from, dayoff_to } = storeAccountManagement.selectedAccount;

  const currentDay = new Date().toISOString().split("T")[0];

  if (!val) {
    return "Không được để trống";
  }

  if (dayoff_to < dayoff_from) {
    return "Ngày nghỉ đến phải sau ngày bắt đầu";
  }

  // if (dayoff_from < currentDay) {
  //   return "Ngày bắt đầu nghỉ phải sau ngày hiện tại";
  // }

  return true;
};

const validateDateRangeFrom = (val) => {
  const { dayoff_from, dayoff_to } = storeAccountManagement.selectedAccount;

  const currentDay = new Date().toISOString().split("T")[0];

  if (!val) {
    return "Không được để trống";
  }

  if (dayoff_from < currentDay) {
    return "Ngày bắt đầu nghỉ phải sau ngày hiện tại";
  }

  return true;
};
</script>

<template>
  <div class="wrapper t-default">
    <div>
      <div
        v-if="storeAccountManagement.isLoadingMainScreen"
        style="height: 30vh"
        class="full-width flex column flex-center"
      >
        Đang tải <q-spinner-ios size="lg" color="blue" />
      </div>

      <q-list v-else>
        <div
          style="margin-bottom: 10em"
          v-if="storeAccountManagement.listAccount?.length"
        >
          <div class="q-py-md q-px-md">
            <q-btn
              class="t-default bg-default"
              label="Tất cả các shop"
              rounded
              flat
            />
            <q-btn
              class="t-default bg-default q-ml-md"
              label="Tất cả quyền"
              rounded
              flat
            />
          </div>

          <div class="add-session q-px-md">
            <div class="title-header t-default text-bold text-h6">
              Danh sách tài khoản
            </div>

            <q-btn
              class="t-default bg-default q-my-md q-py-sm text-capitalize text-bold"
              icon="eva-plus-circle-outline"
              label="Thêm tài khoản"
              @click="storeAccountManagement.isShowCreateDialog = true"
              flat
            />

            <q-card
              v-for="(item, index) in storeAccountManagement.listAccount"
              :key="index"
              flat
              bordered
              class="my-card q-mb-md t-default bg-default"
            >
              <q-card-section>
                <div class="full-width flex justify-between">
                  <div class="text-h6 text-bold">{{ item.display_name }}</div>

                  <q-icon
                    name="eva-more-vertical-outline"
                    size="sm"
                    @click="storeAccountManagement.editAccount(item)"
                  />
                </div>
                <div>
                  <div class="text-caption text-grey">
                    {{ item.email }}
                    •

                    <span>Quyền:</span> {{ item.role }}

                    •

                    <span>Trạng thái: {{ item.status?.name }}</span>
                  </div>
                </div>
              </q-card-section>

              <q-card-section>
                <div class="q-mb-sm">
                  <span class="text-bold"
                    ><q-icon name="eva-pin-outline" size="sm" />&nbsp;</span
                  >
                  {{ item.site?.name }}
                </div>
              </q-card-section>

              <!-- <q-card-actions align="right">
              <q-btn
                label="Sửa"
                color="primary"
                @click="storeAccountManagement.editAccount(item)"
              />

              <q-dialog v-model="storeAccountManagement.showDeleteDialog">
                <q-card style="min-width: 400px; max-width: 500px">
                  <q-card-section>
                    <div class="text-h6">Xác nhận</div>
                    <div>Bạn có chắc chắn muốn xóa tài khoản này không?</div>
                  </q-card-section>

                  <q-card-actions align="right">
                    <q-btn
                      flat
                      label="Xóa"
                      color="red"
                      @click="
                        storeAccountManagement.deleteUser(
                          storeAccountManagement.deleteObject.id,
                          storeAccountManagement.deleteObject.user_id
                        )
                      "
                    />
                    <q-btn
                      label="Hủy"
                      color="primary"
                      @click="storeAccountManagement.showDeleteDialog = false"
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>
            </q-card-actions> -->
            </q-card>

            <q-dialog v-model="storeAccountManagement.showDeleteDialog">
              <q-card style="min-width: 400px; max-width: 500px">
                <q-card-section>
                  <div class="text-h6">Xác nhận</div>
                  <div>Bạn có chắc chắn muốn xóa tài khoản này không?</div>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn
                    flat
                    label="Xóa"
                    color="red"
                    @click="
                      storeAccountManagement.deleteUser(
                        storeAccountManagement.deleteObject.id,
                        storeAccountManagement.deleteObject.user_id
                      )
                    "
                  />
                  <q-btn
                    label="Hủy"
                    color="primary"
                    @click="storeAccountManagement.showDeleteDialog = false"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </div>
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
    </div>

    <q-dialog v-model="storeAccountManagement.isShowCreateDialog">
      <q-card style="min-width: 400px; max-width: 500px">
        <q-card-section>
          <div class="text-h6">Tạo tài khoản mới</div>
        </q-card-section>
        <q-form
          @submit="
            storeAccountManagement.newAccount.role === 'user'
              ? storeAccountManagement.createAccount(
                  storeAccountManagement.newAccount.email,
                  storeAccountManagement.newAccount.password,
                  storeAccountManagement.newAccount.displayName,
                  storeAccountManagement.newAccount.role,
                  storeAccountManagement.newAccount.site.id,
                  storeAccountManagement.defaultStatusId
                )
              : storeAccountManagement.createAccount(
                  storeAccountManagement.newAccount.email,
                  storeAccountManagement.newAccount.password,
                  storeAccountManagement.newAccount.displayName,
                  storeAccountManagement.newAccount.role
                )
          "
          class="q-gutter-md"
        >
          <q-card-section>
            <q-tabs v-model="tab" class="text-teal">
              <q-tab
                name="user"
                icon="eva-person-outline"
                label="Nhân viên"
                @click="storeAccountManagement.newAccount.role = 'user'"
              />
              <q-tab
                name="admin"
                icon="support_agent"
                label="Quản lý"
                @click="storeAccountManagement.newAccount.role = 'admin'"
              />
            </q-tabs>

            <q-tab-panels v-model="tab" animated>
              <!-- user add session -->
              <q-tab-panel name="user">
                <div>
                  <q-input
                    v-model="storeAccountManagement.newAccount.email"
                    label="Email"
                    :rules="[(val) => !!val || 'Không được để rỗng']"
                    outlined
                    @input="
                      storeAccountManagement.newAccount.email =
                        $event.toLowerCase()
                    "
                    dense
                  >
                    <template v-slot:append>
                      <span class="text-subtitle1">@gmail.com</span>
                    </template>
                  </q-input>

                  <q-input
                    v-model="storeAccountManagement.newAccount.password"
                    label="Mật khẩu"
                    :type="showPassword ? 'text' : 'password'"
                    :rules="[
                      (val) => !!val || 'Không được để rỗng',
                      (val) => val.length > 5 || 'Mật khẩu tối thiểu 6 ký tự',
                    ]"
                    outlined
                    dense
                  >
                    <template v-slot:append>
                      <q-icon
                        :name="showPassword ? 'visibility' : 'visibility_off'"
                        class="cursor-pointer"
                        @click="togglePassword"
                      />
                    </template>
                  </q-input>

                  <q-input
                    v-model="storeAccountManagement.newAccount.displayName"
                    label="Tên hiển thị"
                    :rules="[(val) => !!val || 'Không được để rỗng']"
                    outlined
                    dense
                  />

                  <q-select
                    v-model="storeAccountManagement.newAccount.site"
                    :options="storeAccountManagement.listSite"
                    option-label="name"
                    option-value="id"
                    label="Site"
                    outlined
                    class="q-mb-md"
                    dense
                  />
                </div>
              </q-tab-panel>

              <!-- admin add session -->
              <q-tab-panel name="admin">
                <div>
                  <q-input
                    v-model="storeAccountManagement.newAccount.email"
                    label="Email"
                    :rules="[(val) => !!val || 'Không được để rỗng']"
                    outlined
                    @input="
                      storeAccountManagement.newAccount.email =
                        $event.toLowerCase()
                    "
                    dense
                  >
                    <template v-slot:append>
                      <span class="text-subtitle1">@gmail.com</span>
                    </template>
                  </q-input>

                  <q-input
                    v-model="storeAccountManagement.newAccount.password"
                    label="Mật khẩu"
                    :type="showPassword ? 'text' : 'password'"
                    :rules="[
                      (val) => !!val || 'Không được để rỗng',
                      (val) => val.length > 5 || 'Mật khẩu tối thiểu 6 ký tự',
                    ]"
                    outlined
                    dense
                  >
                    <template v-slot:append>
                      <q-icon
                        :name="showPassword ? 'visibility' : 'visibility_off'"
                        class="cursor-pointer"
                        @click="togglePassword"
                      />
                    </template>
                  </q-input>

                  <q-input
                    v-model="storeAccountManagement.newAccount.displayName"
                    label="Tên hiển thị"
                    :rules="[(val) => !!val || 'Không được để rỗng']"
                    outlined
                    dense
                  />
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Trở về" color="primary" v-close-popup />
            <q-btn
              type="submit"
              label="Tạo"
              color="primary"
              @click="createAccount"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog class="t-default" v-model="storeAccountManagement.isShowEditDialog">
      <q-card style="min-width: 90vw">
        <q-card-section>
          <div class="text-h6 text-bold t-default">Cập nhật tài khoản</div>
        </q-card-section>

        <q-form
          @submit="
            storeAccountManagement.postUpdateAccount(
              storeAccountManagement.selectedAccount
            )
          "
          class="q-gutter-md"
        >
          <div>
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
                @update:model-value="
                  storeAccountManagement.selectedAccount.isChangeStatus = true
                "
              />

              <div
                v-if="
                  storeAccountManagement.selectedAccount.status.name ===
                    'off' &&
                  storeAccountManagement.selectedAccount.isChangeStatus
                "
              >
                <q-input
                  v-model="storeAccountManagement.selectedAccount.dayoff_from"
                  label="Ngày bắt đầu nghỉ"
                  dense
                  outlined
                  type="date"
                  :rules="[validateDateRangeFrom]"
                />

                <q-input
                  v-model="storeAccountManagement.selectedAccount.dayoff_to"
                  label="Nghỉ đến ngày"
                  dense
                  outlined
                  type="date"
                  :rules="[validateDateRange]"
                />
              </div>

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
              <q-btn label="Lưu" color="positive" type="submit" />
            </q-card-actions>
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<style lang="scss" scoped>
.my-card {
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
  }
}
</style>
