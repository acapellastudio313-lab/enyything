import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI("AIzaSyDRDKsF5J6mCjEfp_-0y0STRivu-evJQOA");

export const askGeminiAndSave = async (userId: string, prompt: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();

    // OTOMATIS SIMPAN KE FIREBASE
    await addDoc(collection(db, "ai_logs"), {
      userId: userId,
      question: prompt,
      answer: response,
      createdAt: serverTimestamp(),
    });

    return response;
  } catch (error) {
    console.error("AI Error:", error);
    return "Maaf, terjadi kesalahan pada sistem AI.";
  }
};