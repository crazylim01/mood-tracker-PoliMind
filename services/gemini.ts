
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MoodEntry, UserSettings, ChatMessage } from "../types";

let chatSession: any = null;

export const getMoodInsights = async (entries: MoodEntry[], settings: UserSettings) => {
  if (entries.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const moodHistory = entries.slice(0, 15).map(e => ({
    mood: e.mood,
    activities: e.activities.join(', '),
    note: e.note,
    date: new Date(e.timestamp).toLocaleDateString()
  }));

  const prompt = `
    Analyze the mental wellness patterns for a student at ${settings.campus}.
    Student Name: ${settings.name}
    Language: ${settings.language}
    
    History (Recent Logs): ${JSON.stringify(moodHistory)}

    Task:
    Provide a professional, empathetic analysis. 
    Include 3 highly specific recommendations for a Malaysian Politeknik student (e.g., managing PTPTN, preparation for industrial training (LI), or FYP stress).
    Return the response strictly in JSON format.
    Language for response: ${settings.language === 'ms' ? 'Malay/Bahasa Melayu' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedAction: { type: Type.STRING }
          },
          required: ["summary", "recommendations", "suggestedAction"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return null;
  }
};

export const findNearbyHelp = async (campusName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Find 3 nearby mental health clinics or counseling centers for a student at ${campusName} in Malaysia. Provide the names and brief reason why they are helpful.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleMaps: {} }]
      }
    });
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text,
      links: chunks.filter((c: any) => c.maps).map((c: any) => ({
        title: c.maps.title,
        uri: c.maps.uri
      }))
    };
  } catch (err) {
    console.error("Maps Grounding Error:", err);
    return null;
  }
};

export const generateMeditation = async (settings: UserSettings, currentMood?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Write a short, calming guided meditation script (about 60 words) for a Politeknik student.
    The student is feeling: ${currentMood || 'neutral'}.
    Mention relaxing from assignments, lecturers' expectations, or campus exams.
    Language: ${settings.language === 'ms' ? 'Malay' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    const result = response.text;
    if (result && result.trim().length > 10) {
      return result.trim();
    }
    throw new Error("Invalid response");
  } catch (error) {
    return settings.language === 'ms' 
      ? "Tarik nafas dalam. Lepaskan stres tugasan. Fokus pada ketenangan saat ini."
      : "Take a deep breath. Release assignment stress. Focus on the peace of the present moment.";
  }
};

export const generateMeditationAudio = async (script: string, settings: UserSettings) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this meditation script calmly and slowly: ${script}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return null;
  }
};

export const getChatResponse = async (message: string, history: ChatMessage[], settings: UserSettings) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `
          You are PoliBot, a friendly AI counselor for Politeknik students in Malaysia.
          You understand LI (Industrial Training), FYP, Quizzes, PTPTN, and Hostel life.
          Be supportive. If extremely depressed, suggest e-Psychology PSA.
          Language: ${settings.language === 'ms' ? 'Malay' : 'English'}.
        `,
      }
    });
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("Chat Error:", error);
    chatSession = null;
    return "System busy, please try again.";
  }
};
