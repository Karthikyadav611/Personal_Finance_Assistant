const express = require("express");

const { uploadStatement, importConfirmed } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

let multer = null;
try {
  // eslint-disable-next-line global-require
  multer = require("multer");
} catch (_error) {
  multer = null;
}

if (!multer) {
  router.post("/statement", protect, (_req, res) => {
    res.status(500).json({
      success: false,
      message: 'File upload is not available because dependency "multer" is missing. Run: npm install multer',
      data: null,
    });
  });
} else {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      // Keep this under Vercel's 4.5MB payload limit to reduce surprises in production.
      fileSize: 4 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      const name = String(file.originalname || "").toLowerCase();
      if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".pdf")) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported file type. Upload CSV, XLSX, or PDF."));
      }
    },
  });

  router.post("/statement", protect, upload.single("file"), uploadStatement);
}

router.post("/import-confirmed", protect, importConfirmed);

module.exports = router;

