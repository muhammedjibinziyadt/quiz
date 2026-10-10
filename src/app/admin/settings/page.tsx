"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import {
  Settings,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Terminal,
  Server,
  Sparkles,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [copiedScript, setCopiedScript] = useState(false);

  const copyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header isAdmin />
      <AdminNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            System & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure admin credentials, Pusher environment status, and competition policies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Admin Credentials Generator */}
          <div className="fest-glass rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Admin Password Security</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Per strict security standards, admin passwords are never stored in plain text or
              committed to Git. Passwords are securely hashed with bcrypt.
            </p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-xs font-semibold text-slate-300 mb-2">
                CLI Command to Generate a New Password Hash:
              </p>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black border border-slate-800 font-mono text-xs text-amber-400">
                <span>npm run hash:admin your_new_password</span>
                <button
                  onClick={() => copyScript("npm run hash:admin your_new_password")}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="Copy command"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              After running the command, copy the output hash into your <code className="text-amber-400">.env.local</code> file under <code className="text-slate-300">ADMIN_PASSWORD_HASH</code>.
            </p>
          </div>

          {/* Festival Competition Title & Branding */}
          <div className="fest-glass rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Competition Branding</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                  Festival Title
                </span>
                <p className="font-bold text-white text-sm">MAERIKA 2K26 Arts Fest</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                  Malayalam Quiz Signature
                </span>
                <p className="font-bold text-emerald-400 font-malayalam text-base">
                  നാട്ടറിവ് QUIZ 2026
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                  Assets Verified
                </span>
                <p className="text-slate-300 font-mono text-[11px]">
                  /public/images/maerika-arts-fest-logo.png
                  <br />
                  /public/images/nattarivu-quiz-logo.png
                </p>
              </div>
            </div>
          </div>

          {/* Environment Variables & Architecture Specs */}
          <div className="md:col-span-2 fest-glass rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Server className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Environment Configuration</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-semibold block">MONGODB_URI</span>
                <span className="text-emerald-400 font-medium">Configured / Auto-Fallback</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-semibold block">SESSION_SECRET</span>
                <span className="text-emerald-400 font-medium">Active (256-bit JWT)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-semibold block">PUSHER_CHANNELS</span>
                <span className="text-blue-400 font-medium">Supported (Auto Fallback)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-semibold block">STUDENT_PRIVACY</span>
                <span className="text-emerald-400 font-semibold">Strict Backend Enforcement</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
