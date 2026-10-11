"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export function Header({
  studentName,
  isAdmin,
}: {
  studentName?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  // Keep full-screen landing and login pages header-free so centered brand heroes are uninterrupted
  if (pathname === "/" || pathname === "/student/login" || pathname === "/admin/login") {
    return null;
  }

  const handleLogout = async () => {
    try {
      if (isAdmin) {
        await fetch("/api/admin/auth/logout", { method: "POST" });
        window.location.href = "/admin/login";
      } else {
        await fetch("/api/student/auth/logout", { method: "POST" });
        window.location.href = "/student/login";
      }
    } catch {
      window.location.href = isAdmin ? "/admin/login" : "/student/login";
    }
  };

  const homeHref = isAdmin ? "/admin/dashboard" : "/student/quizzes";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* The Two Logos */}
        <Link
          href={homeHref}
          className="flex items-center gap-3 sm:gap-4 transition-transform hover:opacity-90"
        >
          <div className="relative w-9 h-12 sm:w-11 sm:h-14 shrink-0">
            <Image
              src="/images/maerika-arts-fest-logo.png"
              alt="MAERIKA 2K26"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="h-6 sm:h-8 w-px bg-slate-700/60" />

          <div className="relative w-20 h-10 sm:w-28 sm:h-14 shrink-0">
            <Image
              src="/images/nattarivu-quiz-logo.png"
              alt="നാട്ടറിവ് QUIZ 2026"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          {studentName && (
            <span className="hidden sm:inline-block text-xs font-medium text-slate-300 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              {studentName}
            </span>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-red-400 bg-slate-900/90 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAdmin ? "Log Out" : "Exit"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
