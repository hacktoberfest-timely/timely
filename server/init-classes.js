require("dotenv").config();

const pool = require("./db");

async function initClasses() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        settings_id INTEGER NOT NULL
          REFERENCES student_settings(id)
          ON DELETE CASCADE,
        course TEXT NOT NULL,
        day TEXT NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME,
        location TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("Classes table created!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initClasses();