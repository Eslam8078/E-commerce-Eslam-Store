const backupService = require("../services/backup.service");

const catchAsync = require("../utilities/catchAsync.util");
const AppError = require("../utilities/appError.util");

exports.createBackup = catchAsync(async (req, res, next) => {
  const backup = await backupService.createBackup();

  res.status(201).json({
    message: "Backup created successfully",
    data: backup,
  });
});

exports.listBackups = catchAsync(async (req, res, next) => {
  const backups = backupService.listBackups();

  res.status(200).json({
    message: "Backups list",
    count: backups.length,
    data: backups,
  });
});

exports.restoreBackup = catchAsync(async (req, res, next) => {
  const { fileName } = req.body;

  if (!fileName) {
    return next(new AppError("Backup file name is required", 400));
  }

  await backupService.restoreBackup(fileName);

  res.status(200).json({
    message: "Backup restored successfully",
  });
});
