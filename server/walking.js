require("dotenv").config();
const { DateTime } = require("luxon");

async function estimateWalk(startLocation, destination, classStart) {
  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const response = await ai.models.generateContent({
    model: "gemma-4-26b-a4b-it",
    contents: `
You are Timely, a walking-time assistant specifically
for the UC Santa Cruz campus.

Student starting location: ${startLocation}
Class destination: ${destination}

Estimate a reasonable walking time between these UCSC locations.

Account for:
- UCSC's hilly terrain
- Walking paths between buildings
- A typical student's walking pace

IMPORTANT:
You have no live map or routing data.
Do not pretend to know an exact route or distance.
If either location is unknown or ambiguous, set
walkingMinutes to null.

Return ONLY JSON:
{
  "walkingMinutes": 12,
  "explanation": "Approximate walk across campus"
}
`
  });

  const cleaned = response.text.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const result = JSON.parse(cleaned);

  const walkingMinutes = Number(result.walkingMinutes);

  if (
    result.walkingMinutes == null ||
    !Number.isFinite(walkingMinutes) ||
    walkingMinutes < 1 ||
    walkingMinutes > 120
  ) {
    throw new Error("Could not estimate walking time");
  }

  // Extra safety buffer
  const bufferMinutes = 5;
  const totalMinutes = Math.ceil(walkingMinutes) + bufferMinutes;

  const classTime = DateTime.fromISO(classStart, {
    zone: "America/Los_Angeles"
  });

  if (!classTime.isValid) {
    throw new Error("Invalid class start time");
  }

  return {
    startLocation,
    destination,
    estimatedWalkingMinutes: Math.ceil(walkingMinutes),
    bufferMinutes,
    totalMinutes,
    leaveAt: classTime.minus({
      minutes: totalMinutes
    }).toISO(),
    explanation: result.explanation,
    estimateOnly: true
  };
}

module.exports = { estimateWalk };