const STORAGE_KEY = "geminiApiKey";
const EL_KEY = "elevenlabsApiKey";

export async function getApiKey() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || "";
}

export async function setApiKey(key) {
  await chrome.storage.local.set({ [STORAGE_KEY]: key });
}

export async function getElKey() {
  const data = await chrome.storage.local.get(EL_KEY);
  return data[EL_KEY] || "";
}

export async function setElKey(key) {
  await chrome.storage.local.set({ [EL_KEY]: key });
}

export async function speakEL(apiKey, text) {
  const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL", {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
  });
  if (!res.ok) throw new Error(`ElevenLabs (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.play();
}

export async function askGemini(apiKey, noteContent, question) {
  const prompt = `You are a helpful, friendly study assistant called Boba. A student is taking notes and wants your help. Based on their notes below, answer their question concisely and clearly. If the notes are empty or unrelated, still answer helpfully using your knowledge.

Notes:
${noteContent || "(no notes yet)"}

Question: ${question}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("Gemini API error:", res.status, errBody);
    if (res.status === 400) throw new Error("Invalid API key. Check your Gemini key.");
    if (res.status === 403) throw new Error("API key not authorized. Check your Gemini key permissions.");
    if (res.status === 404) throw new Error("Model not found. The Gemini model may have changed.");
    if (res.status === 429) throw new Error("Rate limit hit. Wait a moment and try again.");
    throw new Error(`Gemini error (${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini.");
  return text;
}

export async function generateQuiz(apiKey, sectionText) {
  const prompt = `You are a study quiz generator called Boba. Given the following study notes, generate exactly 3 multiple-choice questions to test comprehension. Each question should have 4 options (A, B, C, D) with exactly one correct answer.

Return ONLY valid JSON in this exact format, no markdown:
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": 0
    }
  ]
}

Notes:
${sectionText}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) {
    if (res.status === 400) throw new Error("Invalid API key");
    if (res.status === 403) throw new Error("API key not authorized");
    if (res.status === 429) throw new Error("Rate limit — try again soon");
    throw new Error(`Gemini error ${res.status}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text);
}
