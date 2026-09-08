require("dotenv").config();

const mongoose = require("mongoose");

const User = require("./models/user.model");
const Category = require("./models/category.model");
const SubCategory = require("./models/subCategory.model");
const Product = require("./models/product.model");
const FAQ = require("./models/faq.model");
const Testimonial = require("./models/testimonial.model");

const shouldReset = process.argv.includes("--reset");

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function seed() {
  const options = process.env.DB_NAME ? { dbName: process.env.DB_NAME } : {};
  await mongoose.connect(process.env.DB_URI, options);
  console.log(`Connected to MongoDB (${mongoose.connection.name})`);

  if (shouldReset) {
    console.log("Resetting collections...");
    await Promise.all([
      User.deleteMany({ role: "customer" }),
      User.deleteMany({ email: "admin@ezstore.com" }),
      Category.deleteMany({}),
      SubCategory.deleteMany({}),
      Product.deleteMany({}),
      FAQ.deleteMany({}),
      Testimonial.deleteMany({}),
    ]);
  }

  let admin = await User.findOne({ email: "admin@ezstore.com" });
  if (!admin) {
    admin = await User.create({
      name: "Store Admin",
      email: "admin@ezstore.com",
      password: "Admin@123",
      role: "admin",
      gender: "male",
      DOB: new Date("1990-01-01"),
      mobilePhone: "01000000000",
    });
    console.log("Created admin user -> admin@ezstore.com / Admin@123");
  } else {
    console.log("Admin user already exists, skipping.");
  }

  const customerSeeds = [
    {
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      gender: "male",
      DOB: new Date("1996-05-12"),
      mobilePhone: "01111111111",
      addresses: [
        {
          label: "Home",
          governorate: "Cairo",
          city: "Nasr City",
          street: "12 Makram Ebeid St.",
          isDefault: true,
        },
      ],
    },
    {
      name: "Mona Ali",
      email: "mona@example.com",
      gender: "female",
      DOB: new Date("1998-09-23"),
      mobilePhone: "01222222222",
      addresses: [
        {
          label: "Home",
          governorate: "Giza",
          city: "6th of October",
          street: "5 Hosary St.",
          isDefault: true,
        },
      ],
    },
    {
      name: "Youssef Ibrahim",
      email: "youssef@example.com",
      gender: "male",
      DOB: new Date("1993-02-17"),
      mobilePhone: "01333333333",
      addresses: [
        {
          label: "Work",
          governorate: "Alexandria",
          city: "Smouha",
          street: "20 Fouad St.",
          isDefault: true,
        },
      ],
    },
  ];

  const customers = [];
  for (const seedUser of customerSeeds) {
    let user = await User.findOne({ email: seedUser.email });
    if (!user) {
      user = await User.create({ ...seedUser, password: "Customer@123", role: "customer" });
      console.log(`Created customer -> ${seedUser.email} / Customer@123`);
    }
    customers.push(user);
  }

  const categoryDefs = [
    {
      name: "Men",
      subcategories: ["T-Shirts", "Jackets", "Jeans", "Shirts"],
    },
    {
      name: "Women",
      subcategories: ["Dresses", "Blouses", "Jeans", "Abayas"],
    },
    {
      name: "Kids",
      subcategories: ["T-Shirts", "Dresses", "Pajamas", "Jackets"],
    },
    {
      name: "Accessories",
      subcategories: ["Bags", "Belts", "Scarves", "Sunglasses"],
    },
  ];

  const categoriesByName = {};
  const subcategoriesByKey = {};

  for (const def of categoryDefs) {
    const slug = slugify(def.name);
    let category = await Category.findOne({ slug });
    if (!category) {
      category = await Category.create({ name: def.name, slug, isActive: true });
      console.log(`Created category -> ${def.name}`);
    }
    categoriesByName[def.name] = category;

    for (const subName of def.subcategories) {
      const subSlug = slugify(`${def.name}-${subName}`);
      let subCategory = await SubCategory.findOne({ slug: subSlug });
      if (!subCategory) {
        subCategory = await SubCategory.create({
          name: subName,
          slug: subSlug,
          categoryId: category._id,
          isActive: true,
        });
        console.log(`  Created subcategory -> ${def.name} / ${subName}`);
      }
      subcategoriesByKey[`${def.name}:${subName}`] = subCategory;
    }
  }

  const productDefs = [
    { name: "Classic Cotton T-Shirt", cat: "Men", sub: "T-Shirts", price: 350, stock: 60, season: "all", images: ["mens-classic-tshirt.jpg"], description: "Soft breathable cotton t-shirt, perfect for everyday wear." },
    { name: "Slim Fit Denim Jacket", cat: "Men", sub: "Jackets", price: 950, stock: 25, season: "winter", images: ["mens-denim-jacket.jpg"], description: "Durable denim jacket with a modern slim fit cut." },
    { name: "Slim Fit Jeans", cat: "Men", sub: "Jeans", price: 720, stock: 40, season: "all", images: ["mens-slim-jeans.jpg"], description: "Comfortable stretch denim jeans with a tailored slim fit." },
    { name: "Formal Business Shirt", cat: "Men", sub: "Shirts", price: 550, stock: 35, season: "all", images: ["mens-formal-shirt.jpg"], description: "Wrinkle-resistant formal shirt, ideal for the office." },
    { name: "Pullover Hoodie", cat: "Men", sub: "Jackets", price: 680, stock: 30, season: "winter", images: ["mens-hoodie.jpg"], description: "Warm fleece-lined hoodie with a relaxed fit." },
    { name: "Casual Chino Shorts", cat: "Men", sub: "Jeans", price: 420, stock: 45, season: "summer", images: ["mens-shorts.jpg"], description: "Lightweight chino shorts for warm summer days." },

    { name: "Floral Summer Dress", cat: "Women", sub: "Dresses", price: 850, stock: 20, season: "summer", images: ["womens-summer-dress.jpg"], description: "Flowy floral dress made from breathable fabric." },
    { name: "Chiffon Blouse", cat: "Women", sub: "Blouses", price: 480, stock: 30, season: "all", images: ["womens-blouse.jpg"], description: "Elegant chiffon blouse suitable for work or evenings out." },
    { name: "High-Waist Skinny Jeans", cat: "Women", sub: "Jeans", price: 690, stock: 35, season: "all", images: ["womens-skinny-jeans.jpg"], description: "Figure-flattering high-waist skinny jeans." },
    { name: "Knit Cardigan", cat: "Women", sub: "Blouses", price: 590, stock: 28, season: "winter", images: ["womens-cardigan.jpg"], description: "Cozy knit cardigan, perfect for layering." },
    { name: "Elegant Embroidered Abaya", cat: "Women", sub: "Abayas", price: 1200, stock: 18, season: "all", images: ["womens-abaya.jpg"], description: "Modest embroidered abaya with premium finishing." },
    { name: "Pleated Midi Skirt", cat: "Women", sub: "Dresses", price: 520, stock: 24, season: "spring", images: ["womens-skirt.jpg"], description: "Flattering pleated midi skirt for a polished look." },

    { name: "Kids Graphic T-Shirt Set", cat: "Kids", sub: "T-Shirts", price: 280, stock: 50, season: "all", images: ["kids-tshirt-set.jpg"], description: "Fun graphic t-shirt set for active kids." },
    { name: "Kids Party Dress", cat: "Kids", sub: "Dresses", price: 460, stock: 22, season: "all", images: ["kids-dress.jpg"], description: "Adorable party dress for special occasions." },
    { name: "Kids Cotton Pajamas", cat: "Kids", sub: "Pajamas", price: 320, stock: 40, season: "all", images: ["kids-pajamas.jpg"], description: "Soft cotton pajama set for comfortable sleep." },
    { name: "Kids Winter Jacket", cat: "Kids", sub: "Jackets", price: 580, stock: 26, season: "winter", images: ["kids-jacket.jpg"], description: "Warm padded jacket to keep kids cozy in winter." },

    { name: "Leather Handbag", cat: "Accessories", sub: "Bags", price: 890, stock: 15, season: "all", images: ["accessories-leather-bag.jpg"], description: "Genuine leather handbag with spacious compartments." },
    { name: "Classic Leather Belt", cat: "Accessories", sub: "Belts", price: 260, stock: 45, season: "all", images: ["accessories-belt.jpg"], description: "Durable leather belt with a classic buckle." },
    { name: "Wool Winter Scarf", cat: "Accessories", sub: "Scarves", price: 220, stock: 38, season: "winter", images: ["accessories-scarf.jpg"], description: "Soft wool scarf to keep warm through winter." },
    { name: "Polarized Sunglasses", cat: "Accessories", sub: "Sunglasses", price: 390, stock: 32, season: "summer", images: ["accessories-sunglasses.jpg"], description: "UV-protective polarized sunglasses with a sleek frame." },
  ];

  let productsCreated = 0;

  for (const def of productDefs) {
    const slug = slugify(def.name);
    const existing = await Product.findOne({ slug });
    if (existing) {
      continue;
    }

    const category = categoriesByName[def.cat];
    const subCategory = subcategoriesByKey[`${def.cat}:${def.sub}`];

    await Product.create({
      name: def.name,
      description: def.description,
      price: def.price,
      images: def.images,
      categoryId: category._id,
      subCategoryId: subCategory._id,
      season: def.season,
      slug,
      stockQuantity: def.stock,
      isActive: true,
    });

    productsCreated += 1;
  }

  console.log(`Created ${productsCreated} products (skipped existing).`);

  const faqDefs = [
    { question: "How long does delivery take?", answer: "Orders are typically delivered within 2-5 business days depending on your location." },
    { question: "What payment methods do you accept?", answer: "We currently accept cash on delivery for all orders." },
    { question: "Can I return or exchange an item?", answer: "Yes, items can be returned within 14 days of delivery, provided they are unused and in original packaging." },
    { question: "How do I track my order?", answer: "You can track your order status anytime from the 'My Orders' section of your account." },
    { question: "Do you ship outside Egypt?", answer: "Currently we only deliver within Egypt. International shipping is coming soon." },
    { question: "How can I cancel an order?", answer: "You can cancel an order from the order details page as long as it hasn't been confirmed for shipping yet." },
  ];

  let faqsCreated = 0;
  for (const def of faqDefs) {
    const existing = await FAQ.findOne({ question: def.question });
    if (!existing) {
      await FAQ.create({ ...def, isActive: true });
      faqsCreated += 1;
    }
  }
  console.log(`Created ${faqsCreated} FAQs (skipped existing).`);

  const testimonialDefs = [
    { message: "Amazing quality and super fast delivery. Will definitely order again!", rating: 5, status: "approved" },
    { message: "The clothes look exactly like the pictures. Very happy with my purchase.", rating: 5, status: "approved" },
    { message: "Good products overall, but delivery took a bit longer than expected.", rating: 4, status: "approved" },
    { message: "Great customer service and easy returns process.", rating: 5, status: "pending" },
    { message: "Nice variety of styles, prices are reasonable too.", rating: 4, status: "pending" },
  ];

  let testimonialsCreated = 0;
  for (let i = 0; i < testimonialDefs.length; i++) {
    const def = testimonialDefs[i];
    const user = customers[i % customers.length];

    const existing = await Testimonial.findOne({ userId: user._id, message: def.message });
    if (!existing) {
      await Testimonial.create({ ...def, userId: user._id });
      testimonialsCreated += 1;
    }
  }
  console.log(`Created ${testimonialsCreated} testimonials (skipped existing).`);

  console.log("\nSeeding complete!");
  console.log("--------------------------------------------------");
  console.log("Admin login   -> admin@ezstore.com / Admin@123");
  console.log("Customer login-> ahmed@example.com / Customer@123");
  console.log("               (also mona@example.com, youssef@example.com)");
  console.log("--------------------------------------------------");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
