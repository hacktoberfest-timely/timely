require("dotenv").config();

async function testGemma() {
  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemma-4-26b-a4b-it",
      contents:
        "Say hello! You are the AI assistant for Timely, a student class reminder app."
    });

    console.log("Gemma response:", response.text);

  } catch (error) {
    console.error("Gemma error:", error.message);
  }
}

testGemma();