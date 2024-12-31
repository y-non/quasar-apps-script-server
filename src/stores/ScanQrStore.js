import { defineStore } from "pinia";
import { Notify } from "quasar";

export const useScanQrStore = defineStore("scan-qr", {
  state: () => ({}),
  actions: {
    /**
     * @name scanData
     * @description main scan QR function in index page
     * @param {*} detectedCodes
     */
    async scanData(detectedCodes) {
      try {
        console.log(detectedCodes);

        Notify.create({
          message: "Đang quét mã QR..." + detectedCodes[0].rawValue,
          color: "info",
          position: "bottom",
        });
        const result = this.onDetectDataScan(detectedCodes);

        this.handleGetData(result);

        if (result) {
          Notify.create({
            message: "Quét mã QR thành công",
            color: "positive",
            position: "bottom",
          });
          this.isShowDialog = false;
        } else {
          Notify.create({
            message: "Quét mã QR không thành công",
            color: "negative",
            position: "bottom",
          });
        }
      } catch (err) {
        console.error("Internal Server Error scanDataIndexPage(): ", err);
      }
    },

    /**
     * @name onDetectDataScan
     * @description this func used for get data from QrCode after scan will return value
     * @param {*} detectedCodes
     * @returns
     */
    async onDetectDataScan(detectedCodes) {
      try {
        return detectedCodes[0].rawValue;
      } catch (err) {
        console.error("Internal Server Error onDetectDataScan(): ", err);
      }
    },
  },
});
