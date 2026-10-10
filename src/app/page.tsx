"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Trophy,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Lock,
  Layers,
  Radio,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] relative selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
          {/* Ambient Festival Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-blue-600/20 via-red-600/15 to-amber-500/15 blur-3xl -z-10 rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Logos Showcase */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8 animate-fade-in">
              <div className="relative w-24 h-32 sm:w-28 sm:h-36 drop-shadow-2xl transition-transform hover:scale-105">
                <Image
                  src="/images/maerika-arts-fest-logo.png"
                  alt="MAERIKA 2K26 Arts Fest"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="h-14 sm:h-20 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent" />

              <div className="relative w-[106px] h-[58px] sm:w-60 sm:h-32 drop-shadow-2xl transition-transform hover:scale-105">
                <Image
                  src="/images/nattarivu-quiz-logo.png"
                  alt="നാട്ടറിവ് QUIZ 2026"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600/20 via-blue-600/20 to-amber-500/20 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6 shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>MAERIKA 2K26 Arts Fest • Live Quiz Competition</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
              Maerika 2k26 ആർട്സ് ഫെസ്റ്റിന്റെ ഭാഗമായി സംഘടിപ്പിക്കുന്ന നാട്ടറിവ് ക്വിസ് 2026
            </h1>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/student/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-xl shadow-blue-600/30 transition-all text-base cursor-pointer"
              >
                <Trophy className="w-5 h-5 text-amber-300" />
                <span>Enter Student Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/admin/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 hover:text-white border border-slate-700 transition-all text-sm cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Admin Portal</span>
              </Link>
            </div>

            {/* Trust and Feature Bullets */}
            <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unique Access Codes</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Server-Authoritative Clock</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Strict Student Privacy</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live Pusher Leaderboard</span>
              </div>
            </div>
          </div>
        </section>

        {/* HIGHLIGHTED COMPETITIONS & FEATURES */}
        <section className="py-16 bg-[#060a12] border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Designed for High-Stakes Arts Fest Competitions
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                A purpose-built quiz engine engineered for fairness, real-time evaluation, and distraction-free participation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="fest-glass rounded-2xl p-6 sm:p-8 border border-slate-800 relative">
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-5">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Server-Authoritative Timing
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Contest timers are recorded on the server. Student clocks cannot tamper with deadlines. Expired attempts automatically finalize to ensure total fairness.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="fest-glass rounded-2xl p-6 sm:p-8 border border-slate-800 relative">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Strict Participant Privacy
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Students never see leaderboards, winner profiles, or other students&apos; scores. All leaderboard APIs are protected by authenticated admin sessions.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="fest-glass rounded-2xl p-6 sm:p-8 border border-slate-800 relative">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-5">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Live Animated Leaderboard
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Powered by Pusher Channels, admins watch real-time score updates, podium shifts, and animated student ranking cards without refreshing the browser.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
