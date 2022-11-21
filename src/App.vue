<template>
  <v-app>
    <v-app-bar app color="secondary" dark>
      <div class="d-flex align-center">ABN Amro Spending Report</div>
    </v-app-bar>

    <v-main>
      <v-container class="mb-12" v-if="transactions.length">
        <h1>Expenses</h1>
        <v-tabs
          v-model="expensesTab"
          background-color="primary accent-4 mt-6 rounded-t"
        >
          <v-tab>By Category</v-tab>
          <v-tab>By Merchant</v-tab>
        </v-tabs>
        <div v-if="expensesTab == 0" class="active-page rounded-b">
          <div class="px-4">
            <v-text-field
              v-model="expensesSearch"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </div>
          <v-data-table
            :headers="headersForCategoriesTable"
            :items="expensesByCategory"
            :single-expand="singleExpand"
            :expanded.sync="expanded"
            :items-per-page="expensesByCategory.length"
            :search="expensesSearch"
            sort-by="ammount"
            item-key="category"
            show-expand
            hide-default-footer
          >
            <template v-slot:header.category="{ header }">
              {{ header.text }}
              <div class="header-summary">
                {{ expensesByCategory.length }} categories
              </div>
            </template>
            <template v-slot:header.ammount="{ header }">
              {{ header.text }}
              <div class="header-summary">Total {{ totalSpent | price }}</div>
            </template>
            <template v-slot:item.ammount="{ item }">
              {{ item.ammount | price }}
            </template>
            <template v-slot:item.percent="{ item }">
              {{ (item.ammount / totalSpent) | percent }}
            </template>
            <template v-slot:expanded-item="{ headers, item }">
              <td :colspan="headers.length" class="pa-12 grey darken-4">
                <v-data-table
                  :headers="headersForCategorySubtable"
                  :items="transactionCategories[item.category]"
                  :items-per-page="transactionCategories[item.category].length"
                  sort-by="ammount"
                  hide-default-footer
                  class="rounded"
                >
                  <template v-slot:item.ammount="{ item }">
                    {{ item.ammount | price }}
                  </template>
                  <template v-slot:item.date="{ item }">
                    {{ item.date | date }}
                  </template>
                </v-data-table>
              </td>
            </template>
          </v-data-table>
        </div>
        <div v-else-if="expensesTab == 1" class="active-page pa-6">
          <v-data-table
            :headers="headersForMerchantTable"
            :items="expensesByMerchant"
            :single-expand="singleExpand"
            :expanded.sync="expanded"
            :items-per-page="expensesByMerchant.length"
            sort-by="ammount"
            item-key="merchant"
            show-expand
            hide-default-footer
          >
            <template v-slot:expanded-item="{ headers, item }">
              <td :colspan="headers.length" class="pa-12 grey darken-4">
                <v-data-table
                  :headers="headersForCategorySubtable"
                  :items="transactionMerchants[item.merchant]"
                  :items-per-page="transactionMerchants[item.merchant].length"
                  sort-by="ammount"
                  hide-default-footer
                  class="rounded"
                ></v-data-table>
              </td>
            </template>
          </v-data-table>
        </div>
      </v-container>
      <div v-else>Loading...</div>
      <!-- <h1>Categories</h1>
      <v-data-table
        :headers="headersForCategoriesTable"
        :items="transactionsGroupedByCategory"
        :single-expand="singleExpand"
        :expanded.sync="expanded"
        item-key="category"
        show-expand
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Expandable Table</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-switch
              v-model="singleExpand"
              label="Single expand"
              class="mt-2"
            ></v-switch>
          </v-toolbar>
        </template>
        <template v-slot:expanded-item="{ headers, item }">
          <td :colspan="headers.length">
            <v-data-table
              :headers="headersForCategorySubtable"
              :items="transactionCategories[item.category]"
            ></v-data-table>
          </td>
        </template>
      </v-data-table> -->
      <!-- <v-expansion-panels accordion>
        <v-expansion-panel
          v-for="(categoryData, categoryName) in transactionCategories"
          :key="categoryName"
        >
          <v-expansion-panel-header
            >{{ categoryName }}
            {{ getTotalForCategory(categoryData) }}</v-expansion-panel-header
          >
          <v-expansion-panel-content>
            <v-data-table
              :headers="headers"
              :items="categoryData"
            ></v-data-table>
            <pre>{{ categoryData }}</pre>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels> -->
    </v-main>
  </v-app>
</template>

<script>
import codes from "./codes.js";

export default {
  name: "App",

  components: {},

  data: () => ({
    reportDuration: 18, //months
    expensesTab: 0,
    singleExpand: false,
    expanded: [],
    transactions: [],
    allDataFiles: [],
    expensesSearch: "",
    headersForCategoriesTable: [
      { text: "Category", value: "category" },
      { text: "Ammount", value: "ammount" },
      { text: "Percent", value: "percent" },
    ],
    headersForMerchantTable: [
      { text: "Merchant", value: "merchant" },
      { text: "Ammount", value: "ammount" },
      { text: "Percent", value: "percent" },
    ],
    headersForCategorySubtable: [
      { text: "merchant", value: "merchant" },
      { text: "ammount", value: "ammount" },
      { text: "date", value: "date" },
      { text: "source", value: "source" },
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
      return this.expensesByCategory.reduce((prev, current) => {
        if (current && current.ammount < 0) {
          return prev + current.ammount;
        }

        return prev;
      }, 0);
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
    transactionMerchants() {
      let result = {};

      this.transactions.forEach((t) => {
        if (!result[t.merchant]) {
          result[t.merchant] = [];
        }
        result[t.merchant].push(t);
      });

      return result;
    },
    transactionsGroupedByMerchant() {
      let result = [];
      Object.keys(this.transactionMerchants).forEach((merchant) => {
        let ammount = this.getTotalForCategory(
          this.transactionMerchants[merchant]
        );

        result.push({
          merchant: merchant,
          ammount: ammount,
        });
      });

      return result;
    },
    expensesByCategory() {
      return this.transactionsGroupedByCategory.filter(
        (transaction) => transaction.ammount < 0
      );
    },
    expensesByMerchant() {
      return this.transactionsGroupedByMerchant.filter(
        (transaction) => transaction.ammount < 0
      );
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
      } else if (fileName.includes("creditcard")) {
        this.transactions = [
          ...this.transactions,
          ...this.processAbnAmroCreditReport(
            require(`raw-loader!./data${fileName.substring(1)}`).default
          ),
        ];
      }
    });
  },
  filters: {
    price(number) {
      return "€" + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
      return (
        date.getDate() +
        " " +
        months[date.getMonth()] +
        " " +
        date.getFullYear()
      );
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

          let transationInfo = this.findCode(columns[7]);
          let merchant;
          let category;

          if (transationInfo) {
            merchant = transationInfo.name || transationInfo.match;
            category = transationInfo.category;
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
          };
        })
        .filter((row) => {
          return (
            row.category !== "ignore" &&
            row.category !== "creditcard" &&
            row.merchant !== "Flatex Bank"
          );
        });
    },
    processAbnAmroCreditReport(rawTxtData) {
      return rawTxtData.split(/\r?\n/).map((row) => {
        let columns = row.split("\t");
        let transationInfo = this.findCode(columns[1]);
        let merchant;
        let category;
        let date = columns[0].split("/");
        date = new Date(`${date[2]}-${date[0]}-${date[1]}`);

        if (transationInfo) {
          merchant = transationInfo.name || transationInfo.match;
          category = transationInfo.category;
        } else {
          merchant = columns[1];
          category = "NO_CATEGORY_FOUND";
        }

        return {
          ammount: -1 * Number(columns[2].replace(/,/g, ".").replace(/€/g, "")),
          date: date,
          merchant: merchant,
          category: category,
          source: "creditcard",
        };
      });
    },
    findCode(input) {
      return codes.find(function (code) {
        if (typeof code.match === "string") {
          return input.toLowerCase().indexOf(code.match.toLowerCase()) !== -1;
        }

        return code.match.test(input);
      });
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
}

.header-summary {
  font-size: 12px;
  font-weight: 400;
  position: absolute;
  bottom: 12px;
}
</style>