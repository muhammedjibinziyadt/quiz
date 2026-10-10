import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-900 bg-[#060910] text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-10">
            <Image
              src="/images/maerika-arts-fest-logo.png"
              alt="MAERIKA 2K26"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              MAERIKA 2K26 Arts Fest
            </p>
            <p className="text-xs text-slate-500">
              Live Quiz Competition Engine & Real-time Evaluation System
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end text-xs text-slate-500">
          <p>© 2026 MAERIKA Arts Fest Committee. All rights reserved.</p>
          <p className="mt-1 text-slate-600">
            Secure Access Code Authentication • Strict Participant Privacy • Real-time Scoring
          </p>
        </div>
      </div>
    </footer>
  );
}
