"use client";

import { useEffect, useState, useRef, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronRight,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  FileText,
} from "lucide-react";

interface Option {
  id: string;
  text: string;
  imageUrl?: string;
}

interface Question {
  _id: string;
  order: number;
  questionType?: "mcq" | "short_answer";
  minWords?: number;
  questionText: string;
  questionImage?: string;
  options: Option[];
  marks: number;
  timeLimitSeconds?: number | null;
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
  durationSeconds?: number;
  timeLimitPerQuestion?: number;
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
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);
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

        // Populate written answer for first question if exists
        if (loadedQuestions[0] && initialAnswers[loadedQuestions[0]._id]) {
          setWrittenAnswer(initialAnswers[loadedQuestions[0]._id]);
        }

        // Resume at first unanswered question
        const firstUnanswered = loadedQuestions.findIndex(
          (q: Question) => !initialAnswers[q._id]
        );
        let activeIdx = 0;
        if (firstUnanswered !== -1) {
          activeIdx = firstUnanswered;
        } else if (loadedQuestions.length > 0) {
          activeIdx = loadedQuestions.length - 1;
        }
        setCurrentIndex(activeIdx);

        // Initialize question timer
        if (loadedQuestions[activeIdx]) {
          const limit =
            loadedQuestions[activeIdx].timeLimitSeconds ||
            data.quiz.timeLimitPerQuestion ||
            10;
          setQuestionTimeLeft(limit);
        }
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

  // PER-QUESTION COUNTDOWN TICKER
  useEffect(() => {
    if (!attempt || submitting || questions.length === 0) return;

    // Reset countdown to current question's time limit and sync writtenAnswer
    const currentQ = questions[currentIndex];
    if (currentQ) {
      setWrittenAnswer(selectedAnswers[currentQ._id] || "");
    }
    const limit =
      currentQ?.timeLimitSeconds || quiz?.timeLimitPerQuestion || 10;
    setQuestionTimeLeft(limit);

    const timer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Question time expired: auto-advance or auto-submit
          if (currentIndex < questions.length - 1) {
            setCurrentIndex((curr) => curr + 1);
          } else if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, questions.length, attempt, submitting, quiz?.timeLimitPerQuestion]);

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
    } else {
      // Last question: automatically submit directly without any confirmation popup
      advanceTimerRef.current = setTimeout(() => {
        handleFinalSubmit(false, updated);
      }, 400);
    }
  };

  const handleNext = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const currentQ = questions[currentIndex];
    if (!currentQ || !selectedAnswers[currentQ._id]) return;
    setCurrentIndex((prev) => Math.min(maxAccessibleIndex, prev + 1));
  };

  // Final Submit Handler
  const handleFinalSubmit = async (
    isAuto = false,
    answersToSubmit?: Record<string, string>
  ) => {
    if (!attempt || submitting) return;
    setSubmitting(true);

    try {
      const activeAnswers = answersToSubmit || selectedAnswers;
      const answersArray = Object.entries(activeAnswers).map(
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
  const isTimeCritical = questionTimeLeft <= 3;

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col select-none overflow-x-hidden w-full">
      {/* Quiz Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Quiz Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="relative w-7 h-8 sm:w-8 sm:h-10 shrink-0">
              <Image
                src="/images/maerika-arts-fest-logo.png"
                alt="MAERIKA 2K26"
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-white leading-tight truncate">
                {quiz.title}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-300">
                  Q {currentIndex + 1} of {questions.length}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">+{currentQ.marks} Marks</span>
              </div>
            </div>
          </div>

          {/* Timer Display & Instructions button (NO Submit button here) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="View Instructions"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Countdown Badge for this Question */}
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border font-mono font-bold text-xs sm:text-sm md:text-base transition-all ${
                isTimeCritical
                  ? "bg-red-950/70 border-red-500 text-red-300 animate-pulse shadow-md shadow-red-900/40"
                  : "bg-slate-900/90 border-slate-700 text-amber-300"
              }`}
              title="Time limit for current question"
            >
              <Clock
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  isTimeCritical ? "text-red-400 animate-spin" : "text-amber-400"
                }`}
              />
              <span>{questionTimeLeft}s</span>
            </div>
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex flex-col justify-between">
        <div
          key={currentQ._id}
          className="fest-glass rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-800 animate-question-fade"
        >
          {/* Question Header */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shrink-0">
              Question #{currentIndex + 1}
            </span>
            <span className="text-[11px] sm:text-xs">
              {currentAnswer ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {currentQ.questionType === "short_answer"
                      ? "ഉത്തരം രേഖപ്പെടുത്തി (Answer Submitted)"
                      : "Answer Selected"}
                  </span>
                  {currentIndex < questions.length - 1 && (
                    <span className="text-slate-400 font-normal hidden xs:inline">→ Next...</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  {currentQ.questionType === "short_answer"
                    ? "20 വാക്കുകളിൽ ഉത്തരം എഴുതി സമർപ്പിക്കുക"
                    : "Select option to proceed"}
                </span>
              )}
            </span>
          </div>

          {/* Question countdown progress bar */}
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mb-4 sm:mb-5">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                questionTimeLeft <= 3
                  ? "bg-red-500 animate-pulse"
                  : "bg-gradient-to-r from-blue-500 to-amber-400"
              }`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    (questionTimeLeft /
                      (currentQ?.timeLimitSeconds ||
                        quiz?.timeLimitPerQuestion ||
                        10)) *
                      100
                  )
                )}%`,
              }}
            />
          </div>

          {/* PROMINENTLY HIGHLIGHTED QUESTION BOX */}
          <div className="mb-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-2 border-blue-500/50 shadow-xl shadow-blue-950/40 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-400/40 px-2.5 py-0.5 rounded-md">
                ചോദ്യം (Question #{currentIndex + 1})
              </span>
              {currentQ.questionType === "short_answer" && (
                <span className="text-[10px] sm:text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  മിനിമം {currentQ.minWords || 20} വാക്കുകൾ
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-relaxed font-malayalam break-words drop-shadow">
              {currentQ.questionText}
            </h2>
          </div>

          {/* Question Image (if image-based question) */}
          {currentQ.questionImage && (
            <div className="relative w-full max-w-xl h-48 sm:h-64 md:h-72 mx-auto rounded-xl overflow-hidden border border-slate-700/80 mb-4 sm:mb-6 bg-slate-900/50">
              <Image
                src={currentQ.questionImage}
                alt={`Question ${currentIndex + 1} Image`}
                fill
                className="object-contain p-2"
              />
            </div>
          )}

          {/* Options List OR Written Answer Box */}
          {currentQ.questionType === "short_answer" ? (
            <div className="space-y-3">
              {/* Clean, Subtle Input Guidance Header (No distracting loud orange box) */}
              <div className="flex items-center justify-between text-xs text-slate-300 px-1">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs sm:text-sm">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>നിങ്ങളുടെ ഉത്തരം താഴെ എഴുതുക (Write your answer below):</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                  മിനിമം 20 വാക്കുകൾ
                </span>
              </div>

              {/* Textarea for written answer */}
              <div className="relative">
                <textarea
                  value={writtenAnswer}
                  onChange={(e) => setWrittenAnswer(e.target.value)}
                  disabled={submitting}
                  rows={5}
                  placeholder="ഇവിടെ നിങ്ങളുടെ ഉത്തരം ചുരുങ്ങിയത് 20 വാക്കുകളിൽ വ്യക്തമായി എഴുതുക... (Write your answer note here in at least 20 words...)"
                  className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-sm sm:text-base font-malayalam leading-relaxed placeholder:text-slate-500 resize-none transition-all"
                />

                {/* Live word counter */}
                {(() => {
                  const words = writtenAnswer.trim().split(/\s+/).filter(Boolean);
                  const wordCount = writtenAnswer.trim() ? words.length : 0;
                  const reqWords = currentQ.minWords || 20;
                  const passed = wordCount >= reqWords;

                  return (
                    <div className="flex items-center justify-between text-xs px-1 pt-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold px-2.5 py-1 rounded-md text-xs ${
                            passed
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {wordCount} / {reqWords} വാക്കുകൾ (words)
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {passed ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> നിശ്ചിത വാക്ക് പരിധി തികഞ്ഞു (Ready to submit)
                            </span>
                          ) : (
                            <span>(ഇനിയും {Math.max(0, reqWords - wordCount)} വാക്കുകൾ കൂടി എഴുതുക)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Submit Written Answer Button */}
              {(() => {
                const words = writtenAnswer.trim().split(/\s+/).filter(Boolean);
                const wordCount = writtenAnswer.trim() ? words.length : 0;
                const reqWords = currentQ.minWords || 20;
                const passed = wordCount >= reqWords;

                return (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!passed) {
                          alert(`ചുരുങ്ങിയത് ${reqWords} വാക്കുകൾ വേണം (നിലവിൽ ${wordCount} വാക്കുകൾ). Please write at least ${reqWords} words to submit.`);
                          return;
                        }
                        handleSelectOption(writtenAnswer.trim());
                      }}
                      disabled={!passed || submitting}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                        passed
                          ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-emerald-900/30 active:scale-[0.99]"
                          : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-75"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {currentAnswer
                          ? "ഉത്തരം അപ്ഡേറ്റ് ചെയ്യുക (Update Answer & Next)"
                          : "ഉത്തരം സമർപ്പിക്കുക (Submit Answer & Next)"}
                      </span>
                    </button>
                    {!passed && (
                      <p className="text-[11px] text-amber-400/80 text-center mt-2 font-medium">
                        ⚠️ 20 വാക്കുകളിൽ കൂടുതലായാൽ മാത്രമേ ഉത്തരം സ്വീകരിക്കുകയും പോയിന്റ് ലഭിക്കുകയും ചെയ്യുകയുള്ളൂ.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3.5">
              {currentQ.options.map((opt, optIndex) => {
                const isSelected = currentAnswer === opt.id;
                const letter = String.fromCharCode(65 + optIndex); // A, B, C, D

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all flex items-start gap-3 sm:gap-4 cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 text-white fest-glow-blue ring-1 ring-blue-500/50"
                        : "bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {letter}
                    </div>

                    <div className="flex-1 font-malayalam text-xs sm:text-sm md:text-base leading-relaxed break-words min-w-0">
                      {opt.imageUrl && (
                        <div className="relative w-36 h-20 sm:w-40 sm:h-24 rounded-lg overflow-hidden border border-slate-700 mb-2">
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

                    <div className="shrink-0 mt-0.5 sm:mt-1">
                      <div
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-blue-500 bg-blue-500" : "border-slate-600"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-300">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {!currentAnswer && currentIndex < questions.length - 1 && (
                <span className="text-[11px] text-amber-400 font-medium hidden sm:inline">
                  • Select an option to proceed
                </span>
              )}
            </div>

            <div>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer || currentIndex >= maxAccessibleIndex || submitting}
                  title={!currentAnswer ? "Answer this question to proceed" : "Next question"}
                  className="flex items-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:border disabled:border-slate-700/60 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
                    handleFinalSubmit(false);
                  }}
                  disabled={submitting}
                  className="flex items-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-md shadow-red-600/30 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Quiz</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Direct Submitting Screen Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="fest-glass rounded-2xl p-6 sm:p-8 border border-slate-700 text-center max-w-sm w-full animate-scale-up shadow-2xl">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Submitting Quiz Answers...</h3>
            <p className="text-xs text-slate-400">Recording results and generating your score.</p>
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
