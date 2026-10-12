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
  CheckCircle,
  Calendar,
} from "lucide-react";

export default function NewQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [durationSecondsInput, setDurationSecondsInput] = useState(0);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState(10);
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
      const durationSeconds = Math.max(
        10,
        (durationMinutes || 0) * 60 + (durationSecondsInput || 0)
      );

      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          quizType: "text",
          durationSeconds,
          timeLimitPerQuestion,
          marksPerQuestion,
          negativeMarkingEnabled,
          negativeMarks: negativeMarkingEnabled ? negativeMarks : 0,
          maxAttempts,
          allowReviewAnswers,
          startTime: startTime ? new Date(startTime).toISOString() : null,
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
              Configure parameters, schedule, scoring system, and competition rules.
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
                placeholder="Enter quiz title"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              />
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
                placeholder="Enter description (optional)"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            {/* Schedule Start Time */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Quiz Start Time / ആരംഭ സമയം (Optional)</span>
              </label>
              <p className="text-xs text-slate-400">
                Participants can register beforehand, but can only enter the quiz once this start time arrives. Leave empty for immediate entry.
              </p>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Timing & Scoring Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Time Per Question *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={timeLimitPerQuestion}
                    onChange={(e) => setTimeLimitPerQuestion(Math.max(1, parseInt(e.target.value, 10) || 10))}
                    placeholder="10"
                    className="w-full px-3 py-2.5 pr-7 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">s</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Each question counts down this time (e.g. 10s)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Total Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full px-3 py-2.5 pr-7 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm text-center"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">m</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={durationSecondsInput}
                      onChange={(e) => setDurationSecondsInput(Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                      placeholder="0"
                      className="w-full px-3 py-2.5 pr-7 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm text-center"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">s</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" /> Marks Per Question
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  Max Attempts
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
                    step="any"
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
