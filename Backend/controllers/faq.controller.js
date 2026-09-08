const mongoose = require("mongoose");

const FAQ = require("../models/faq.model");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { getPaginatedResults } = require("../utilities/pagination.util");

const normalizeString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const findFAQOrFail = async (id) => {
  if (!isValidObjectId(id)) {
    throw new AppError("Invalid FAQ id", 400);
  }

  const faq = await FAQ.findOne({ _id: id, isDeleted: { $ne: true } });

  if (!faq) {
    throw new AppError("FAQ not found", 404);
  }

  return faq;
};

exports.getActiveFAQsFilter = async () => {
  return {
    isActive: true,
    isDeleted: { $ne: true },
  };
};

exports.getAllFAQsFilter = async (req) => {
  const filter = {};

  if (req.query.isDeleted === "true") {
    filter.isDeleted = true;
  } else if (req.query.isDeleted === "false") {
    filter.isDeleted = false;
  } else {
    filter.isDeleted = false;
  }

  if (req.query.isActive === "true" || req.query.isActive === "false") {
    filter.isActive = req.query.isActive === "true";
  }

  return filter;
};

exports.getActiveFAQsHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(FAQ, req, exports.getActiveFAQsFilter, {
      defaultSort: "createdAt",
      allowedSortFields: ["createdAt"],
      defaultOrder: "desc",
    });

  res.status(200).json({
    message: "FAQs list",
    count: results.length,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    data: results,
  });
});

exports.getAllFAQsHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(FAQ, req, exports.getAllFAQsFilter, {
      defaultSort: "createdAt",
      allowedSortFields: ["createdAt"],
      defaultOrder: "desc",
    });

  res.status(200).json({
    message: "FAQs list",
    count: results.length,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    data: results,
  });
});

exports.getFAQById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {

    return next(new AppError("Invalid FAQ id", 400));
  }

  const faq = await FAQ.findOne({
    _id: id,
    isActive: true,
    isDeleted: { $ne: true },
  });

  if (!faq) {

    return next(new AppError("FAQ not found", 404));
  }

  res.status(200).json({
    message: "FAQ found",
    data: faq,
  });
});

exports.getFAQByIdAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {

    return next(new AppError("Invalid FAQ id", 400));
  }

  const faq = await FAQ.findById(id);

  if (!faq) {

    return next(new AppError("FAQ not found", 404));
  }

  res.status(200).json({
    message: "FAQ found",
    data: faq,
  });
});

exports.createFAQ = catchAsync(async (req, res, next) => {
  const question = normalizeString(req.body.question);
  const answer = normalizeString(req.body.answer);

  if (!question) {

    return next(new AppError("Question is required", 400));
  }

  if (question.length < 5) {
    return next(
      new AppError("Question must be at least 5 characters", 400)
    );
  }

  if (question.length > 300) {
    return next(
      new AppError("Question cannot exceed 300 characters", 400)
    );
  }

  if (!answer) {

    return next(new AppError("Answer is required", 400));
  }

  if (answer.length < 2) {
    return next(new AppError("Answer must be at least 2 characters", 400));
  }

  if (answer.length > 2000) {
    return next(
      new AppError("Answer cannot exceed 2000 characters", 400)
    );
  }

  const faq = await FAQ.create({
    question,
    answer,
    isActive: true,
  });

  res.status(201).json({
    message: "FAQ created successfully",
    data: faq,
  });
});

exports.updateFAQ = catchAsync(async (req, res, next) => {
  const faq = await findFAQOrFail(req.params.id);

  if (faq.isDeleted) {
    return next(new AppError("Deleted FAQ cannot be updated", 400));
  }

  const hasQuestion = req.body.question !== undefined;
  const hasAnswer = req.body.answer !== undefined;

  if (!hasQuestion && !hasAnswer) {
    return next(
      new AppError("Provide at least one field to update", 400)
    );
  }

  if (hasQuestion) {
    const question = normalizeString(req.body.question);

    if (!question) {
      return next(new AppError("Question cannot be empty", 400));
    }

    if (question.length < 5) {
      return next(
        new AppError("Question must be at least 5 characters", 400)
      );
    }

    if (question.length > 300) {
      return next(
        new AppError("Question cannot exceed 300 characters", 400)
      );
    }

    faq.question = question;
  }

  if (hasAnswer) {
    const answer = normalizeString(req.body.answer);

    if (!answer) {
      return next(new AppError("Answer cannot be empty", 400));
    }

    if (answer.length < 2) {
      return next(
        new AppError("Answer must be at least 2 characters", 400)
      );
    }

    if (answer.length > 2000) {
      return next(
        new AppError("Answer cannot exceed 2000 characters", 400)
      );
    }

    faq.answer = answer;
  }

  await faq.save();

  res.status(200).json({
    message: "FAQ updated successfully",
    data: faq,
  });
});

exports.deactivateFAQ = catchAsync(async (req, res, next) => {
  const faq = await findFAQOrFail(req.params.id);

  if (faq.isDeleted) {
    return next(new AppError("Deleted FAQ cannot be activated or deactivated", 400));
  }

  if (!faq.isActive) {
    return res.status(200).json({
      message: "FAQ is already inactive",
      data: faq,
    });
  }

  faq.isActive = false;

  await faq.save();

  res.status(200).json({
    message: "FAQ deactivated successfully",
    data: faq,
  });
});

exports.deleteFAQ = catchAsync(async (req, res, next) => {
  const faq = await findFAQOrFail(req.params.id);

  if (faq.isDeleted) {
    return res.status(200).json({
      message: "FAQ is already deleted",
      data: faq,
    });
  }

  faq.isDeleted = true;
  faq.isActive = false;

  await faq.save();

  res.status(200).json({
    message: "FAQ deleted successfully",
    data: faq,
  });
});

exports.restoreFAQ = catchAsync(async (req, res, next) => {
  const faq = await FAQ.findById(req.params.id);

  if (!faq) {
    return next(new AppError("FAQ not found", 404));
  }

  if (!faq.isDeleted) {
    return res.status(200).json({
      message: "FAQ is already active in the list",
      data: faq,
    });
  }

  faq.isDeleted = false;
  faq.isActive = true;

  await faq.save();

  res.status(200).json({
    message: "FAQ restored successfully",
    data: faq,
  });
});

exports.activateFAQ = catchAsync(async (req, res, next) => {
  const faq = await findFAQOrFail(req.params.id);

  if (faq.isDeleted) {
    return next(new AppError("Deleted FAQ cannot be activated or deactivated", 400));
  }

  if (faq.isActive) {
    return res.status(200).json({
      message: "FAQ is already active",
      data: faq,
    });
  }

  faq.isActive = true;

  await faq.save();

  res.status(200).json({
    message: "FAQ activated successfully",
    data: faq,
  });
});
