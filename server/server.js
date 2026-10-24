require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();

const cors = require("cors");

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5500"
  ]
}));

app.use(express.json());

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and WebP images allowed"));
    }
  }
});

// Test Express
app.get("/api/health", (req, res) => {
  res.json({
    message: "Timely backend is running!"
  });
});

// Test PostgreSQL
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    res.json({
      connected: true,
      databaseTime: result.rows[0].current_time
    });

  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

app.get("/api/tables-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM student_settings"
    );

    res.json({
      success: true,
      rows: Number(result.rows[0].count)
    });

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/api/settings/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: "Invalid settings ID"
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        height_cm,
        circumstances,
        campus_map IS NOT NULL AS has_campus_map,
        class_schedule IS NOT NULL AS has_schedule,
        created_at
       FROM student_settings
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Settings not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("GET settings error:", error.message);

    res.status(500).json({
      error: "Failed to retrieve settings"
    });
  }
});

app.get("/api/settings-test", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        height_cm,
        circumstances,
        campus_map IS NOT NULL AS has_campus_map,
        class_schedule IS NOT NULL AS has_schedule,
        created_at
      FROM student_settings
      ORDER BY id DESC
      LIMIT 10
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Read settings error:", error.message);

    res.status(500).json({
      error: "Could not retrieve settings"
    });
  }
});

app.get("/api/settings/:id/image/:type", async (req, res) => {
  try {
    const { id, type } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: "Invalid settings ID"
      });
    }

    const imageTypes = {
      campus: {
        data: "campus_map",
        mime: "campus_map_type"
      },
      schedule: {
        data: "class_schedule",
        mime: "class_schedule_type"
      }
    };

    const selected = imageTypes[type];

    if (!selected) {
      return res.status(400).json({
        error: "Invalid image type. Use campus or schedule."
      });
    }

    const result = await pool.query(
      `SELECT
        ${selected.data} AS image_data,
        ${selected.mime} AS image_type
       FROM student_settings
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Settings not found"
      });
    }

    const { image_data, image_type } = result.rows[0];

    if (!image_data) {
      return res.status(404).json({
        error: "Image not found"
      });
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (!allowedTypes.includes(image_type)) {
      return res.status(500).json({
        error: "Unsupported saved image type"
      });
    }

    res.set("Content-Type", image_type);
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Cache-Control", "no-store");

    res.send(image_data);

  } catch (error) {
    console.error("GET image error:", error.message);

    res.status(500).json({
      error: "Failed to retrieve image"
    });
  }
});

app.post(
  "/api/settings",
  upload.fields([
    { name: "campusMap", maxCount: 1 },
    { name: "classSchedule", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { height, circumstances } = req.body;

      const campusMap = req.files?.campusMap?.[0];
      const classSchedule = req.files?.classSchedule?.[0];

      const heightCm = Number(height);

      if (
        !Number.isInteger(heightCm) ||
        heightCm < 50 ||
        heightCm > 250
      ) {
        return res.status(400).json({
          error: "Please enter a valid height in cm"
        });
      }

      if (!campusMap || !classSchedule) {
        return res.status(400).json({
          error: "Both images are required"
        });
      }

      if (
        typeof circumstances !== "undefined" &&
        (typeof circumstances !== "string" ||
         circumstances.length > 1000)
      ) {
        return res.status(400).json({
          error: "Circumstances must be text under 1000 characters"
        });
      }

      const result = await pool.query(
        `INSERT INTO student_settings (
          height_cm,
          circumstances,
          campus_map,
          campus_map_type,
          class_schedule,
          class_schedule_type
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, height_cm, circumstances, created_at`,
        [
          heightCm,
          circumstances || null,
          campusMap.buffer,
          campusMap.mimetype,
          classSchedule.buffer,
          classSchedule.mimetype
        ]
      );

      res.status(201).json({
        message: "Settings saved successfully!",
        settings: result.rows[0]
      });

    } catch (error) {
      console.error("Save settings error:", error.message);

      res.status(500).json({
        error: "Could not save settings"
      });
    }
  }
);

app.use((err, req, res, next) => {
  console.error("Upload error:", err.message);

  res.status(400).json({
    error: err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Timely running on port ${PORT}`);
});