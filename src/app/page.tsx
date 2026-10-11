"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Trophy,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] relative selection:bg-blue-600 selection:text-white">
      <Header />

      <main className="flex-1 flex flex-col justify-center">
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-snug sm:leading-tight font-malayalam">
              Maerika 2k26 ആർട്സ് ഫെസ്റ്റിന്റെ ഭാഗമായി സംഘടിപ്പിക്കുന്ന നാട്ടറിവ് ക്വിസ് 2026
            </h1>

            {/* Action Buttons */}
            <div className="mt-10 flex items-center justify-center">
              <Link
                href="/student/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-xl shadow-blue-600/30 transition-all text-base cursor-pointer"
              >
                <Trophy className="w-5 h-5 text-amber-300" />
                <span>Enter Student Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
