"use client";

import { useEffect, useRef } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => { });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Background Video & Cinematic Overlays */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        >
          <source src="/videos/new-bg-video.mp4" type="video/mp4" />
        </video>

        {/* Clean, neutral dark cinematic overlay preserving 100% natural video color without tint or saturation boost */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75" />
      </div>

      <Header />

      <main className="flex-1 flex flex-col justify-center relative z-10">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
          {/* Subtle Ambient Festival Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-blue-600/10 via-red-600/10 to-amber-500/10 blur-3xl -z-10 rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Logos Showcase */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8 animate-fade-in">
              <div className="relative w-24 h-32 sm:w-28 sm:h-36 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-transform hover:scale-105">
                <Image
                  src="/images/maerika-arts-fest-logo.png"
                  alt="MAERIKA 2K26 Arts Fest"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="h-14 sm:h-20 w-px bg-gradient-to-b from-transparent via-slate-500/50 to-transparent" />

              <div className="relative w-[125px] h-[68px] sm:w-60 sm:h-32 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-transform hover:scale-105">
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6 shadow-2xl">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>MAERIKA 2K26 Arts Fest • Live Quiz Competition</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-snug sm:leading-tight font-malayalam [text-shadow:_0_4px_24px_rgba(0,0,0,0.95),_0_1px_4px_rgba(0,0,0,0.9)]">
              Maerika 2k26 ആർട്സ് ഫെസ്റ്റിന്റെ ഭാഗമായി സംഘടിപ്പിക്കുന്ന നാട്ടറിവ് ക്വിസ് 2026
            </h1>

            {/* Action Buttons */}
            <div className="mt-10 flex items-center justify-center">
              <Link
                href="/student/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-2xl shadow-blue-600/40 transition-all text-base cursor-pointer backdrop-blur-sm"
              >
                <Trophy className="w-5 h-5 text-amber-300" />
                <span>Enter for Quiz</span>
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
