// import { getMonthsBetween } from "../plugins/utils";

const globalMixin = {
  filters: {
    price(number) {
      let result = Math.round(number * 100) / 100;
      result = result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return "€" + result;
    },
    percent(number) {
      return Math.round(number * 1000) / 10 + "%";
    },
    yyyymmdd(rawDate) {
      const date = new Date(rawDate);

      let month = date.getMonth() + 1;
      if (month < 10) month = "0" + month;

      let day = date.getDate();
      if (day < 10) day = "0" + day;

      return `${date.getFullYear()}-${month}-${day}`;
    },
    prettyDate(rawDate) {
      const date = new Date(rawDate);

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
};

export default globalMixin;
