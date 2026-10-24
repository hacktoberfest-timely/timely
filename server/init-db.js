require("dotenv").config();

const pool = require("./db");

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_settings (
        id SERIAL PRIMARY KEY,
        height_cm INTEGER NOT NULL,
        circumstances TEXT,
        campus_map BYTEA,
        campus_map_type TEXT,
        class_schedule BYTEA,
        class_schedule_type TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("Table created successfully!");

  } catch (error) {
    console.error("Error creating table:", error.message);
  } finally {
    await pool.end();
  }
}

initDB();