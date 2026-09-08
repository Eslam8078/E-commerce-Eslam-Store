const express = require("express");

const {
  listBackups,
  createBackup,
  restoreBackup,
} = require("../controllers/backup.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/authorization.middleware");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/", listBackups);
router.post("/", createBackup);
router.post("/restore", restoreBackup);

module.exports = router;