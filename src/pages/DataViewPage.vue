<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { Dialog, Loading, Notify } from "quasar";
import { useMainStore } from "src/stores/main-store";
import { QSpinnerIos } from "quasar";
import { useQuasar } from "quasar";

// import loadingVideo from "../assets/video/angry-cute.mp4";
import noData from "../assets/images/nodata.jpg";
import updateImg from "../assets/icons/update.png";
import deleteImg from "../assets/icons/delete.png";

const router = useRouter();
const username = localStorage.getItem("username");
const password = localStorage.getItem("password");
const loadingTable = ref(false);
const loadingSelect = ref(false);
const storeMain = useMainStore();

if (!username || !password) {
  router.push("/");
}

const $q = useQuasar();

const userData = ref([]);
const menuData = ref([]);
const optionsMenuData = ref([]);

const newData = ref({ umsatz: 0, notizen: "", menuSelected: [] });
const updateData = ref({ umsatz: 0, notizen: "", menuSelected: [] });

const showAddDialog = ref(false);
const showUpdateDialog = ref(false);
const showNotizen = ref(false);

/* Update state */
const showUpdateMenuList = ref(false);
const showAddMenuList = ref(false);

showAddMenuList;

const visibleCount = ref(3);

// Computed to get visible users
const visibleUsers = computed(() =>
  storeMain.listUserData.slice(0, visibleCount.value)
);

// Check if there are more users to show
const hasMoreUsers = computed(
  () => visibleCount.value < storeMain.listUserData.length
);

// Methods to show more or less users
const showMore = () => {
  visibleCount.value = storeMain.listUserData.length;
};

// Create our number formatter for German currency.
const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  trailingZeroDisplay: "stripIfInteger",
});

onMounted(async () => {
  await fetchData();
});

const showLess = () => {
  visibleCount.value = 3;
};

function showAction(grid) {
  $q.bottomSheet({
    message: "Hành động",
    grid,
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
      // console.log('Action chosen:', action.id)
      let listSelectedMenu;
      switch (action.id) {
        case "update":
          showUpdateDialog.value = true;
          updateData.value = userData.value.filter(
            (item) => item.id === grid
          )[0];

          listSelectedMenu =
            updateData.value.menu.length > 1
              ? updateData.value.menu.split(";")
              : updateData.value.menu;

          updateData.value.menu.length > 1
            ? (updateData.value.menuSelected = listSelectedMenu.map((item) => {
                return menuData.value.filter(
                  (menuItem) => item == menuItem.id
                )[0];
              }))
            : (updateData.value.menuSelected = menuData.value.filter(
                (menuItem) => updateData.value.menu == menuItem.id
              )[0]);
          break;

        case "delete":
          deleteData(grid);
          break;

        default:
          break;
      }
    })
    .onCancel(() => {
      // console.log('Dismissed')
    })
    .onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
}

const fetchData = async () => {
  try {
    //hàm này lên đầu để user không cần phải đợi load user data vẫn có thể thực hiện action khi app vừa render
    await fetchMenuData();
    loadingTable.value = true;
    loadingSelect.value = false;

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain;charset=utf-8");

    const raw = JSON.stringify({
      action: "fetchData",
      username,
      password,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(storeMain.urlEndPoint, requestOptions);

    const result = await response.json();

    if (result.success) {
      let dataResponse = result.data.userData || [];

      //assign and arranged in order from largest to smallest
      storeMain.listUserData =
        result.data.otherData.sort((a, b) => b.orderCount - a.orderCount) || [];

      // storeMain.listUserData.push({
      //   name: username,
      //   length: result.data.userData.length,
      // });

      //set status user
      storeMain.userStatus = result.data.userStatus;

      visibleUsers.value = computed(() =>
        storeMain.listUserData.slice(0, visibleCount.value)
      );
      hasMoreUsers.value = computed(
        () => visibleCount.value < storeMain.listUserData.length
      );

      userData.value = dataResponse
        .map((item) => {
          const newDate = parseDateString(item.datum);

          const hours = String(newDate.getHours()).padStart(2, "0");
          const minutes = String(newDate.getMinutes()).padStart(2, "0");
          // const seconds = String(newDate.getSeconds()).padStart(2, "0");
          const formattedTime = `${hours}:${minutes}`;

          return {
            id: item.id,
            benutzername: item.benutzername,
            umsatz: item.umsatz,
            notizen: item.notizen,
            menu: item.menu,
            datum: formattedTime,
          };
        })
        .filter((item) => item);

      /* handle menu item in main page */
      userData.value.forEach((_, index) => {
        const listSelectedMenu =
          userData.value[index].menu?.length > 1
            ? userData.value[index].menu.split(";")
            : userData.value[index].menu;

        userData.value[index].menu.length > 1
          ? (userData.value[index].menuSelected = listSelectedMenu.map(
              (item) => {
                return menuData.value.filter(
                  (menuItem) => item == menuItem.id
                )[0];
              }
            ))
          : (userData.value[index].menuSelected = menuData.value.filter(
              (menuItem) => userData.value[index].menu == menuItem.id
            ));
      });
      // loadingSelect.value = false;

      if (!userData.value.length) {
        userData.value = [];
        // loadingTable.value = false;
      }
    } else {
      alert("Failed to fetch data");
    }

    loadingTable.value = false;
  } catch (error) {
    console.error("Error fetching data:", error);
    loadingTable.value = false; // Ensure loading state is reset even in case of error
  }
};

// Function to parse date string in "DD/MM/YYYY HH:MM:SS" format
function parseDateString(dateString) {
  const [datePart, timePart] = dateString.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

const fetchMenuData = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain;charset=utf-8");

    const raw = JSON.stringify({
      action: "fetchMenuData",
      // username,
      // password,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const menuLocal = JSON.parse(localStorage.getItem("menuData"));

    if (!menuLocal) {
      const response = await fetch(storeMain.urlEndPoint, requestOptions);
      const result = await response.json();
      if (result.success) {
        menuData.value = result.data || [];

        if (menuData.value.length) {
          menuData.value = menuData.value.map((item) => ({
            id: item.id,
            label: item.service,
            value: parseFloat(item.price),
          }));

          menuData.value = menuData.value.map((item) => ({
            ...item,
            filterSearch: `${item.label}${formatter.format(item.value)}`,
          }));

          localStorage.setItem("menuData", JSON.stringify(menuData.value));
        }
      }
    } else {
      menuData.value = menuLocal;
    }
  } catch (error) {
    loadingSelect.value = false;
    console.error("Error fetching data:", error);
  }
};

const addData = async () => {
  try {
    const funcAddData = async () => {
      Loading.show({
        message: "Đang thêm mới dữ liệu...",
      });

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "text/plain;charset=utf-8");

      if (newData.value.menuSelected.length > 1) {
        newData.value.listSelectedId = newData.value.menuSelected.map(
          (item) => item.id
        );
      } else {
        newData.value.listSelectedId = newData.value.menuSelected[0].id;
      }

      if (newData.value.listSelectedId.length > 1) {
        newData.value.listSelectedId = newData.value.listSelectedId.join(";");
      } else {
        newData.value.listSelectedId = newData.value.listSelectedId + "";
      }

      const raw = JSON.stringify({
        action: "addData",
        username,
        password,
        data: newData.value,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(storeMain.urlEndPoint, requestOptions);

      const result = await response.json();

      if (result.success) {
        Notify.create({
          type: "positive",
          message: "Thêm mới thành công!",
          position: "top",
        });
        newData.value = { umsatz: 0, notizen: "", menuSelected: [] };
        showAddDialog.value = false;
        // fetchData();
      } else {
        alert("Failed to add data");
      }
      Loading.hide();
    };

    let items = [
      { label: "Serving", value: "serving", color: "green" },
      { label: "Waiting", value: "waiting", color: "yellow" },
      { label: "Off", value: "off", color: "red" },
    ];

    items = items.filter((item) => item.value !== storeMain.userStatus);

    $q.dialog({
      title: "Thông báo",
      message: "Bạn có muốn thay đổi trạng thái sau khi thêm không?",
      options: {
        type: "radio",
        model: "opt1",
        // inline: true
        items,
      },
      cancel: true,
      persistent: true,
    })
      .onOk(async (data) => {
        if (data != "opt1") {
          await funcAddData();
          fetchData();
          storeMain.updateUserStatus(data);
        } else {
          await funcAddData();
          fetchData();
        }
      })

      .onCancel(() => {})
      .onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      });
  } catch (error) {
    console.error("Error adding data:", error);
    Loading.hide(); // Ensure loading state is reset even in case of error
  }
};

const deleteData = async (rowId) => {
  try {
    Dialog.create({
      title: "Xác nhận",
      message: "Bạn có chắc chắn muốn xóa hàng này không?",
      ok: true,
      cancel: true,
    }).onOk(async () => {
      Loading.show({
        message: "Đang xóa dữ liệu...",
      });

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "text/plain;charset=utf-8");

      const raw = JSON.stringify({
        action: "deleteData",
        username,
        password,
        id: rowId,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(storeMain.urlEndPoint, requestOptions);

      const result = await response.json();

      if (result.success) {
        Notify.create({
          type: "positive",
          message: "Xóa thành công!",
          position: "top",
        });
        fetchData();
      } else {
        alert("Failed to delete data");
      }
      Loading.hide();
    });
  } catch (error) {
    console.error("Error deleting data:", error);
    Loading.hide(); // Ensure loading state is reset even in case of error
  }
};
// eslint-disable-next-line no-unused-vars
const postUpdateItem = async (rowId, value) => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain;charset=utf-8");

    if (updateData.value.menuSelected.length > 1) {
      updateData.value.listSelectedId = updateData.value.menuSelected.map(
        (item) => item.id
      );
    } else {
      updateData.value.listSelectedId = updateData.value.menuSelected[0].id;
    }

    if (updateData.value.listSelectedId.length > 1) {
      updateData.value.listSelectedId =
        updateData.value.listSelectedId.join(";");
    } else {
      updateData.value.listSelectedId = updateData.value.listSelectedId + "";
    }

    const raw = JSON.stringify({
      action: "updateData",
      username,
      password,
      id: rowId,
      // valueChange: value,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(storeMain.urlEndPoint, requestOptions);

    const result = await response.json();

    if (result.success) {
      console.log("Data updated successfully");
    } else {
      alert("Error when updating data");
    }
  } catch (error) {
    console.error("Error updating data:", error);
  }
};

const removeUpdateMenuItem = (id) => {
  let total = 0;

  updateData.value.menuSelected = updateData.value.menuSelected.filter(
    (item) => {
      if (item.id !== id) {
        total += +item.value;
        return item;
      }
    }
  );
  updateData.value.umsatz = total;

  updateData.value.umsatz === 0 ? (showUpdateMenuList.value = false) : [];
};

const removeAddMenuItem = (id) => {
  let total = 0;

  newData.value.menuSelected = newData.value.menuSelected.filter((item) => {
    if (item.id !== id) {
      total += +item.value;
      return item;
    }
  });

  newData.value.umsatz = total;

  newData.value.umsatz === 0 ? (showAddMenuList.value = false) : [];
};

// Access slide items by ref
const slideItems = ref([]);

function onRightSlide(itemId, index) {
  // Perform the remove action
  removeAddMenuItem(itemId);

  // Reset the q-slide-item after performing the action
  const slideItem = slideItems.value[index];
  if (slideItem) {
    slideItem.reset();
  }
}

const filterFn = (val, update) => {
  if (val === "") {
    update(() => {
      optionsMenuData.value = menuData.value;

      // here you have access to "ref" which
      // is the Vue reference of the QSelect
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    optionsMenuData.value = menuData.value.filter(
      (v) => v.filterSearch.toLowerCase().indexOf(needle) > -1
    );
  });
};

const getColor = (status) => {
  switch (status) {
    case "serving":
      return "green-3";
    case "waiting":
      return "yellow-3";
    case "off":
      return "red-3";
    default:
      return "primary";
  }
};
</script>

<template>
  <q-page class="q-pa-sm">
    <!-- Display User Badges -->
    <div v-if="!loadingTable" class="q-my-sm">
      <q-btn
        v-for="user in visibleUsers"
        :key="user.benutzername"
        color="grey-6"
        class="q-mx-xs q-pa-sm q-my-xs"
        outline
        size="md"
        style="min-width: 100px"
      >
        <q-icon
          name="circle"
          :color="getColor(user.status)"
          size="xs"
          class="q-mx-xs"
        />
        {{ user.name }} - {{ user.orderCount }}
      </q-btn>

      <q-btn
        v-if="hasMoreUsers"
        flat
        text-color="grey-4"
        label=""
        icon-right="unfold_more"
        class="q-ml-sm"
        @click="showMore"
      />
      <q-btn
        v-else
        flat
        label=""
        dense
        text-color="grey-4"
        icon-right="unfold_less"
        class="q-ml-sm"
        @click="showLess"
      />
    </div>

    <div
      v-if="loadingTable"
      style="height: 30vh"
      class="full-width flex column flex-center"
    >
      Đang tải <q-spinner-ios size="lg" color="blue" />
    </div>

    <q-list class="q-mt-md" v-else>
      <div v-if="userData.length">
        <q-card
          v-for="(item, index) in userData"
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
            </div>

            <div class="flex flex-center">
              <!-- <video
                v-if="loadingSelect"
                autoplay
                loop
                muted
                width="50"
                height="50"
                :src="loadingVideo"
              ></video> -->

              <q-icon
                name="more_vert"
                size="sm"
                :color="loadingSelect ? 'grey-3' : 'grey-5'"
                @click="!loadingSelect ? showAction(item.id) : []"
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
              <span class="text-blue text-h4">{{
                formatter.format(item.umsatz)
              }}</span>
            </div>

            <q-list v-if="item.showQList" class="q-mb-md" bordered separator>
              <q-item v-for="(menu, index) in item.menuSelected" :key="index">
                <q-item-section>
                  <div class="flex justify-between" style="align-items: center">
                    <div class="flex justify-between full-width">
                      <div class="text-grey-7">
                        {{ menu.label }}
                      </div>
                      <div class="text-grey text-bold">
                        {{ formatter.format(menu.value) }}
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
    </q-list>

    <q-page-sticky position="bottom-right" :offset="[18, 48]">
      <q-btn
        icon="add"
        color="green-7"
        class="q-pa-md"
        round
        @click="showAddDialog = true"
      />
    </q-page-sticky>

    <q-dialog
      :maximized="showAddDialog"
      class="full-width full-height"
      v-model="showAddDialog"
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
            @click="showAddDialog = false"
          >
            <span class="text-subtitle1">Quay lại</span>
          </q-btn>

          <div class="float-bottom text-h6" style="right: 5%">
            <span class="text-bold">Tổng cộng:</span>
            {{ formatter.format(newData.umsatz) }}
          </div>
        </div>
        <q-card-section>
          <q-form class="q-gutter-md q-py-lg flex column" @submit="addData">
            <span class="text-subtitle1">Chọn dịch vụ</span>
            <q-select
              :rules="[(val) => !!val || 'Field is required']"
              v-model="newData.menuSelected"
              :options="optionsMenuData"
              option-label="label"
              option-value="id"
              outlined
              multiple
              use-input
              @filter="filterFn"
              input-debounce="300"
              @update:model-value="
                newData.umsatz = newData.menuSelected
                  .map((item) => item.value)
                  .reduce((acc, current) => acc + current, 0)
              "
              :disable="loadingSelect"
              hide-selected
            >
              <template v-slot:selected>
                <!-- <div>
                  Already checked
                  <span class="text-bold">{{
                    newData.menuSelected.length
                  }}</span>
                  items
                </div> -->
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
                        formatter.format(scope.opt.value)
                      }}</span></q-item-label
                    >
                  </q-item-section>

                  <q-item-section side>
                    <div class="flex justify-end full-width">
                      <q-toggle
                        v-model="scope.selected"
                        color="green"
                        @click="
                          () => {
                            let listIdSelected = newData.menuSelected.map(
                              (item) => item.id
                            );

                            listIdSelected.includes(scope.opt.id)
                              ? (newData.menuSelected =
                                  newData.menuSelected.filter((item) => {
                                    if (item.id !== scope.opt.id) {
                                      return item;
                                    }
                                  }))
                              : newData.menuSelected.push(scope.opt);
                          }
                        "
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <span v-if="newData.menuSelected?.length" class="text-subtitle1"
              >Dịch vụ đã chọn</span
            >
            <q-list v-if="newData.menuSelected?.length" bordered separator>
              <q-slide-item
                v-for="(item, index) in newData.menuSelected"
                :key="index"
                ref="slideItems"
                @right="onRightSlide(item.id, index)"
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
                      <div class="flex justify-between full-width">
                        <div class="text-grey-7">
                          {{ item.label }}
                        </div>
                        <div class="text-blue text-bold">
                          {{ formatter.format(item.value) }}
                        </div>
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-slide-item>
            </q-list>
            <!-- notizen -->
            <div
              v-if="!showNotizen"
              @click="showNotizen = true"
              class="flex flex-center text-blue"
            >
              <q-icon name="add" size="sm" rounded />Hiện ghi chú
            </div>

            <q-input
              v-if="showNotizen"
              v-model="newData.notizen"
              label="Thêm ghi chú"
              outlined
            />

            <div
              v-if="showNotizen"
              @click="showNotizen = false"
              class="flex flex-center text-blue"
            >
              <q-icon name="remove" size="sm" rounded />Ẩn ghi chú
            </div>

            <q-btn
              label="Lưu dữ liệu"
              type="submit"
              color="green-7"
              icon="add"
              class="q-py-sm"
              push
            />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog :maximized="showUpdateDialog" v-model="showUpdateDialog">
      <q-card class="full-width full-height">
        <div
          class="flex justify-between q-py-md q-pr-md bg-white z-max"
          style="position: sticky; top: 0"
        >
          <q-btn
            icon="eva-arrow-ios-back-outline"
            class="text-blue"
            flat
            @click="showUpdateDialog = false"
          >
            <span class="text-subtitle1">Quay lại</span>
          </q-btn>

          <div class="float-bottom text-h6" style="right: 5%">
            <span class="text-bold">Tổng cộng:</span>
            {{ formatter.format(updateData.umsatz) }}
          </div>
        </div>
        <q-card-section>
          <q-form
            class="q-gutter-md q-py-lg flex column"
            @submit="postUpdateItem"
          >
            <span class="text-subtitle1">Chọn dịch vụ</span>
            <q-select
              :rules="[(val) => !!val || 'Field is required']"
              v-model="updateData.menuSelected"
              :options="optionsMenuData"
              option-label="label"
              option-value="id"
              outlined
              multiple
              use-input
              @filter="filterFn"
              input-debounce="300"
              @update:model-value="
                updateData.umsatz = updateData.menuSelected
                  .map((item) => item.value)
                  .reduce((acc, current) => acc + current, 0)
              "
              :disable="loadingSelect"
              hide-selected
            >
              <template v-slot:selected>
                <!-- <div>
                  Already checked
                  <span class="text-bold">{{
                    updateData.menuSelected?.length
                  }}</span>
                  items
                </div> -->
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
                        formatter.format(scope.opt.value)
                      }}</span></q-item-label
                    >
                  </q-item-section>

                  <q-item-section side>
                    <div class="flex justify-end full-width">
                      <q-toggle
                        v-model="scope.selected"
                        color="green"
                        @click="
                          () => {
                            let listIdSelected = updateData.menuSelected.map(
                              (item) => item.id
                            );

                            listIdSelected.includes(scope.index)
                              ? (updateData.menuSelected =
                                  updateData.menuSelected.filter((item) => {
                                    console.log(item);
                                    console.log(scope);
                                    if (item.index !== scope.index) {
                                      console.log(item);
                                    }
                                  }))
                              : '';
                          }
                        "
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <span v-if="updateData.menuSelected?.length" class="text-subtitle1"
              >Dịch vụ đã chọn</span
            >
            <q-list v-if="updateData.menuSelected?.length" bordered separator>
              <q-slide-item
                v-for="(item, index) in updateData.menuSelected"
                :key="index"
                ref="slideItems"
                @right="onRightSlide(item.id, index)"
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
                      <div class="flex justify-between full-width">
                        <div class="text-grey-7">
                          {{ item.label }}
                        </div>
                        <div class="text-blue text-bold">
                          {{ formatter.format(item.value) }}
                        </div>
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-slide-item>
            </q-list>
            <!-- notizen -->
            <div
              v-if="!showNotizen"
              @click="showNotizen = true"
              class="flex flex-center text-blue"
            >
              <q-icon name="add" size="sm" rounded />Hiện ghi chú
            </div>

            <q-input
              v-if="showNotizen"
              v-model="updateData.notizen"
              label="Thêm ghi chú"
              outlined
            />

            <div
              v-if="showNotizen"
              @click="showNotizen = false"
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
