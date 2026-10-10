"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, Trophy, ShieldCheck, User } from "lucide-react";

export function Header({
  studentName,
  isAdmin,
}: {
  studentName?: string | null;
  isAdmin?: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logos & Brand */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative w-12 h-14 shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/images/maerika-arts-fest-logo.png"
              alt="MAERIKA 2K26 Arts Fest Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg sm:text-xl text-white">
                MAERIKA <span className="text-amber-400">2K26</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                Arts Fest
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Official Live Quiz Competition
            </span>
          </div>
        </Link>

        {/* Right side navigation / session badge */}
        <div className="flex items-center gap-3">
          {studentName ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-white">{studentName}</span>
              </div>
              <button
                onClick={async () => {
                  await fetch("/api/student/auth/logout", { method: "POST" });
                  window.location.href = "/student/login";
                }}
                className="text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-500/30 transition-colors"
              >
                Exit
              </button>
            </div>
          ) : isAdmin ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
              </span>
              <button
                onClick={async () => {
                  await fetch("/api/admin/auth/logout", { method: "POST" });
                  window.location.href = "/admin/login";
                }}
                className="text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-500/30 transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/student/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-600/30 active:scale-95"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                Student Login
              </Link>
              <Link
                href="/admin/login"
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Admin
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
