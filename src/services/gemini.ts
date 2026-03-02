import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// API Key dari screenshot ChaPras Anda
const genAI = new GoogleGenerativeAI("AIzaSyDRDKsF5J6mCjEfp_-0y0STRivu-evJQOA");

export const processAIRequest = async (prompt: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    // 1. Mendapatkan jawaban dari AI
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 2. OTOMATIS: Simpan ke Firebase Firestore
    await addDoc(collection(db, "interactions"), {
      user_query: prompt,
      ai_response: responseText,
      created_at: serverTimestamp()
    });

    return responseText;
  } catch (error) {
    console.error("Gagal memproses/menyimpan data:", error);
    throw error;
  }
};