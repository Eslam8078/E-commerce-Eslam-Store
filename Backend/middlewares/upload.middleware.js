const fs = require("fs");
const path = require("path");
const multer = require("multer");
const AppError = require("../utilities/appError.util");

const UPLOAD_DIR = "uploads";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExtensions = [".png", ".jpg", ".jpeg"];
  const allowedMimeTypes = ["image/png", "image/jpeg"];

  if (
    !allowedExtensions.includes(ext) ||
    !allowedMimeTypes.includes(file.mimetype)
  ) {
    return cb(new AppError("Only PNG and JPG images are allowed", 400), false);
  }

  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, filename);
  },
});

const MB = 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MB * 2,
  },
});

module.exports = { upload };