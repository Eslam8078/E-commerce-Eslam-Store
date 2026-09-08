const express = require("express");
const {
  getMyNotificationsHandler,
  markAllAsRead,
  getNotificationById,
  markAsRead,
  deleteNotification,
} = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.get("/", getMyNotificationsHandler);
router.patch("/read-all", markAllAsRead);
router.get("/:id", getNotificationById);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;