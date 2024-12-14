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

export const dateUtil = {
  formatter,
  parseDateString,
};
