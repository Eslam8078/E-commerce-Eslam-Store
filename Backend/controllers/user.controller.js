const User = require("../models/user.model");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const { getPaginatedResults } = require("../utilities/pagination.util");
const { isValidLocation } = require("../services/deliveryLocation.service");

const emailRegex = /^\S+@\S+\.\S+$/;
const phoneRegex = /^01[0125]\d{8}$/;
const nationalIdRegex = /^\d{14}$/;

const getActiveUser = async (id) => {
  return User.findOne({
    _id: id,
    isDeleted: false,
  });
};

const clearDefaultAddresses = (addresses) => {
  addresses.forEach((address) => {
    address.isDefault = false;
  });
};

const checkUniqueField = async (field, value, currentUserId, next) => {
  const existingUser = await User.findOne({
    [field]: value,
    _id: { $ne: currentUserId },
  });

  if (existingUser) {

    next(
      new AppError(
        field === "email"
          ? "Email already exists"
          : "National ID already exists",
        409,
      ),
    );

    return false;
  }

  return true;
};

const preventAdminTargetAction = (targetUser, currentUser, action, next) => {
  if (String(targetUser._id) === String(currentUser._id)) {

    next(new AppError(`You cannot ${action.toLowerCase()} yourself`, 400));

    return false;
  }

  if (targetUser.role === "admin") {

    next(new AppError(`You cannot ${action.toLowerCase()} another admin`, 403));

    return false;
  }

  return true;
};

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await getActiveUser(req.user._id);

  if (!user) {

    return next(new AppError("User not found", 404));
  }

  return res.status(200).json({
    message: "User profile",
    data: user,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const { name, email, gender, mobilePhone, nationalId, DOB } = req.body;

  const forbiddenFields = ["password", "role", "isBlocked", "isDeleted"];

  const attemptedForbidden = forbiddenFields.filter(
    (field) => req.body[field] !== undefined,
  );

  if (attemptedForbidden.length > 0) {

    return next(
      new AppError(
        "You cannot update password, role, block status or delete status from this endpoint",
        400,
      ),
    );
  }

  const updateData = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return next(new AppError("Name must be a valid non-empty string", 400));
    }

    updateData.name = name.trim();
  }

  if (email !== undefined) {
    if (
      typeof email !== "string" ||
      !email.trim() ||
      !emailRegex.test(email.trim())
    ) {
      return next(new AppError("Please provide a valid email", 400));
    }

    const normalizedEmail = email.trim().toLowerCase();

    const isUnique = await checkUniqueField(
      "email",
      normalizedEmail,
      req.user._id,
      next,
    );

    if (!isUnique) {
      return;
    }

    updateData.email = normalizedEmail;
  }

  if (gender !== undefined) {
    if (!["male", "female"].includes(gender)) {
      return next(new AppError("Gender must be male or female", 400));
    }

    updateData.gender = gender;
  }

  if (mobilePhone !== undefined) {
    if (
      typeof mobilePhone !== "string" ||
      !phoneRegex.test(mobilePhone.trim())
    ) {
      return next(
        new AppError(
          "Please provide a valid Egyptian mobile phone number",
          400,
        ),
      );
    }

    updateData.mobilePhone = mobilePhone.trim();
  }

  if (nationalId !== undefined) {
    if (
      typeof nationalId !== "string" ||
      !nationalId.trim() ||
      !nationalIdRegex.test(nationalId.trim())
    ) {
      return next(
        new AppError("National ID must contain exactly 14 digits", 400),
      );
    }

    const trimmedNationalId = nationalId.trim();

    const isUnique = await checkUniqueField(
      "nationalId",
      trimmedNationalId,
      req.user._id,
      next,
    );

    if (!isUnique) {
      return;
    }

    updateData.nationalId = trimmedNationalId;
  }

  if (DOB !== undefined) {
    const birthDate = new Date(DOB);

    if (Number.isNaN(birthDate.getTime())) {
      return next(new AppError("Invalid date of birth", 400));
    }

    if (birthDate > new Date()) {
      return next(new AppError("Date of birth cannot be in the future", 400));
    }

    updateData.DOB = birthDate;
  }

  if (Object.keys(updateData).length === 0) {
    return next(new AppError("No valid fields provided for update", 400));
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: req.user._id,
      isDeleted: false,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  ).select("-password");

  if (!updatedUser) {

    return next(new AppError("User not found", 404));
  }

  return res.status(200).json({
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

exports.getMyAddresses = catchAsync(async (req, res, next) => {
  const user = await getActiveUser(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  return res.status(200).json({
    message: "User addresses",
    data: user.addresses.filter((item) => !item.isDeleted),
  });
});

exports.addAddress = catchAsync(async (req, res, next) => {
  const { label, street, address, governorate, city, isDefault } = req.body;
  const streetValue = street ?? address;

  if (
    typeof streetValue !== "string" ||
    !streetValue.trim() ||
    typeof governorate !== "string" ||
    !governorate.trim() ||
    typeof city !== "string" ||
    !city.trim()
  ) {
    return next(new AppError("Street, governorate and city are required", 400));
  }

  if (!(await isValidLocation(governorate, city))) {
    return next(new AppError("Invalid governorate and city", 400));
  }

  const user = await getActiveUser(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const hasActiveAddress = user.addresses.some((item) => !item.isDeleted);
  const makeDefault = !hasActiveAddress || isDefault === true;

  if (makeDefault) {
    clearDefaultAddresses(user.addresses);
  }

  user.addresses.push({
    label: typeof label === "string" && label.trim() ? label.trim() : "Home",

    street: streetValue.trim(),

    governorate: governorate.trim(),

    city: city.trim(),

    isDefault: makeDefault,
  });

  await user.save();

  return res.status(201).json({
    message: "Address added successfully",
    data: user.addresses.filter((item) => !item.isDeleted),
  });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;

  const { label, street, governorate, city, isDefault } = req.body;

  const user = await getActiveUser(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const address = user.addresses.id(addressId);

  if (!address || address.isDeleted) {

    return next(new AppError("Address not found", 404));
  }

  if (label !== undefined) {
    if (typeof label !== "string" || !label.trim()) {
      return next(new AppError("Label must be a valid string", 400));
    }

    address.label = label.trim();
  }

  if (street !== undefined) {
    if (typeof street !== "string" || !street.trim()) {
      return next(new AppError("Street must be a valid string", 400));
    }

    address.street = street.trim();
  }

  if (governorate !== undefined) {
    if (typeof governorate !== "string" || !governorate.trim()) {
      return next(new AppError("Governorate must be a valid string", 400));
    }

    address.governorate = governorate.trim();
  }

  if (city !== undefined) {
    if (typeof city !== "string" || !city.trim()) {
      return next(new AppError("City must be a valid string", 400));
    }

    address.city = city.trim();
  }

  if (governorate !== undefined || city !== undefined) {
    if (!(await isValidLocation(address.governorate, address.city))) {
      return next(new AppError("Invalid governorate and city", 400));
    }
  }

  if (isDefault === true) {
    clearDefaultAddresses(user.addresses);

    address.isDefault = true;
  }

  if (isDefault === false) {
    address.isDefault = false;

    const anotherDefault = user.addresses.some(
      (item) => String(item._id) !== String(addressId) && item.isDefault,
    );

    if (!anotherDefault) {
      address.isDefault = true;
    }
  }

  await user.save();

  return res.status(200).json({
    message: "Address updated successfully",
    data: user.addresses.filter((item) => !item.isDeleted),
  });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;

  const user = await getActiveUser(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const address = user.addresses.id(addressId);

  if (!address || address.isDeleted) {
    return next(new AppError("Address not found", 404));
  }

  const wasDefault = address.isDefault;
  address.isDeleted = true;
  address.isDefault = false;

  if (wasDefault) {
    const nextDefault = user.addresses.find(
      (item) => !item.isDeleted && String(item._id) !== String(addressId),
    );

    if (nextDefault) {
      nextDefault.isDefault = true;
    }
  }

  await user.save();

  return res.status(200).json({
    message: "Address deleted successfully",
    data: user.addresses.filter((item) => !item.isDeleted),
  });
});

exports.createAdmin = catchAsync(async (req, res, next) => {
  const { name, email, password, gender, DOB } = req.body;

  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedName || !normalizedEmail || !password || !gender || !DOB) {
    return next(
      new AppError("Name, email, password, gender and date of birth are required", 400),
    );
  }

  if (!["male", "female"].includes(gender)) {
    return next(new AppError("Gender must be male or female", 400));
  }

  const birthDate = new Date(DOB);
  if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
    return next(new AppError("Invalid date of birth", 400));
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(new AppError("Email already exists", 409));
  }

  const admin = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password,
    gender,
    DOB: birthDate,
    role: "admin",
  });

  const safeAdmin = {
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    gender: admin.gender,
    DOB: admin.DOB,
    isBlocked: admin.isBlocked,
    isDeleted: admin.isDeleted,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };

  return res.status(201).json({
    message: "Admin created successfully",
    data: safeAdmin,
  });
});

exports.getAllUsersFilter = async (req) => {
  const { search, role, accountStatus } = req.query;
  const filter = {};

  if (accountStatus === "active") {
    filter.isDeleted = false;
    filter.isBlocked = false;
  } else if (accountStatus === "blocked") {
    filter.isDeleted = false;
    filter.isBlocked = true;
  } else if (accountStatus === "deleted") {
    filter.isDeleted = true;
  } else {
    filter.isDeleted = false;
  }

  if (role) {
    if (!['customer', 'admin'].includes(role)) {
      throw new AppError("Role must be customer or admin", 400);
    }
    filter.role = role;
  }

  if (typeof search === "string" && search.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }

  return filter;
};

exports.getAllUsersHandler = catchAsync(async (req, res, next) => {
  const {
    results,
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = await getPaginatedResults(User, req, exports.getAllUsersFilter, {
    defaultSort: "createdAt",
    allowedSortFields: ["createdAt", "name", "email", "role"],
    select: "-password",
  });

  return res.status(200).json({
    message: "Users list",

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

exports.getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findOne({
    _id: id,
    isDeleted: false,
  }).select("-password");

  if (!user) {

    return next(new AppError("User not found", 404));
  }

  return res.status(200).json({
    message: "User data",
    data: user,
  });
});

exports.blockUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isDeleted) {
    return next(new AppError("Cannot block a deleted user", 400));
  }

  if (!preventAdminTargetAction(user, req.user, "Block", next)) {
    return;
  }

  if (user.isBlocked) {
    return next(new AppError("User is already blocked", 400));
  }

  user.isBlocked = true;

  await user.save();

  return res.status(200).json({
    message: "User blocked successfully",
    data: user,
  });
});

exports.unblockUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isDeleted) {
    return next(new AppError("Cannot unblock a deleted user", 400));
  }

  if (!preventAdminTargetAction(user, req.user, "Unblock", next)) {
    return;
  }

  if (!user.isBlocked) {
    return next(new AppError("User is already unblocked", 400));
  }

  user.isBlocked = false;

  await user.save();

  return res.status(200).json({
    message: "User unblocked successfully",
    data: user,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isDeleted) {
    return next(new AppError("User is already deleted", 400));
  }

  if (!preventAdminTargetAction(user, req.user, "Delete", next)) {
    return;
  }

  user.isDeleted = true;
  user.isBlocked = true;

  await user.save();

  return res.status(200).json({
    message: "User deleted successfully",
    data: user,
  });
});

exports.restoreUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (!user.isDeleted) {
    return next(new AppError("User is already active", 400));
  }

  if (!preventAdminTargetAction(user, req.user, "Restore", next)) {
    return;
  }

  user.isDeleted = false;
  user.isBlocked = false;

  await user.save();

  return res.status(200).json({
    message: "User restored successfully",
    data: user,
  });
});
