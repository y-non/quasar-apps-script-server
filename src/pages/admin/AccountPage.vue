<script setup>
import { onMounted, ref } from "vue";
import { useAccountManagementStore } from "src/stores/admin/AccountManagementStore";

import noData from "../../assets/images/nodata.jpg";
import { dateUtil } from "src/utils/dateUtil";
import { Dialog } from "quasar";

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
            <!-- <q-btn
              class="t-default bg-default"
              label="Tất cả các shop"
              rounded
              flat
            /> -->

            <q-btn-dropdown
              label="Chọn Site"
              class="t-default bg-default"
              rounded
            >
              <!-- :label="storeAccountManagement.selectSite.name" -->
              <q-list>
                <q-item
                  v-for="(site, index) in storeAccountManagement.listSelectSite"
                  :key="index"
                  clickable
                  v-close-popup
                  @click="storeAccountManagement.onChangeSite(site)"
                >
                  <q-item-section>
                    <q-item-label>{{ site.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <q-btn-dropdown
              label="Chọn quyền"
              class="t-default bg-default q-ml-md"
              rounded
            >
              <!-- :label="storeAccountManagement.selectRole.label" -->
              <q-list>
                <q-item
                  v-for="(role, index) in storeAccountManagement.listRoleSelect"
                  :key="index"
                  clickable
                  v-close-popup
                  @click="storeAccountManagement.onChangeRole(role)"
                >
                  <q-item-section>
                    <q-item-label>{{ role.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
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
                  <div class="flex" style="align-items: center">
                    <div class="text-h6 text-bold">{{ item.display_name }}</div>
                  </div>

                  <div>
                    <q-icon
                      v-if="item.disable"
                      name="lock_open"
                      size="sm"
                      class="q-mr-sm"
                    />

                    <q-icon
                      v-if="item.role === 'user'"
                      name="eva-more-vertical-outline"
                      size="sm"
                      @click="storeAccountManagement.editAccount(item)"
                    />
                  </div>
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
                  {{ item.site?.name ? item.site?.name : "none" }}
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

    <q-dialog
      transition-show="slide-left"
      transition-hide="slide-right"
      :maximized="storeAccountManagement.isShowCreateDialog"
      v-model="storeAccountManagement.isShowCreateDialog"
    >
      <q-card style="height: 100vh; width: 100vw">
        <q-card-section
          @click="storeAccountManagement.isShowCreateDialog = false"
          class="flex"
          style="align-items: center"
        >
          <q-icon
            name="eva-arrow-ios-back-outline"
            size="sm"
            class="t-default"
          />
          <div class="text-h6 t-default">Thêm tài khoản</div>
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
            <q-tabs v-model="tab" class="t-default">
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
                  <div class="form-group">
                    <label class="t-default text-subtitle2" for=""
                      >Email đăng nhập</label
                    >
                    <q-input
                      v-model="storeAccountManagement.newAccount.email"
                      :rules="[(val) => !!val || 'Không được để rỗng']"
                      filled
                      @input="
                        storeAccountManagement.newAccount.email =
                          $event.toLowerCase()
                      "
                      class="t-default"
                    >
                      <template v-slot:append>
                        <span class="text-subtitle1">@gmail.com</span>
                      </template>
                    </q-input>
                  </div>

                  <div class="form-group">
                    <label class="t-default text-subtitle2" for=""
                      >Mật khẩu</label
                    >
                    <q-input
                      v-model="storeAccountManagement.newAccount.password"
                      :type="showPassword ? 'text' : 'password'"
                      :rules="[
                        (val) => !!val || 'Không được để rỗng',
                        (val) => val.length > 5 || 'Mật khẩu tối thiểu 6 ký tự',
                      ]"
                      filled
                    >
                      <template v-slot:append>
                        <q-icon
                          :name="showPassword ? 'visibility' : 'visibility_off'"
                          class="cursor-pointer"
                          @click="togglePassword"
                        />
                      </template>
                    </q-input>
                  </div>

                  <div class="form-group">
                    <label class="t-default text-subtitle2" for=""
                      >Tên hiển thị</label
                    >
                    <q-input
                      v-model="storeAccountManagement.newAccount.displayName"
                      :rules="[(val) => !!val || 'Không được để rỗng']"
                      filled
                    />
                  </div>

                  <div class="form-group">
                    <label class="t-default text-subtitle2" for="">Site</label>
                    <q-select
                      v-model="storeAccountManagement.newAccount.site"
                      :options="storeAccountManagement.listSite"
                      option-label="name"
                      option-value="id"
                      filled
                      class="q-mb-md"
                    />
                  </div>
                </div>
              </q-tab-panel>

              <!-- admin add session -->
              <q-tab-panel name="admin">
                <div>
                  <div class="form-group">
                    <label class="t-default text-subtitle2" for=""
                      >Email đăng nhập</label
                    >
                    <q-input
                      v-model="storeAccountManagement.newAccount.email"
                      :rules="[(val) => !!val || 'Không được để rỗng']"
                      filled
                      @input="
                        storeAccountManagement.newAccount.email =
                          $event.toLowerCase()
                      "
                    >
                      <template v-slot:append>
                        <span class="text-subtitle1">@gmail.com</span>
                      </template>
                    </q-input>
                  </div>

                  <div class="form-group">
                    <label class="t-default text-subtitle2" for=""
                      >Mật khẩu</label
                    >
                    <q-input
                      v-model="storeAccountManagement.newAccount.password"
                      :type="showPassword ? 'text' : 'password'"
                      :rules="[
                        (val) => !!val || 'Không được để rỗng',
                        (val) => val.length > 5 || 'Mật khẩu tối thiểu 6 ký tự',
                      ]"
                      filled
                    >
                      <template v-slot:append>
                        <q-icon
                          :name="showPassword ? 'visibility' : 'visibility_off'"
                          class="cursor-pointer"
                          @click="togglePassword"
                        />
                      </template>
                    </q-input>
                  </div>

                  <div class="form-groupt">
                    <label class="t-default text-subtitle2" for=""
                      >Tên hiển thị</label
                    >
                    <q-input
                      v-model="storeAccountManagement.newAccount.displayName"
                      :rules="[(val) => !!val || 'Không được để rỗng']"
                      filled
                    />
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>

          <q-card-actions align="center">
            <q-btn
              label="Trở về"
              class="t-default q-my-md q-py-sm text-capitalize text-bold q-mx-md"
              flat
              style="padding: 0.7em 2em"
              @click="storeAccountManagement.isShowCreateDialog = false"
            />
            <q-btn
              type="submit"
              label="Thêm tài khoản"
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
      v-model="storeAccountManagement.isShowEditDialog"
      :maximized="storeAccountManagement.isShowEditDialog"
      transition-show="slide-left"
      transition-hide="slide-right"
    >
      <q-card style="min-width: 90vw">
        <q-card-section
          @click="storeAccountManagement.isShowEditDialog = false"
          class="flex"
          style="align-items: center"
        >
          <q-icon
            name="eva-arrow-ios-back-outline"
            size="sm"
            class="t-default"
          />
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

              <div class="form-group">
                <label class="t-default text-subtitle2" for=""
                  >Tên hiển thị</label
                >
                <q-input
                  v-model="storeAccountManagement.selectedAccount.display_name"
                  filled
                  class="q-mb-md t-default"
                />
              </div>

              <!-- Role -->
              <!-- <q-input
          v-model="storeAccountManagement.selectedAccount.role"
          label="Phân quyền"
          outlined
          dense
          class="q-mb-md"
          placeholder="Vui lòng chọn phân quyền"
        /> -->

              <div class="form-group">
                <label class="t-default text-subtitle2" for="">Quyền</label>
                <q-select
                  v-model="storeAccountManagement.selectedAccount.role"
                  :options="storeAccountManagement.listRole"
                  option-label="label"
                  option-value="id"
                  filled
                  class="q-mb-md t-default"
                  placeholder="Vui lòng chọn phân quyền"
                />
              </div>

              <!-- Status -->
              <div class="form-group">
                <label class="t-default text-subtitle2" for=""
                  >Trạng thái</label
                >
                <q-select
                  v-model="storeAccountManagement.selectedAccount.status"
                  :options="storeAccountManagement.listStatus"
                  option-label="name"
                  option-value="id"
                  filled
                  class="q-mb-md"
                  placeholder="Vui lòng chọn trạng thái"
                  @update:model-value="
                    storeAccountManagement.selectedAccount.isChangeStatus = true
                  "
                />
              </div>

              <div
                v-if="
                  storeAccountManagement.selectedAccount.status?.name ===
                    'off' &&
                  storeAccountManagement.selectedAccount.isChangeStatus
                "
              >
                <div class="form-group">
                  <label class="t-default text-subtitle2" for=""
                    >Ngày bắt đầu nghỉ</label
                  >
                  <q-input
                    v-model="storeAccountManagement.selectedAccount.dayoff_from"
                    filled
                    type="date"
                    :rules="[validateDateRangeFrom]"
                  />
                </div>

                <div class="form-group">
                  <label class="t-default text-subtitle2" for=""
                    >Nghỉ đến ngày</label
                  >
                  <q-input
                    v-model="storeAccountManagement.selectedAccount.dayoff_to"
                    filled
                    type="date"
                    :rules="[validateDateRange]"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="t-default text-subtitle2" for="">Site</label>
                <q-select
                  v-model="storeAccountManagement.selectedAccount.site"
                  :options="storeAccountManagement.listSite"
                  option-label="name"
                  option-value="id"
                  class="q-mb-md"
                  filled
                />
              </div>

              <div class="form-group">
                <label class="t-default text-subtitle2" for=""
                  >Phương thức</label
                >
                <q-input
                  v-model="storeAccountManagement.selectedAccount.provider"
                  filled
                  class="q-mb-md"
                  readonly
                />
              </div>

              <!-- Creation Date (readonly) -->

              <div class="form-group">
                <label class="t-default text-subtitle2" for="">Ngày tạo</label>
                <q-input
                  :placeholder="`${new Date(
                    storeAccountManagement.selectedAccount.created_at
                  ).toLocaleDateString('vi-VN')}`"
                  filled
                  readonly
                  class="q-mb-md"
                />
              </div>

              <q-checkbox
                right-label
                v-model="storeAccountManagement.selectedAccount.disable"
                label="Vô hiệu hóa tài khoản"
              />
            </q-card-section>

            <q-card-actions align="center">
              <q-btn
                label="Trở về"
                class="t-default q-my-md q-py-sm text-capitalize text-bold q-mx-md"
                flat
                style="padding: 0.7em 2em"
                @click="storeAccountManagement.isShowEditDialog = false"
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
