<template>
  <div class="mt-6 mb-12">
    <h3>Stats</h3>
    <ul>
      <li>
        <b>{{ transactions.length }}</b> transactions
        <span>
          (
          {{ months }}
          <template v-if="months == 1">month</template>
          <template v-else>months</template>
          )
        </span>
      </li>
      <li>Earned: {{ totalEarned | price }}</li>
      <li>Spent: {{ totalSpent | price }}</li>
      <li>
        Net Total: {{ totalNet | price }}
        <span v-if="totalNet > 0">🚀🌛</span>
        <span v-else>😞</span>
      </li>
    </ul>
  </div>
</template>

<script>
import { getMonthsBetween } from "../plugins/utils.js";

export default {
  name: "Stats",
  props: {
    transactions: Array,
    startDate: String,
    endDate: String,
  },
  computed: {
    months() {
      return getMonthsBetween(this.startDate, this.endDate);
    },
    totalEarned() {
      return this.transactions.reduce((prev, current) => {
        if (current && current.ammount > 0) {
          return prev + current.ammount;
        }

        return prev;
      }, 0);
    },
    totalSpent() {
      return (
        -1 *
        this.transactions.reduce((prev, current) => {
          if (current && current.ammount < 0) {
            return prev + current.ammount;
          }

          return prev;
        }, 0)
      );
    },
    totalNet() {
      return this.totalEarned - this.totalSpent;
    },
  },
};
</script>

<style>
</style>