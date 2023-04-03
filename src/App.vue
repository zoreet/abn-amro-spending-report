<template>
  <v-app>
    <v-app-bar app color="secondary" dark>
      <div class="d-flex align-center">ABN Amro Spending Report</div>
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main>
      <div class="mb-12 px-4" v-if="hasDataLoaded">
        <div class="mt-6 mb-12">
          <h3>Stats</h3>
          <ul>
            <li>
              <b>{{ transactions.length }}</b> transactions between
              <b>{{ reportDateRange.startDate | date }}</b> and
              <b>{{ reportDateRange.endDate | date }}</b>
              ( {{ reportDateRange.months }}
              <template v-if="reportDateRange.months == 1">month</template>
              <template v-else>months</template>
              )
            </li>
            <li>Spent: {{ totalSpent | price }}</li>
            <li>Earned: {{ totalEarned | price }}</li>
            <li>
              Net Total: {{ totalNet | price }}
              <span v-if="totalNet > 0">🚀🌛</span>
              <span v-else>😞</span>
            </li>
            <!-- <li></li> -->
          </ul>
          <!-- {{ report.startDate }} - {{ {{ report.endDate }} }} -->
        </div>
        <v-tabs
          v-model="activeTab"
          background-color="primary accent-4 mt-6 rounded-t"
        >
          <v-tab>Categories</v-tab>
          <v-tab>All transaction</v-tab>
        </v-tabs>
        <!-- Categories -->
        <div v-if="activeTab == 0" class="active-page rounded-b">
          <div class="px-4">
            <v-text-field
              v-model="categoriesSearch"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </div>
          <v-data-table
            :headers="headersForCategoriesTable"
            :items="transactionsGroupedByCategory"
            :single-expand="singleExpand"
            :expanded.sync="expanded"
            :items-per-page="transactionsGroupedByCategory.length"
            :search="categoriesSearch"
            sort-by="ammount"
            item-key="category"
            show-expand
            hide-default-footer
          >
            <template v-slot:header.category="{ header }">
              {{ header.text }}
              <div class="header-summary">
                {{ transactionsGroupedByCategory.length }} categories
              </div>
            </template>
            <template v-slot:header.ammount="{ header }">
              {{ header.text }}
              <div class="header-summary">Total {{ totalSpent | price }}</div>
            </template>
            <template v-slot:header.permonth="{ header }">
              {{ header.text }}
              <div class="header-summary">
                Avg {{ (totalSpent / reportDateRange.months) | price }}
              </div>
            </template>
            <template v-slot:item.category="{ item }">
              <b>{{ item.category }}</b
              >&nbsp;
              <span class="category-length"
                >{{
                  transactionCategories[item.category].length
                }}
                transactions</span
              >
            </template>
            <template v-slot:item.ammount="{ item }">
              {{ item.ammount | price }}
            </template>
            <template v-slot:item.percent="{ item }">
              {{ (item.ammount / totalSpent) | percent }}
            </template>
            <template v-slot:item.permonth="{ item }">
              {{ (item.ammount / reportDateRange.months) | price }}
            </template>
            <template v-slot:expanded-item="{ headers, item }">
              <td :colspan="headers.length" class="pa-12 grey darken-4">
                <h2 class="mb-2">Transactions grouped by merchant</h2>
                <v-data-table
                  :headers="headersForMerchantTable"
                  :items="
                    groupTransactionsByMerchant(
                      transactionCategories[item.category]
                    )
                  "
                  :items-per-page="10000"
                  sort-by="ammount"
                  hide-default-footer
                  class="rounded"
                  ref="table"
                >
                  <template v-slot:item.category="{ item }">
                    {{ item.category }}
                  </template>
                  <template v-slot:item.ammount="{ item }">
                    {{ item.ammount | price }}
                  </template>
                  <template v-slot:item.date="{ item }">
                    {{ item.date | date }}
                  </template>
                  <template v-slot:item.percent="{ item }">
                    {{ item.percent | percent }}
                  </template>
                  <template v-slot:item.percent="{ item }">
                    {{ item.percent | percent }}
                  </template>
                  <template v-slot:item.permonth="{ item }">
                    {{ (item.ammount / reportDateRange.months) | price }}
                  </template>
                </v-data-table>
                <h2 class="mt-6 mb-2">
                  All transactions in {{ item.category }}
                </h2>
                <v-data-table
                  :headers="headersForCategorySubtable"
                  :items="transactionCategories[item.category]"
                  :items-per-page="transactionCategories[item.category].length"
                  sort-by="ammount"
                  hide-default-footer
                  class="rounded"
                  ref="table"
                >
                  <template v-slot:item.ammount="{ item }">
                    {{ item.ammount | price }}
                  </template>
                  <template v-slot:item.permonth="{ item }">
                    {{ (item.ammount / reportDateRange.months) | price }}
                  </template>
                  <template v-slot:item.date="{ item }">
                    <span class="nowrap">{{ item.date | date }}</span>
                  </template>
                </v-data-table>
              </td>
            </template>
          </v-data-table>
        </div>
        <!-- All Transactions -->
        <div v-else-if="activeTab == 1" class="active-page pa-6">
          <v-text-field
            v-model="categoriesSearch"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
          ></v-text-field>
          <v-data-table
            :headers="headersForAllTransactions"
            :items="transactions"
            :items-per-page="transactions.length"
            :search="categoriesSearch"
            sort-by="ammount"
            item-key="index"
            hide-default-footer
          >
            <template v-slot:item.date="{ item }">
              {{ item.date | date }}
            </template>
          </v-data-table>
        </div>
      </div>
      <div v-else>Loading...</div>
    </v-main>
  </v-app>
</template>

<script>
import codes from "./codes.js";

export default {
  name: "App",

  components: {},

  data: () => ({
    hasDataLoaded: false,
    activeTab: 0,
    singleExpand: false,
    expanded: [],
    transactions: [],
    allDataFiles: [],
    categoriesSearch: "",
    headersForCategoriesTable: [
      { text: "Category", value: "category" },
      { text: "Ammount", value: "ammount" },
      { text: "Month", value: "permonth" },
      { text: "Percent", value: "percent" },
    ],
    headersForMerchantTable: [
      { text: "Merchant", value: "merchant" },
      { text: "Ammount", value: "ammount" },
      { text: "Percent", value: "percent" },
      { text: "Month", value: "permonth" },
    ],
    headersForCategorySubtable: [
      { text: "merchant", value: "merchant" },
      { text: "ammount", value: "ammount" },
      { text: "date", value: "date" },
      { text: "source", value: "source" },
      { text: "Raw", value: "raw" },
    ],
    headersForAllTransactions: [
      { text: "Category", value: "category" },
      { text: "Merchant", value: "merchant" },
      { text: "Ammount", value: "ammount" },
      { text: "Date", value: "date" },
      { text: "Source", value: "source" },
      { text: "Raw", value: "raw" },
    ],
  }),

  computed: {
    totalEarned() {
      return this.transactions.reduce((prev, current) => {
        if (current && current.ammount > 0) {
          return prev + current.ammount;
        }

        return prev;
      }, 0);
    },
    totalSpent() {
      return this.transactions.reduce((prev, current) => {
        if (current && current.ammount < 0) {
          return prev + current.ammount;
        }

        return prev;
      }, 0);
    },
    totalNet() {
      return this.totalSpent + this.totalEarned;
    },
    transactionCategories() {
      let result = {};

      this.transactions.forEach((t) => {
        if (!result[t.category]) {
          result[t.category] = [];
        }
        result[t.category].push(t);
      });

      return result;
    },
    transactionsGroupedByCategory() {
      let result = [];
      Object.keys(this.transactionCategories).forEach((category) => {
        let ammount = this.getTotalForCategory(
          this.transactionCategories[category]
        );

        result.push({
          category: category,
          ammount: ammount,
        });
      });

      return result;
    },
    reportDateRange() {
      const startDate = this.transactions[0].date;
      const endDate = [...this.transactions].pop().date;

      const monthDiff = endDate.getMonth() - startDate.getMonth();
      const yearDiff = endDate.getYear() - startDate.getYear();
      const months = monthDiff + yearDiff * 12;

      return {
        startDate,
        endDate,
        months,
      };
    },
  },

  mounted() {
    //load all data
    this.allDataFiles = require.context("./data", true, /./, "sync").keys();
    this.allDataFiles.forEach((fileName) => {
      console.log("loading", fileName);
      if (fileName.includes(".TAB")) {
        this.transactions = [
          ...this.transactions,
          ...this.processAbnAmroDebitReport(
            require(`raw-loader!./data${fileName.substring(1)}`).default
          ),
        ];
      } else if (fileName.includes(".txt")) {
        this.transactions = [
          ...this.transactions,
          ...this.processAbnAmroCreditReport(
            require(`raw-loader!./data${fileName.substring(1)}`).default,
            fileName
          ),
        ];
      }
    });

    this.transactions = [...this.transactions].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    this.hasDataLoaded = this.transactions.length ? true : false;
  },
  filters: {
    price(number) {
      let result = Math.round(number * 100) / 100;
      result = result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return "€" + result;
    },
    percent(number) {
      return Math.round(number * 1000) / 10 + "%";
    },
    date(date) {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      if (typeof date !== "object") {
        return "!! Invalid date" + date;
      }

      return (
        date.getDate() +
        " " +
        months[date.getMonth()] +
        " " +
        date.getFullYear()
      );
    },
  },
  watch: {
    activeTab() {
      this.categoriesSearch = "";
    },
  },
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

          let date = new Date(
            columns[2].substring(0, 4) +
              "-" +
              columns[2].substring(4, 6) +
              "-" +
              columns[2].substring(6, 8)
          );

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

          let translateMonths = {
            jan: "january",
            feb: "february",
            mrt: "march",
            apr: "april",
            mei: "may",
            jun: "june",
            jul: "july",
            aug: "august",
            sep: "september",
            okt: "october",
            nov: "november",
            dec: "december",
          };

          let date = new Date(
            year +
              "-" +
              translateMonths[row.substring(3, 6)] +
              "-" +
              row.substring(0, 2)
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
            ammount: ammount,
            date: date,
            merchant: merchant,
            category: category,
            source: "creditcard",
            raw: row,
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
    groupTransactionsByMerchant(transactions) {
      let result = [];

      let total = 0;

      const transactionMerchants = {};
      transactions.forEach((t) => {
        if (t.ammount < 0) total += t.ammount;
        if (!transactionMerchants[t.merchant]) {
          transactionMerchants[t.merchant] = t.ammount;
        } else {
          transactionMerchants[t.merchant] += t.ammount;
        }
      });

      Object.keys(transactionMerchants).forEach((merchant) => {
        let ammount = transactionMerchants[merchant];

        result.push({
          merchant: merchant,
          ammount: Math.round(ammount),
          percent: ammount / total,
        });
      });

      return result;
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
    getMonthDiff(d1, d2) {
      var months;
      months = (d2.getFullYear() - d1.getFullYear()) * 12;
      months -= d1.getMonth();
      months += d2.getMonth();
      return months <= 0 ? 0 : months;
    },
    getTotalForCategory(data) {
      let totalInCategory = data.reduce((prev, current) => {
        if (prev) return prev + current.ammount;

        return current.ammount;
      }, 0);

      return Math.round(totalInCategory);
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
</style>