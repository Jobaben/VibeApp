// Learning Mode type definitions

export type LessonType = 'theory' | 'interactive' | 'quiz' | 'exercise';
export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface Highlight {
  term: string;
  definition: string;
}

export interface Annotation {
  x: number | 'auto';
  y: number | string; // Can be number or level identifier like 'support_level'
  label: string;
  description: string;
  lineColor: string;
  pointerDirection?: 'up' | 'down' | 'left' | 'right';
}

export interface TourStep {
  targetSelector: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'scroll';
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  correctExplanation: string;
  incorrectExplanation: string;
}

export interface ExerciseConfig {
  type: 'multiple_choice' | 'click_chart' | 'stock_selection' | 'value_range';
  instructions: string;
  successCriteria: string;
  hints: string[];
  validationFn?: string; // Function name for validation
}

export interface LessonContent {
  text: string;
  highlights?: Highlight[];
  tourSteps?: TourStep[];
  annotations?: Annotation[];
  quiz?: QuizQuestion[];
  exercise?: ExerciseConfig;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  content: LessonContent;
  targetPage?: string; // Which page this lesson is for (e.g., '/stock/:ticker')
  targetComponent?: string; // Which component to highlight
  order: number;
  estimatedMinutes?: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
  prerequisites: string[]; // module IDs required to unlock
  estimatedTime: number; // minutes
  level: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
}

export interface LearningProgress {
  completedLessons: string[]; // lesson IDs
  completedModules: string[]; // module IDs
  currentModuleId: string | null;
  currentLessonId: string | null;
  quizScores: Record<string, number>; // lessonId -> score percentage
  totalTimeSpent: number; // seconds
  startedAt: string;
  lastActivityAt: string;
}

export interface LearningPreferences {
  showTooltips: boolean;
  showAnnotations: boolean;
  autoAdvance: boolean;
  playbackSpeed: number; // for future audio/video content
}

export interface LearningModeState {
  isEnabled: boolean;
  isSidebarOpen: boolean;
  currentModule: LearningModule | null;
  currentLesson: Lesson | null;
  progress: LearningProgress;
  preferences: LearningPreferences;
}

// Tooltip content for metrics
export interface MetricTooltip {
  key: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  interpretation: {
    low: { threshold: number; meaning: string };
    medium: { meaning: string };
    high: { threshold: number; meaning: string };
  };
  relatedLesson?: string; // lesson ID for "Learn more"
}

// Achievement/Badge types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  criteria: string;
}

// Context type for the provider
export interface LearningModeContextType {
  // State
  isEnabled: boolean;
  isSidebarOpen: boolean;
  currentModule: LearningModule | null;
  currentLesson: Lesson | null;
  progress: LearningProgress;
  preferences: LearningPreferences;
  modules: LearningModule[];

  // Actions
  toggleLearningMode: () => void;
  toggleSidebar: () => void;
  closeLesson: () => void;
  startModule: (moduleId: string) => void;
  startLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string, quizScore?: number) => void;
  nextLesson: () => void;
  previousLesson: () => void;
  skipToModule: (moduleId: string) => void;
  resetProgress: () => void;

  // Preferences
  updatePreferences: (prefs: Partial<LearningPreferences>) => void;

  // Helpers
  isModuleUnlocked: (moduleId: string) => boolean;
  isLessonCompleted: (lessonId: string) => boolean;
  getModuleProgress: (moduleId: string) => number; // percentage
  getOverallProgress: () => number; // percentage
}
