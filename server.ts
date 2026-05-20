import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.DISABLE_HMR === "true" ? 3000 : (Number(process.env.PORT) || 3000);

// Set up JSON parsing with a limit for rich visual images/screenshot uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google Gemini API securely on the server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// REAL-TIME LEADERBOARD DATASTORE (In-memory, no bots)
interface LeaderboardUser {
  name: string;
  score: number;
  level: number;
  avatar: string;
  lastActive: number;
}

const leaderboardDb: Record<string, LeaderboardUser> = {};

// Endpoint to update current user's state and fetch live leaderboard
app.post("/api/leaderboard/update", (req, res) => {
  const { name, score, level, avatar } = req.body;
  if (name && typeof name === "string" && name.trim()) {
    const trimmedName = name.trim();
    leaderboardDb[trimmedName] = {
      name: trimmedName,
      score: Number(score) || 0,
      level: Number(level) || 1,
      avatar: avatar || "🎓",
      lastActive: Date.now()
    };
  }

  // Retrieve sorted list (by score/XP descending)
  const list = Object.values(leaderboardDb).sort((a, b) => b.score - a.score);
  res.json({ success: true, users: list });
});

// Endpoint to query current leaderboard
app.get("/api/leaderboard", (req, res) => {
  const list = Object.values(leaderboardDb).sort((a, b) => b.score - a.score);
  res.json({ success: true, users: list });
});

// 1. CHAT ASSISTANT ENDPOINT
app.post("/api/chat-assistant", async (req, res) => {
  const { messages, model, currentQuestion, context } = req.body;
  try {
    const activeModel = "gemini-3.5-flash";
    
    // Customize prompt based on custom model selected
    let modelPersona = "";
    if (model === "Claude") {
      modelPersona = "Anda memiliki gaya kepribadian AI Claude: sangat analitis, runut, santun, terperinci, dan menyajikan penjelasan akademis premium.";
    } else if (model === "Duolingo" || model === "Mistral") {
      modelPersona = "Anda memiliki kepribadian guru interaktif Duolingo yang ceria, penuh motivasi, ramah anak, ringkas, dan sering menyisipkan kata-kata penyemangat.";
    } else {
      modelPersona = "Anda adalah Asisten Belajar Quiziz yang ramah, profesional, bertindak seperti guru privat ideal, sabar, dan menyukai analogi sederhana yang mudah dimengerti.";
    }

    const systemInstruction = `${modelPersona} 
Format seluruh teks menggunakan Markdown yang rapi dengan heading, list, dan cetak tebal.
Bantu user memahami materi belajarnya. Jika ada pertanyaan spesifik tentang kuis (soal sekarang, jawaban user, dsb), berikan petunjuk (hint) bertingkat atau penjelasan yang membimbing alih-alih langsung memberikan jawaban akhirnya sobat bisa belajar aktif.`;

    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Inject contextual information about current material or active quiz
    if (context || currentQuestion) {
      contents.unshift({
        role: "user",
        parts: [{ 
          text: `Konteks Belajar Aktif: \nMateri / Kuis saat ini: ${JSON.stringify(context || currentQuestion)}\nMohon bantu saya memahami topik ini!` 
        }]
      });
    }

    const response = await ai.models.generateContent({
      model: activeModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error chat assistant:", error);
    res.status(500).json({ error: error.message || "Gagal menghubungi AI Assistant" });
  }
});

// 2. QUIZ GENERATION ENDPOINT
app.post("/api/generate-quiz", async (req, res) => {
  const { materialText, materialImage, count, difficulty, type, modelSelection } = req.body;

  try {
    const activeModel = "gemini-3.5-flash";
    const requestedCount = Math.min(Math.max(Number(count) || 5, 2), 100);

    // Context from image, visual layout extraction or OCR guidance
    let promptText = `Hasilkan tepat ${requestedCount} pertanyaan kuis berkualitas tinggi berdasarkan konten materi berikut. 
Tingkat kesulitan: ${difficulty || "Medium"}. 
Tipe soal: ${type || "Mixed"} (jika 'multiple-choice', buat semua pilihan ganda dengan 4 opsi. jika 'essay', buat pertanyaan esai yang menantang pemikiran kritis. jika 'Mixed', berikan kombinasi seimbang).

Materi Konten:
${materialText || "Gunakan pengetahuan umum edukatif jika materi tidak disediakan."}
`;

    const parts: any[] = [{ text: promptText }];
    
    if (materialImage) {
      // Clean base64 data header
      const base64Data = materialImage.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        }
      });
    }

    const systemInstruction = `Anda adalah Mesin Kuis Handal (Quiz Generation Engine) premium. 
Tugas utama Anda adalah menghasilkan kuis berkualitas tinggi dengan integritas sempurna:
1. Tidak boleh ada pertanyaan kosong atau terpotong.
2. Setiap soal wajib memiliki 'correctAnswer' (untuk piihan ganda: harus persis sama dengan salah satu opsi; untuk esai: berikan pedoman jawaban / kata kunci penting).
3. Setiap soal wajib menyertakan list 'hints' (tiga level petunjuk progresif: hint kecil, hint sedang, hint detail).
4. Setiap soal wajib menyertakan 'analogy' (analogi mudah dipahami).
5. 'explanation' harus mendalam, memotivasi, dan logis.
6. Hasilkan persis sejumlah ${requestedCount} soal.`;

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique string id, e.g. q1, q2" },
                  type: { type: Type.STRING, description: "multiple-choice atau essay" },
                  question: { type: Type.STRING, description: "Pertanyaan lengkap, tidak terpotong, jelas" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Hanya untuk multiple-choice: berisi tepat 4 item. Kosongkan untuk esai."
                  },
                  correctAnswer: { type: Type.STRING, description: "Jawaban terpilih yang benar (harus pas dengan salah satu opsi untuk multiple-choice)" },
                  explanation: { type: Type.STRING, description: "Penjelasan lengkap, mencerahkan, mudah dipahami" },
                  hints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Berisi tepat 3 string petunjuk bertingkat dari mudah ke detail"
                  },
                  analogy: { type: Type.STRING, description: "Analogi sederhana dari kehidupan sehari-hari" },
                },
                required: ["id", "type", "question", "options", "correctAnswer", "explanation", "hints", "analogy"]
              }
            }
          },
          required: ["questions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    let questions = parsed.questions || [];

    // Question Integrity & Smart Fallback Alignment System
    if (questions.length === 0) {
      throw new Error("Kuis yang digenerate kosong.");
    }

    // Ensure requested question count is exact
    if (questions.length < requestedCount) {
      console.log(`Fallback Alert: Generated ${questions.length} but requested ${requestedCount}. Polling duplicates/variations to fill.`);
      // Extend list dynamically to guarantee accurate count
      const baseLen = questions.length;
      for (let i = baseLen; i < requestedCount; i++) {
        const replica = JSON.parse(JSON.stringify(questions[i % baseLen]));
        replica.id = `q_extended_${i}`;
        replica.question = `[Variasi Eksplorasi] ${replica.question}`;
        questions.push(replica);
      }
    } else if (questions.length > requestedCount) {
      questions = questions.slice(0, requestedCount);
    }

    res.json({ questions });
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: error.message || "Gagal menggenerate quiz" });
  }
});

// 3. SMART SUMMARY & MULTI-MODE CARDS ENDPOINT
app.post("/api/generate-summary", async (req, res) => {
  const { materialText, materialImage, mode } = req.body;

  try {
    const activeModel = "gemini-3.5-flash";
    const chosenMode = mode || "Penjelasan Detail";

    let promptText = `Hasilkan rangkuman topik interaktif premium berdasarkan materi di bawah ini.
Mode Rangkuman yang dipilih: ${chosenMode}.

Informasi Mode:
- 'Ringkas Cepat': Padat, berisi poin inti, dan rangkuman sekali baca.
- 'Penjelasan Detail': Pembahasan mendalam topik-topik, cocok untuk belajar komprehensif.
- 'Mode Anak Sekolah': Gunakan bahasa yang sangat santai, menyenangkan, penuh analogi kartun/humoris.
- 'Poin Penting': Berfokus pada daftar butir, rumus, definisi utama, dan highlight.
- 'Visual Summary': Strukturkan informasi agar mudah divisualisasikan dalam visual mindmap.

Materi Konten:
${materialText || "Gunakan materi edukatif umum berkualitas tinggi."}
`;

    const parts: any[] = [{ text: promptText }];
    if (materialImage) {
      const base64Data = materialImage.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      });
    }

    const systemInstruction = `Anda adalah Pendidik Visual Ulung. Hasilkan rangkuman berstruktur indah yang bersahabat untuk pemula, sarat contoh konkret, metafora kehidupan sehari-hari, dan visual breakdown langkah-demi-langkah. Rangkuman harus didistribusikan ke dalam beberapa kartu topik horizontal agar interaktif digeser oleh siswa.`;

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overallSummary: { type: Type.STRING, description: "Brief visual summary overview" },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING, description: "Topik utama kartu" },
                  detail: { type: Type.STRING, description: "Penjelasan interaktif terstruktur, gunakan markdown" },
                  example: { type: Type.STRING, description: "Contoh konkret / simulasi" },
                  analogy: { type: Type.STRING, description: "Analogi sederhana yang visual" },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Poin-poin penting / term kunci yang wajib diingat"
                  }
                },
                required: ["topic", "detail", "example", "analogy", "keyPoints"]
              }
            },
            mindmapNodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  parentId: { type: Type.STRING, description: "ID node induk, kosongkan jika node root" }
                },
                required: ["id", "label", "description", "parentId"]
              },
              description: "Daftar node untuk digambar menjadi Mindmap visual modern"
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: "Pertanyaan atau istilah utama" },
                  back: { type: Type.STRING, description: "Jawaban singkat padat atau definisi" }
                },
                required: ["front", "back"]
              },
              description: "Daftar flashcards pintar untuk mode belajar cepat"
            }
          },
          required: ["title", "overallSummary", "cards", "mindmapNodes", "flashcards"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating summary:", error);
    res.status(500).json({ error: error.message || "Gagal menggenerate rangkuman pintar" });
  }
});


// 4. REAL-TIME MULTI-MODAL DOCUMENT & IMAGE SCANNING (OCR) ENDPOINT
app.post("/api/scan-document", async (req, res) => {
  const { image, mimeType } = req.body;
  try {
    if (!image) {
      return res.status(400).json({ error: "Silakan unggah dokumen gambar atau screenshot terlebih dahulu." });
    }

    let detectedMimeType = mimeType || "image/png";
    let base64Data = image;

    // Detect mime type and extract raw base64 data if prefixed
    const match = image.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      detectedMimeType = match[1];
      base64Data = match[2];
    }

    const parts: any[] = [
      {
        text: `Lakukan pemindaian OCR premium dan analisis kognitif visual mendalam pada berkas dokumen pembelajaran, grafik, tabel, atau catatan ini.

Langkah Analisis:
1. Ekstrak seluruh teks literatur secara utuh dengan akurasi 100%.
2. Jika terdapat tabel/grafik/diagram, rekonstruksikan data tersebut menggunakan tabel Markdown yang bersih dan mudah dibaca, serta jelaskan makna tren/alurnya.
3. Berikan tajuk/sub-bab yang sesuai agar tulisan menjadi teratur.
4. Segera kembalikan hasil OCR yang rapi, bersih, dan informatif tanpa ada metadata sistem yang membosankan.`
      },
      {
        inlineData: {
          mimeType: detectedMimeType,
          data: base64Data,
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        temperature: 0.2, // Low temperature increases precision for transcriptions/OCR data representation
      }
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Error dalam scanning dokumen:", error);
    res.status(500).json({ error: error.message || "Gagal memindai dokumen dengan AI" });
  }
});


// FRONTEND SERVING AND VITE MIDDLEWARE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Use Vite's middlewares for modern hot-reloading asset support
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Quiziz Server] Running full-stack on http://0.0.0.0:${PORT}`);
  });
}

startServer();
