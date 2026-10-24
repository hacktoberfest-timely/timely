require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();

const { analyzeSchedule } = require("./gemma");

const { calculateNextDeparture } = require("./departure");

const { estimateWalk } = require("./walking");

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

      if (!classSchedule) {
        return res.status(400).json({
            error: "Class schedule image is required"
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
          campusMap?.buffer ?? null,
          campusMap?.mimetype ?? null,
          campusMap?.buffer ?? null,
          campusMap?.mimetype ?? null,
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

app.get("/api/settings/:id/classes", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: "Invalid settings ID"
      });
    }

    const result = await pool.query(
      `SELECT id, course, day,
              start_time, end_time, location
       FROM classes
       WHERE settings_id = $1
       ORDER BY CASE day
         WHEN 'Monday' THEN 1
         WHEN 'Tuesday' THEN 2
         WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4
         WHEN 'Friday' THEN 5
         WHEN 'Saturday' THEN 6
         ELSE 7
       END, start_time`,
      [id]
    );

    res.json({
      classes: result.rows
    });

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      error: "Could not retrieve classes"
    });
  }
});

app.get("/api/settings/:id/next-departure", async (req, res) => {
  try {
    const { id } = req.params;

    const walkMinutes = Number(req.query.walkMinutes);
    const bufferMinutes = req.query.bufferMinutes === undefined
      ? 5
      : Number(req.query.bufferMinutes);

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: "Invalid settings ID"
      });
    }

    if (
      !Number.isInteger(walkMinutes) ||
      walkMinutes < 1 ||
      walkMinutes > 120 ||
      !Number.isInteger(bufferMinutes) ||
      bufferMinutes < 0 ||
      bufferMinutes > 60
    ) {
      return res.status(400).json({
        error: "Invalid walking time or buffer"
      });
    }

    const result = await pool.query(
      `SELECT course, day, start_time, location
       FROM classes
       WHERE settings_id = $1`,
      [id]
    );

    const nextDeparture = calculateNextDeparture(
      result.rows,
      walkMinutes,
      bufferMinutes
    );

    if (!nextDeparture) {
      return res.status(404).json({
        error: "No upcoming classes found"
      });
    }

    res.json({
      message: "Next departure calculated!",
      nextDeparture
    });

  } catch (error) {
    console.error("Departure error:", error.message);

    res.status(500).json({
      error: "Could not calculate departure"
    });
  }
});

app.use((err, req, res, next) => {
  console.error("Upload error:", err.message);

  res.status(400).json({
    error: err.message
  });
});

// prevent public access to AI analysis if disabled
function requireAIEnabled(req, res, next) {
  if (process.env.ENABLE_PUBLIC_AI !== "true") {
    return res.status(503).json({
      error: "AI analysis is temporarily disabled"
    });
  }

  next();
}

app.post("/api/settings/:id/analyze-schedule",
    requireAIEnabled,
    async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: "Invalid settings ID"
      });
    }

    // 1. Get the saved schedule image
    const result = await pool.query(
      `SELECT class_schedule, class_schedule_type
       FROM student_settings
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Settings not found"
      });
    }

    const schedule = result.rows[0];

    if (!schedule.class_schedule) {
      return res.status(400).json({
        error: "No class schedule uploaded"
      });
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (!allowedTypes.includes(schedule.class_schedule_type)) {
      return res.status(400).json({
        error: "Unsupported image type"
      });
    }

    // 2. Ask Gemma 4 to analyze it
    const extracted = await analyzeSchedule(
      schedule.class_schedule,
      schedule.class_schedule_type
    );

    // 3. Return the extracted classes
    res.json({
      message: "Schedule analyzed successfully!",
      settingsId: Number(id),
      classes: extracted.classes
    });

  } catch (error) {
    console.error("Gemma analysis error:", error.message);

    res.status(500).json({
      error: "Failed to analyze schedule"
    });
  }
});

app.post("/api/settings/:id/classes", async (req, res) => {
  const { id } = req.params;
  const { classes } = req.body;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      error: "Invalid settings ID"
    });
  }

  if (!Array.isArray(classes) || classes.length > 50) {
    return res.status(400).json({
      error: "Expected an array of up to 50 classes"
    });
  }

  const validDays = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const validTime = (time) =>
    typeof time === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

  for (const c of classes) {
    if (
      !c ||
      typeof c.course !== "string" ||
      !c.course.trim() ||
      c.course.length > 200 ||
      !validDays.includes(c.day) ||
      !validTime(c.startTime) ||
      (c.endTime != null && !validTime(c.endTime)) ||
      (c.location != null &&
        (typeof c.location !== "string" ||
         c.location.length > 200))
    ) {
      return res.status(400).json({
        error: "Invalid class data. Review the schedule."
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const settings = await client.query(
      "SELECT id FROM student_settings WHERE id = $1",
      [id]
    );

    if (settings.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Settings not found"
      });
    }

    // Replace previously saved classes
    await client.query(
      "DELETE FROM classes WHERE settings_id = $1",
      [id]
    );

    for (const c of classes) {
      await client.query(
        `INSERT INTO classes
         (settings_id, course, day,
          start_time, end_time, location)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          c.course.trim(),
          c.day,
          c.startTime,
          c.endTime ?? null,
          c.location ?? null
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Classes saved successfully!",
      count: classes.length
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error.message);

    res.status(500).json({
      error: "Could not save classes"
    });
  } finally {
    client.release();
  }
});

app.post("/api/estimate-walk", async (req, res) => {
  try {
    const {
      startLocation,
      latitude,
      longitude,
      destination,
      classStart
    } = req.body;

    const hasGPS =
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180;

    const hasLocationName =
      typeof startLocation === "string" &&
      startLocation.trim().length > 0 &&
      startLocation.length <= 150;

    if (
      (!hasGPS && !hasLocationName) ||
      typeof destination !== "string" ||
      !destination.trim() ||
      destination.length > 150 ||
      typeof classStart !== "string"
    ) {
      return res.status(400).json({
        error: "Valid location, destination and class time required"
      });
    }

    const origin = hasGPS
      ? `GPS coordinates at latitude ${latitude}, longitude ${longitude}, near UC Santa Cruz`
      : startLocation;

    const result = await estimateWalk(
      origin,
      destination,
      classStart
    );

    res.json(result);

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      error: "Could not estimate walking time"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Timely running on port ${PORT}`);
});