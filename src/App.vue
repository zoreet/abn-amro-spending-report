<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">ABN Amro Spending Report</div>
    </v-app-bar>

    <v-main>
      <v-container class="mb-12" v-if="transactions.length">
        <h1>Expenses</h1>
        <v-tabs
          v-model="expensesTab"
          background-color="secondary accent-4 mt-6 rounded-t"
        >
          <v-tab>By Category</v-tab>
          <v-tab>By Merchant</v-tab>
        </v-tabs>
        <div v-if="expensesTab == 0" class="active-page rounded-b">
          <v-data-table
            :headers="headersForCategoriesTable"
            :items="transactionsGroupedByCategory"
            :single-expand="singleExpand"
            :expanded.sync="expanded"
            :items-per-page="transactionsGroupedByCategory.length"
            item-key="category"
            show-expand
            hide-default-footer
          >
            <template v-slot:expanded-item="{ headers, item }">
              <td :colspan="headers.length" class="pa-12 grey darken-4">
                <v-data-table
                  :headers="headersForCategorySubtable"
                  :items="transactionCategories[item.category]"
                  :items-per-page="transactionCategories[item.category].length"
                  hide-default-footer
                  class="rounded"
                ></v-data-table>
              </td>
            </template>
          </v-data-table>
        </div>
        <div v-else-if="expensesTab == 1" class="active-page pa-6">
          Merchant
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
      <pre
        >{{ allDataFiles.length }} file(s) found: {{ allDataFiles }}
output: {{ output }}
      </pre>
      <pre v-if="transactions.length">
found {{ transactions.length }} transaction(s)

totalEarned €{{ Math.round(totalEarned) }}
totalSpent €{{ Math.round(totalSpent) }}
net €{{ Math.round(totalEarned + totalSpent) }}
      </pre>
    </v-main>
  </v-app>
</template>

<script>
import codes from "./codes.js";

export default {
  name: "App",

  components: {},

  data: () => ({
    expensesTab: 0,
    singleExpand: false,
    expanded: [],
    transactions: [],
    allDataFiles: [],
    output: "",
    headersForCategoriesTable: [
      { text: "Category", value: "category" },
      { text: "Ammount", value: "ammount" },
    ],
    headersForCategorySubtable: [
      { text: "merchant", value: "merchant" },
      { text: "ammount", value: "ammount" },
      { text: "date", value: "date" },
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
        result.push({
          category: category,
          ammount: this.getTotalForCategory(
            this.transactionCategories[category]
          ),
        });
      });

      return result;
    },
  },

  mounted() {
    //load all data
    this.allDataFiles = require.context("./data", true, /./, "sync").keys();
    this.allDataFiles.forEach((fileName) => {
      this.output = `\nLoading ${fileName}`;
      this.transactions = this.processTxt(
        require(`raw-loader!./data${fileName.substring(1)}`).default
      );
    });
  },
  methods: {
    processTxt(rawTxtData) {
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
            merchant = "NO_MERCHANT_FOUND";
            category = "NO_CATEGORY_FOUND";
          }

          return {
            ammount: Number(columns[6].replace(/,/g, ".")),
            date: columns[2],
            merchant: merchant,
            category: category,
          };
        })
        .filter((row) => {
          return row.category !== "internal";
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

      // return Math.round((totalInCategory / this.totalSpent) * 10000) / 100;
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
}
</style>