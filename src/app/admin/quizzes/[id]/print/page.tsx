"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  FileDown,
  CheckCircle2,
  FileText,
  Table,
} from "lucide-react";
import {
  QuizDetails,
  QuestionItem,
  PdfExportOptions,
  DEFAULT_PDF_OPTIONS,
} from "@/lib/quiz-pdf";

function QuizPrintContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialMode =
    (searchParams.get("mode") as "full" | "paper" | "key") || "full";
  const [options, setOptions] = useState<PdfExportOptions>({
    ...DEFAULT_PDF_OPTIONS,
    mode: initialMode,
    includeImages: searchParams.get("images") !== "false",
    includeExplanations: searchParams.get("explanations") !== "false",
    includeMeta: searchParams.get("meta") !== "false",
    includeInstructions: searchParams.get("instructions") !== "false",
    includeStudentInfo:
      searchParams.get("studentInfo") === "true" || initialMode === "paper",
  });

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/quizzes/${quizId}`);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Quiz not found");
        const data = await res.json();
        setQuiz(data.quiz);
        setQuestions(data.questions || []);

        // If autoPrint requested
        if (searchParams.get("autoPrint") === "true") {
          setTimeout(() => {
            window.print();
          }, 800);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [quizId, router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Preparing printable quiz document...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-red-400 gap-4">
        <p className="text-sm font-semibold">{error || "Quiz not found"}</p>
        <Link
          href={`/admin/quizzes/${quizId}/edit`}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs hover:bg-slate-700"
        >
          Back to Quiz Editor
        </Link>
      </div>
    );
  }

  const isAnswerKey = options.mode === "full";
  const isPaperOnly = options.mode === "paper";
  const isKeyOnly = options.mode === "key";

  const totalMarks = questions.reduce(
    (sum, q) => sum + (q.marks ?? quiz.marksPerQuestion ?? 1),
    0
  );

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900">
      {/* Interactive Top Bar (Hidden during print) */}
      <div className="print:hidden sticky top-0 z-40 bg-[#090e1a]/95 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/quizzes/${quizId}/edit`}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Back to Editor"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-sm font-bold font-malayalam leading-tight">
                {quiz.title}
              </h2>
              <p className="text-[11px] text-slate-400">
                {questions.length} Questions • Printable PDF Preview
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setOptions({ ...options, mode: "full" })}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                isAnswerKey
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Questions &amp; Answers</span>
            </button>

            <button
              onClick={() =>
                setOptions({
                  ...options,
                  mode: "paper",
                  includeStudentInfo: true,
                })
              }
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                isPaperOnly
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Question Paper Only</span>
            </button>

            <button
              onClick={() => setOptions({ ...options, mode: "key" })}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                isKeyOnly
                  ? "bg-amber-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Answer Key Summary</span>
            </button>
          </div>

          {/* Print Trigger Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Save as PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Main A4 Document Sheet */}
      <main className="max-w-4xl mx-auto my-6 p-8 sm:p-10 bg-white shadow-xl rounded-xl print:shadow-none print:m-0 print:p-0 print:rounded-none">
        {/* Document Header */}
        <header className="border-b-2 border-slate-900 pb-3 mb-4 break-inside-avoid">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/maerika-arts-fest-logo.png"
                alt="MAERIKA 2K26"
                className="h-10 w-auto object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-red-600">
                  MAERIKA 2K26 ARTS FEST
                </h3>
                <p className="text-[10px] font-semibold text-slate-500">
                  Jawharathul Uloom Suffa Dars Online Platform
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                isAnswerKey
                  ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                  : isPaperOnly
                  ? "bg-blue-50 text-blue-800 border-blue-400"
                  : "bg-amber-50 text-amber-800 border-amber-400"
              }`}
            >
              {isAnswerKey
                ? "Questions & Answer Key"
                : isPaperOnly
                ? "Official Question Paper"
                : "Answer Key Summary"}
            </span>
          </div>

          <h1 className="text-xl font-bold font-malayalam text-slate-900 mt-1">
            {quiz.title}
          </h1>

          {quiz.description && (
            <p className="text-xs text-slate-600 font-malayalam mt-1">
              {quiz.description}
            </p>
          )}

          {options.includeMeta && (
            <div className="grid grid-cols-4 gap-2 mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">
                  Total Questions
                </span>
                <span className="font-bold text-slate-900">
                  {questions.length} Questions
                </span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">
                  Total Marks
                </span>
                <span className="font-bold text-slate-900">
                  {totalMarks} Marks
                </span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">
                  Time Per Question
                </span>
                <span className="font-bold text-slate-900">
                  {quiz.timeLimitPerQuestion || 10} Seconds
                </span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500">
                  Date
                </span>
                <span className="font-bold text-slate-900">{dateStr}</span>
              </div>
            </div>
          )}

          {isPaperOnly && options.includeStudentInfo && (
            <div className="grid grid-cols-4 gap-3 mt-3 p-2.5 border border-dashed border-slate-300 rounded-lg text-xs">
              <div className="flex items-baseline gap-1 col-span-2">
                <span className="font-semibold text-slate-600">Student Name:</span>
                <span className="flex-1 border-b border-slate-400 inline-block h-3"></span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-slate-600">Chest No:</span>
                <span className="flex-1 border-b border-slate-400 inline-block h-3"></span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-slate-600">Score:</span>
                <span className="flex-1 border-b border-slate-400 inline-block h-3"></span>
              </div>
            </div>
          )}
        </header>

        {options.includeInstructions && quiz.instructions && (
          <div className="mb-4 p-2.5 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-md text-xs break-inside-avoid">
            <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
              Competition Instructions
            </span>
            <div className="whitespace-pre-line text-[11px]">
              {quiz.instructions}
            </div>
          </div>
        )}

        {/* Content by mode */}
        {isKeyOnly ? (
          <table className="w-full text-xs border-collapse mt-4">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-2 text-left w-12 text-[10px] uppercase font-bold">
                  Q#
                </th>
                <th className="p-2 text-left text-[10px] uppercase font-bold">
                  Question Excerpt
                </th>
                <th className="p-2 text-center w-20 text-[10px] uppercase font-bold">
                  Correct Opt
                </th>
                <th className="p-2 text-left text-[10px] uppercase font-bold">
                  Correct Answer
                </th>
                <th className="p-2 text-right w-16 text-[10px] uppercase font-bold">
                  Marks
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => {
                const correctOpt = q.options?.find(
                  (o) => o.id === q.correctOptionId
                );
                const optIndex = q.options?.findIndex(
                  (o) => o.id === q.correctOptionId
                );
                const letter =
                  optIndex !== undefined && optIndex >= 0
                    ? ["A", "B", "C", "D"][optIndex]
                    : "-";
                const qMarks = q.marks ?? quiz.marksPerQuestion ?? 1;

                return (
                  <tr
                    key={q._id}
                    className="border-b border-slate-200 even:bg-slate-50"
                  >
                    <td className="p-2 font-bold">#{idx + 1}</td>
                    <td className="p-2 font-malayalam">
                      {q.questionText
                        ? q.questionText.slice(0, 70) +
                          (q.questionText.length > 70 ? "..." : "")
                        : "(Image Question)"}
                    </td>
                    <td className="p-2 text-center">
                      {q.questionType === "short_answer" ? (
                        <span className="text-[10px] font-semibold bg-slate-200 px-1.5 py-0.5 rounded">
                          Note
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                          ({letter})
                        </span>
                      )}
                    </td>
                    <td className="p-2 font-malayalam font-semibold text-emerald-800">
                      {q.questionType === "short_answer"
                        ? q.correctAnswerText ||
                          `Min ${q.minWords || 20} words required`
                        : correctOpt?.text || "-"}
                    </td>
                    <td className="p-2 text-right font-bold text-slate-800">
                      +{qMarks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="space-y-3.5">
            {questions.map((q, idx) => {
              const qMarks = q.marks ?? quiz.marksPerQuestion ?? 1;
              const qTime =
                q.timeLimitSeconds ?? quiz.timeLimitPerQuestion ?? 10;
              const isWritten = q.questionType === "short_answer";

              return (
                <div
                  key={q._id}
                  className="p-3 border border-slate-200 rounded-lg break-inside-avoid bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                        +{qMarks} Mark{qMarks > 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                        {qTime}s
                      </span>
                      {isWritten ? (
                        <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          Written Note ({q.minWords || 20}+ words)
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          Multiple Choice
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold font-malayalam text-slate-900 leading-relaxed mb-2">
                    {q.questionText || "(Image Question)"}
                  </h3>

                  {options.includeImages && q.questionImage && (
                    <div className="my-2 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={q.questionImage}
                        alt="Question"
                        className="max-h-40 max-w-full inline-block object-contain rounded border border-slate-200 p-1"
                      />
                    </div>
                  )}

                  {isWritten ? (
                    isPaperOnly ? (
                      <div className="mt-2 p-2.5 border border-dashed border-slate-300 rounded bg-slate-50">
                        <p className="text-[10px] text-slate-500 italic mb-2">
                          Write your response below (Min {q.minWords || 20}{" "}
                          words):
                        </p>
                        <div className="space-y-4 pt-1">
                          <div className="border-b border-slate-300 h-2"></div>
                          <div className="border-b border-slate-300 h-2"></div>
                          <div className="border-b border-slate-300 h-2"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-amber-50 border-l-3 border-amber-500 text-amber-900 text-xs font-malayalam rounded-r">
                        <span className="font-bold">Reference Answer: </span>
                        {q.correctAnswerText ||
                          `Students provide an answer with at least ${
                            q.minWords || 20
                          } words.`}
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {(q.options || []).map((opt, optIdx) => {
                        const letters = ["A", "B", "C", "D", "E", "F"];
                        const letter = letters[optIdx] || String(optIdx + 1);
                        const isCorrect =
                          isAnswerKey && opt.id === q.correctOptionId;

                        return (
                          <div
                            key={opt.id}
                            className={`p-2 rounded border text-xs flex items-center justify-between font-malayalam ${
                              isCorrect
                                ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isPaperOnly ? (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-400 inline-block shrink-0" />
                              ) : (
                                <span
                                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isCorrect
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {letter}
                                </span>
                              )}
                              <span>{opt.text}</span>
                            </div>

                            {isCorrect && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isAnswerKey &&
                    options.includeExplanations &&
                    q.explanation && (
                      <div className="mt-2.5 p-2 bg-slate-50 border-l-2 border-blue-500 text-slate-700 text-[11px] font-malayalam rounded-r">
                        <span className="font-bold text-blue-600">
                          Explanation:{" "}
                        </span>
                        {q.explanation}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}

        <footer className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 break-inside-avoid">
          <span>
            MAERIKA 2K26 Arts Fest • Jawharathul Uloom Suffa Dars Online Platform
          </span>
          <span>Official Quiz Question Bank</span>
        </footer>
      </main>
    </div>
  );
}

export default function QuizPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 text-sm">
          Loading print document...
        </div>
      }
    >
      <QuizPrintContent params={params} />
    </Suspense>
  );
}
