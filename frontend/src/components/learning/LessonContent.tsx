import { useState } from 'react';
import { useLearningMode } from '../../contexts/LearningModeContext';

export function LessonContent() {
  const {
    isEnabled,
    currentLesson,
    currentModule,
    completeLesson,
    nextLesson,
    previousLesson,
    isLessonCompleted,
    closeLesson,
  } = useLearningMode();

  const [quizState, setQuizState] = useState<{
    currentQuestion: number;
    answers: Record<string, string>;
    showResults: boolean;
    score: number;
  }>({
    currentQuestion: 0,
    answers: {},
    showResults: false,
    score: 0,
  });

  if (!isEnabled || !currentLesson) return null;

  const isCompleted = isLessonCompleted(currentLesson.id);
  const lessonContent = currentLesson.content;

  // Handle quiz answer selection
  const handleQuizAnswer = (questionId: string, answerId: string) => {
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answerId },
    }));
  };

  // Submit quiz
  const submitQuiz = () => {
    if (!lessonContent.quiz) return;

    let correct = 0;
    lessonContent.quiz.forEach(q => {
      const selectedAnswer = quizState.answers[q.id];
      const correctAnswer = q.options.find(o => o.isCorrect);
      if (selectedAnswer === correctAnswer?.id) {
        correct++;
      }
    });

    const score = Math.round((correct / lessonContent.quiz.length) * 100);
    setQuizState(prev => ({ ...prev, showResults: true, score }));
    completeLesson(currentLesson.id, score);
  };

  // Reset quiz for retry
  const resetQuiz = () => {
    setQuizState({
      currentQuestion: 0,
      answers: {},
      showResults: false,
      score: 0,
    });
  };

  // Handle lesson completion for non-quiz lessons
  const handleComplete = () => {
    completeLesson(currentLesson.id);
    nextLesson();
  };

  // Render theory lesson
  const renderTheoryLesson = () => (
    <div className="prose prose-invert max-w-none">
      <div className="text-gray-300 leading-relaxed whitespace-pre-line">
        {lessonContent.text.split('\n\n').map((paragraph, idx) => {
          // Handle bold text
          const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={idx} className="mb-4">
              {parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={partIdx} className="text-white font-semibold">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={partIdx}>{part}</span>;
              })}
            </p>
          );
        })}
      </div>

      {/* Highlights/Key Terms */}
      {lessonContent.highlights && lessonContent.highlights.length > 0 && (
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <h4 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Key Terms
          </h4>
          <div className="space-y-2">
            {lessonContent.highlights.map((highlight, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-amber-300 font-medium">{highlight.term}:</span>
                <span className="text-gray-300">{highlight.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render quiz lesson
  const renderQuizLesson = () => {
    if (!lessonContent.quiz) return null;

    if (quizState.showResults) {
      return (
        <div className="space-y-6">
          <div className="text-center p-8 bg-gray-800/50 rounded-xl">
            <div className={`text-6xl mb-4 ${quizState.score >= 70 ? 'text-green-400' : 'text-amber-400'}`}>
              {quizState.score >= 90 ? '🎉' : quizState.score >= 70 ? '👍' : '📚'}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {quizState.score >= 70 ? 'Great Job!' : 'Keep Learning!'}
            </h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {quizState.score}%
            </p>
            <p className="text-gray-400 mt-2">
              You got {Math.round(quizState.score / 100 * lessonContent.quiz.length)} out of {lessonContent.quiz.length} questions correct
            </p>
          </div>

          {/* Review Answers */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Review Your Answers:</h4>
            {lessonContent.quiz.map((q, idx) => {
              const selectedAnswer = quizState.answers[q.id];
              const correctAnswer = q.options.find(o => o.isCorrect);
              const isCorrect = selectedAnswer === correctAnswer?.id;

              return (
                <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white text-sm font-bold`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">{q.question}</p>
                      <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? q.correctExplanation : q.incorrectExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            {quizState.score < 100 && (
              <button
                onClick={resetQuiz}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={nextLesson}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Continue to Next Lesson
            </button>
          </div>
        </div>
      );
    }

    const currentQ = lessonContent.quiz[quizState.currentQuestion];

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${((quizState.currentQuestion + 1) / lessonContent.quiz.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">
            {quizState.currentQuestion + 1} / {lessonContent.quiz.length}
          </span>
        </div>

        {/* Question */}
        <div className="p-6 bg-gray-800/50 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-6">{currentQ.question}</h3>

          <div className="space-y-3">
            {currentQ.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleQuizAnswer(currentQ.id, option.id)}
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  quizState.answers[currentQ.id] === option.id
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white'
                }`}
              >
                <span className={`inline-block w-8 h-8 rounded-full text-center leading-8 mr-3 ${
                  quizState.answers[currentQ.id] === option.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {option.id.toUpperCase()}
                </span>
                {option.text}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {quizState.currentQuestion > 0 && (
            <button
              onClick={() => setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion - 1 }))}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Previous
            </button>
          )}
          {quizState.currentQuestion < lessonContent.quiz.length - 1 ? (
            <button
              onClick={() => setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1 }))}
              disabled={!quizState.answers[currentQ.id]}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={Object.keys(quizState.answers).length < lessonContent.quiz.length}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render interactive/tour lesson
  const renderInteractiveLesson = () => (
    <div className="space-y-6">
      <p className="text-gray-300 leading-relaxed">{lessonContent.text}</p>

      {lessonContent.tourSteps && lessonContent.tourSteps.length > 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Interactive Tour
          </h4>
          <p className="text-gray-400 text-sm mb-3">
            This lesson includes an interactive tour. Follow along with the highlighted elements on the page.
          </p>
          <p className="text-gray-500 text-xs italic">
            (Interactive tours coming soon - for now, read through the steps below)
          </p>
          <div className="mt-4 space-y-2">
            {lessonContent.tourSteps.map((step, idx) => (
              <div key={idx} className="flex gap-3 p-2 bg-gray-800/50 rounded">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-white font-medium">{step.title}</p>
                  <p className="text-gray-400 text-sm">{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render exercise lesson
  const renderExerciseLesson = () => (
    <div className="space-y-6">
      <p className="text-gray-300 leading-relaxed">{lessonContent.text}</p>

      {lessonContent.exercise && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Exercise
          </h4>
          <p className="text-white font-medium mb-2">{lessonContent.exercise.instructions}</p>
          <p className="text-gray-400 text-sm mb-4">
            Success criteria: {lessonContent.exercise.successCriteria}
          </p>

          {lessonContent.exercise.hints && lessonContent.exercise.hints.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-500 text-sm mb-2">Hints:</p>
              <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                {lessonContent.exercise.hints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render lesson based on type
  const renderLessonContent = () => {
    switch (currentLesson.type) {
      case 'theory':
        return renderTheoryLesson();
      case 'quiz':
        return renderQuizLesson();
      case 'interactive':
        return renderInteractiveLesson();
      case 'exercise':
        return renderExerciseLesson();
      default:
        return renderTheoryLesson();
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">
                {currentModule?.title} • Lesson {currentLesson.order}
              </p>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {currentLesson.title}
                {isCompleted && (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </h2>
            </div>
            <button
              onClick={closeLesson}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Close lesson"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lesson type badge */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${currentLesson.type === 'theory' ? 'bg-gray-700 text-gray-300' :
                currentLesson.type === 'interactive' ? 'bg-blue-500/20 text-blue-400' :
                currentLesson.type === 'quiz' ? 'bg-purple-500/20 text-purple-400' :
                'bg-green-500/20 text-green-400'}
            `}>
              {currentLesson.type.charAt(0).toUpperCase() + currentLesson.type.slice(1)}
            </span>
            {currentLesson.estimatedMinutes && (
              <span className="text-xs text-gray-500">
                ~{currentLesson.estimatedMinutes} min
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderLessonContent()}
        </div>

        {/* Footer - Navigation (for non-quiz lessons) */}
        {currentLesson.type !== 'quiz' && (
          <div className="p-4 border-t border-white/10 bg-gray-900/50">
            <div className="flex gap-3">
              <button
                onClick={previousLesson}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
              >
                {isCompleted ? 'Continue' : 'Mark Complete & Continue'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonContent;
