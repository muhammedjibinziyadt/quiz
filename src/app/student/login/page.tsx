"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { KeyRound, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = accessCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter your unique student access code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/student/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in");
      }

      // Redirect to student quizzes
      router.push("/student/quizzes");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid access code. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-red-600/10 to-amber-500/10 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="relative w-20 h-24 drop-shadow-md">
                <Image
                  src="/images/maerika-arts-fest-logo.png"
                  alt="MAERIKA 2K26 Arts Fest"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="h-14 w-px bg-slate-800" />
              <div className="relative w-28 h-16 drop-shadow-md">
                <Image
                  src="/images/nattarivu-quiz-logo.png"
                  alt="നാട്ടറിവ് QUIZ 2026"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              MAERIKA 2K26 Arts Fest
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Student Quiz Entry
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter your exclusive participant access code to unlock your scheduled quiz.
            </p>
          </div>

          {/* Login Card */}
          <div className="fest-glass rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 text-red-300 text-sm animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                  <p className="leading-snug">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="accessCode"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
                >
                  Access Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    id="accessCode"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MK-ABHI-2026"
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 font-mono text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase"
                    disabled={loading}
                    required
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Access codes are provided by the festival coordinators.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Validating Code...</span>
                  </div>
                ) : (
                  <>
                    <span>Enter Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Organizers or Faculty?{" "}
                <a
                  href="/admin/login"
                  className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4"
                >
                  Admin Portal Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
