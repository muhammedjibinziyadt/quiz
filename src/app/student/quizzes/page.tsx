"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Clock,
  HelpCircle,
  Award,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
} from "lucide-react";

interface QuizItem {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  quizType?: "text" | "image" | "mixed";
  startTime?: string | null;
  endTime?: string | null;
  isStarted: boolean;
  durationSeconds: number;
  marksPerQuestion: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  questionsCount: number;
  maxAttempts: number;
  completedAttemptsCount: number;
  hasAttemptsLeft: boolean;
  activeAttemptId?: string | null;
  lastCompletedAttemptId?: string | null;
}

interface StudentUser {
  id: string;
  name: string;
  place: string;
}

export default function StudentQuizzesPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Auto-refresh clock every 5 seconds to unlock quizzes when start time arrives
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchQuizzes = async () => {
    try {
      const quizRes = await fetch("/api/student/quizzes");
      if (!quizRes.ok) throw new Error("Failed to load available quizzes");
      const quizData = await quizRes.json();
      setQuizzes(quizData.quizzes || []);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch("/api/student/auth/me");
        if (!meRes.ok) {
          router.push("/student/login");
          return;
        }
        const meData = await meRes.json();
        setStudent(meData.student);

        const quizRes = await fetch("/api/student/quizzes");
        if (!quizRes.ok) throw new Error("Failed to load available quizzes");
        const quizData = await quizRes.json();
        setQuizzes(quizData.quizzes || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Format scheduled time helper
  const formatScheduledTime = (isoString?: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header studentName={student?.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Banner */}
        <div className="fest-glass rounded-2xl p-6 sm:p-8 mb-10 border border-slate-800 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Participant Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {student ? student.name : "Participant"}!
            </h1>
            {student?.place && (
              <p className="mt-1.5 text-slate-300 text-sm font-medium">
                {student.place}
              </p>
            )}
          </div>
        </div>

        {/* Available Quizzes Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Available Competitions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select an authorized event to participate once the competition starts.
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="fest-glass rounded-2xl p-6 border border-slate-800 animate-pulse h-64"
              >
                <div className="h-6 w-3/4 bg-slate-800 rounded mb-4" />
                <div className="h-4 w-full bg-slate-800 rounded mb-2" />
                <div className="h-4 w-2/3 bg-slate-800 rounded mb-6" />
                <div className="h-10 w-full bg-slate-800 rounded mt-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-800/50 text-red-300 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && quizzes.length === 0 && (
          <div className="text-center py-16 fest-glass rounded-2xl border border-slate-800 p-8">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No Competitions Scheduled Yet</h3>
            <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
              The competition organizers have not published any quizzes yet, or the contest window has ended.
            </p>
          </div>
        )}

        {/* Quizzes List */}
        {!loading && !error && quizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const minutes = Math.floor(quiz.durationSeconds / 60);
              const seconds = quiz.durationSeconds % 60;
              const formattedDuration = `${minutes > 0 ? `${minutes}m ` : ""}${seconds > 0 ? `${seconds}s` : ""}`;

              // Dynamic check against live time
              const isStarted = !quiz.startTime || new Date(quiz.startTime).getTime() <= currentTime;

              return (
                <div
                  key={quiz._id}
                  className="fest-glass-interactive rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover or Logo Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {isStarted ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          Live Now
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Starts at {formatScheduledTime(quiz.startTime)}
                        </span>
                      )}

                      {quiz.activeAttemptId ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          <RotateCcw className="w-3 h-3" /> In Progress
                        </span>
                      ) : !quiz.hasAttemptsLeft ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                          {quiz.maxAttempts - quiz.completedAttemptsCount} attempt left
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 leading-snug line-clamp-2">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-5 line-clamp-3 leading-relaxed">
                      {quiz.description || "Official MAERIKA 2K26 Competition."}
                    </p>

                    {/* Scheduled notice if quiz has not started yet */}
                    {!isStarted && quiz.startTime && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-2.5 text-xs text-amber-300">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                        <div>
                          <p className="font-semibold text-white">
                            Starts at {formatScheduledTime(quiz.startTime)}
                          </p>
                          <p className="text-[11px] text-amber-300/80">
                            You are registered! Quiz will unlock automatically when start time arrives.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Metadata Specs */}
                    <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-slate-800/80 mb-6 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{formattedDuration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{quiz.questionsCount} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>+{quiz.marksPerQuestion} Marks / Q</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 ${quiz.negativeMarkingEnabled ? "text-red-400" : "text-slate-500"
                            }`}
                        />
                        <span>
                          {quiz.negativeMarkingEnabled
                            ? `-${quiz.negativeMarks} Neg. Marks`
                            : "No Negative Mark"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {quiz.activeAttemptId ? (
                      <Link
                        href={`/student/quiz/${quiz._id}`}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/25 transition-all text-sm active:scale-98"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Resume In-Progress Quiz</span>
                      </Link>
                    ) : !quiz.hasAttemptsLeft ? (
                      <Link
                        href={`/student/result/${quiz.lastCompletedAttemptId}`}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all text-sm border border-slate-700"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>View Your Submission</span>
                      </Link>
                    ) : !isStarted ? (
                      <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 text-sm cursor-not-allowed opacity-80"
                      >
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Starts at {formatScheduledTime(quiz.startTime)}</span>
                      </button>
                    ) : (
                      <Link
                        href={`/student/quiz/${quiz._id}`}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/25 transition-all text-sm active:scale-98 cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4 text-amber-300" />
                        <span>Start Competition</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
