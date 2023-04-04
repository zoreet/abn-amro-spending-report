<template>
  <div class="active-page pa-6">
    <v-text-field
      v-model="searchTerm"
      append-icon="mdi-magnify"
      label="Search"
      single-line
      hide-details
    ></v-text-field>
    <v-data-table
      :headers="headersForAllTransactions"
      :items="transactions"
      :items-per-page="transactions.length"
      :search="searchTerm"
      sort-by="ammount"
      item-key="index"
      hide-default-footer
    >
      <template v-slot:item.date="{ item }">
        <div class="date">{{ item.date | prettyDate }}</div>
      </template>
      <template v-slot:item.merchant="{ item }">
        <div class="merchant">{{ item.merchant }}</div>
      </template>
    </v-data-table>
  </div>
</template>

<script>
export default {
  name: "AllTransactions",
  props: {
    transactions: Array,
  },
  data: () => ({
    searchTerm: "",
    headersForAllTransactions: [
      { text: "Category", value: "category" },
      { text: "Merchant", value: "merchant" },
      { text: "Ammount", value: "ammount" },
      { text: "Date", value: "date" },
      { text: "Source", value: "source" },
      { text: "Raw", value: "raw" },
    ],
  }),
};
</script>

<style scoped>
.date {
  white-space: nowrap;
}
.merchant {
  white-space: nowrap;
  max-width: 20vw;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>