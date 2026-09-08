const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
    },
    process.env.SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );

const normalizeEmail = (email) => {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, gender, DOB, mobilePhone, nationalId } = req.body;

  if (!name || !email || !password || !gender || !DOB) {

    return next(
      new AppError(
        "Name, email, password, gender and date of birth are required",
        400,
      ),
    );
  }

  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName || !normalizedEmail) {
    return next(new AppError("Name and email must be valid strings", 400));
  }

  const allowedGenders = ["male", "female"];

  if (!allowedGenders.includes(gender)) {
    return next(new AppError("Gender must be male or female", 400));
  }

  if (
    mobilePhone !== undefined &&
    (typeof mobilePhone !== "string" || !/^01[0125]\d{8}$/.test(mobilePhone.trim()))
  ) {
    return next(new AppError("Please provide a valid Egyptian mobile phone number", 400));
  }

  if (
    nationalId !== undefined &&
    (typeof nationalId !== "string" || !/^\d{14}$/.test(nationalId.trim()))
  ) {
    return next(new AppError("National ID must contain exactly 14 digits", 400));
  }

  const birthDate = new Date(DOB);

  if (Number.isNaN(birthDate.getTime())) {
    return next(new AppError("Invalid date of birth", 400));
  }

  if (birthDate > new Date()) {
    return next(new AppError("Date of birth cannot be in the future", 400));
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    return next(new AppError("Email already exists", 409));
  }

  const newUser = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password,
    role: "customer",
    gender,
    DOB: birthDate,
    mobilePhone: mobilePhone?.trim() || undefined,
    nationalId: nationalId?.trim() || undefined,
  });

  const accessToken = signToken(newUser);

  const user = {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    gender: newUser.gender,
    mobilePhone: newUser.mobilePhone,
    nationalId: newUser.nationalId,
    DOB: newUser.DOB,
    isBlocked: newUser.isBlocked,
    isDeleted: newUser.isDeleted,
    addresses: newUser.addresses,
  };

  return res.status(201).json({
    message: "Registered successfully",
    data: {
      token: accessToken,
      user,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {

    return next(new AppError("Email and password are required", 400));
  }

  const normalizedEmail = normalizeEmail(email);

  const myUser = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!myUser) {

    return next(new AppError("Invalid email or password", 401));
  }

  const isPasswordCorrect = await myUser.isCorrectPassword(password);

  if (!isPasswordCorrect) {

    return next(new AppError("Invalid email or password", 401));
  }

  if (myUser.isDeleted) {
    return next(new AppError("This account no longer exists", 401));
  }

  if (myUser.isBlocked) {
    return next(new AppError("Your account has been blocked", 403));
  }

  const accessToken = signToken(myUser);

  const user = {
    _id: myUser._id,
    name: myUser.name,
    email: myUser.email,
    role: myUser.role,
    gender: myUser.gender,
    mobilePhone: myUser.mobilePhone,
    nationalId: myUser.nationalId,
    DOB: myUser.DOB,
    isBlocked: myUser.isBlocked,
    isDeleted: myUser.isDeleted,
    addresses: myUser.addresses,
  };

  return res.status(200).json({
    message: "Logged in successfully",
    data: {
      token: accessToken,
      user,
    },
  });
});
