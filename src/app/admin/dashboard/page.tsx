"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import {
  Users,
  BookOpen,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  UserPlus,
  PlusCircle,
  Activity,
  Radio,
} from "lucide-react";

interface DashboardStats {
  totalRegisteredStudents: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  totalAttempts: number;
  completedAttempts: number;
  activeParticipants: number;
}

interface AuditLogItem {
  _id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const meRes = await fetch("/api/admin/auth/me");
        if (!meRes.ok) {
          router.push("/admin/login");
          return;
        }

        const statsRes = await fetch("/api/admin/dashboard/stats");
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
          setActivity(data.recentActivity || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header isAdmin />
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome & Quick Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              MAERIKA 2K26 Arts Fest Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Competition Overview
            </h1>
            <p className="text-sm text-slate-400">
              Live statistics, participation volume, and rapid contest controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/students?action=new"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Register Student</span>
            </Link>

            <Link
              href="/admin/quizzes/new"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Quiz</span>
            </Link>

            <Link
              href="/admin/leaderboard"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-600/25 transition-all"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Launch Live Leaderboard</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
          <div className="fest-glass rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {loading ? "..." : stats?.totalRegisteredStudents ?? 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Registered participants</p>
            </div>
          </div>

          <div className="fest-glass rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Quizzes</span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {loading ? "..." : stats?.totalQuizzes ?? 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Created contests</p>
            </div>
          </div>

          <div className="fest-glass rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {loading ? "..." : stats?.publishedQuizzes ?? 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Active competitions</p>
            </div>
          </div>

          <div className="fest-glass rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Attempts</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {loading ? "..." : stats?.totalAttempts ?? 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Started attempts</p>
            </div>
          </div>

          <div className="fest-glass rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Live Taking</span>
              <Clock className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {loading ? "..." : stats?.activeParticipants ?? 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Countdown running</p>
            </div>
          </div>

          <div className="fest-glass rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {loading ? "..." : stats?.completedAttempts ?? 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Scored submissions</p>
            </div>
          </div>
        </div>

        {/* Two-Column Section: Quick Navigation Cards & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2 columns: Section Hub Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Administrative Modules
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/admin/leaderboard"
                className="fest-glass-interactive rounded-2xl p-6 border border-slate-800 block group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Real-time Animated Leaderboard
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Live podium, rank movement animations (↑/↓), and Recharts charts powered by Pusher Channels.
                </p>
              </Link>

              <Link
                href="/admin/students"
                className="fest-glass-interactive rounded-2xl p-6 border border-slate-800 block group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Student Management</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Individual registration, cryptographic access codes, participation history, and CSV export.
                </p>
              </Link>

              <Link
                href="/admin/quizzes"
                className="fest-glass-interactive rounded-2xl p-6 border border-slate-800 block group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Quiz & Question Builder</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Text and image-based MCQs, timers, negative marking, attempt locks, and image uploads.
                </p>
              </Link>

              <Link
                href="/admin/results"
                className="fest-glass-interactive rounded-2xl p-6 border border-slate-800 block group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Results & Performance Logs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Complete score breakdowns, correct/wrong counts, completion times, and CSV report downloads.
                </p>
              </Link>
            </div>
          </div>

          {/* Right 1 column: Recent Activity Audit Stream */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4">Recent System Activity</h2>
            <div className="fest-glass rounded-2xl p-5 border border-slate-800 space-y-4">
              {activity.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No recent admin actions logged yet.
                </p>
              ) : (
                activity.map((log) => {
                  const date = new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={log._id}
                      className="flex items-start gap-3 pb-3 border-b border-slate-800/80 last:border-0 last:pb-0 text-xs"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-200 capitalize">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          By {log.performedBy}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{date}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
