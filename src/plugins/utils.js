// src/utils.js
const getTimeDiff = (date1, date2) => {
  const startDate = new Date(date1);
  const endDate = new Date(date2);

  return startDate.getTime() - endDate.getTime();
};

const getMonthsBetween = (date1, date2) => {
  /*
   * calcDate() : Calculates the difference between two dates
   * @date1 : "First Date in the format MM-DD-YYYY"
   * @date2 : "Second Date in the format MM-DD-YYYY"
   * return : Array
   */

  //new date instance
  const dt_date1 = new Date(date1);
  const dt_date2 = new Date(date2);

  //Get the Timestamp
  const date1_time_stamp = dt_date1.getTime();
  const date2_time_stamp = dt_date2.getTime();

  let calc;

  //Check which timestamp is greater
  if (date1_time_stamp > date2_time_stamp) {
    calc = new Date(date1_time_stamp - date2_time_stamp);
  } else {
    calc = new Date(date2_time_stamp - date1_time_stamp);
  }
  //Retrieve the date, month and year
  const calcFormatTmp =
    calc.getDate() + "-" + (calc.getMonth() + 1) + "-" + calc.getFullYear();
  //Convert to an array and store
  const calcFormat = calcFormatTmp.split("-");
  //Subtract each member of our array from the default date
  const days_passed = Number(Math.abs(calcFormat[0]) - 1);
  const months_passed = Number(Math.abs(calcFormat[1]) - 1);
  const years_passed = Number(Math.abs(calcFormat[2]) - 1970);

  const months =
    months_passed + years_passed * 12 + (days_passed >= 14 ? 1 : 0);

  return months;
};

export { getMonthsBetween, getTimeDiff };
