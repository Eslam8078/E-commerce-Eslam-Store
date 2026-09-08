const mongoose = require("mongoose");
const SubCategory = require("../models/subCategory.model");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { getPaginatedResults } = require("../utilities/pagination.util");

const trimString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeSlug = (value) => trimString(value).toLowerCase();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getSubCategory = async (id) => SubCategory.findById(id);

const getActiveCategory = async (categoryId) => {
  if (!isValidObjectId(categoryId)) return null;
  return Category.findOne({ _id: categoryId, isActive: true, isDeleted: { $ne: true } });
};

const isNameTaken = async (name, categoryId, excludeId = null) => {
  const filter = { name, categoryId };
  if (excludeId) filter._id = { $ne: excludeId };
  return SubCategory.findOne(filter);
};

const isSlugTaken = async (slug, excludeId = null) => {
  const filter = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  return SubCategory.findOne(filter);
};

exports.getAllSubCategoriesFilter = async (req) => {
  const filter = { isDeleted: false, isActive: true };
  if (req.query.categoryId) {
    if (!isValidObjectId(req.query.categoryId)) {
      throw new AppError("Invalid category id", 400);
    }
    filter.categoryId = req.query.categoryId;
  }
  return filter;
};

exports.getAdminSubCategoriesFilter = async (req) => {
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

  if (req.query.categoryId) {
    if (!isValidObjectId(req.query.categoryId)) {
      throw new AppError("Invalid category id", 400);
    }
    filter.categoryId = req.query.categoryId;
  }

  return filter;
};

const getSubCategoriesPage = async (req, filterFunction) =>
  getPaginatedResults(SubCategory, req, filterFunction, {
    defaultSort: "createdAt",
    allowedSortFields: ["createdAt", "name"],
    populate: [{ path: "categoryId", select: "name slug" }],
  });

const sendSubCategoriesResponse = (res, pageData) => {
  const {
    results,
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = pageData;

  return res.status(200).json({
    message: "SubCategories list",
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
};

exports.getAllSubCategoriesHandler = catchAsync(async (req, res, next) => {
  const pageData = await getSubCategoriesPage(req, exports.getAllSubCategoriesFilter);

  return sendSubCategoriesResponse(res, pageData);
});

exports.getAdminSubCategoriesHandler = catchAsync(async (req, res, next) => {
  const pageData = await getSubCategoriesPage(req, exports.getAdminSubCategoriesFilter);

  return sendSubCategoriesResponse(res, pageData);
});

exports.getAdminSubCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return next(new AppError("Invalid subCategory id", 400));
  const subCategory = await SubCategory.findById(id).populate("categoryId", "name slug isActive isDeleted");
  if (!subCategory) return next(new AppError("SubCategory not found", 404));
  return res.status(200).json({ message: "SubCategory found", data: subCategory });
});

exports.getSubCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return next(new AppError("Invalid subCategory id", 400));

  const subCategory = await SubCategory.findOne({
    _id: id,
    isActive: true,
    isDeleted: { $ne: true },
  }).populate("categoryId", "name slug isActive");
  if (!subCategory) {
    return next(new AppError("SubCategory not found", 404));
  }

  if (!subCategory.categoryId || !subCategory.categoryId.isActive) {
    return next(new AppError("Category is not active", 404));
  }

  return res
    .status(200)
    .json({ message: "SubCategory found", data: subCategory });
});

exports.createSubCategory = catchAsync(async (req, res, next) => {
  const name = trimString(req.body.name);
  const slug = normalizeSlug(req.body.slug);
  const { categoryId } = req.body;

  if (!name || !slug || !categoryId) {
    return next(new AppError("Name, slug and categoryId are required", 400));
  }

  const category = await getActiveCategory(categoryId);
  if (!category) {
    return next(new AppError("Active category not found", 404));
  }

  const existingName = await isNameTaken(name, categoryId);
  if (existingName) {
    return next(
      new AppError("SubCategory already exists in this category", 409),
    );
  }

  const existingSlug = await isSlugTaken(slug);
  if (existingSlug) {
    return next(new AppError("SubCategory slug already exists", 409));
  }

  const subCategory = await SubCategory.create({
    name,
    slug,
    categoryId,
    isActive: true,
  });
  return res
    .status(201)
    .json({ message: "SubCategory created successfully", data: subCategory });
});

exports.updateSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id))
    return next(new AppError("Invalid subCategory id", 400));

  const subCategory = await getSubCategory(id);
  if (!subCategory) return next(new AppError("SubCategory not found", 404));
  if (subCategory.isDeleted) return next(new AppError("Deleted SubCategory cannot be updated", 400));

  const { name, slug, categoryId } = req.body;
  if (name === undefined && slug === undefined && categoryId === undefined) {
    return next(new AppError("Provide at least one field to update", 400));
  }

  const newName = name !== undefined ? trimString(name) : subCategory.name;
  if (name !== undefined && !newName) {
    return next(
      new AppError("SubCategory name must be a non-empty string", 400),
    );
  }

  const newCategoryId =
    categoryId !== undefined ? categoryId : String(subCategory.categoryId);
  if (categoryId !== undefined) {
    const category = await getActiveCategory(categoryId);
    if (!category) return next(new AppError("Active category not found", 404));
  }

  if (name !== undefined || categoryId !== undefined) {
    const duplicateName = await isNameTaken(newName, newCategoryId, id);
    if (duplicateName) {
      return next(
        new AppError("SubCategory already exists in this category", 409),
      );
    }
  }

  let newSlug;
  if (slug !== undefined) {
    newSlug = normalizeSlug(slug);
    if (!newSlug) {
      return next(
        new AppError("SubCategory slug must be a non-empty string", 400),
      );
    }

    const duplicateSlug = await isSlugTaken(newSlug, id);
    if (duplicateSlug) {
      return next(new AppError("SubCategory slug already exists", 409));
    }
  }

  if (name !== undefined) subCategory.name = newName;
  if (categoryId !== undefined) subCategory.categoryId = categoryId;
  if (newSlug !== undefined) subCategory.slug = newSlug;

  await subCategory.save();
  return res
    .status(200)
    .json({ message: "SubCategory updated successfully", data: subCategory });
});

exports.deactivateSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id))
    return next(new AppError("Invalid subCategory id", 400));

  const subCategory = await getSubCategory(id);
  if (!subCategory) return next(new AppError("SubCategory not found", 404));
  if (subCategory.isDeleted) return next(new AppError("SubCategory is deleted", 400));
  if (!subCategory.isActive)
    return next(new AppError("SubCategory is already inactive", 400));

  const linkedProductsCount = await Product.countDocuments({
    subCategoryId: id,
    isDeleted: { $ne: true },
    isActive: true,
  });

  if (linkedProductsCount > 0) {
    return next(
      new AppError(
        `Cannot deactivate subcategory, it is linked to ${linkedProductsCount} active product(s)`,
        409,
      ),
    );
  }

  subCategory.isActive = false;
  await subCategory.save();

  return res
    .status(200)
    .json({
      message: "SubCategory deactivated successfully",
      data: subCategory,
    });
});

exports.activateSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id))
    return next(new AppError("Invalid subCategory id", 400));

  const subCategory = await getSubCategory(id);
  if (!subCategory) return next(new AppError("SubCategory not found", 404));
  if (subCategory.isDeleted) return next(new AppError("Deleted SubCategory must be restored first", 400));
  if (subCategory.isActive)
    return next(new AppError("SubCategory is already active", 400));

  const category = await getActiveCategory(subCategory.categoryId);
  if (!category) {
    return next(
      new AppError(
        "Cannot activate SubCategory because parent category is inactive",
        400,
      ),
    );
  }

  subCategory.isActive = true;
  await subCategory.save();

  return res
    .status(200)
    .json({ message: "SubCategory activated successfully", data: subCategory });
});

exports.deleteSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid subCategory id", 400));
  }

  const subCategory = await SubCategory.findById(id);

  if (!subCategory) {
    return next(new AppError("SubCategory not found", 404));
  }

  if (subCategory.isDeleted) {
    return next(new AppError("SubCategory is already deleted", 400));
  }

  const linkedProductsCount = await Product.countDocuments({
    subCategoryId: id,
    isDeleted: { $ne: true },
    isActive: true,
  });

  if (linkedProductsCount > 0) {
    return next(
      new AppError(
        "SubCategory cannot be deleted while it is linked to products",
        409,
      ),
    );
  }

  subCategory.isDeleted = true;
  subCategory.isActive = false;

  await subCategory.save();

  return res.status(200).json({
    message: "SubCategory deleted successfully",
    data: subCategory,
  });
});

exports.restoreSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid subCategory id", 400));
  }

  const subCategory = await SubCategory.findById(id);

  if (!subCategory) {
    return next(new AppError("SubCategory not found", 404));
  }

  if (!subCategory.isDeleted) {
    return next(new AppError("SubCategory is already active", 400));
  }

  const category = await getActiveCategory(subCategory.categoryId);

  if (!category) {
    return next(
      new AppError(
        "Cannot restore SubCategory because parent category is inactive or deleted",
        400,
      ),
    );
  }

  subCategory.isDeleted = false;
  subCategory.isActive = true;

  await subCategory.save();

  return res.status(200).json({
    message: "SubCategory restored successfully",
    data: subCategory,
  });
});
