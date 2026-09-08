const mongoose = require("mongoose");

const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");

const CART_ITEM_POPULATE = {
  path: "items.productId",
  select: "name price images slug stockQuantity isActive isDeleted",
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parsePositiveQuantity = (value) => {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return null;
  }
  return numericValue;
};

const findAvailableProduct = async (productId) => {
  if (!isValidObjectId(productId)) {
    return null;
  }
  return Product.findOne({
    _id: productId,
    isActive: true,
    isDeleted: false,
  });
};

const findCart = async (userId) => Cart.findOne({ userId });

const findCartItem = (cart, productId) => {
  return cart.items.find(
    (item) => String(item.productId) === String(productId),
  );
};

const syncCartPrices = async (cart) => {
  if (!cart || cart.items.length === 0) {
    return cart;
  }

  const productIds = cart.items.map((item) => item.productId);

  const products = await Product.find({
    _id: { $in: productIds },
    isDeleted: false,
  }).select("_id price stockQuantity isActive");

  const productMap = new Map(
    products.map((product) => [String(product._id), product]),
  );

  cart.items = cart.items.filter((item) => {
    const product = productMap.get(String(item.productId));
    return product && product.isActive && !product.isDeleted;
  });

  cart.items.forEach((item) => {
    const product = productMap.get(String(item.productId));

    if (!product) {
      return;
    }

    const currentPrice = Number(product.price);

    if (currentPrice !== Number(item.priceAtOrder)) {
      item.isPriceChanged = true;
      item.currentPrice = currentPrice;
    } else {
      item.isPriceChanged = false;
      item.currentPrice = undefined;
    }

    if (item.quantity > product.stockQuantity) {
      item.quantity = product.stockQuantity;
    }
  });

  cart.items = cart.items.filter((item) => item.quantity > 0);

  return cart;
};

exports.getMyCart = catchAsync(async (req, res, next) => {
  let cart = await findCart(req.user._id);

  if (!cart) {
    cart = await Cart.create({
      userId: req.user._id,
      items: [],
      totalPrice: 0,
    });

    return res.status(200).json({
      message: "Cart retrieved successfully",
      data: cart,
    });
  }

  await syncCartPrices(cart);
  await cart.save();
  await cart.populate(CART_ITEM_POPULATE);

  return res.status(200).json({
    message: "Cart retrieved successfully",
    data: cart,
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const quantity = parsePositiveQuantity(req.body.quantity ?? 1);

  if (quantity === null) {
    return next(new AppError("Quantity must be a positive integer", 400));
  }

  const product = await findAvailableProduct(productId);

  if (!product) {
    return next(new AppError("Product not found or unavailable", 404));
  }

  if (product.stockQuantity < 1) {
    return next(new AppError("Product is out of stock", 400));
  }

  if (quantity > product.stockQuantity) {
    return next(
      new AppError(`Only ${product.stockQuantity} items are available`, 400),
    );
  }

  let cart = await findCart(req.user._id);

  if (!cart) {
    cart = new Cart({
      userId: req.user._id,
      items: [],
    });
  }

  await syncCartPrices(cart);

  const existingItem = findCartItem(cart, product._id);

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > product.stockQuantity) {
      return next(
        new AppError(`Only ${product.stockQuantity} items are available`, 400),
      );
    }

    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      productId: product._id,
      priceAtOrder: Number(product.price),
      isPriceChanged: false,
      quantity,
    });
  }

  await cart.save();
  await cart.populate(CART_ITEM_POPULATE);

  return res.status(200).json({
    message: "Product added to cart successfully",
    data: cart,
  });
});

exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return next(new AppError("Invalid product id", 400));
  }

  const quantity = parsePositiveQuantity(req.body.quantity);

  if (quantity === null) {
    return next(new AppError("Quantity must be a positive integer", 400));
  }

  const cart = await findCart(req.user._id);

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  const item = findCartItem(cart, productId);

  if (!item) {
    return next(new AppError("Product is not in your cart", 404));
  }

  const product = await findAvailableProduct(productId);

  if (!product) {
    return next(new AppError("Product is no longer available", 404));
  }

  if (quantity > product.stockQuantity) {
    return next(
      new AppError(`Only ${product.stockQuantity} items are available`, 400),
    );
  }

  item.quantity = quantity;

  const currentPrice = Number(product.price);
  if (currentPrice !== Number(item.priceAtOrder)) {
    item.isPriceChanged = true;
    item.currentPrice = currentPrice;
  }

  await cart.save();
  await cart.populate(CART_ITEM_POPULATE);

  return res.status(200).json({
    message: "Cart item updated successfully",
    data: cart,
  });
});

exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return next(new AppError("Invalid product id", 400));
  }

  const cart = await findCart(req.user._id);

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  const itemExists = cart.items.some(
    (item) => String(item.productId) === String(productId),
  );

  if (!itemExists) {
    return next(new AppError("Product is not in your cart", 404));
  }

  cart.items = cart.items.filter(
    (item) => String(item.productId) !== String(productId),
  );

  await cart.save();
  await cart.populate(CART_ITEM_POPULATE);

  return res.status(200).json({
    message: "Product removed from cart successfully",
    data: cart,
  });
});

exports.clearCart = catchAsync(async (req, res, next) => {
  const cart = await findCart(req.user._id);

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  const itemCount = cart.items.length;
  cart.items = [];

  await cart.save();

  return res.status(200).json({
    message: "Cart cleared successfully",
    data: cart,
  });
});

exports.confirmPriceChange = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return next(new AppError("Invalid product id", 400));
  }

  const cart = await findCart(req.user._id);

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  const item = findCartItem(cart, productId);

  if (!item) {
    return next(new AppError("Product is not in your cart", 404));
  }

  if (!item.isPriceChanged) {
    return next(new AppError("Price for this product has not changed", 400));
  }

  const product = await findAvailableProduct(productId);

  if (!product) {
    return next(new AppError("Product is no longer available", 404));
  }

  item.priceAtOrder = Number(product.price);
  item.isPriceChanged = false;
  item.currentPrice = undefined;

  await cart.save();
  await cart.populate(CART_ITEM_POPULATE);

  return res.status(200).json({
    message: "Price updated in your cart",
    data: cart,
  });
});

exports.mergeGuestCart = catchAsync(async (req, res, next) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return next(new AppError("Items must be an array", 400));
  }

  let cart = await findCart(req.user._id);

  if (!cart) {
    cart = new Cart({
      userId: req.user._id,
      items: [],
    });
  }

  await syncCartPrices(cart);

  let mergedItems = 0;

  for (const guestItem of items) {
    const { productId } = guestItem;
    const quantity = parsePositiveQuantity(guestItem.quantity);

    if (!productId || quantity === null) {
      continue;
    }

    const product = await findAvailableProduct(productId);

    if (!product) {
      continue;
    }

    if (product.stockQuantity < 1) {
      continue;
    }

    const existingItem = findCartItem(cart, product._id);

    if (existingItem) {
      const mergedQuantity = Math.min(
        existingItem.quantity + quantity,
        product.stockQuantity,
      );

      existingItem.quantity = mergedQuantity;
    } else {
      cart.items.push({
        productId: product._id,
        priceAtOrder: Number(product.price),
        isPriceChanged: false,
        quantity: Math.min(quantity, product.stockQuantity),
      });
    }

    mergedItems++;
  }

  await cart.save();
  await cart.populate(CART_ITEM_POPULATE);

  return res.status(200).json({
    message: "Guest cart merged successfully",
    data: cart,
  });
});
