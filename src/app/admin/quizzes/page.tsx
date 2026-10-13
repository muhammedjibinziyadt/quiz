"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import {
  BookOpen,
  PlusCircle,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Globe,
  Lock,
  Layers,
  Trophy,
  Calendar,
} from "lucide-react";

interface QuizRecord {
  _id: string;
  title: string;
  description?: string;
  quizType: "text" | "image" | "mixed";
  startTime?: string | null;
  endTime?: string | null;
  durationSeconds: number;
  timeLimitPerQuestion?: number;
  marksPerQuestion: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  status: "draft" | "published" | "archived";
  isLocked: boolean;
  questionsCount: number;
  totalAttempts: number;
  completedAttempts: number;
  createdAt: string;
}

export default function AdminQuizzesListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/admin/quizzes");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes(true);
  }, []);

  const handleTogglePublish = async (quizId: string, currentStatus: string) => {
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update publication status");
        return;
      }
      fetchQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuiz = async (quizId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the quiz "${title}" and all its questions and attempt data?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchQuizzes();
      } else {
        alert("Failed to delete quiz");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header isAdmin />
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              Quiz Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Create and configure text and image-based quiz competitions with timers and marking criteria.
            </p>
          </div>

          <Link
            href="/admin/quizzes/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Quiz</span>
          </Link>
        </div>

        {/* Quizzes Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            Loading quizzes...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 fest-glass rounded-2xl border border-slate-800 p-8">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Quizzes Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Get started by creating your first quiz competition for MAERIKA 2K26 Arts Fest.
            </p>
            <Link
              href="/admin/quizzes/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Quiz</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const mins = Math.floor(quiz.durationSeconds / 60);
              const secs = quiz.durationSeconds % 60;
              const isPublished = quiz.status === "published";

              return (
                <div
                  key={quiz._id}
                  className="fest-glass rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <Layers className="w-3 h-3" /> Quiz Competition
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                          isPublished
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {isPublished ? (
                          <>
                            <Globe className="w-3 h-3" /> Published
                          </>
                        ) : (
                          "Draft"
                        )}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                      {quiz.description || "No description provided."}
                    </p>

                    {quiz.startTime && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg mb-4">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Starts:{" "}
                          {new Date(quiz.startTime).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800 text-xs text-slate-300 mb-5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{quiz.timeLimitPerQuestion || 10}s / question</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                        <span>{quiz.questionsCount} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>+{quiz.marksPerQuestion} Marks</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-purple-400" />
                        <span>{quiz.completedAttempts} Completed</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/quizzes/${quiz._id}/edit`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-400" />
                        <span>Edit & Questions</span>
                      </Link>

                      <button
                        onClick={() => handleTogglePublish(quiz._id, quiz.status)}
                        className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                          isPublished
                            ? "bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      {quiz.isLocked && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400">
                          <Lock className="w-3 h-3" /> Attempts in progress
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                        className="text-slate-500 hover:text-red-400 ml-auto flex items-center gap-1 transition-colors p-1"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
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
