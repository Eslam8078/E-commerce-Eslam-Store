const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const logger = require("../utilities/logger.util");

const createBirthdayNotifications = async (date = new Date()) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const users = await User.find({
    role: "customer",
    isDeleted: false,
    isBlocked: false,
    DOB: { $ne: null },
  }).select("_id name DOB");

  let created = 0;

  for (const user of users) {
    if (user.DOB.getMonth() + 1 !== month || user.DOB.getDate() !== day) continue;

    const exists = await Notification.exists({
      userId: user._id,
      type: "birthday",
      birthdayYear: year,
    });

    if (exists) continue;

    await Notification.create({
      userId: user._id,
      type: "birthday",
      birthdayYear: year,
      message: `Happy birthday, ${user.name}!`,
    });
    created += 1;
  }

  logger.info(`Birthday notifications processed | date:${date.toISOString().slice(0, 10)} | created:${created}`);
  return created;
};

const startBirthdayNotificationScheduler = () => {
  const run = () => createBirthdayNotifications().catch((error) => logger.error(`Birthday notification job failed | error:${error.message}`));
  run();
  return setInterval(run, 24 * 60 * 60 * 1000);
};

module.exports = { createBirthdayNotifications, startBirthdayNotificationScheduler };
