const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");

const Product = require("../models/product.model");
const Category = require("../models/category.model");
const SubCategory = require("../models/subCategory.model");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { getPaginatedResults } = require("../utilities/pagination.util");

const ALLOWED_SEASONS = ["summer", "winter", "spring", "autumn", "all"];

const ALLOWED_SORT_FIELDS = ["createdAt", "price", "name", "stockQuantity"];

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const trimString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const parsePrice = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return numericValue;
};

const parseStock = (value) => {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return null;
  }

  return numericValue;
};

const findActiveCategory = async (categoryId) => {
  if (!isValidObjectId(categoryId)) {
    return null;
  }

  return Category.findOne({
    _id: categoryId,
    isActive: true,
    isDeleted: { $ne: true },
  });
};

const findActiveSubCategory = async (subCategoryId, categoryId) => {
  if (!isValidObjectId(subCategoryId) || !isValidObjectId(categoryId)) {
    return null;
  }

  return SubCategory.findOne({
    _id: subCategoryId,
    categoryId,
    isActive: true,
    isDeleted: { $ne: true },
  });
};

const ensureSlugIsUnique = async (slug, excludeId = null) => {
  const filter = { slug };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return Product.findOne(filter);
};

const getRelatedProducts = async (product) => {
  const baseFilter = {
    _id: { $ne: product._id },
    categoryId: product.categoryId._id || product.categoryId,
    isActive: true,
    isDeleted: false,
  };

  const sameSubCategory = await Product.find({
    ...baseFilter,
    subCategoryId: product.subCategoryId._id || product.subCategoryId,
  })
    .sort({ isBestSeller: -1, createdAt: -1 })
    .limit(4)
    .select("name slug price images stockQuantity isBestSeller")
    .lean();

  if (sameSubCategory.length >= 4) {
    return sameSubCategory;
  }

  const ids = [product._id, ...sameSubCategory.map((item) => item._id)];
  const more = await Product.find({
    ...baseFilter,
    _id: { $nin: ids },
  })
    .sort({ isBestSeller: -1, createdAt: -1 })
    .limit(4 - sameSubCategory.length)
    .select("name slug price images stockQuantity isBestSeller")
    .lean();

  return [...sameSubCategory, ...more];
};

const productDetailsResponse = async (product) => {
  const data = product.toObject();
  data.relatedProducts = await getRelatedProducts(product);
  return data;
};

exports.createProduct = catchAsync(async (req, res, next) => {

  const { categoryId, subCategoryId, season, stockQuantity, price } = req.body;

  const name = trimString(req.body.name);
  const description = trimString(req.body.description);
  const slug = trimString(req.body.slug).toLowerCase();

  if (
    !name ||
    !description ||
    price === undefined ||
    !categoryId ||
    !subCategoryId ||
    !slug ||
    stockQuantity === undefined
  ) {

    return next(
      new AppError(
        "Name, description, price, categoryId, subCategoryId, slug and stockQuantity are required",
        400,
      ),
    );
  }

  if (!Array.isArray(req.files) || req.files.length === 0) {

    return next(new AppError("At least one product image is required", 400));
  }

  const numericPrice = parsePrice(price);

  if (numericPrice === null) {
    return next(new AppError("Price must be a valid non-negative number", 400));
  }

  const numericStock = parseStock(stockQuantity);

  if (numericStock === null) {
    return next(
      new AppError("Stock quantity must be a non-negative integer", 400),
    );
  }

  if (season !== undefined && !ALLOWED_SEASONS.includes(season)) {
    return next(
      new AppError(`Season must be one of: ${ALLOWED_SEASONS.join(", ")}`, 400),
    );
  }

  const category = await findActiveCategory(categoryId);

  if (!category) {
    return next(new AppError("Active category not found", 404));
  }

  const subCategory = await findActiveSubCategory(subCategoryId, categoryId);

  if (!subCategory) {
    return next(
      new AppError(
        "Active SubCategory not found or does not belong to this Category",
        404,
      ),
    );
  }

  const existingProduct = await ensureSlugIsUnique(slug);

  if (existingProduct) {

    return next(new AppError("Product slug already exists", 409));
  }

  const images = req.files.map((file) => file.filename);

  const product = await Product.create({
    name,
    description,
    price: numericPrice,
    images,
    categoryId,
    subCategoryId,
    season: season || "all",
    slug,
    stockQuantity: numericStock,
    isBestSeller: req.body.isBestSeller === true || req.body.isBestSeller === "true",
    isNewArrival: req.body.isNewArrival === true || req.body.isNewArrival === "true",
  });

  return res.status(201).json({
    message: "Product created successfully",
    data: product,
  });
});

exports.getAllProductsFilter = async (req) => {
  const { categoryId, subCategoryId, season, minPrice, maxPrice, search } = req.query;

  const filter = {
    isActive: true,
    isDeleted: { $ne: true },
  };

  if (categoryId && !isValidObjectId(categoryId)) {
    throw new AppError("Invalid category id", 400);
  }

  if (subCategoryId && !isValidObjectId(subCategoryId)) {
    throw new AppError("Invalid subCategory id", 400);
  }

  if (categoryId || subCategoryId) {
    let activeCategory = null;

    if (categoryId) {
      activeCategory = await findActiveCategory(categoryId);
      if (!activeCategory) return { _id: null };
    }

    if (subCategoryId) {
      const activeSubCategory = await SubCategory.findOne({
        _id: subCategoryId,
        isActive: true,
        isDeleted: { $ne: true },
      });

      if (!activeSubCategory) return { _id: null };

      if (activeCategory && String(activeSubCategory.categoryId) !== String(activeCategory._id)) {
        return { _id: null };
      }

      activeCategory = await findActiveCategory(activeSubCategory.categoryId);
      if (!activeCategory) return { _id: null };
      filter.subCategoryId = activeSubCategory._id;
    }

    filter.categoryId = activeCategory._id;
  } else {
    const activeCategories = await Category.find({
      isActive: true,
      isDeleted: { $ne: true },
    }).select("_id").lean();

    const activeCategoryIds = activeCategories.map((category) => category._id);
    filter.categoryId = { $in: activeCategoryIds };

    const activeSubCategories = await SubCategory.find({
      isActive: true,
      isDeleted: { $ne: true },
      categoryId: { $in: activeCategoryIds },
    }).select("_id").lean();

    filter.subCategoryId = { $in: activeSubCategories.map((subCategory) => subCategory._id) };
  }

  if (season) {
    if (!ALLOWED_SEASONS.includes(season)) throw new AppError(`Season must be one of: ${ALLOWED_SEASONS.join(", ")}`, 400);
    filter.season = season;
  }

  if (minPrice !== undefined) {
    const numericMinPrice = parsePrice(minPrice);
    if (numericMinPrice === null) throw new AppError("minPrice must be a valid non-negative number", 400);
    filter.price = { ...(filter.price || {}), $gte: numericMinPrice };
  }

  if (maxPrice !== undefined) {
    const numericMaxPrice = parsePrice(maxPrice);
    if (numericMaxPrice === null) throw new AppError("maxPrice must be a valid non-negative number", 400);
    filter.price = { ...(filter.price || {}), $lte: numericMaxPrice };
  }

  if (filter.price?.$gte !== undefined && filter.price?.$lte !== undefined && filter.price.$gte > filter.price.$lte) {
    throw new AppError("minPrice cannot be greater than maxPrice", 400);
  }

  const normalizedSearch = trimString(search);
  if (normalizedSearch) {
    const safeSearch = escapeRegex(normalizedSearch);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  return filter;
};

exports.getAdminProductsFilter = async (req) => {
  const { categoryId, subCategoryId, season, minPrice, maxPrice, search, includeInactive, includeDeleted, isActive, isDeleted } =
    req.query;

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
  } else if (isDeleted !== "true" && includeInactive !== "true") {
    filter.isActive = true;
  }

  if (categoryId) {
    if (!isValidObjectId(categoryId)) {
      throw new AppError("Invalid category id", 400);
    }
    filter.categoryId = categoryId;
  }

  if (subCategoryId) {
    if (!isValidObjectId(subCategoryId)) {
      throw new AppError("Invalid subCategory id", 400);
    }
    filter.subCategoryId = subCategoryId;
  }

  if (season) {
    if (!ALLOWED_SEASONS.includes(season)) {
      throw new AppError(`Season must be one of: ${ALLOWED_SEASONS.join(", ")}`, 400);
    }
    filter.season = season;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) {
      const min = parsePrice(minPrice);
      if (min === null) throw new AppError("minPrice must be a valid non-negative number", 400);
      filter.price.$gte = min;
    }
    if (maxPrice !== undefined) {
      const max = parsePrice(maxPrice);
      if (max === null) throw new AppError("maxPrice must be a valid non-negative number", 400);
      filter.price.$lte = max;
    }
    if (filter.price.$gte !== undefined && filter.price.$lte !== undefined && filter.price.$gte > filter.price.$lte) {
      throw new AppError("minPrice cannot be greater than maxPrice", 400);
    }
  }

  const normalizedSearch = trimString(search);
  if (normalizedSearch) {
    const safeSearch = escapeRegex(normalizedSearch);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  return filter;
};

exports.getAdminProductsHandler = catchAsync(async (req, res, next) => {
  const { results, total, page, limit, totalPages, hasNextPage, hasPreviousPage } =
    await getPaginatedResults(Product, req, exports.getAdminProductsFilter, {
      defaultSort: "createdAt",
      allowedSortFields: ALLOWED_SORT_FIELDS,
      populate: [
        { path: "categoryId", select: "name slug" },
        { path: "subCategoryId", select: "name slug" },
      ],
    });

  return res.status(200).json({
    message: "Admin products list",
    pagination: { page, limit, total, totalPages, hasNextPage, hasPreviousPage },
    data: results,
  });
});

exports.getAllProductsHandler = catchAsync(async (req, res, next) => {
  const {
    results,
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = await getPaginatedResults(Product, req, exports.getAllProductsFilter, {
    defaultSort: "createdAt",
    allowedSortFields: ALLOWED_SORT_FIELDS,
    defaultOrder: "desc",
    populate: [
      { path: "categoryId", select: "name slug" },
      { path: "subCategoryId", select: "name slug" },
    ],
  });

  return res.status(200).json({
    message: "Products list",
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

exports.getAdminProductById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return next(new AppError("Invalid product id", 400));
  const product = await Product.findById(id)
    .populate("categoryId", "name slug isActive isDeleted")
    .populate("subCategoryId", "name slug isActive isDeleted");
  if (!product) return next(new AppError("Product not found", 404));
  return res.status(200).json({ message: "Product found", data: product });
});

exports.getProductById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid product id", 400));
  }

  const product = await Product.findOne({
    _id: id,
    isActive: true,
    isDeleted: { $ne: true },
  })
    .populate("categoryId", "name slug isActive isDeleted")
    .populate("subCategoryId", "name slug isActive isDeleted");

  if (!product || !product.categoryId?.isActive || product.categoryId.isDeleted || !product.subCategoryId?.isActive || product.subCategoryId.isDeleted) {
    return next(new AppError("Product not found", 404));
  }

  if (!product) {

    return next(new AppError("Product not found", 404));
  }

  const data = await productDetailsResponse(product);

  return res.status(200).json({
    message: "Product found",
    data,
  });
});

exports.getProductBySlug = catchAsync(async (req, res, next) => {
  const slug = trimString(req.params.slug).toLowerCase();

  if (!slug) {
    return next(new AppError("Product slug is required", 400));
  }

  const product = await Product.findOne({
    slug,
    isActive: true,
    isDeleted: { $ne: true },
  })
    .populate("categoryId", "name slug isActive isDeleted")
    .populate("subCategoryId", "name slug isActive isDeleted");

  if (!product || !product.categoryId?.isActive || product.categoryId.isDeleted || !product.subCategoryId?.isActive || product.subCategoryId.isDeleted) {
    return next(new AppError("Product not found", 404));
  }

  const data = await productDetailsResponse(product);

  return res.status(200).json({
    message: "Product found",
    data,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid product id", 400));
  }

  const product = await Product.findById(id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (product.isDeleted) {
    return next(
      new AppError("Deleted product cannot be updated. Restore it first", 400),
    );
  }

  const {
    name,
    description,
    price,
    categoryId,
    subCategoryId,
    season,
    slug,
    stockQuantity,
    isBestSeller,
  } = req.body;

  if (name !== undefined) {
    const normalizedName = trimString(name);

    if (!normalizedName) {
      return next(new AppError("Product name must be a non-empty string", 400));
    }

    product.name = normalizedName;
  }

  if (description !== undefined) {
    const normalizedDescription = trimString(description);

    if (!normalizedDescription) {
      return next(
        new AppError("Product description must be a non-empty string", 400),
      );
    }

    product.description = normalizedDescription;
  }

  if (price !== undefined) {
    const numericPrice = parsePrice(price);

    if (numericPrice === null) {
      return next(
        new AppError("Price must be a valid non-negative number", 400),
      );
    }

    product.price = numericPrice;
  }

  const finalCategoryId = categoryId !== undefined ? String(categoryId) : String(product.categoryId);
  const finalSubCategoryId = subCategoryId !== undefined ? String(subCategoryId) : String(product.subCategoryId);
  const categoryChanged = categoryId !== undefined && finalCategoryId !== String(product.categoryId);
  const subCategoryChanged = subCategoryId !== undefined && finalSubCategoryId !== String(product.subCategoryId);

  if (categoryChanged || subCategoryChanged) {
    const category = await findActiveCategory(finalCategoryId);
    const subCategory = await findActiveSubCategory(finalSubCategoryId, finalCategoryId);
    if (!category) return next(new AppError("Active category not found", 404));
    if (!subCategory) {
      return next(new AppError("Active SubCategory not found or does not belong to this Category", 404));
    }
    product.categoryId = finalCategoryId;
    product.subCategoryId = finalSubCategoryId;
  }

  if (season !== undefined) {
    if (!ALLOWED_SEASONS.includes(season)) {
      return next(
        new AppError(
          `Season must be one of: ${ALLOWED_SEASONS.join(", ")}`,
          400,
        ),
      );
    }

    product.season = season;
  }

  if (slug !== undefined) {
    const normalizedSlug = trimString(slug).toLowerCase();

    if (!normalizedSlug) {
      return next(new AppError("Product slug must be a non-empty string", 400));
    }

    const existingProduct = await ensureSlugIsUnique(normalizedSlug, id);

    if (existingProduct) {
      return next(new AppError("Product slug already exists", 409));
    }

    product.slug = normalizedSlug;
  }

  if (stockQuantity !== undefined) {
    const numericStock = parseStock(stockQuantity);

    if (numericStock === null) {
      return next(
        new AppError("Stock quantity must be a non-negative integer", 400),
      );
    }

    product.stockQuantity = numericStock;
  }

  if (isBestSeller !== undefined) {
    product.isBestSeller = isBestSeller === true || isBestSeller === "true";
  }

  if (req.body.isNewArrival !== undefined) {
    product.isNewArrival = req.body.isNewArrival === true || req.body.isNewArrival === "true";
  }

  if (Array.isArray(req.files) && req.files.length > 0) {
    const newImages = req.files.map((file) => file.filename);

    product.images = [...product.images, ...newImages];
  }

  await product.save();

  return res.status(200).json({
    message: "Product updated successfully",
    data: product,
  });
});

exports.deleteProductImage = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const image = trimString(req.body.image);

  if (!isValidObjectId(id)) return next(new AppError("Invalid product id", 400));
  if (!image) return next(new AppError("Image is required", 400));

  const product = await Product.findById(id);
  if (!product) return next(new AppError("Product not found", 404));
  if (product.isDeleted) return next(new AppError("Deleted product cannot be edited", 400));
  if (!product.images.includes(image)) return next(new AppError("Image not found", 404));
  if (product.images.length <= 1) return next(new AppError("Product must have at least one image", 400));

  product.images = product.images.filter((item) => item !== image);
  await product.save();

  try {
    await fs.unlink(path.join(process.cwd(), "uploads", image));
  } catch (error) {
    if (error.code !== "ENOENT") {
    }
  }

  return res.status(200).json({
    message: "Product image deleted successfully",
    data: product,
  });
});

exports.deactivateProduct = catchAsync(async (req, res, next) => {

  if (!isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid product id", 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (product.isDeleted) {
    return next(new AppError("Deleted product cannot be deactivated", 400));
  }

  if (!product.isActive) {
    return next(new AppError("Product is already inactive", 400));
  }

  product.isActive = false;

  await product.save();

  return res.status(200).json({
    message: "Product deactivated successfully",
    data: product,
  });
});

exports.deactivateSeasonProducts = catchAsync(async (req, res, next) => {
  const season = trimString(req.params.season).toLowerCase();

  if (!ALLOWED_SEASONS.includes(season)) {
    return next(new AppError("Invalid season", 400));
  }

  const result = await Product.updateMany(
    {
      season,
      isDeleted: false,
      isActive: true,
    },
    {
      $set: { isActive: false },
    },
  );

  return res.status(200).json({
    message: `${season} products deactivated successfully`,
    data: {
      season,
      modifiedCount: result.modifiedCount,
    },
  });
});

exports.activateSeasonProducts = catchAsync(async (req, res, next) => {
  const season = trimString(req.params.season).toLowerCase();

  if (!ALLOWED_SEASONS.includes(season)) {
    return next(new AppError("Invalid season", 400));
  }

  const result = await Product.updateMany(
    {
      season,
      isDeleted: false,
      isActive: false,
    },
    {
      $set: { isActive: true },
    },
  );

  return res.status(200).json({
    message: `${season} products activated successfully`,
    data: {
      season,
      modifiedCount: result.modifiedCount,
    },
  });
});

exports.activateProduct = catchAsync(async (req, res, next) => {

  if (!isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid product id", 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (product.isDeleted) {
    return next(
      new AppError(
        "Deleted product cannot be activated. Restore it first",
        400,
      ),
    );
  }

  if (product.isActive) {
    return next(new AppError("Product is already active", 400));
  }

  const category = await findActiveCategory(product.categoryId);
  const subCategory = await findActiveSubCategory(
    product.subCategoryId,
    product.categoryId,
  );

  if (!category || !subCategory) {
    return next(
      new AppError(
        "Cannot activate product while its category or subcategory is inactive or deleted",
        409,
      ),
    );
  }

  product.isActive = true;

  await product.save();

  return res.status(200).json({
    message: "Product activated successfully",
    data: product,
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {

  if (!isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid product id", 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (product.isDeleted) {
    return next(new AppError("Product is already deleted", 400));
  }

  product.isDeleted = true;
  product.isActive = false;

  await product.save();

  return res.status(200).json({
    message: "Product soft deleted successfully",
    data: product,
  });
});

exports.restoreProduct = catchAsync(async (req, res, next) => {

  if (!isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid product id", 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (!product.isDeleted) {
    return next(new AppError("Product is not deleted", 400));
  }

  const category = await findActiveCategory(product.categoryId);
  const subCategory = await findActiveSubCategory(
    product.subCategoryId,
    product.categoryId,
  );

  if (!category || !subCategory) {
    return next(
      new AppError(
        "Cannot restore product while its category or subcategory is inactive or deleted",
        409,
      ),
    );
  }

  product.isDeleted = false;
  product.isActive = true;

  await product.save();

  return res.status(200).json({
    message: "Product restored successfully",
    data: product,
  });
});

exports.toggleNewArrival = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new AppError("Invalid product id", 400));
  }

  const product = await Product.findById(id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (product.isDeleted) {
    return next(new AppError("Deleted product cannot be a new arrival", 400));
  }

  product.isNewArrival = !product.isNewArrival;
  await product.save();

  return res.status(200).json({
    message: product.isNewArrival
      ? "Product added to new arrivals"
      : "Product removed from new arrivals",
    data: product,
  });
});

exports.toggleBestSeller = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) return next(new AppError("Invalid product id", 400));

  const product = await Product.findById(id);
  if (!product) return next(new AppError("Product not found", 404));
  if (product.isDeleted) return next(new AppError("Deleted product cannot be a best seller", 400));

  product.isBestSeller = !product.isBestSeller;
  await product.save();

  res.status(200).json({
    message: product.isBestSeller ? "Product added to best sellers" : "Product removed from best sellers",
    data: product,
  });
});
