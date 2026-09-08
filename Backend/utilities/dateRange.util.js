const AppError = require("./appError.util");

const isValidDateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const parseDateValue = (value, field) => {
  if (isValidDateOnly(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(`Invalid ${field}`, 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid ${field}`, 400);
  }

  return date;
};

const parseDateRange = (fromDate, toDate) => {
  if (!fromDate && !toDate) return null;

  const range = {};

  if (fromDate) range.$gte = parseDateValue(fromDate, "fromDate");
  if (toDate) {
    if (isValidDateOnly(toDate)) {
      range.$lte = new Date(`${toDate}T23:59:59.999Z`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      throw new AppError("Invalid toDate", 400);
    } else {
      range.$lte = parseDateValue(toDate, "toDate");
    }
  }

  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    throw new AppError("fromDate cannot be after toDate", 400);
  }

  return range;
};

module.exports = { isValidDateOnly, parseDateRange, parseDateValue };
