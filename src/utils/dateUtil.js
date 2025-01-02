// Create our number formatter for German currency.
const formatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  trailingZeroDisplay: "stripIfInteger",
});

// Function to parse date string in "DD/MM/YYYY HH:MM:SS" format
function parseDateString(dateString) {
  const [datePart, timePart] = dateString.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function formatDate(date) {
  const newDate = new Date(date);
  const hours = String(newDate.getHours()).padStart(2, "0");
  const minutes = String(newDate.getMinutes()).padStart(2, "0");
  const formattedTime = `${hours}:${minutes} ${newDate.toLocaleDateString(
    "en-GB"
  )}`;

  return formattedTime;
}

export const dateUtil = {
  formatter,
  parseDateString,
  formatDate,
};
