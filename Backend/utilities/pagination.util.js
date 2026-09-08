const AppError = require("./appError.util");
const logger = require("./logger.util");

const parsePositiveInt = (value, defaultValue, max) => {
  if (value === undefined) return defaultValue;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || (max && parsed > max)) {
    return null;
  }

  return parsed;
};

const getPaginatedResults = async (Model, req, getFilter, options = {}) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 10, 100);

  if (page === null) {
    throw new AppError("Page must be a positive integer", 400);
  }

  if (limit === null) {
    throw new AppError("Limit must be between 1 and 100", 400);
  }

  const filter = await getFilter(req);
  const requestedSort = req.query.sort || options.defaultSort || "createdAt";
  const allowedSortFields = options.allowedSortFields || ["createdAt"];
  const requestedOrder = req.query.order || options.defaultOrder || "asc";

  if (!allowedSortFields.includes(requestedSort)) {
    throw new AppError(
      `Invalid sort field. Allowed fields: ${allowedSortFields.join(", ")}`,
      400,
    );
  }

  if (!["asc", "desc"].includes(requestedOrder)) {
    throw new AppError("Order must be 'asc' or 'desc'", 400);
  }

  const order = requestedOrder === "desc" ? -1 : 1;
  const skip = (page - 1) * limit;

  let query = Model.find(filter)
    .sort({ [requestedSort]: order })
    .skip(skip)
    .limit(limit);

  if (options.select) {
    query = query.select(options.select);
  }

  if (Array.isArray(options.populate)) {
    options.populate.forEach((populateOption) => {
      query = query.populate(populateOption);
    });
  }

  const [results, total] = await Promise.all([
    query.exec(),
    Model.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  logger.debug(
    `Pagination executed | model:${Model.modelName} | page:${page} | limit:${limit} | total:${total} | totalPages:${totalPages} | sort:${requestedSort} | order:${requestedOrder}`,
  );

  return {
    page,
    limit,
    total,
    totalPages,
    results,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  };
};

module.exports = { getPaginatedResults };
