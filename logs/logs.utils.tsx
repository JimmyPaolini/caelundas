import moment from "npm:moment-timezone";

export function setupDates(args: { date?: Date; start?: Date; end?: Date }) {
  const { date, start, end } = args;

  const dateLabel = formatDate(date);
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);

  const daysTotal = moment(end).diff(moment(start), "days");
  const daysElapsed = moment(date).diff(moment(start), "days");
  const daysRemaining = moment(end).diff(moment(date), "days");
  const dateProgressPercent = (daysElapsed / daysTotal) * 100;
  const dateProgressPercentLabel = dateProgressPercent.toFixed(1);
  const dateProgressLabel = `${daysElapsed}/${daysTotal} | ${dateProgressPercentLabel}% `;

  return {
    dateLabel,
    dateProgressLabel,
    dateProgressPercent,
    daysTotal,
    daysRemaining,
    endLabel,
    startLabel,
  };
}

const formatDate = (date?: Date) => {
  if (!date) return "";

  const isStartOfDay =
    moment(date).hour() === 0 &&
    moment(date).minute() === 0 &&
    moment(date).second() === 0;

  const formattedDate = isStartOfDay
    ? moment(date).format("MMMM Do, YYYY")
    : moment(date).format("h:mm A, MMMM Do, YYYY");

  return formattedDate;
};
