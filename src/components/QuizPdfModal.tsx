"use client";

import { useState, useMemo } from "react";
import {
  X,
  FileDown,
  Printer,
  ExternalLink,
  CheckCircle2,
  FileText,
  Table,
  Check,
  Eye,
  Settings2,
} from "lucide-react";
import {
  QuizDetails,
  QuestionItem,
  PdfExportOptions,
  DEFAULT_PDF_OPTIONS,
  generateQuizPrintHtml,
  printQuizDocument,
} from "@/lib/quiz-pdf";

interface QuizPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizDetails | null;
  questions: QuestionItem[];
}

export function QuizPdfModal({
  isOpen,
  onClose,
  quiz,
  questions,
}: QuizPdfModalProps) {
  const [options, setOptions] = useState<PdfExportOptions>(DEFAULT_PDF_OPTIONS);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "settings">("preview");

  const hasImages = useMemo(
    () => questions.some((q) => !!q.questionImage),
    [questions]
  );
  const hasExplanations = useMemo(
    () => questions.some((q) => !!q.explanation),
    [questions]
  );

  const previewHtml = useMemo(() => {
    if (!quiz) return "";
    return generateQuizPrintHtml(quiz, questions, options);
  }, [quiz, questions, options]);

  if (!isOpen || !quiz) return null;

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printQuizDocument(quiz, questions, options);
    } catch (err) {
      console.error("Print error:", err);
      // Fallback: open print page in new window
      window.open(
        `/admin/quizzes/${quiz._id}/print?mode=${options.mode}&images=${options.includeImages}&explanations=${options.includeExplanations}&autoPrint=true`,
        "_blank"
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const openFullscreenPrint = () => {
    window.open(
      `/admin/quizzes/${quiz._id}/print?mode=${options.mode}&images=${options.includeImages}&explanations=${options.includeExplanations}&meta=${options.includeMeta}&instructions=${options.includeInstructions}&studentInfo=${options.includeStudentInfo}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1324] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#090e1a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-malayalam">
                  Download Quiz PDF
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {questions.length} Questions
                </span>
              </div>
              <p className="text-xs text-slate-400 font-malayalam truncate max-w-md">
                {quiz.title} • Questions, Answers &amp; Answer Key
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector & Customization Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          {/* Format Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800">
            <button
              onClick={() => setOptions({ ...options, mode: "full" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                options.mode === "full"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                options.mode === "paper"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Question Paper Only</span>
            </button>

            <button
              onClick={() => setOptions({ ...options, mode: "key" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                options.mode === "key"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Answer Key Summary</span>
            </button>
          </div>

          {/* Quick Option Checkboxes */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {hasImages && (
              <label className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.includeImages}
                  onChange={(e) =>
                    setOptions({ ...options, includeImages: e.target.checked })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Images</span>
              </label>
            )}

            {hasExplanations && options.mode === "full" && (
              <label className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.includeExplanations}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      includeExplanations: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Explanations</span>
              </label>
            )}

            <label className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.includeMeta}
                onChange={(e) =>
                  setOptions({ ...options, includeMeta: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <span>Timing &amp; Marks</span>
            </label>

            {options.mode === "paper" && (
              <label className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.includeStudentInfo}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      includeStudentInfo: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Student Header Box</span>
              </label>
            )}
          </div>
        </div>

        {/* Live Document Preview Box */}
        <div className="flex-1 overflow-hidden p-3 sm:p-5 bg-[#070b14] flex justify-center">
          <div className="w-full max-w-4xl h-full bg-white rounded-xl shadow-xl overflow-hidden border border-slate-400/40 relative">
            <iframe
              srcDoc={previewHtml}
              title="Quiz PDF Preview"
              className="w-full h-full border-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#090e1a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 text-center sm:text-left">
            <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Direct print opens your browser dialog with <strong>Save as PDF</strong> pre-formatted for A4 paper.
            </span>
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={openFullscreenPrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Open full page printable view"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full View</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-60"
            >
              <FileDown className="w-4 h-4" />
              <span>{isPrinting ? "Preparing PDF..." : "Download / Save as PDF"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
