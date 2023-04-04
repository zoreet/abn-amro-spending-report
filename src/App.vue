<template>
  <v-app>
    <v-app-bar app color="secondary" dark>
      <div class="d-flex align-center">ABN Amro Spending Report</div>
      <v-spacer></v-spacer>
      <div>
        Report dates
        <input
          type="date"
          v-model="reportStartDate"
          :min="availableStartDate"
          :max="reportEndDate"
          class="date-picker"
        />
        -
        <input
          type="date"
          v-model="reportEndDate"
          :min="reportStartDate"
          :max="availableEndDate"
          class="date-picker"
        />
      </div>
    </v-app-bar>

    <v-main>
      <!-- <div>availableStartDate: {{ availableStartDate | prettyDate }}</div>
      <div>availableEndDate: {{ availableEndDate | prettyDate }}</div>
      <div>reportStartDate: {{ reportStartDate }}</div>
      <div>reportEndDate: {{ reportEndDate }}</div>
      <div>transactionsInDateRange: {{ transactionsInDateRange.length }}</div>
      <pre>{{ transactionsInDateRange }}</pre> -->
      <div class="mb-12 px-4" v-if="hasDataLoaded">
        <Stats
          :transactions="transactionsInDateRange"
          :start-date="reportStartDate"
          :end-date="reportEndDate"
        />
        <v-tabs
          v-model="activeTab"
          background-color="primary accent-4 mt-6 rounded-t"
        >
          <v-tab>All transaction</v-tab>
        </v-tabs>
        <AllTransactions
          v-if="activeTab == 0"
          :transactions="transactionsInDateRange"
        />
      </div>
      <div v-else>Loading...</div>
    </v-main>
  </v-app>
</template>

<script>
import codes from "./codes.js";
import Stats from "./components/Stats.vue";
import AllTransactions from "./components/AllTransactions.vue";

import { getTimeDiff } from "./plugins/utils.js";

export default {
  name: "App",

  components: {
    Stats,
    AllTransactions,
  },

  data: () => ({
    allTransactions: [],
    availableStartDate: "",
    availableEndDate: "",
    reportStartDate: "2022-01-01",
    reportEndDate: "2023-03-31",

    hasDataLoaded: false,
    activeTab: 0,
  }),

  computed: {
    transactionsInDateRange() {
      return this.allTransactions.filter((item) => {
        return (
          getTimeDiff(item.date, this.reportStartDate) >= 0 &&
          getTimeDiff(item.date, this.reportEndDate) <= 0
        );
      });
    },
  },

  mounted() {
    //load all data
    this.allDataFiles = require.context("./data", true, /./, "sync").keys();
    this.allDataFiles.forEach((fileName) => {
      console.log("loading", fileName);
      if (fileName.includes(".TAB")) {
        this.allTransactions = [
          ...this.allTransactions,
          ...this.processAbnAmroDebitReport(
            require(`raw-loader!./data${fileName.substring(1)}`).default
          ),
        ];
      } else if (fileName.includes(".txt")) {
        this.allTransactions = [
          ...this.allTransactions,
          ...this.processAbnAmroCreditReport(
            require(`raw-loader!./data${fileName.substring(1)}`).default,
            fileName
          ),
        ];
      }
    });

    this.allTransactions = [...this.allTransactions].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    if (this.allTransactions.length) {
      this.availableStartDate = this.allTransactions[0].date;
      this.availableEndDate = [...this.allTransactions].pop().date;

      if (!this.reportStartDate) {
        this.reportStartDate = this.$options.filters.yyyymmdd(
          this.availableStartDate
        );
      }
      if (!this.reportEndDate) {
        this.reportEndDate = this.$options.filters.yyyymmdd(
          this.availableEndDate
        );
      }

      this.hasDataLoaded = true;
    }
  },
  // watch: {
  //   activeTab() {
  //     this.categoriesSearch = "";
  //   },
  // },
  methods: {
    processAbnAmroDebitReport(rawTxtData) {
      return rawTxtData
        .split(/\r?\n/)
        .map((row) => {
          let columns = row.split("\t");

          if (columns.length < 7) {
            return {};
          }

          let transactionInfo = this.findCode(columns[7]);
          let merchant;
          let category;

          if (transactionInfo) {
            merchant = transactionInfo.name || transactionInfo.match;
            category = transactionInfo.category;
          } else {
            category = "NO_CATEGORY_FOUND";
            merchant = columns[7].substring(
              columns[7].indexOf("Naam: "),
              columns[7].length
            );
          }

          let date =
            columns[2].substring(0, 4) +
            "-" +
            columns[2].substring(4, 6) +
            "-" +
            columns[2].substring(6, 8);

          return {
            ammount: Number(columns[6].replace(/,/g, ".")),
            date: date,
            merchant: merchant,
            category: category,
            source: "debit",
            raw: row,
          };
        })
        .filter((row) => {
          return (
            row.ammount &&
            row.category !== "ignore" &&
            row.category !== "creditcard" &&
            row.merchant !== "Flatex Bank"
          );
        });
    },
    processAbnAmroCreditReport(rawTxtData, fileName) {
      return rawTxtData
        .split(/\r?\n/)
        .map((row) => {
          let year = fileName.match(/[0-9]+/g)[0];

          let date = this.$options.filters.yyyymmdd(
            year + "-" + row.substring(3, 6) + "-" + row.substring(0, 2)
          );

          let ammount = row.match(/[0-9]*\.*[0-9]+,[0-9]+/g).pop();
          ammount = ammount.replace(".", "");
          ammount = ammount.replace(",", ".");
          ammount = Number(ammount);

          if (row.endsWith(" Af")) ammount *= -1;

          let transactionInfo = this.findCode(row);
          let merchant;
          let category;

          if (transactionInfo) {
            merchant = transactionInfo.name || transactionInfo.match;
            category = transactionInfo.category;
          } else {
            category = "NO_CATEGORY_FOUND";
            merchant = row.substring(14, row.length);
          }

          return {
            ammount,
            date,
            merchant,
            category,
            raw: row,
            source: "creditcard",
          };
        })
        .filter((row) => {
          return (
            row.ammount &&
            !row.merchant.includes("IDEAL BETALING") &&
            row.category !== "ignore"
          );
        });
    },
    findCode(input) {
      //overrides
      if (input.includes("APPLE.COM/BILL ITUNES.COM IRL 109,99")) {
        return {
          name: "Squla",
          category: "kids activities",
        };
      }
      if (input.includes("APPLE.COM/BILL ITUNES.COM IRL 57,99")) {
        return {
          name: "Headspace",
          category: "healthcare",
        };
      }
      if (input.includes("APPLE.COM/BILL ITUNES.COM IRL 14,99")) {
        return {
          name: "Apple Music Family",
          category: "entertainment",
        };
      }
      if (input.includes("APPLE.COM/BILL ITUNES.COM IRL 8,99")) {
        return {
          name: "Disney+",
          category: "entertainment",
        };
      }

      return codes.find(function (code) {
        if (typeof code.match === "string") {
          return input.toLowerCase().indexOf(code.match.toLowerCase()) !== -1;
        }

        return code.match.test(input);
      });
    },
  },
};
</script>

<style lang="scss">
.active-page {
  border: 1px solid #045d56;
}

.v-tab.v-tab--active {
  border-bottom: 2px solid;
}

.v-data-table-header th {
  font-size: 16px !important;
  padding-bottom: 32px !important;
  padding-top: 12px !important;
  position: relative;
  white-space: nowrap;
}

.header-summary {
  font-size: 12px;
  font-weight: 400;
  position: absolute;
  bottom: 12px;
}

.category-length {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.7;
}

.nowrap {
  white-space: nowrap;
}

.date-picker {
  background: #fff;
  border-radius: 4px;
  padding: 0 4px;
}
</style>