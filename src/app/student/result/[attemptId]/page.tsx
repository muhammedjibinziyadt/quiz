"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  CheckCircle,
  Clock,
  Award,
  HelpCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AnswerDetail {
  questionId: string;
  questionText: string;
  selectedOptionId?: string;
  correctOptionId: string;
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
}

interface ResultData {
  attemptId: string;
  quizTitle: string;
  score: number;
  totalPossibleMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  completionTimeSeconds: number;
  submittedAt: string;
  allowReviewAnswers: boolean;
  answersDetail?: AnswerDetail[];
}

import { Suspense } from "react";

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
          throw new Error("Could not load your result record.");
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
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <h2 className="text-white font-bold text-lg">Retrieving Your Evaluation...</h2>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col justify-between">
        <Header />
        <main className="max-w-md mx-auto my-auto p-6 text-center">
          <p className="text-red-400 font-semibold mb-4">{error || "Result not found"}</p>
          <Link
            href="/student/quizzes"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm"
          >
            Back to Quizzes
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const mins = Math.floor(result.completionTimeSeconds / 60);
  const secs = result.completionTimeSeconds % 60;
  const timeFormatted = `${mins}m ${secs}s`;

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Celebration Card */}
        <div className="fest-glass rounded-3xl p-8 sm:p-10 border border-slate-800 text-center relative overflow-hidden mb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Arts Fest Branding */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative w-14 h-16">
              <Image
                src="/images/maerika-arts-fest-logo.png"
                alt="MAERIKA 2K26"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <CheckCircle className="w-3.5 h-3.5" />
            Quiz Submitted Successfully
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Thank You for Participating!
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
            Your answers for <strong className="text-white">{result.quizTitle}</strong> have been
            recorded and officially scored by the MAERIKA 2K26 evaluation engine.
          </p>

          {/* Score Badge */}
          <div className="my-8 inline-flex flex-col items-center justify-center px-8 py-6 rounded-2xl bg-gradient-to-b from-blue-950/60 to-slate-900/80 border border-blue-500/30 fest-glow-blue">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Your Personal Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {result.score}
              </span>
              <span className="text-slate-400 font-semibold text-lg">
                / {result.totalPossibleMarks}
              </span>
            </div>
            <span className="text-xs text-amber-400 font-semibold mt-1">
              Completion Time: {timeFormatted}
            </span>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
                <CheckCircle className="w-3.5 h-3.5" /> Correct
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {result.correctCount}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold mb-1">
                <XCircle className="w-3.5 h-3.5" /> Incorrect
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {result.incorrectCount}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                <HelpCircle className="w-3.5 h-3.5" /> Unanswered
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {result.unansweredCount}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/student/quizzes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/30"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Optional Review Answers (Only if authorized by quiz rules) */}
        {result.allowReviewAnswers && result.answersDetail && (
          <div className="fest-glass rounded-2xl p-6 sm:p-8 border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Answer Review & Explanations
            </h2>

            <div className="space-y-6">
              {result.answersDetail.map((ans, idx) => (
                <div
                  key={ans.questionId}
                  className={`p-5 rounded-xl border ${
                    ans.isCorrect
                      ? "bg-emerald-950/20 border-emerald-800/40"
                      : "bg-red-950/20 border-red-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400">
                      Question #{idx + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        ans.isCorrect
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {ans.marksAwarded >= 0 ? `+${ans.marksAwarded}` : ans.marksAwarded} Marks
                    </span>
                  </div>

                  <p className="text-white font-medium text-sm mb-3 font-malayalam">
                    {ans.questionText}
                  </p>

                  {ans.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-malayalam leading-relaxed">
                      <strong className="text-blue-400">Explanation: </strong>
                      {ans.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
          Loading student evaluation result...
        </div>
      }
    >
      <StudentResultContent params={params} />
    </Suspense>
  );
}
