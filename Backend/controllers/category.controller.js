const mongoose = require("mongoose");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const SubCategory = require("../models/subCategory.model");
const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { getPaginatedResults } = require("../utilities/pagination.util");

const trimString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeSlug = (value) => trimString(value).toLowerCase();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

exports.getAllCategoriesFilter = async (req) => {
  const filter = { isDeleted: false, isActive: true };
  return filter;
};

exports.getAdminCategoriesFilter = async (req) => {
  const { isDeleted, isActive } = req.query;
  const filter = {};

  if (isDeleted === "true") {
    filter.isDeleted = true;
  } else if (isDeleted === "false") {
    filter.isDeleted = false;
  } else {
    filter.isDeleted = false;
  }

  if (isActive === "true" || isActive === "false") {
    filter.isActive = isActive === "true";
  }

  return filter;
};

const getCategoriesPage = async (req, filterFunction) =>
  getPaginatedResults(Category, req, filterFunction, {
    defaultSort: "createdAt",
    allowedSortFields: ["createdAt", "name"],
  });

const sendCategoriesResponse = (res, pageData) => {
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
    message: "Categories list",
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

exports.getAllCategoriesHandler = catchAsync(async (req, res, next) => {
  const pageData = await getCategoriesPage(req, exports.getAllCategoriesFilter);

  return sendCategoriesResponse(res, pageData);
});

exports.getAdminCategoriesHandler = catchAsync(async (req, res, next) => {
  const pageData = await getCategoriesPage(req, exports.getAdminCategoriesFilter);

  return sendCategoriesResponse(res, pageData);
});

exports.getAdminCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return next(new AppError("Invalid category id", 400));
  const category = await Category.findById(id);
  if (!category) return next(new AppError("Category not found", 404));
  return res.status(200).json({ message: "Category found", data: category });
});

exports.getCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return next(new AppError("Invalid category id", 400));
  const category = await Category.findOne({ _id: id, isActive: true, isDeleted: { $ne: true } });
  if (!category) {
    return next(new AppError("Category not found", 404));
  }
  return res.status(200).json({ message: "Category found", data: category });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const name = trimString(req.body.name);
  const slug = normalizeSlug(req.body.slug);
  if (!name || !slug) {
    return next(new AppError("Category name and slug are required", 400));
  }
  const existingCategory = await Category.findOne({
    $or: [{ name }, { slug }],
  });
  if (existingCategory) {
    return next(new AppError("Category name or slug already exists", 409));
  }
  const category = await Category.create({ name, slug, isActive: true });
  return res
    .status(201)
    .json({ message: "Category created successfully", data: category });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return next(new AppError("Invalid category id", 400));
  const category = await Category.findById(id);
  if (!category) {
    return next(new AppError("Category not found", 404));
  }
  if (category.isDeleted) {
    return next(new AppError("Deleted category cannot be updated", 400));
  }

  if (req.body.name === undefined && req.body.slug === undefined) {
    return next(new AppError("Provide at least one field to update", 400));
  }
  if (req.body.name !== undefined) {
    const name = trimString(req.body.name);
    if (!name)
      return next(
        new AppError("Category name must be a non-empty string", 400),
      );
    const existingName = await Category.findOne({ name, _id: { $ne: id } });
    if (existingName)
      return next(new AppError("Category name already exists", 409));
    category.name = name;
  }
  if (req.body.slug !== undefined) {
    const slug = normalizeSlug(req.body.slug);
    if (!slug)
      return next(
        new AppError("Category slug must be a non-empty string", 400),
      );
    const existingSlug = await Category.findOne({ slug, _id: { $ne: id } });
    if (existingSlug)
      return next(new AppError("Category slug already exists", 409));
    category.slug = slug;
  }
  await category.save();
  return res
    .status(200)
    .json({ message: "Category updated successfully", data: category });
});

exports.deactivateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return next(new AppError("Invalid category id", 400));
  const category = await Category.findById(id);
  if (!category) return next(new AppError("Category not found", 404));
  if (category.isDeleted) return next(new AppError("Category is deleted", 400));
  if (!category.isActive)
    return next(new AppError("Category is already inactive", 400));

  const linkedProductsCount = await Product.countDocuments({
    categoryId: id,
    isDeleted: { $ne: true },
    isActive: true,
  });

  if (linkedProductsCount > 0) {
    return next(
      new AppError(
        `Cannot deactivate category, it is linked to ${linkedProductsCount} active product(s)`,
        409,
      ),
    );
  }

  category.isActive = false;
  await category.save();

  await SubCategory.updateMany(
    { categoryId: category._id, isDeleted: false, isActive: true },
    { $set: { isActive: false } },
  );
  return res
    .status(200)
    .json({ message: "Category deactivated successfully", data: category });
});

exports.activateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id))
    return next(new AppError("Invalid category id", 400));
  const category = await Category.findById(id);
  if (!category) return next(new AppError("Category not found", 404));
  if (category.isDeleted) return next(new AppError("Deleted category must be restored first", 400));
  if (category.isActive)
    return next(new AppError("Category is already active", 400));
  category.isActive = true;
  await category.save();
  return res
    .status(200)
    .json({ message: "Category activated successfully", data: category });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid category id", 400));
  }

  const category = await Category.findById(id);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  if (category.isDeleted) {
    return next(new AppError("Category is already deleted", 400));
  }

  const [productsCount, subCategoriesCount] = await Promise.all([
    Product.countDocuments({
      categoryId: id,
      isDeleted: { $ne: true },
      isActive: true,
    }),
    SubCategory.countDocuments({
      categoryId: id,
      isDeleted: { $ne: true },
    }),
  ]);

  if (productsCount > 0 || subCategoriesCount > 0) {
    return next(
      new AppError(
        "Category cannot be deleted while it is linked to products or subcategories",
        409,
      ),
    );
  }

  category.isDeleted = true;
  category.isActive = false;

  await category.save();

  return res.status(200).json({
    message: "Category deleted successfully",
    data: category,
  });
});

exports.restoreCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid category id", 400));
  }

  const category = await Category.findById(id);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  if (!category.isDeleted) {
    return next(new AppError("Category is already active", 400));
  }

  category.isDeleted = false;
  category.isActive = true;

  await category.save();

  return res.status(200).json({
    message: "Category restored successfully",
    data: category,
  });
});
