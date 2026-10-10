"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import {
  BookOpen,
  ArrowLeft,
  Clock,
  Award,
  AlertTriangle,
  Layers,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";

export default function NewQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState(
    "1. All questions are multiple choice.\n2. Do not refresh or close the tab during the quiz.\n3. The quiz will auto-submit once the timer expires."
  );
  const [quizType, setQuizType] = useState<"text" | "image">("text");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [marksPerQuestion, setMarksPerQuestion] = useState(2);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
  const [negativeMarks, setNegativeMarks] = useState(0.5);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [allowReviewAnswers, setAllowReviewAnswers] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const durationSeconds = Math.max(10, durationMinutes * 60);

      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          instructions,
          quizType,
          durationSeconds,
          marksPerQuestion,
          negativeMarkingEnabled,
          negativeMarks: negativeMarkingEnabled ? negativeMarks : 0,
          maxAttempts,
          allowReviewAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create quiz");
      }

      // Route directly to the question builder for this quiz
      router.push(`/admin/quizzes/${data.quiz._id}/edit?tab=questions`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header isAdmin />
      <AdminNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/quizzes"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Create New Quiz Competition
            </h1>
            <p className="text-xs text-slate-400">
              Configure parameters, scoring system, and competition rules.
            </p>
          </div>
        </div>

        <div className="fest-glass rounded-2xl p-6 sm:p-8 border border-slate-800">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. നാട്ടറിവ് QUIZ 2026 (Kerala Heritage & Culture)"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            {/* Quiz Type Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                Competition Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setQuizType("text")}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    quizType === "text"
                      ? "bg-blue-600/20 border-blue-500 text-white fest-glow-blue"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Layers className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Text-Based MCQ</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Traditional multiple-choice questions with Malayalam/English text.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuizType("image")}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    quizType === "image"
                      ? "bg-purple-600/20 border-purple-500 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <ImageIcon className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Image-Based Quiz</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Visual identification questions with uploaded illustration banners and images.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Festival background, context, or syllabus..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                Instructions for Students
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono text-xs"
              />
            </div>

            {/* Timing & Scoring Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" /> Marks Per Question
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  Max Attempts Per Student
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
            </div>

            {/* Negative Marking Toggle */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Negative Marking</h4>
                  <p className="text-xs text-slate-400">
                    Deduct points for incorrect answer submissions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={negativeMarkingEnabled}
                  onChange={(e) => setNegativeMarkingEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
              </div>

              {negativeMarkingEnabled && (
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Penalty Marks per Incorrect Answer
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
                    className="w-48 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Review Answers Toggle */}
            <div className="flex items-center gap-2">
              <input
                id="review"
                type="checkbox"
                checked={allowReviewAnswers}
                onChange={(e) => setAllowReviewAnswers(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
              />
              <label htmlFor="review" className="text-xs text-slate-300">
                Allow students to review answers & explanations after their quiz submission
              </label>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Link
                href="/admin/quizzes"
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 cursor-pointer"
              >
                {loading ? "Creating..." : "Save & Proceed to Questions"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
