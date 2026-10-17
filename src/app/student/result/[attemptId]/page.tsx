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
        <h2 className="text-white font-bold text-base sm:text-lg font-malayalam">വിവരങ്ങൾ ശേഖരിക്കുന്നു...</h2>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col justify-between">
        <Header />
        <main className="max-w-md mx-auto my-auto p-6 text-center">
          <p className="text-red-400 font-semibold mb-4 text-sm">{error || "Submission record not found"}</p>
          <Link
            href="/student/quizzes"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm"
          >
            തിരികെ ഡാഷ്‌ബോർഡിലേക്ക് (Back to Dashboard)
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] w-full max-w-full overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full max-w-lg mx-auto px-3.5 sm:px-6 py-6 sm:py-10 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Ambient subtle glow contained to viewport */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-tr from-amber-600/15 via-orange-600/15 to-red-600/10 blur-3xl -z-10 rounded-full pointer-events-none" />

        {/* Fest Result Card */}
        <div className="fest-glass rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-amber-500/25 shadow-2xl relative w-full overflow-hidden text-center">
          
          {/* SETUP 1: അഭിനന്ദനങ്ങൾ! (Congratulations) */}
          <div className="mb-4 sm:mb-5">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-semibold mb-2.5 max-w-full">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ക്വിസ് വിജയകരമായി പൂർത്തിയാക്കി</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-100 font-malayalam tracking-tight drop-shadow-sm">
              അഭിനന്ദനങ്ങൾ!
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 mt-2 font-medium font-malayalam leading-relaxed px-1">
              MAERIKA 2K26 - നാട്ടറിവ് ക്വിസ് 2026 മത്സരത്തിൽ പങ്കെടുത്തതിന് എല്ലാവിധ ഭാവുകങ്ങളും നേരുന്നു!
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-malayalam">
              മത്സര ഫലങ്ങൾ പിന്നീട് ഔദ്യോഗികമായി പ്രഖ്യാപിക്കുന്നതാണ്.
            </p>
          </div>

          {/* SETUP 2: MAERIKA FEST POSTER (100% Responsive) */}
          <div className="my-4 sm:my-5 w-full max-w-[340px] sm:max-w-md mx-auto rounded-xl sm:rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-orange-950/50 bg-black/40">
            <Image
              src="/images/maerika-fest-poster.jpg"
              alt="MAERIKA 2K26 Arts Fest Poster - കലായുക ഭാവുകം"
              width={819}
              height={1024}
              className="w-full h-auto block object-contain"
              priority
              sizes="(max-width: 640px) 100vw, 420px"
            />
          </div>

          {/* SETUP 3: ARTS FEST MAIN WEBSITE OG BUTTON */}
          <div className="space-y-3 pt-1 w-full">
            <a
              href="https://maerika-2k26.jawharathululoomsuffadars.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full group flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:via-orange-500 hover:to-red-500 shadow-xl shadow-orange-600/30 active:scale-[0.99] transition-all border border-amber-400/30 text-left cursor-pointer min-w-0"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm md:text-base font-bold font-malayalam leading-tight truncate sm:whitespace-normal">
                    കലാമേള പ്രധാന വെബ്സൈറ്റ് സന്ദർശിക്കുക
                  </div>
                  <div className="text-[10px] sm:text-xs text-amber-100/90 font-medium tracking-wide truncate">
                    MAERIKA 2K26 Arts Fest Official Website
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 shrink-0 ml-1.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Back to Dashboard Link */}
            <div className="pt-1">
              <Link
                href="/student/quizzes"
                className="inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1"
              >
                <span>തിരികെ ഡാഷ്‌ബോർഡിലേക്ക് (Dashboard)</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
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
