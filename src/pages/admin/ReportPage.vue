<script setup>
import { useReportStore } from "src/stores/admin/ReportStore";
import { onMounted, watch } from "vue";
import Chart from "chart.js/auto";
import { dateUtil } from "src/utils/dateUtil";

const storeReport = useReportStore();
let charts = {};

const createPerUserChart = (listUser, listValue) => {
  try {
    const revenuePerUserCanvas = document.getElementById("revenuePerUser");
    // Ensure the canvas exists before creating the chart
    if (!revenuePerUserCanvas) return;

    if (charts.revenuePerUser) charts.revenuePerUser.destroy();

    // Create Revenue Per User Chart
    charts.revenuePerUser = new Chart(revenuePerUserCanvas, {
      type: "bar",
      data: {
        labels: listUser || [],
        datasets: [
          {
            label: "Doanh thu theo người dùng ($)",
            data: listValue || [],
            backgroundColor: [
              "#42A5F5",
              "#66BB6A",
              "#FFA726",
              "#26C6DA",
              "#5DAEFF",
              "#71BDE8",
              "#87CBCC",
              "#9FD8AA",
              "#B5E28E",
              "#C8EB7C",
              "#D7F166",
            ],
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
      },
    });
  } catch (err) {
    console.error("Internal Server Error: ", err);
  }
};

const createPerSiteChart = (listSite, listValue) => {
  try {
    const revenuePerSiteCanvas = document.getElementById("revenuePerSite");

    // Ensure the canvas exists before creating the chart
    if (!revenuePerSiteCanvas) return;

    // Destroy existing charts to avoid duplication
    if (charts.revenuePerSite) charts.revenuePerSite.destroy();

    // Create Revenue Per Site Chart
    charts.revenuePerSite = new Chart(revenuePerSiteCanvas, {
      type: "bar",
      data: {
        labels: listSite || [],
        datasets: [
          {
            label: "Doanh thu theo site ($)",
            data: listValue || [],
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#FF728E",
              "#26C6DA",
              "#FFA726",
              "#FFA0AA",
              "#D7F166",
              "#5DAEFF",
            ],
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
      },
    });
  } catch (err) {
    console.error("Internal Server Error: ", err);
  }
};

async function createReportChart(val) {
  if (storeReport.isGetToday) {
    const today = val;
    storeReport.listOrder = await storeReport.getOrderList(today, today);

    await storeReport.handleShowDataSite();
    await storeReport.handleShowDataUser();
  } else {
    const fromDate = val.from;
    const toDate = val.to;
    storeReport.listOrder = await storeReport.getOrderList(fromDate, toDate);

    await storeReport.handleShowDataSite();
    await storeReport.handleShowDataUser();
  }

  createPerUserChart(storeReport.listUserName, storeReport.listUserValue);
  createPerSiteChart(storeReport.listSiteName, storeReport.listSiteValue);
}

async function initChart(val) {
  storeReport.listUser = await storeReport.getListUsersBaseOnSite(val.id);
  await storeReport.handleShowDataUser();

  createPerUserChart(storeReport.listUserName, storeReport.listUserValue);
}

async function initDataTab2(val) {
  const userResponse = await storeReport.getListUsersBaseOnSite(val.id);
  await storeReport.handleGetRevenueByUser(
    userResponse,
    storeReport.listOrder,
    storeReport.siteSelectedTextReport.id
  );
}

// Watch for data changes and update the charts
watch(
  () => storeReport.siteSelected, // Replace with the actual reactive variable for updates
  async (val) => {
    if (val) {
      initChart(val);
    }
  }
);

watch(
  () => storeReport.objectCallWatchAction,
  async (val) => {
    if (val) {
      createReportChart(val);
    }
  }
);

onMounted(async () => {
  storeReport.isLoadingMainScreen = true;
  await storeReport.getInit();
  createPerUserChart(storeReport.listUserName, storeReport.listUserValue);

  createPerSiteChart(storeReport.listSiteName, storeReport.listSiteValue);
  storeReport.isLoadingMainScreen = false;
});
</script>

<template>
  <q-page class="q-pa-md">
    <q-tabs v-model="storeReport.tab" class="text-teal">
      <q-tab
        @click="
          () => {
            initChart(storeReport.siteSelected);
            createReportChart(storeReport.objectCallWatchAction);
          }
        "
        name="chart"
        icon="eva-pie-chart-outline"
        label="Theo biểu đồ"
      />
      <q-tab
        @click="initDataTab2(storeReport.siteSelectedTextReport)"
        name="number"
        icon="format_list_numbered"
        label="Theo số liệu"
      />
    </q-tabs>

    <q-tab-panels v-model="storeReport.tab" animated>
      <q-tab-panel name="chart">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6 text-primary">Tổng kết doanh thu</div>
            <div class="text-subtitle2 text-grey-7">
              Tổng quan về doanh thu trên mỗi người dùng và site
            </div>
          </q-card-section>
        </q-card>

        <div
          v-if="storeReport.isLoadingMainScreen"
          style="height: 30vh"
          class="full-width flex column flex-center"
        >
          Đang tải <q-spinner-ios size="lg" color="blue" />
        </div>

        <div v-show="!storeReport.isLoadingMainScreen">
          <div class="flex justify-end q-pb-md" style="align-items: center">
            <q-badge
              v-if="storeReport.isGetToday"
              color="primary"
              text-color="{2:black}"
              :label="
                dateUtil.formatDateOnly(
                  storeReport.objectCallWatchAction?.length
                    ? storeReport.objectCallWatchAction
                    : new Date()
                )
              "
              outline
              class="q-pa-xs"
            />

            <div v-else>
              <q-badge
                color="primary"
                text-color="{2:black}"
                :label="
                  dateUtil.formatDateOnly(
                    storeReport.objectCallWatchAction.from
                  )
                "
                outline
                class="q-pa-xs"
              />
              <span class="t-default q-mx-sm">-</span>
              <q-badge
                color="primary"
                text-color="{2:black}"
                :label="
                  dateUtil.formatDateOnly(storeReport.objectCallWatchAction.to)
                "
                outline
                class="q-pa-xs"
              />
            </div>
          </div>

          <q-card flat bordered class="q-mb-md">
            <q-card-section class="flex justify-between">
              <div>
                <div class="text-h6">Doanh thu theo người dùng</div>
                <q-badge :label="storeReport.siteSelected.name" />
              </div>

              <q-icon name="store" size="md" class="t-default">
                <q-menu>
                  <q-list style="min-width: 100px">
                    <div
                      v-for="(item, index) in storeReport.listSite"
                      :key="index"
                    >
                      <q-item
                        :class="
                          storeReport.siteSelected.name === item.name
                            ? 'bg-default'
                            : ''
                        "
                        clickable
                        @click="storeReport.siteSelected = { ...item }"
                      >
                        <q-item-section>{{ item.name }}</q-item-section>
                      </q-item>
                      <q-separator />
                    </div>
                  </q-list>
                </q-menu>
              </q-icon>
            </q-card-section>
            <q-card-section>
              <canvas id="revenuePerUser"></canvas>
            </q-card-section>
          </q-card>

          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6">Doanh thu theo site</div>
            </q-card-section>
            <q-card-section>
              <canvas id="revenuePerSite"></canvas>
            </q-card-section>
          </q-card>
        </div>
      </q-tab-panel>

      <q-tab-panel name="number">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6 text-primary">Báo cáo số liệu doanh thu</div>
            <div class="text-subtitle2 text-grey-7">
              Thống kê chi tiết doanh thu theo từng người dùng và site
            </div>
          </q-card-section>
        </q-card>

        <div
          v-if="storeReport.isLoadingNumberTab"
          style="height: 30vh"
          class="full-width flex column flex-center"
        >
          Đang tải <q-spinner-ios size="lg" color="blue" />
        </div>

        <div v-show="!storeReport.isLoadingNumberTab" class="q-pb-md">
          <q-card flat bordered class="q-mb-md">
            <q-card-section class="flex justify-between">
              <div>
                <div class="text-h6">Doanh thu theo người dùng</div>
                <q-badge :label="storeReport.siteSelectedTextReport.name" />
              </div>

              <q-icon name="store" size="md" class="t-default">
                <q-menu>
                  <q-list style="min-width: 100px">
                    <div
                      v-for="(item, index) in storeReport.listSite"
                      :key="index"
                    >
                      <q-item
                        :class="
                          storeReport.siteSelectedTextReport.name === item.name
                            ? 'bg-default'
                            : ''
                        "
                        clickable
                        @click="
                          storeReport.siteSelectedTextReport = { ...item }
                        "
                      >
                        <q-item-section>{{ item.name }}</q-item-section>
                      </q-item>
                      <q-separator />
                    </div>
                  </q-list>
                </q-menu>
              </q-icon>
            </q-card-section>
            <q-card-section>
              <table class="q-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th class="text-left">Người dùng</th>
                    <th class="text-right">Doanh thu (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(user, index) in storeReport.revenueByUser"
                    :key="index"
                  >
                    <td>{{ index + 1 }}</td>
                    <td class="text-left">{{ user.name }}</td>
                    <td class="text-right">
                      {{ dateUtil.formatter.format(user.revenue) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </q-card-section>
          </q-card>

          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6">Doanh thu theo site</div>
            </q-card-section>
            <q-card-section>
              <table class="q-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th class="text-left">Site</th>
                    <th class="text-right">Doanh thu (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(site, index) in storeReport.revenueBySite"
                    :key="index"
                  >
                    <td>{{ index + 1 }}</td>
                    <td class="text-left">{{ site.name }}</td>
                    <td class="text-right">
                      {{ dateUtil.formatter.format(site.revenue) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </q-card-section>
          </q-card>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <q-page-sticky position="bottom-right" :offset="[18, 48]">
      <q-btn class="q-pa-sm" icon="eva-calendar-outline" round color="primary">
        <q-popup-proxy
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date v-model="storeReport.dateRange" range today-btn>
            <div class="row items-center justify-end q-gutter-sm">
              <q-btn label="Cancel" color="primary" flat v-close-popup />
              <q-btn
                label="OK"
                color="primary"
                flat
                @click="storeReport.getReport(storeReport.dateRange)"
                v-close-popup
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<style scoped>
canvas {
  max-width: 100%;
}
</style>
