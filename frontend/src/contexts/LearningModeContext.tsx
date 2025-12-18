import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  LearningModeContextType,
  LearningModule,
  Lesson,
  LearningProgress,
  LearningPreferences,
} from '../types/learning';

// Import learning modules data
import modulesData from '../content/modules.json';

const LearningModeContext = createContext<LearningModeContextType | undefined>(undefined);

const STORAGE_KEY = 'vibeapp_learning_progress';
const PREFERENCES_KEY = 'vibeapp_learning_preferences';

const DEFAULT_PROGRESS: LearningProgress = {
  completedLessons: [],
  completedModules: [],
  currentModuleId: null,
  currentLessonId: null,
  quizScores: {},
  totalTimeSpent: 0,
  startedAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
};

const DEFAULT_PREFERENCES: LearningPreferences = {
  showTooltips: true,
  showAnnotations: true,
  autoAdvance: true,
  playbackSpeed: 1,
};

export function LearningModeProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [currentModule, setCurrentModule] = useState<LearningModule | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LearningProgress>(DEFAULT_PROGRESS);
  const [preferences, setPreferences] = useState<LearningPreferences>(DEFAULT_PREFERENCES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load modules data
  useEffect(() => {
    try {
      setModules(modulesData.modules as LearningModule[]);
    } catch (error) {
      console.error('Failed to load learning modules:', error);
      setModules([]);
    }
  }, []);

  // Load progress and preferences from localStorage on mount
  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(STORAGE_KEY);
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        setProgress(parsed);
        setIsEnabled(parsed.currentModuleId !== null);
      }

      const storedPreferences = localStorage.getItem(PREFERENCES_KEY);
      if (storedPreferences) {
        setPreferences(JSON.parse(storedPreferences));
      }
    } catch (error) {
      console.error('Failed to load learning progress:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (error) {
        console.error('Failed to save learning progress:', error);
      }
    }
  }, [progress, isInitialized]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to save learning preferences:', error);
      }
    }
  }, [preferences, isInitialized]);

  // Restore current module/lesson from progress
  useEffect(() => {
    if (isInitialized && modules.length > 0 && progress.currentModuleId) {
      const module = modules.find(m => m.id === progress.currentModuleId);
      if (module) {
        setCurrentModule(module);
        if (progress.currentLessonId) {
          const lesson = module.lessons.find(l => l.id === progress.currentLessonId);
          if (lesson) {
            setCurrentLesson(lesson);
          }
        }
      }
    }
  }, [isInitialized, modules, progress.currentModuleId, progress.currentLessonId]);

  const toggleLearningMode = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        setIsSidebarOpen(true);
        // If no module started, start from Module 1
        if (!progress.currentModuleId && modules.length > 0) {
          const firstModule = modules[0];
          setCurrentModule(firstModule);
          if (firstModule.lessons.length > 0) {
            setCurrentLesson(firstModule.lessons[0]);
            setProgress(prev => ({
              ...prev,
              currentModuleId: firstModule.id,
              currentLessonId: firstModule.lessons[0].id,
              lastActivityAt: new Date().toISOString(),
            }));
          }
        }
      } else {
        setIsSidebarOpen(false);
      }
      return newValue;
    });
  }, [modules, progress.currentModuleId]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const isModuleUnlocked = useCallback((moduleId: string): boolean => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return false;

    // First module is always unlocked
    if (module.prerequisites.length === 0) return true;

    // Check if all prerequisites are completed
    return module.prerequisites.every(prereqId =>
      progress.completedModules.includes(prereqId)
    );
  }, [modules, progress.completedModules]);

  const startModule = useCallback((moduleId: string) => {
    if (!isModuleUnlocked(moduleId)) return;

    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    setCurrentModule(module);

    // Find first incomplete lesson or start from beginning
    const firstIncompleteLesson = module.lessons.find(
      l => !progress.completedLessons.includes(l.id)
    ) || module.lessons[0];

    if (firstIncompleteLesson) {
      setCurrentLesson(firstIncompleteLesson);
      setProgress(prev => ({
        ...prev,
        currentModuleId: moduleId,
        currentLessonId: firstIncompleteLesson.id,
        lastActivityAt: new Date().toISOString(),
      }));
    }
  }, [modules, progress.completedLessons, isModuleUnlocked]);

  const startLesson = useCallback((lessonId: string) => {
    // Find the lesson across all modules
    for (const module of modules) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson && isModuleUnlocked(module.id)) {
        setCurrentModule(module);
        setCurrentLesson(lesson);
        setProgress(prev => ({
          ...prev,
          currentModuleId: module.id,
          currentLessonId: lessonId,
          lastActivityAt: new Date().toISOString(),
        }));
        return;
      }
    }
  }, [modules, isModuleUnlocked]);

  const completeLesson = useCallback((lessonId: string, quizScore?: number) => {
    setProgress(prev => {
      const newCompletedLessons = prev.completedLessons.includes(lessonId)
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId];

      const newQuizScores = quizScore !== undefined
        ? { ...prev.quizScores, [lessonId]: quizScore }
        : prev.quizScores;

      // Check if current module is now complete
      let newCompletedModules = [...prev.completedModules];
      if (currentModule) {
        const allLessonsComplete = currentModule.lessons.every(
          l => newCompletedLessons.includes(l.id)
        );
        if (allLessonsComplete && !newCompletedModules.includes(currentModule.id)) {
          newCompletedModules.push(currentModule.id);
        }
      }

      return {
        ...prev,
        completedLessons: newCompletedLessons,
        completedModules: newCompletedModules,
        quizScores: newQuizScores,
        lastActivityAt: new Date().toISOString(),
      };
    });
  }, [currentModule]);

  const nextLesson = useCallback(() => {
    if (!currentModule || !currentLesson) return;

    const currentIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);

    // Try next lesson in current module
    if (currentIndex < currentModule.lessons.length - 1) {
      const nextLessonItem = currentModule.lessons[currentIndex + 1];
      setCurrentLesson(nextLessonItem);
      setProgress(prev => ({
        ...prev,
        currentLessonId: nextLessonItem.id,
        lastActivityAt: new Date().toISOString(),
      }));
      return;
    }

    // Try first lesson of next unlocked module
    const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
    for (let i = currentModuleIndex + 1; i < modules.length; i++) {
      if (isModuleUnlocked(modules[i].id)) {
        const nextModule = modules[i];
        const firstLesson = nextModule.lessons[0];
        if (firstLesson) {
          setCurrentModule(nextModule);
          setCurrentLesson(firstLesson);
          setProgress(prev => ({
            ...prev,
            currentModuleId: nextModule.id,
            currentLessonId: firstLesson.id,
            lastActivityAt: new Date().toISOString(),
          }));
          return;
        }
      }
    }
  }, [currentModule, currentLesson, modules, isModuleUnlocked]);

  const previousLesson = useCallback(() => {
    if (!currentModule || !currentLesson) return;

    const currentIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);

    // Try previous lesson in current module
    if (currentIndex > 0) {
      const prevLessonItem = currentModule.lessons[currentIndex - 1];
      setCurrentLesson(prevLessonItem);
      setProgress(prev => ({
        ...prev,
        currentLessonId: prevLessonItem.id,
        lastActivityAt: new Date().toISOString(),
      }));
      return;
    }

    // Try last lesson of previous unlocked module
    const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
    for (let i = currentModuleIndex - 1; i >= 0; i--) {
      if (isModuleUnlocked(modules[i].id)) {
        const prevModule = modules[i];
        const lastLesson = prevModule.lessons[prevModule.lessons.length - 1];
        if (lastLesson) {
          setCurrentModule(prevModule);
          setCurrentLesson(lastLesson);
          setProgress(prev => ({
            ...prev,
            currentModuleId: prevModule.id,
            currentLessonId: lastLesson.id,
            lastActivityAt: new Date().toISOString(),
          }));
          return;
        }
      }
    }
  }, [currentModule, currentLesson, modules, isModuleUnlocked]);

  const skipToModule = useCallback((moduleId: string) => {
    startModule(moduleId);
  }, [startModule]);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    setCurrentModule(null);
    setCurrentLesson(null);
    setIsEnabled(false);
    setIsSidebarOpen(false);
  }, []);

  const updatePreferences = useCallback((prefs: Partial<LearningPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  const isLessonCompleted = useCallback((lessonId: string): boolean => {
    return progress.completedLessons.includes(lessonId);
  }, [progress.completedLessons]);

  const getModuleProgress = useCallback((moduleId: string): number => {
    const module = modules.find(m => m.id === moduleId);
    if (!module || module.lessons.length === 0) return 0;

    const completedCount = module.lessons.filter(
      l => progress.completedLessons.includes(l.id)
    ).length;

    return Math.round((completedCount / module.lessons.length) * 100);
  }, [modules, progress.completedLessons]);

  const getOverallProgress = useCallback((): number => {
    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    if (totalLessons === 0) return 0;

    return Math.round((progress.completedLessons.length / totalLessons) * 100);
  }, [modules, progress.completedLessons]);

  const value: LearningModeContextType = {
    isEnabled,
    isSidebarOpen,
    currentModule,
    currentLesson,
    progress,
    preferences,
    modules,
    toggleLearningMode,
    toggleSidebar,
    startModule,
    startLesson,
    completeLesson,
    nextLesson,
    previousLesson,
    skipToModule,
    resetProgress,
    updatePreferences,
    isModuleUnlocked,
    isLessonCompleted,
    getModuleProgress,
    getOverallProgress,
  };

  return (
    <LearningModeContext.Provider value={value}>
      {children}
    </LearningModeContext.Provider>
  );
}

export function useLearningMode() {
  const context = useContext(LearningModeContext);
  if (context === undefined) {
    throw new Error('useLearningMode must be used within a LearningModeProvider');
  }
  return context;
}
