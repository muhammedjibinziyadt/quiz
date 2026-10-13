"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import {
  ArrowLeft,
  Settings,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle,
  MoveUp,
  MoveDown,
  Upload,
  Globe,
  Lock,
  Layers,
  Image as ImageIcon,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Clock,
  Pencil,
} from "lucide-react";

interface Option {
  id: string;
  text: string;
  imageUrl?: string;
}

interface QuestionItem {
  _id: string;
  order: number;
  questionText: string;
  questionImage?: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  timeLimitSeconds?: number | null;
}

interface QuizDetails {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  quizType: "text" | "image" | "mixed";
  startTime?: string | null;
  endTime?: string | null;
  durationSeconds: number;
  timeLimitPerQuestion?: number;
  marksPerQuestion: number;
  maxAttempts: number;
  status: "draft" | "published" | "archived";
  allowReviewAnswers: boolean;
  isLocked: boolean;
  version: number;
}

import { Suspense } from "react";

function EditQuizContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active tab: 'questions' | 'settings'
  const [activeTab, setActiveTab] = useState<"questions" | "settings">(
    (searchParams.get("tab") as "questions" | "settings") || "questions"
  );

  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings form state
  const [settingsTitle, setSettingsTitle] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsStartTime, setSettingsStartTime] = useState("");
  const [settingsTimePerQ, setSettingsTimePerQ] = useState(10);
  const [settingsMarks, setSettingsMarks] = useState(2);
  const [settingsMaxAttempts, setSettingsMaxAttempts] = useState(1);
  const [settingsAllowReview, setSettingsAllowReview] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Question Modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qText, setQText] = useState("");
  const [qImage, setQImage] = useState<string | null>(null);
  const [qTimeLimitSeconds, setQTimeLimitSeconds] = useState<string | number>("");
  const [qOptions, setQOptions] = useState<Option[]>([
    { id: "opt_1", text: "" },
    { id: "opt_2", text: "" },
    { id: "opt_3", text: "" },
    { id: "opt_4", text: "" },
  ]);
  const [qCorrectId, setQCorrectId] = useState("opt_1");
  const [qExplanation, setQExplanation] = useState("");
  const [qUploading, setQUploading] = useState(false);
  const [qSaving, setQSaving] = useState(false);

  const fetchQuizData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Quiz not found");
      const data = await res.json();
      setQuiz(data.quiz);
      setQuestions(data.questions || []);

      // Populate settings form
      setSettingsTitle(data.quiz.title || "");
      setSettingsDescription(data.quiz.description || "");
      setSettingsStartTime(
        data.quiz.startTime
          ? new Date(data.quiz.startTime).toISOString().slice(0, 16)
          : ""
      );
      setSettingsTimePerQ(data.quiz.timeLimitPerQuestion ?? 10);
      setSettingsMarks(data.quiz.marksPerQuestion ?? 1);
      setSettingsMaxAttempts(data.quiz.maxAttempts || 1);
      setSettingsAllowReview(data.quiz.allowReviewAnswers || false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  // Handle Image Upload for questions
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setQImage(data.url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload error");
    } finally {
      setQUploading(false);
    }
  };

  // Open modal to add a fresh question
  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQText("");
    setQImage(null);
    setQTimeLimitSeconds("");
    setQOptions([
      { id: "opt_1", text: "" },
      { id: "opt_2", text: "" },
      { id: "opt_3", text: "" },
      { id: "opt_4", text: "" },
    ]);
    setQCorrectId("opt_1");
    setQExplanation("");
    setShowQuestionModal(true);
  };

  // Open modal to edit an existing question
  const handleOpenEditQuestion = (q: QuestionItem) => {
    setEditingQuestionId(q._id);
    setQText(q.questionText || "");
    setQImage(q.questionImage || null);
    setQTimeLimitSeconds(q.timeLimitSeconds ?? "");
    setQOptions(
      q.options && q.options.length >= 2
        ? q.options.map((o) => ({ ...o }))
        : [
            { id: "opt_1", text: "" },
            { id: "opt_2", text: "" },
            { id: "opt_3", text: "" },
            { id: "opt_4", text: "" },
          ]
    );
    setQCorrectId(q.correctOptionId || "opt_1");
    setQExplanation(q.explanation || "");
    setShowQuestionModal(true);
  };

  // Save Question (Add or Update)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() && !qImage) {
      alert("Please provide question text or an image.");
      return;
    }

    const filledOptions = qOptions.filter((o) => o.text.trim() !== "");
    if (filledOptions.length < 2) {
      alert("Please provide at least 2 non-empty options.");
      return;
    }

    setQSaving(true);
    try {
      const payload = {
        questionText: qText,
        questionImage: qImage,
        options: filledOptions,
        correctOptionId: qCorrectId,
        explanation: qExplanation,
        timeLimitSeconds:
          qTimeLimitSeconds !== "" && !isNaN(Number(qTimeLimitSeconds))
            ? Math.max(1, parseInt(String(qTimeLimitSeconds), 10))
            : null,
      };

      const url = editingQuestionId
        ? `/api/admin/quizzes/${quizId}/questions/${editingQuestionId}`
        : `/api/admin/quizzes/${quizId}/questions`;
      const method = editingQuestionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save question");

      setShowQuestionModal(false);
      // Reset question modal state
      setEditingQuestionId(null);
      setQText("");
      setQImage(null);
      setQTimeLimitSeconds("");
      setQOptions([
        { id: "opt_1", text: "" },
        { id: "opt_2", text: "" },
        { id: "opt_3", text: "" },
        { id: "opt_4", text: "" },
      ]);
      setQCorrectId("opt_1");
      setQExplanation("");

      fetchQuizData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving question");
    } finally {
      setQSaving(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to remove this question?")) return;
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/questions/${questionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchQuizData();
      } else {
        alert("Failed to delete question");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reorder Questions
  const handleReorder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const reordered = [...questions];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setQuestions(reordered);

    // Save order to server
    try {
      await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: reordered.map((q) => q._id),
        }),
      });
    } catch (err) {
      console.error("Failed to reorder questions on server:", err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: settingsTitle,
          description: settingsDescription,
          durationSeconds: 0,
          timeLimitPerQuestion: settingsTimePerQ,
          marksPerQuestion: settingsMarks,
          negativeMarkingEnabled: false,
          negativeMarks: 0,
          maxAttempts: settingsMaxAttempts,
          allowReviewAnswers: settingsAllowReview,
          startTime: settingsStartTime ? new Date(settingsStartTime).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      alert("Settings saved successfully!");
      fetchQuizData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle publish
  const handleTogglePublish = async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to toggle status");
        return;
      }
      fetchQuizData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2" />
        <p className="text-slate-400 text-sm">Loading quiz editor...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col justify-between">
        <Header isAdmin />
        <div className="max-w-md mx-auto my-auto p-6 text-center">
          <p className="text-red-400 mb-4">{error || "Quiz not found"}</p>
          <Link
            href="/admin/quizzes"
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm"
          >
            Back to Quizzes
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header isAdmin />
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/quizzes"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {quiz.title}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${quiz.status === "published"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                >
                  {quiz.status}
                </span>
                {quiz.isLocked && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800">
                    <Lock className="w-3 h-3" /> Locked for active attempts
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Version {quiz.version} • {questions.length} questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTogglePublish}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${quiz.status === "published"
                ? "bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900/80"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
            >
              {quiz.status === "published" ? "Unpublish Quiz" : "Publish Quiz"}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === "questions"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Questions Builder ({questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === "settings"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
          >
            <Settings className="w-4 h-4" />
            <span>Quiz Settings</span>
          </button>
        </div>

        {/* TAB 1: QUESTIONS BUILDER */}
        {activeTab === "questions" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-400">
                Add multiple-choice questions, question images, and configure time limits for each question.
              </p>
              <button
                onClick={handleOpenAddQuestion}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-16 fest-glass rounded-2xl border border-slate-800 p-8">
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No Questions in this Quiz</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Add questions to make this quiz ready for the competition. Quizzes must have at least one question before publishing.
                </p>
                <button
                  onClick={handleOpenAddQuestion}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q._id}
                    className="fest-glass rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {q.timeLimitSeconds
                            ? `${q.timeLimitSeconds}s (Custom)`
                            : `${quiz?.timeLimitPerQuestion || 10}s (Default)`}
                        </span>
                        {q.questionImage && (
                          <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Image Question
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white mb-3 font-malayalam leading-relaxed">
                        {q.questionText || "(Image Question)"}
                      </h4>

                      {q.questionImage && (
                        <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-slate-700 mb-3 bg-slate-900">
                          <Image
                            src={q.questionImage}
                            alt="Question preview"
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      )}

                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt) => {
                          const isCorrect = opt.id === q.correctOptionId;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border font-malayalam flex items-center justify-between ${isCorrect
                                ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200"
                                : "bg-slate-900/60 border-slate-800 text-slate-300"
                                }`}
                            >
                              <span>{opt.text}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 shrink-0">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <p className="mt-3 text-xs text-slate-400 font-malayalam bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                          <strong className="text-blue-400">Explanation: </strong>
                          {q.explanation}
                        </p>
                      )}
                    </div>

                    {/* Order, edit & delete buttons */}
                    <div className="flex md:flex-col items-center gap-1 shrink-0 pt-2 md:pt-0">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 cursor-pointer"
                        title="Edit Question & Time Limit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(idx, "down")}
                        disabled={idx === questions.length - 1}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 cursor-pointer ml-auto md:ml-0"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUIZ SETTINGS */}
        {activeTab === "settings" && (
          <div className="fest-glass rounded-2xl p-6 sm:p-8 border border-slate-800 max-w-3xl">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={settingsTitle}
                  onChange={(e) => setSettingsTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={settingsDescription}
                  onChange={(e) => setSettingsDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              {/* Schedule Start Time */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Quiz Start Time / ആരംഭ സമയം (Optional)</span>
                </label>
                <p className="text-xs text-slate-400">
                  Participants can register beforehand, but can only enter the quiz once this start time arrives. Leave empty for immediate entry.
                </p>
                <input
                  type="datetime-local"
                  value={settingsStartTime}
                  onChange={(e) => setSettingsStartTime(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> Time Per Question *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={settingsTimePerQ}
                      onChange={(e) => setSettingsTimePerQ(Math.max(1, parseInt(e.target.value, 10) || 10))}
                      placeholder="10"
                      className="w-full px-3 py-2 pr-7 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">s</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Default timer for questions</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Marks per Question
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={settingsMarks}
                    onChange={(e) => setSettingsMarks(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settingsMaxAttempts}
                    onChange={(e) => setSettingsMaxAttempts(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>



              <div className="flex items-center gap-2">
                <input
                  id="allowReview"
                  type="checkbox"
                  checked={settingsAllowReview}
                  onChange={(e) => setSettingsAllowReview(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="allowReview" className="text-xs text-slate-300">
                  Allow students to review answers & explanations after submission
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm cursor-pointer"
                >
                  {savingSettings ? "Saving Settings..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ADD QUESTION MODAL */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="fest-glass rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-700 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                {editingQuestionId ? "Edit Question & Time Limit" : "Add New Question"}
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Question Time Limit */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Time Limit for this Question (Seconds)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Set specific seconds for this question, or leave empty to use default ({quiz?.timeLimitPerQuestion || 10}s)
                    </p>
                  </div>
                  <div className="relative w-36">
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={qTimeLimitSeconds}
                      onChange={(e) =>
                        setQTimeLimitSeconds(
                          e.target.value === ""
                            ? ""
                            : Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      }
                      placeholder={`${quiz?.timeLimitPerQuestion || 10}`}
                      className="w-full px-3 py-2 pr-7 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                      s
                    </span>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Question Text (Malayalam / English) *
                </label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter the question text here..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-malayalam"
                />
              </div>

              {/* Upload Question Image */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Question Image (Optional for Visual Questions)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                  />
                  {qUploading && <span className="text-xs text-blue-400">Uploading...</span>}
                </div>
                {qImage && (
                  <div className="relative w-36 h-20 mt-2 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                    <Image src={qImage} alt="Uploaded" fill className="object-contain" />
                    <button
                      type="button"
                      onClick={() => setQImage(null)}
                      className="absolute top-1 right-1 bg-black/70 p-1 rounded-full text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Options */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  Answer Options (Select the Radio button for the Correct Answer) *
                </label>
                <div className="space-y-2.5">
                  {qOptions.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={qCorrectId === opt.id}
                        onChange={() => setQCorrectId(opt.id)}
                        className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700"
                        title="Mark as correct option"
                      />
                      <span className="w-6 text-xs font-bold text-slate-400">
                        {String.fromCharCode(65 + i)}:
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[i].text = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-malayalam"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Explanation (Displayed to students in review mode)
                </label>
                <textarea
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Explain why this is the correct answer..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-malayalam"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={qSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  {qSaving
                    ? "Saving..."
                    : editingQuestionId
                    ? "Update Question"
                    : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 text-sm">
          Loading quiz editor...
        </div>
      }
    >
      <EditQuizContent params={params} />
    </Suspense>
  );
}
