export function timeDuration(startDate: Date, endDate: Date) {
  var timeDiff = Math.abs(startDate.getTime() - endDate.getTime())
  console.log(timeDiff)
  var seconds = Math.floor((timeDiff / 1000));
  var minutes = Math.floor(seconds / 60) % 60;
  var hours = Math.floor(seconds / 3600);
  if (hours == 0 && minutes == 0) {
    return seconds + " Sek."
  }
  if (hours == 0) {
    return minutes + " Min."
  }
  return hours + " Std. " + minutes + " min.";
}
