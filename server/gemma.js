require("dotenv").config();

async function analyzeSchedule(imageBuffer, mimeType) {
  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const prompt = `
    You are helping Timely, a university class reminder app.

    Read the provided class schedule screenshot and extract
    all classes that are clearly visible.

    Return ONLY valid JSON in this format:

    {
    "classes": [
        {
        "course": "CSE 101",
        "day": "Monday",
        "startTime": "09:00",
        "endTime": "10:05",
        "location": "Engineering 2"
        }
    ]
    }

    Rules:
    - Use 24-hour time format HH:MM.
    - Create a separate entry for each day a class meets.
    - Include lectures, labs, and discussions.
    - If a field is unreadable or missing, use null.
    - Do not guess classroom locations or times.
    - If no classes are visible, return {"classes":[]}.
    - Return JSON only, without markdown fences.
`;

  const response = await ai.models.generateContent({
    model: "gemma-4-26b-a4b-it",
    contents: [
      {
        // converts image from postresql db into format that gemini api can accept
        inlineData: {
          mimeType,
          data: imageBuffer.toString("base64")
        }
      },
      {
        text: prompt
      }
    ]
  });

  const rawText = response.text?.trim();

  if (!rawText) {
    throw new Error("Gemma returned an empty response");
  }

  // Handle JSON wrapped in markdown code fences
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const result = JSON.parse(cleaned);

  if (!Array.isArray(result.classes)) {
    throw new Error("Gemma returned an invalid schedule");
  }

  return result;
}

module.exports = { analyzeSchedule };