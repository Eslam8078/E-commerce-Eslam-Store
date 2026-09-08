const DELIVERY_LOCATIONS = [
  {
    governorate: "Cairo",
    cities: [
      { name: "Cairo", fee: 50 },
      { name: "Nasr City", fee: 50 },
      { name: "Heliopolis", fee: 50 },
      { name: "Maadi", fee: 55 },
      { name: "New Cairo", fee: 60 },
    ],
  },
  {
    governorate: "Giza",
    cities: [
      { name: "Giza", fee: 55 },
      { name: "Dokki", fee: 55 },
      { name: "Mohandessin", fee: 55 },
      { name: "Haram", fee: 55 },
      { name: "6th October", fee: 65 },
      { name: "Sheikh Zayed", fee: 65 },
    ],
  },
  {
    governorate: "Alexandria",
    cities: [
      { name: "Alexandria", fee: 70 },
      { name: "Borg El Arab", fee: 80 },
    ],
  },
  {
    governorate: "Qalyubia",
    cities: [
      { name: "Shubra El Kheima", fee: 60 },
      { name: "Qalyub", fee: 60 },
      { name: "Banha", fee: 65 },
    ],
  },
  {
    governorate: "Sharqia",
    cities: [
      { name: "Zagazig", fee: 75 },
      { name: "10th of Ramadan", fee: 75 },
    ],
  },
  {
    governorate: "Dakahlia",
    cities: [
      { name: "Mansoura", fee: 80 },
      { name: "Mit Ghamr", fee: 85 },
    ],
  },
  {
    governorate: "Gharbia",
    cities: [
      { name: "Tanta", fee: 80 },
      { name: "Mahalla El Kubra", fee: 85 },
    ],
  },
  {
    governorate: "Beheira",
    cities: [{ name: "Damanhur", fee: 85 }],
  },
  {
    governorate: "Kafr El Sheikh",
    cities: [{ name: "Kafr El Sheikh", fee: 85 }],
  },
  {
    governorate: "Damietta",
    cities: [{ name: "Damietta", fee: 85 }],
  },
  {
    governorate: "Port Said",
    cities: [{ name: "Port Said", fee: 80 }],
  },
  {
    governorate: "Ismailia",
    cities: [{ name: "Ismailia", fee: 80 }],
  },
  {
    governorate: "Suez",
    cities: [{ name: "Suez", fee: 80 }],
  },
  {
    governorate: "Fayoum",
    cities: [{ name: "Fayoum", fee: 85 }],
  },
  {
    governorate: "Beni Suef",
    cities: [{ name: "Beni Suef", fee: 90 }],
  },
  {
    governorate: "Minya",
    cities: [{ name: "Minya", fee: 95 }],
  },
  {
    governorate: "Assiut",
    cities: [{ name: "Assiut", fee: 100 }],
  },
  {
    governorate: "Sohag",
    cities: [{ name: "Sohag", fee: 105 }],
  },
  {
    governorate: "Qena",
    cities: [{ name: "Qena", fee: 110 }],
  },
  {
    governorate: "Luxor",
    cities: [{ name: "Luxor", fee: 110 }],
  },
  {
    governorate: "Aswan",
    cities: [{ name: "Aswan", fee: 120 }],
  },
  {
    governorate: "Red Sea",
    cities: [{ name: "Hurghada", fee: 120 }],
  },
  {
    governorate: "New Valley",
    cities: [{ name: "Kharga", fee: 130 }],
  },
  {
    governorate: "Matrouh",
    cities: [{ name: "Marsa Matruh", fee: 120 }],
  },
  {
    governorate: "North Sinai",
    cities: [{ name: "Arish", fee: 120 }],
  },
  {
    governorate: "South Sinai",
    cities: [{ name: "Sharm El Sheikh", fee: 130 }],
  },
];

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const findGovernorate = (governorate) =>
  DELIVERY_LOCATIONS.find(
    (item) => normalize(item.governorate) === normalize(governorate),
  );

const findCity = (governorate, city) => {
  const location = findGovernorate(governorate);
  if (!location) return null;

  return location.cities.find(
    (item) => normalize(item.name) === normalize(city),
  );
};

const getDeliveryFee = (governorate, city) =>
  findCity(governorate, city)?.fee ?? null;

const isValidLocation = (governorate, city) =>
  Boolean(findCity(governorate, city));

module.exports = {
  DELIVERY_LOCATIONS,
  getDeliveryFee,
  isValidLocation,
};
