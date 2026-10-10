"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import {
  FileCheck2,
  Download,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
} from "lucide-react";

interface AttemptRecord {
  _id: string;
  studentId?: { name: string; phone: string; place: string; accessCodePrefix: string };
  quizId?: { title: string };
  score: number;
  totalPossibleMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  completionTimeSeconds: number;
  submittedAt: string;
}

interface QuizOption {
  _id: string;
  title: string;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch quizzes
  useEffect(() => {
    async function loadQuizzes() {
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
      }
    }
    loadQuizzes();
  }, [router]);

  // Fetch results
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/results?page=${page}&limit=15&quizId=${selectedQuizId}`
      );
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setAttempts(data.attempts || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalAttempts(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedQuizId, router]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header isAdmin />
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-emerald-400" />
              Competition Results & Logs
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Audit attempt results, score records, accuracy breakdown, and export CSV logs.
            </p>
          </div>

          <a
            href={`/api/admin/results?export=true&quizId=${selectedQuizId}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>

        {/* Filter Bar */}
        <div className="fest-glass rounded-2xl p-4 border border-slate-800 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Filter by Quiz:</span>
            <select
              value={selectedQuizId}
              onChange={(e) => {
                setSelectedQuizId(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Quizzes</option>
              {quizzes.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500">
            {totalAttempts} completed attempts recorded
          </span>
        </div>

        {/* Results Table */}
        <div className="fest-glass rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0b1222] text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Quiz Title</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Correct / Wrong</th>
                  <th className="py-3.5 px-4">Time Taken</th>
                  <th className="py-3.5 px-4 text-right">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                      Loading results records...
                    </td>
                  </tr>
                ) : attempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                      No attempts recorded for this filter.
                    </td>
                  </tr>
                ) : (
                  attempts.map((att) => (
                    <tr key={att._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {att.studentId?.name || "Unknown"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {att.studentId?.place} • {att.studentId?.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-200">
                        {att.quizId?.title || "Quiz"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-base text-amber-400">
                          {att.score}
                        </span>
                        <span className="text-xs text-slate-500">
                          {" "}
                          / {att.totalPossibleMarks}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="text-emerald-400 font-semibold">
                          {att.correctCount}
                        </span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-red-400 font-semibold">
                          {att.incorrectCount}
                        </span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-slate-400">
                          {att.unansweredCount} unans
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                        {formatTime(att.completionTimeSeconds)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded bg-slate-800 text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded bg-slate-800 text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
