"use client";

import { useEffect, useState, useRef, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";

interface Option {
  id: string;
  text: string;
  imageUrl?: string;
}

interface Question {
  _id: string;
  order: number;
  questionText: string;
  questionImage?: string;
  options: Option[];
  marks: number;
}

interface QuizAttemptData {
  id: string;
  attemptNumber: number;
  startTime: string;
  serverDeadline: string;
  savedAnswers: Array<{ questionId: string; selectedOptionId: string }>;
}

interface QuizInfo {
  id: string;
  title: string;
  instructions: string;
  durationSeconds: number;
  marksPerQuestion: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
}

import { Suspense } from "react";

function QuizRunnerContent({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.quizId;
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Auto-submit guard
  const hasAutoSubmitted = useRef(false);

  // Start or resume attempt on mount
  useEffect(() => {
    async function initQuiz() {
      try {
        const res = await fetch("/api/student/attempts/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to start quiz attempt");
        }

        setQuiz(data.quiz);
        setAttempt(data.attempt);
        const loadedQuestions = data.questions || [];
        setQuestions(loadedQuestions);

        // Restore previously saved answers if resuming
        const initialAnswers: Record<string, string> = {};
        if (data.attempt.savedAnswers) {
          data.attempt.savedAnswers.forEach(
            (ans: { questionId: string; selectedOptionId: string }) => {
              initialAnswers[ans.questionId] = ans.selectedOptionId;
            }
          );
        }
        setSelectedAnswers(initialAnswers);

        // Resume at first unanswered question
        const firstUnanswered = loadedQuestions.findIndex(
          (q: Question) => !initialAnswers[q._id]
        );
        if (firstUnanswered !== -1) {
          setCurrentIndex(firstUnanswered);
        } else if (loadedQuestions.length > 0) {
          setCurrentIndex(loadedQuestions.length - 1);
        }

        // Compute initial remaining seconds from serverDeadline
        const deadlineMs = new Date(data.attempt.serverDeadline).getTime();
        const nowMs = Date.now();
        const diffSeconds = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
        setTimeLeft(diffSeconds);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error starting quiz");
      } finally {
        setLoading(false);
      }
    }

    initQuiz();
  }, [quizId]);

  // Timer ref for smooth auto-advance after selecting option
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // Server-authoritative countdown ticker
  useEffect(() => {
    if (!attempt || submitting) return;

    const timer = setInterval(() => {
      const deadlineMs = new Date(attempt.serverDeadline).getTime();
      const nowMs = Date.now();
      const diffSeconds = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
      setTimeLeft(diffSeconds);

      if (diffSeconds <= 0 && !hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        clearInterval(timer);
        handleFinalSubmit(true); // Auto-submit on expiry
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, submitting]);

  // Furthest question accessible: student cannot skip past an unanswered question
  const firstUnansweredIndex = questions.findIndex(
    (q) => !selectedAnswers[q._id]
  );
  const maxAccessibleIndex =
    firstUnansweredIndex === -1 ? questions.length - 1 : firstUnansweredIndex;

  // Select option, sync in background, and automatically advance to next question
  const handleSelectOption = (optionId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || !attempt || submitting) return;

    const updated = {
      ...selectedAnswers,
      [currentQ._id]: optionId,
    };
    setSelectedAnswers(updated);

    // Save in background (non-blocking)
    try {
      fetch(`/api/student/attempts/${attempt.id}/save-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ._id,
          selectedOptionId: optionId,
        }),
      }).catch((saveErr) => {
        console.warn("Could not sync answer immediately:", saveErr);
      });
    } catch (saveErr) {
      console.warn("Could not sync answer immediately:", saveErr);
    }

    // Clear previous advance timer if user changes option rapidly
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }

    // Automatically advance to the next question after visual confirmation delay (380ms)
    if (currentIndex < questions.length - 1) {
      advanceTimerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      }, 380);
    }
    // On the ending question, do not auto-submit - let student submit manually when ready
  };

  const handlePrevious = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const currentQ = questions[currentIndex];
    if (!currentQ || !selectedAnswers[currentQ._id]) return;
    setCurrentIndex((prev) => Math.min(maxAccessibleIndex, prev + 1));
  };

  const handleSelectQuestionFromPalette = (idx: number) => {
    if (idx > maxAccessibleIndex) return; // Prevent jumping ahead past unanswered questions
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setCurrentIndex(idx);
  };

  // Final Submit Handler
  const handleFinalSubmit = async (isAuto = false) => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const answersArray = Object.entries(selectedAnswers).map(
        ([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })
      );

      const res = await fetch(`/api/student/attempts/${attempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answersArray,
          autoSubmitted: isAuto,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission error");
      }

      // Route to personal result screen
      router.push(`/student/result/${attempt.id}`);
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      alert("Submission encountered an issue. Re-attempting sync...");
      setSubmitting(false);
    }
  };

  // Format time display (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <h2 className="text-white font-bold text-lg">Initializing Live Quiz Session...</h2>
        <p className="text-slate-400 text-sm mt-1">Synchronizing with server authoritative timer.</p>
      </div>
    );
  }

  if (error || !quiz || questions.length === 0) {
    const isWaitingStart = error?.toLowerCase().includes("not started yet");

    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-6 text-center">
        <div
          className={`p-4 rounded-full border mb-4 ${
            isWaitingStart
              ? "bg-amber-950/40 border-amber-800 text-amber-400"
              : "bg-red-950/40 border-red-800 text-red-400"
          }`}
        >
          {isWaitingStart ? (
            <Clock className="w-10 h-10 animate-pulse" />
          ) : (
            <AlertTriangle className="w-10 h-10" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isWaitingStart ? "Quiz Has Not Started Yet" : "Unable to Load Quiz"}
        </h2>
        <p className="text-slate-400 max-w-md mb-6 leading-relaxed">
          {error || "No questions found for this quiz."}
        </p>
        <div className="flex items-center gap-3">
          {isWaitingStart && (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
            >
              Check Again
            </button>
          )}
          <button
            onClick={() => router.push("/student/quizzes")}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = selectedAnswers[currentQ._id];
  const answeredCount = Object.keys(selectedAnswers).length;
  const isTimeCritical = timeLeft < 60;

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col select-none">
      {/* Quiz Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Quiz Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-10 shrink-0">
              <Image
                src="/images/maerika-arts-fest-logo.png"
                alt="MAERIKA 2K26"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-1">
                {quiz.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">+{currentQ.marks} Marks</span>
                {quiz.negativeMarkingEnabled && (
                  <>
                    <span>•</span>
                    <span className="text-red-400 font-medium">-{quiz.negativeMarks} Neg</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Timer Display & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="View Instructions"
            >
              <Info className="w-5 h-5" />
            </button>

            {/* Countdown Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono font-bold text-base sm:text-lg transition-all ${
                isTimeCritical
                  ? "bg-red-950/60 border-red-600 text-red-400 animate-pulse shadow-lg shadow-red-900/40"
                  : "bg-slate-900/90 border-slate-700 text-white"
              }`}
            >
              <Clock
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isTimeCritical ? "text-red-400 animate-spin" : "text-amber-400"
                }`}
              />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-red-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit Quiz</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="bg-slate-900/95 border-b border-slate-800 p-4 text-xs text-slate-300">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-white mb-1">Competition Instructions:</p>
              <p className="whitespace-pre-line text-slate-300 leading-relaxed">
                {quiz.instructions}
              </p>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-between">
        <div
          key={currentQ._id}
          className="fest-glass rounded-2xl p-6 sm:p-8 border border-slate-800 animate-question-fade"
        >
          {/* Question Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              Question #{currentIndex + 1}
            </span>
            <span className="text-xs">
              {currentAnswer ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Answer Selected</span>
                  {currentIndex < questions.length - 1 && (
                    <span className="text-slate-400 font-normal">→ Next question...</span>
                  )}
                </span>
              ) : (
                <span className="text-amber-400/90 font-medium flex items-center gap-1">
                  Select an option to unlock next
                </span>
              )}
            </span>
          </div>

          {/* Question Text with Malayalam font */}
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed mb-6 font-malayalam">
            {currentQ.questionText}
          </h2>

          {/* Question Image (if image-based question) */}
          {currentQ.questionImage && (
            <div className="relative w-full max-w-2xl h-64 sm:h-80 mx-auto rounded-xl overflow-hidden border border-slate-700/80 mb-6 bg-slate-900/50">
              <Image
                src={currentQ.questionImage}
                alt={`Question ${currentIndex + 1} Image`}
                fill
                className="object-contain p-2"
              />
            </div>
          )}

          {/* Options List */}
          <div className="space-y-3 sm:space-y-4">
            {currentQ.options.map((opt, optIndex) => {
              const isSelected = currentAnswer === opt.id;
              const letter = String.fromCharCode(65 + optIndex); // A, B, C, D

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all flex items-start gap-4 cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? "bg-blue-600/20 border-blue-500 text-white fest-glow-blue ring-1 ring-blue-500/50"
                      : "bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {letter}
                  </div>

                  <div className="flex-1 font-malayalam text-sm sm:text-base leading-relaxed">
                    {opt.imageUrl && (
                      <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-slate-700 mb-2">
                        <Image
                          src={opt.imageUrl}
                          alt={opt.text}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    )}
                    <span>{opt.text}</span>
                  </div>

                  <div className="shrink-0 mt-1">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "border-blue-500 bg-blue-500" : "border-slate-600"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-300">
              {currentIndex + 1} of {questions.length}
            </span>
            {!currentAnswer && currentIndex < questions.length - 1 && (
              <span className="text-[10px] text-amber-400/80 font-medium">Complete to unlock next</span>
            )}
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!currentAnswer || currentIndex >= maxAccessibleIndex}
              title={!currentAnswer ? "Answer this question to proceed" : "Next question"}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:border disabled:border-slate-700/60 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
                setShowConfirmModal(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Quiz</span>
            </button>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="fest-glass rounded-2xl max-w-md w-full p-6 sm:p-8 border border-slate-700 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <ShieldAlert className="w-7 h-7" />
              <h3 className="text-xl font-bold text-white">Confirm Submission</h3>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to finalize and submit your quiz answers? You have completed{" "}
              <strong className="text-white">{answeredCount}</strong> of{" "}
              <strong className="text-white">{questions.length}</strong> questions.
            </p>

            {questions.length - answeredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs mb-6 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  You have {questions.length - answeredCount} unanswered questions which will receive zero marks.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
              >
                Continue Quiz
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                {submitting ? "Scoring..." : "Yes, Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentQuizRunnerPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          <h2 className="text-white font-bold text-base">Loading Live Quiz Session...</h2>
        </div>
      }
    >
      <QuizRunnerContent params={params} />
    </Suspense>
  );
}
