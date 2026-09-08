const DeliveryLocation = require("../models/deliveryLocation.model");
const { DELIVERY_LOCATIONS } = require("../utilities/deliveryLocation.util");

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const seedDefaults = async () => {
  await DeliveryLocation.updateMany(
    { isDeleted: { $exists: false } },
    { $set: { isDeleted: false } },
  );

  const count = await DeliveryLocation.countDocuments();

  if (count > 0) return;

  await DeliveryLocation.insertMany(
    DELIVERY_LOCATIONS.map((location) => ({
      governorate: location.governorate,
      cities: location.cities,
    })),
    { ordered: false },
  );
};

const getLocations = async () => {
  await seedDefaults();
  return DeliveryLocation.find({ isDeleted: false }).sort({ governorate: 1 });
};

const getLocation = async (governorate) => {
  await seedDefaults();
  const key = normalize(governorate);

  return DeliveryLocation.findOne({
    governorate: { $regex: `^${escapeRegex(key)}$`, $options: "i" },
    isDeleted: false,
  });
};

const getDeliveryFee = async (governorate, city) => {
  const location = await getLocation(governorate);

  if (!location) return null;

  const selectedCity = location.cities.find(
    (item) => normalize(item.name) === normalize(city),
  );

  return selectedCity ? Number(selectedCity.fee) : null;
};

const isValidLocation = async (governorate, city) =>
  (await getDeliveryFee(governorate, city)) !== null;

const createGovernorate = async (governorate) => {
  const exists = await DeliveryLocation.findOne({
    governorate: {
      $regex: `^${escapeRegex(normalize(governorate))}$`,
      $options: "i",
    },
  });

  if (exists) {
    if (!exists.isDeleted) return null;

    exists.isDeleted = false;
    exists.governorate = governorate.trim();
    exists.cities = [];
    await exists.save();
    return exists;
  }

  return DeliveryLocation.create({ governorate: governorate.trim(), cities: [] });
};

const addCity = async (governorate, name, fee) => {
  const location = await getLocation(governorate);

  if (!location) return { error: "not_found" };

  const exists = location.cities.some(
    (city) => normalize(city.name) === normalize(name),
  );

  if (exists) return { error: "exists" };

  location.cities.push({ name: name.trim(), fee: Number(fee) });
  await location.save();
  return { location };
};

const updateLocation = async (currentGovernorate, governorate, cities) => {
  const location = await getLocation(currentGovernorate);

  if (!location) return { error: "not_found" };

  const nextGovernorate = governorate.trim();
  const changedName = normalize(nextGovernorate) !== normalize(location.governorate);

  if (changedName) {
    const duplicate = await DeliveryLocation.findOne({
      _id: { $ne: location._id },
      isDeleted: false,
      governorate: {
        $regex: `^${escapeRegex(normalize(nextGovernorate))}$`,
        $options: "i",
      },
    });

    if (duplicate) return { error: "exists" };
    location.governorate = nextGovernorate;
  }

  location.cities = cities.map((city) => ({
    name: city.name.trim(),
    fee: Number(city.fee),
  }));

  await location.save();
  return { location };
};

const deleteGovernorate = async (governorate) => {
  const location = await getLocation(governorate);

  if (!location) return false;

  location.isDeleted = true;
  await location.save();
  return true;
};

const deleteCity = async (governorate, cityName) => {
  const location = await getLocation(governorate);

  if (!location) return { error: "not_found" };

  const before = location.cities.length;
  location.cities = location.cities.filter(
    (city) => normalize(city.name) !== normalize(cityName),
  );

  if (location.cities.length === before) return { error: "city_not_found" };

  await location.save();
  return { location };
};

module.exports = {
  getLocations,
  getLocation,
  getDeliveryFee,
  isValidLocation,
  createGovernorate,
  addCity,
  updateLocation,
  deleteGovernorate,
  deleteCity,
};
