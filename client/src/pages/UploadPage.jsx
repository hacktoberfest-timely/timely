import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL
  || "http://localhost:3000";

function UploadPage() {
  const [height, setHeight] = useState("");
  const [circumstances, setCircumstances] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [classes, setClasses] = useState([]);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setClasses([]);

    try {
      // Step 1: Prepare user inputs
      const formData = new FormData();

      formData.append("height", height);
      formData.append("circumstances", circumstances);
      formData.append("classSchedule", schedule);

      // Step 2: Save inputs in PostgreSQL
      const saveResponse = await fetch(
        `${API_URL}/api/settings`,
        {
          method: "POST",
          body: formData
        }
      );

      const saved = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saved.error || "Upload failed");
      }

      const id = saved.settings.id;
      setSettingsId(id);

      // Step 3: Ask Gemma 4 to analyze the schedule
      const aiResponse = await fetch(
        `${API_URL}/api/settings/${id}/analyze-schedule`,
        {
          method: "POST"
        }
      );

      const analysis = await aiResponse.json();

      if (!aiResponse.ok) {
        throw new Error(
          analysis.error || "Schedule analysis failed"
        );
      }

      // Step 4: Display extracted classes
      setClasses(analysis.classes);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Upload Your Schedule</h1>
      <p>Let Timely help you get to class on time!</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Height (cm)</label>
          <input
            type="number"
            min="50"
            max="250"
            step="1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Special Circumstances (optional)</label>
          <textarea
            value={circumstances}
            onChange={(e) =>
              setCircumstances(e.target.value)
            }
            placeholder="e.g. I walk slowly or prefer avoiding hills"
          />
        </div>

        <div>
          <label>Class Schedule</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) =>
              setSchedule(e.target.files?.[0] || null)
            }
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Upload and Analyze"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {settingsId && (
        <p>Saved settings ID: {settingsId}</p>
      )}

      {classes.length > 0 && (
        <section>
          <h2>Gemma 4 Extracted Schedule</h2>
          <p>Please check the class details for accuracy.</p>

          {classes.map((course, index) => (
            <div key={index}>
              <h3>{course.course}</h3>
              <p>Day: {course.day}</p>
              <p>Start: {course.startTime}</p>
              <p>End: {course.endTime || "Unknown"}</p>
              <p>
                Location: {course.location || "Unknown"}
              </p>
            </div>
          ))}
        </section>
      )}

      <Link to="/">
        <button type="button">Return to Home Page</button>
      </Link>
    </main>
  );
}

export default UploadPage;