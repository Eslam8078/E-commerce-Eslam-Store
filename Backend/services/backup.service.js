const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

const AppError = require("../utilities/appError.util");
const logger = require("../utilities/logger.util");

const BACKUP_DIR = path.join(process.cwd(), "backups");

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

const buildBackupFileName = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `backup-${timestamp}.gz`;
};

const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });

exports.createBackup = async () => {
  ensureBackupDir();

  const fileName = buildBackupFileName();
  const filePath = path.join(BACKUP_DIR, fileName);

  const args = [
    `--uri=${process.env.DB_URI}`,
    `--archive=${filePath}`,
    "--gzip",
  ];

  if (process.env.DB_NAME) {
    args.push(`--db=${process.env.DB_NAME}`);
  }

  try {
    await runCommand("mongodump", args);
  } catch (err) {
    logger.error(`Backup failed | ${err.message}`);
    throw new AppError("Failed to create database backup", 500);
  }

  const stats = fs.statSync(filePath);

  logger.info(`Backup created | file:${fileName} | size:${stats.size}`);

  return {
    fileName,
    sizeInBytes: stats.size,
    createdAt: stats.birthtime,
  };
};

exports.listBackups = () => {
  ensureBackupDir();

  return fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith(".gz"))
    .map((file) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        fileName: file,
        sizeInBytes: stats.size,
        createdAt: stats.birthtime,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
};

exports.restoreBackup = async (fileName) => {
  const safeName = path.basename(fileName);
  const filePath = path.join(BACKUP_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    throw new AppError("Backup file not found", 404);
  }

  const args = [
    `--uri=${process.env.DB_URI}`,
    `--archive=${filePath}`,
    "--gzip",
    "--drop",
  ];

  try {
    await runCommand("mongorestore", args);
  } catch (err) {
    logger.error(`Restore failed | file:${safeName} | ${err.message}`);
    throw new AppError("Failed to restore database backup", 500);
  }

  logger.info(`Backup restored | file:${safeName}`);
};
