export type Difficulty = "Easy" | "Medium" | "Hard";
export type QuestionType = "multiple-choice" | "essay" | "Mixed";

export interface Question {
  id: string;
  type: "multiple-choice" | "essay";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hints: string[];
  analogy: string;
}

export interface QuizSession {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  comboStreak: number;
  highestCombo: number;
  xpEarned: number;
  answers: { [key: string]: string };
  timeSpentSeconds: number;
  startTime: number;
}

export interface MindmapNode {
  id: string;
  label: string;
  description: string;
  parentId: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface SmartSummary {
  title: string;
  overallSummary: string;
  cards: {
    topic: string;
    detail: string;
    example: string;
    analogy: string;
    keyPoints: string[];
  }[];
  mindmapNodes: MindmapNode[];
  flashcards: Flashcard[];
}

export interface Participant {
  name: string;
  score: number;
  avatar: string;
  level: number;
  isCurrentUser?: boolean;
  lastActive?: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  summary: SmartSummary;
  quiz?: Question[];
}

export interface UserStats {
  totalQuizzesCompleted: number;
  averageAccuracy: number;
  totalStudyMinutes: number;
  dailyStreak: number;
  totalXp: number;
  level: number;
  accuracyTrend: number[]; // Accuracy trend over last 6 sessions
  weakTopics: string[];
}
