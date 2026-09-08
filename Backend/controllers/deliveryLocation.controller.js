const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");
const deliveryService = require("../services/deliveryLocation.service");

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const validCities = (cities) =>
  Array.isArray(cities) &&
  cities.every(
    (city) =>
      city &&
      typeof city.name === "string" &&
      city.name.trim() &&
      Number.isFinite(Number(city.fee)) &&
      Number(city.fee) >= 0,
  );

exports.getDeliveryLocations = catchAsync(async (req, res) => {
  const locations = await deliveryService.getLocations();

  res.status(200).json({
    message: "Delivery locations",
    data: locations,
  });
});

exports.createGovernorate = catchAsync(async (req, res, next) => {
  const governorate = clean(req.body.governorate);

  if (!governorate) {
    return next(new AppError("Governorate name is required", 400));
  }

  const location = await deliveryService.createGovernorate(governorate);

  if (!location) {
    return next(new AppError("Governorate already exists", 409));
  }

  res.status(201).json({
    message: "Governorate added successfully",
    data: location,
  });
});

exports.addCity = catchAsync(async (req, res, next) => {
  const governorate = clean(req.params.governorate);
  const name = clean(req.body.name);
  const fee = Number(req.body.fee);

  if (!governorate || !name) {
    return next(new AppError("Governorate and city name are required", 400));
  }

  if (!Number.isFinite(fee) || fee < 0) {
    return next(new AppError("City fee must be a valid number", 400));
  }

  const result = await deliveryService.addCity(governorate, name, fee);

  if (result.error === "not_found") {
    return next(new AppError("Governorate not found", 404));
  }

  if (result.error === "exists") {
    return next(new AppError("City already exists in this governorate", 409));
  }

  res.status(201).json({
    message: "City added successfully",
    data: result.location,
  });
});

exports.updateDeliveryLocation = catchAsync(async (req, res, next) => {
  const currentGovernorate = clean(req.params.governorate);
  const governorate = clean(req.body.governorate || currentGovernorate);
  const cities = req.body.cities;

  if (!currentGovernorate || !governorate) {
    return next(new AppError("Governorate is required", 400));
  }

  if (!validCities(cities)) {
    return next(new AppError("Cities must contain valid names and fees", 400));
  }

  const duplicateNames = new Set();
  for (const city of cities) {
    const name = clean(city.name).toLowerCase();
    if (duplicateNames.has(name)) {
      return next(new AppError("City names must be unique", 400));
    }
    duplicateNames.add(name);
  }

  const result = await deliveryService.updateLocation(
    currentGovernorate,
    governorate,
    cities,
  );

  if (result.error === "not_found") {
    return next(new AppError("Governorate not found", 404));
  }

  if (result.error === "exists") {
    return next(new AppError("Governorate already exists", 409));
  }

  res.status(200).json({
    message: "Delivery location updated successfully",
    data: result.location,
  });
});

exports.deleteGovernorate = catchAsync(async (req, res, next) => {
  const governorate = clean(req.params.governorate);

  if (!governorate) {
    return next(new AppError("Governorate is required", 400));
  }

  const deleted = await deliveryService.deleteGovernorate(governorate);

  if (!deleted) {
    return next(new AppError("Governorate not found", 404));
  }

  res.status(200).json({ message: "Governorate deleted successfully" });
});

exports.deleteCity = catchAsync(async (req, res, next) => {
  const governorate = clean(req.params.governorate);
  const cityName = clean(req.params.city);

  if (!governorate || !cityName) {
    return next(new AppError("Governorate and city are required", 400));
  }

  const result = await deliveryService.deleteCity(governorate, cityName);

  if (result.error === "not_found") {
    return next(new AppError("Governorate not found", 404));
  }

  if (result.error === "city_not_found") {
    return next(new AppError("City not found", 404));
  }

  res.status(200).json({
    message: "City deleted successfully",
    data: result.location,
  });
});
