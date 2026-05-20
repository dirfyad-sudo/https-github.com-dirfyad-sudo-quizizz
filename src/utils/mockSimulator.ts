export interface SimulatedKuisState {
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
  options: { text: string; status: "idle" | "selected-correct" | "selected-incorrect" }[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  timerSeconds: number;
  score: number;
  streak: number;
  xp: number;
  level: number;
  levelProgress: number; // 0 to 100
  leaderboard: { name: string; score: number; avatar: string; placement: number }[];
  currentActionText: string; // e.g. "Jawaban Benar!", "Jawaban Salah!", "Mempersiapkan Soal...", "Kombinasi Hebat!"
}

export const simulatorQuestions: SimulatedKuisState[] = [
  {
    questionIndex: 1,
    totalQuestions: 5,
    questionText: "Manakah planet terdekat kedua dari Matahari?",
    options: [
      { text: "Merkurius", status: "idle" },
      { text: "Venus", status: "idle" },
      { text: "Bumi", status: "idle" },
      { text: "Mars", status: "idle" },
    ],
    selectedOptionIndex: 1,
    correctOptionIndex: 1,
    timerSeconds: 8,
    score: 1120,
    streak: 3,
    xp: 240,
    level: 3,
    levelProgress: 45,
    leaderboard: [
      { name: "Syamil (You)", score: 1120, avatar: "🔥", placement: 1 },
      { name: "Aisyah AI", score: 1050, avatar: "⚡", placement: 2 },
      { name: "Rafif Pro", score: 980, avatar: "🌟", placement: 3 },
    ],
    currentActionText: "Perfect Streak!"
  },
  {
    questionIndex: 2,
    totalQuestions: 5,
    questionText: "Senyawa kimia yang memberi warna hijau pada daun tanaman bernama...",
    options: [
      { text: "Karotenoid", status: "idle" },
      { text: "Klorofil", status: "idle" },
      { text: "Antosianin", status: "idle" },
      { text: "Melanin", status: "idle" },
    ],
    selectedOptionIndex: 1,
    correctOptionIndex: 1,
    timerSeconds: 5,
    score: 1280,
    streak: 4,
    xp: 290,
    level: 3,
    levelProgress: 68,
    leaderboard: [
      { name: "Syamil (You)", score: 1280, avatar: "🔥", placement: 1 },
      { name: "Aisyah AI", score: 1150, avatar: "⚡", placement: 2 },
      { name: "Rafif Pro", score: 1020, avatar: "🌟", placement: 3 },
    ],
    currentActionText: "Combo Streak x4! +50 XP"
  },
  {
    questionIndex: 3,
    totalQuestions: 5,
    questionText: "Siapakah pencipta teori Relativitas Khusus dalam ilmu Fisika?",
    options: [
      { text: "Isaac Newton", status: "idle" },
      { text: "Albert Einstein", status: "idle" },
      { text: "Galileo Galilei", status: "idle" },
      { text: "Nikola Tesla", status: "idle" },
    ],
    selectedOptionIndex: 0, // chosen Newton (Incorrect)
    correctOptionIndex: 1, // Albert Einstein (Correct)
    timerSeconds: 12,
    score: 1280, // score frozen
    streak: 0,  // streak reset
    xp: 290,
    level: 3,
    levelProgress: 68,
    leaderboard: [
      { name: "Aisyah AI", score: 1350, avatar: "⚡", placement: 1 },
      { name: "Syamil (You)", score: 1280, avatar: "🔥", placement: 2 },
      { name: "Rafif Pro", score: 1180, avatar: "🌟", placement: 3 },
    ],
    currentActionText: "Salah! Streak Putus."
  },
  {
    questionIndex: 4,
    totalQuestions: 5,
    questionText: "Benua terkecil berdasarkan luas wilayah daratan di dunia adalah...",
    options: [
      { text: "Eropa", status: "idle" },
      { text: "Antartika", status: "idle" },
      { text: "Australia", status: "idle" },
      { text: "Amerika Selatan", status: "idle" },
    ],
    selectedOptionIndex: 2, // Australia
    correctOptionIndex: 2,
    timerSeconds: 9,
    score: 1440,
    streak: 1,
    xp: 340,
    level: 4, // Level Up!
    levelProgress: 18,
    leaderboard: [
      { name: "Syamil (You)", score: 1440, avatar: "🔥", placement: 1 },
      { name: "Aisyah AI", score: 1420, avatar: "⚡", placement: 2 },
      { name: "Rafif Pro", score: 1240, avatar: "🌟", placement: 3 },
    ],
    currentActionText: "LEVEL UP! LEVEL 4"
  },
  {
    questionIndex: 5,
    totalQuestions: 5,
    questionText: "Alat pengukur tekanan udara atmosfer disebut dengan nama...",
    options: [
      { text: "Termometer", status: "idle" },
      { text: "Anemometer", status: "idle" },
      { text: "Barometer", status: "idle" },
      { text: "Hygrometer", status: "idle" },
    ],
    selectedOptionIndex: 2, // Barometer
    correctOptionIndex: 2,
    timerSeconds: 4,
    score: 1620,
    streak: 2,
    xp: 390,
    level: 4,
    levelProgress: 42,
    leaderboard: [
      { name: "Syamil (You)", score: 1620, avatar: "🔥", placement: 1 },
      { name: "Aisyah AI", score: 1490, avatar: "⚡", placement: 2 },
      { name: "Rafif Pro", score: 1350, avatar: "🌟", placement: 3 },
    ],
    currentActionText: "Victory! Quiz Selesai 🎉"
  }
];
