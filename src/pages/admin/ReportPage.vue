<script setup>
import { useReportStore } from "src/stores/admin/ReportStore";
import { onMounted, ref, watch } from "vue";
import Chart from "chart.js/auto";

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
            label: "Doanh thu ($)",
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
      type: "pie",
      data: {
        labels: listSite || [],
        datasets: [
          {
            data: listValue || [],
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#FF728E",
              "#FF8198",
              "#FF90A1",
              "#FFA0AA",
              "#FFAFB3",
              "#FFBFBB",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "right",
          },
        },
      },
    });
  } catch (err) {
    console.error("Internal Server Error: ", err);
  }
};

// Watch for data changes and update the charts
watch(
  () => storeReport.siteSelected, // Replace with the actual reactive variable for updates
  (val) => {
    if (val) {
      createPerUserChart(
        ["User A", "User B", "User C", "User D"],
        [1200, 950, 700, 1300]
      );
    }
  }
);

onMounted(async () => {
  await storeReport.getInit();
  createPerUserChart(
    ["User A", "User B", "User C", "User D"],
    [1200, 950, 700, 1300]
  );
  createPerSiteChart(storeReport.listSiteName, [4000, 3000, 2000]);
});
</script>

<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6 text-primary">Tổng kết doanh thu</div>
        <div class="text-subtitle2 text-grey-7">
          Tổng quan về doanh thu trên mỗi người dùng và site
        </div>
      </q-card-section>
    </q-card>

    <div class="flex justify-end q-pb-md" style="align-items: center">
      <q-btn icon="eva-calendar-outline" round>
        <q-popup-proxy
          @before-show="updateProxy"
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
              <div v-for="(item, index) in storeReport.listSite" :key="index">
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
  </q-page>
</template>

<style scoped>
canvas {
  max-width: 100%;
}
</style>
