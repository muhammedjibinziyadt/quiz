"use client";

import { useEffect, useState, use, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  CheckCircle,
  Globe,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface ResultData {
  attemptId: string;
  quizTitle?: string;
  submittedAt?: string;
}

function StudentResultContent({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/student/attempts/${attemptId}/result`);
        if (!res.ok) {
          throw new Error("Could not load your submission record.");
        }
        const data = await res.json();
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading result");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
        <h2 className="text-white font-bold text-lg font-malayalam">വിവരങ്ങൾ ശേഖരിക്കുന്നു...</h2>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col justify-between">
        <Header />
        <main className="max-w-md mx-auto my-auto p-6 text-center">
          <p className="text-red-400 font-semibold mb-4">{error || "Submission record not found"}</p>
          <Link
            href="/student/quizzes"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm"
          >
            തിരികെ ഡാഷ്‌ബോർഡിലേക്ക് (Back to Dashboard)
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 relative">
        {/* Festive ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-600/15 via-orange-600/15 to-red-600/10 blur-3xl -z-10 rounded-full pointer-events-none" />

        {/* Fest Result Card */}
        <div className="fest-glass rounded-3xl p-6 sm:p-8 border border-amber-500/25 shadow-2xl relative overflow-hidden text-center">
          {/* Top Branding Logos */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative w-14 h-16 drop-shadow-md">
              <Image
                src="/images/maerika-arts-fest-logo.png"
                alt="MAERIKA 2K26 Arts Fest"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="relative w-28 h-14 drop-shadow-md">
              <Image
                src="/images/nattarivu-quiz-logo.png"
                alt="നാട്ടറിവ് QUIZ 2026"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* SETUP 1: അഭിനന്ദനങ്ങൾ! (Congratulations) */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold mb-3">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>ക്വിസ് വിജയകരമായി പൂർത്തിയാക്കി</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-100 font-malayalam tracking-wide drop-shadow-sm">
              അഭിനന്ദനങ്ങൾ!
            </h1>

            <p className="text-sm sm:text-base text-slate-200 mt-2 font-medium font-malayalam leading-relaxed max-w-md mx-auto">
              MAERIKA 2K26 - നാട്ടറിവ് ക്വിസ് 2026 മത്സരത്തിൽ പങ്കെടുത്തതിന് എല്ലാവിധ ഭാവുകങ്ങളും നേരുന്നു!
            </p>
            <p className="text-xs text-slate-400 mt-1 font-malayalam">
              മത്സര ഫലങ്ങൾ പിന്നീട് ഔദ്യോഗികമായി പ്രഖ്യാപിക്കുന്നതാണ്.
            </p>
          </div>

          {/* SETUP 2: MAERIKA FEST POSTER */}
          <div className="my-6 relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-orange-950/50 bg-black/40">
            <div className="relative w-full aspect-[4/5] max-w-sm sm:max-w-md mx-auto">
              <Image
                src="/images/maerika-fest-poster.jpg"
                alt="MAERIKA 2K26 Arts Fest Inauguration Ceremony Poster - കലായുക ഭാവുകം"
                fill
                className="object-contain rounded-2xl"
                priority
                sizes="(max-width: 640px) 100vw, 450px"
              />
            </div>
          </div>

          {/* SETUP 3: ARTS FEST MAIN WEBSITE OG BUTTON */}
          <div className="space-y-3 pt-2">
            <a
              href="https://maerika-2k26.jawharathululoomsuffadars.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full group flex items-center justify-between p-4 sm:p-4.5 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:via-orange-500 hover:to-red-500 shadow-xl shadow-orange-600/30 hover:shadow-orange-600/40 active:scale-[0.99] transition-all border border-amber-400/30 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold font-malayalam leading-snug">
                    കലാമേള പ്രധാന വെബ്സൈറ്റ് സന്ദർശിക്കുക
                  </div>
                  <div className="text-[11px] sm:text-xs text-amber-200/90 font-medium tracking-wide">
                    MAERIKA 2K26 Arts Fest Official Website
                  </div>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-amber-200 shrink-0 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Back to Dashboard Link */}
            <Link
              href="/student/quizzes"
              className="inline-flex items-center justify-center gap-2 pt-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <span>തിരികെ ഡാഷ്‌ബോർഡിലേക്ക് (Back to Dashboard)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function StudentResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 text-sm">
          Loading submission details...
        </div>
      }
    >
      <StudentResultContent params={params} />
    </Suspense>
  );
}
