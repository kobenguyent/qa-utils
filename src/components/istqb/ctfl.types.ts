export interface Question {
  id: number;
  question: string;
  image: string | null;
  code?: string;
  options: string[];
  correctOptions: string[];
  explanation: {
    answer: string;
    ref: string;
  };
}

export interface QuestionBank {
  [key: string]: Question[];
}

export interface ChapterInfo {
  id: number;
  code: string;
  title: string;
  icon: string;
  description: string;
}

export const ISTQB_CHAPTERS: Record<number, ChapterInfo> = {
  1: {
    id: 1,
    code: 'FL-1',
    title: 'Fundamentals of Testing',
    icon: '📜',
    description: 'What is testing, principles, test activities, roles, skills, and ethics',
  },
  2: {
    id: 2,
    code: 'FL-2',
    title: 'Testing Throughout the SDLC',
    icon: '🔄',
    description: 'SDLC models, test levels, test types, and maintenance testing',
  },
  3: {
    id: 3,
    code: 'FL-3',
    title: 'Static Testing',
    icon: '🔍',
    description: 'Static testing basics, review process, and review roles',
  },
  4: {
    id: 4,
    code: 'FL-4',
    title: 'Test Analysis & Design',
    icon: '🧪',
    description: 'Black-box (EP/BVA/Decision Table/State Transition), White-box, and Experience-based techniques',
  },
  5: {
    id: 5,
    code: 'FL-5',
    title: 'Managing Test Activities',
    icon: '⚙️',
    description: 'Test planning, estimation, risk management, test control, configuration, and defect management',
  },
  6: {
    id: 6,
    code: 'FL-6',
    title: 'Test Tools',
    icon: '🛠️',
    description: 'Tool support for testing, benefits, and risks of test automation',
  },
};

export interface QuestionMetadata {
  chapterId: number;
  chapter: ChapterInfo;
  learningObjective: string;
  kLevel: string;
  isMultiSelect: boolean;
  requiredCount: number;
}

export function parseQuestionMetadata(question: Question): QuestionMetadata {
  const ref = question.explanation?.ref || '';
  
  // Extract FL-X.Y.Z
  const flMatch = ref.match(/FL-(\d)\.\d+(\.\d+)?/i);
  const chapterNum = flMatch ? parseInt(flMatch[1], 10) : 1;
  const chapter = ISTQB_CHAPTERS[chapterNum] || ISTQB_CHAPTERS[1];

  // Extract LO
  const loMatch = ref.match(/FL-\d\.\d+(\.\d+)?/i);
  const learningObjective = loMatch ? loMatch[0].toUpperCase() : 'FL-General';

  // Extract K-Level
  const kMatch = ref.match(/K(?:-Level)?[:\s]*(K[1-4])/i);
  const kLevel = kMatch ? kMatch[1].toUpperCase() : 'K2';

  const requiredCount = question.correctOptions.length || 1;
  const isMultiSelect = requiredCount > 1 || question.question.toLowerCase().includes('two options') || question.question.toLowerCase().includes('select two');

  return {
    chapterId: chapterNum,
    chapter,
    learningObjective,
    kLevel,
    isMultiSelect,
    requiredCount,
  };
}

export interface ExamAttemptRecord {
  id: string;
  date: string;
  bankName: string;
  mode: 'exam' | 'study';
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  chapterScores: Record<number, { correct: number; total: number }>;
}

export interface DetailedQuestionResult {
  index: number;
  question: Question;
  metadata: QuestionMetadata;
  selectedOptions: string[];
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  isFlagged: boolean;
}
