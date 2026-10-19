// Dates are formatted on the server, which runs in UTC on Vercel. A fixed time
// zone keeps them stable (Tomorrow Industries is on Eastern time).
const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(d: Date | string) {
  return dateFormat.format(new Date(d));
}
