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
  UserPlus,
  PlusCircle,
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const statsRes = await fetch("/api/admin/dashboard/stats");
        if (statsRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
      </main>

      <Footer />
    </div>
  );
}
