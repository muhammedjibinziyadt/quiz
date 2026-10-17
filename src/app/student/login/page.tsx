"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  User,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  Trophy,
} from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();

  // Registration form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Self Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim().toUpperCase();
    const cleanPhone = phone.trim();
    const cleanPlace = place.trim().toUpperCase();

    if (!cleanName || cleanName.length < 2) {
      setError("Please enter your full name (minimum 2 characters).");
      return;
    }
    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, "").length < 7) {
      setError("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    if (!cleanPlace || cleanPlace.length < 2) {
      setError("Please enter your place or location.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/student/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          place: cleanPlace,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      // Successfully registered/logged in and session cookie set; redirect to available quizzes
      router.push("/student/quizzes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-red-600/10 to-amber-500/10 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="relative w-20 h-24 drop-shadow-md">
                <Image
                  src="/images/maerika-arts-fest-logo.png"
                  alt="MAERIKA 2K26 Arts Fest"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="h-10 sm:h-14 w-px bg-slate-800" />
              <div className="relative w-[90px] h-[50px] sm:w-36 sm:h-20 drop-shadow-md">
                <Image
                  src="/images/nattarivu-quiz-logo.png"
                  alt="നാട്ടറിവ് QUIZ 2026"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-300 font-medium font-malayalam max-w-sm mx-auto leading-relaxed drop-shadow-sm">
              ക്വിസിൽ പങ്കെടുക്കാൻ വിവരങ്ങൾ നൽകുക
            </p>
          </div>

          {/* Form Card */}
          <div className="fest-glass rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 text-red-300 text-sm mb-5 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <p className="leading-snug text-xs sm:text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="Enter full name"
                  required
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase placeholder:normal-case"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phone Number *</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  required
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Place / Location *</span>
                </label>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value.toUpperCase())}
                  placeholder="Enter place / location"
                  required
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase placeholder:normal-case"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Entering Quiz...</span>
                  </div>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>Register & Start Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
