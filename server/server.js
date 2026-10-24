require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();

app.use(express.json());

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

const PORT = process.env.PORT || 3000;

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Timely running on port ${PORT}`);
});