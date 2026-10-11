"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, RefreshCw, FileText } from "lucide-react";

interface StudentRecord {
  _id: string;
  name: string;
  phone: string;
  place: string;
  accessCodePrefix: string;
}

export default function StudentPrintA4Page() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [padCount, setPadCount] = useState<number>(18); // Default pad to 18 rows for neat A4 fit

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/students?limit=2000");
      if (!res.ok) {
        throw new Error("Failed to load students data");
      }
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const totalEmptyRowsNeeded = Math.max(0, padCount - students.length);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 print:bg-white print:text-black">
      {/* Top Floating Control Toolbar (Hidden in Print) */}
      <div className="sticky top-0 z-50 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800 p-4 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/students"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Students</span>
            </Link>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>A4 Student Code Sheet Preview</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                {students.length} registered students loaded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <label htmlFor="padCount" className="text-slate-400">
                Total Rows:
              </label>
              <select
                id="padCount"
                value={padCount}
                onChange={(e) => setPadCount(parseInt(e.target.value, 10))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value={students.length}>Only registered ({students.length})</option>
                <option value={15}>15 rows (A4 page)</option>
                <option value={18}>18 rows (Full A4)</option>
                <option value={22}>22 rows</option>
                <option value={30}>30 rows</option>
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main A4 Document Preview Canvas */}
      <main className="py-6 sm:py-10 px-4 flex justify-center print:p-0 print:m-0">
        {loading ? (
          <div className="text-center py-24 text-slate-400 print:hidden">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
            <p className="text-sm font-medium">Generating A4 Student Code Sheet...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24 text-red-400 print:hidden">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchStudents}
              className="mt-3 px-4 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-200"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[210mm] bg-white text-black shadow-2xl p-8 sm:p-12 print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full">
            {/* Title Header: നാട്ടറിവ് 2026 */}
            <div className="text-center mb-6 pt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-malayalam tracking-wide text-black mb-1">
                നാട്ടറിവ് 2026
              </h1>
            </div>

            {/* Table matching the exact format from user image */}
            <div className="w-full overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse border border-black text-black">
                <thead>
                  <tr className="bg-slate-50 print:bg-transparent">
                    <th className="border border-black px-3 py-2 text-center text-xs sm:text-sm font-bold w-[8%]">
                      No
                    </th>
                    <th className="border border-black px-3 py-2 text-left text-xs sm:text-sm font-bold w-[34%]">
                      Name
                    </th>
                    <th className="border border-black px-3 py-2 text-left text-xs sm:text-sm font-bold w-[22%]">
                      Number
                    </th>
                    <th className="border border-black px-3 py-2 text-left text-xs sm:text-sm font-bold w-[22%]">
                      Place
                    </th>
                    <th className="border border-black px-3 py-2 text-center text-xs sm:text-sm font-bold w-[14%]">
                      Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Populated Student Rows */}
                  {students.map((student, idx) => (
                    <tr
                      key={student._id}
                      className="h-10 sm:h-11 print:h-9 hover:bg-slate-50/50 print:hover:bg-transparent"
                    >
                      <td className="border border-black px-3 py-1.5 text-center text-xs sm:text-sm font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-left text-xs sm:text-sm font-medium">
                        {student.name}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-left text-xs sm:text-sm font-mono">
                        {student.phone}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-left text-xs sm:text-sm">
                        {student.place}
                      </td>
                      <td className="border border-black px-3 py-1.5 text-center text-xs sm:text-sm font-mono font-bold tracking-wider">
                        {student.accessCodePrefix}
                      </td>
                    </tr>
                  ))}

                  {/* Blank Rows to fill the A4 sheet */}
                  {Array.from({ length: totalEmptyRowsNeeded }).map((_, emptyIdx) => {
                    const rowNum = students.length + emptyIdx + 1;
                    return (
                      <tr key={`blank-${emptyIdx}`} className="h-10 sm:h-11 print:h-9">
                        <td className="border border-black px-3 py-1.5 text-center text-xs sm:text-sm text-slate-400 print:text-black">
                          {rowNum}
                        </td>
                        <td className="border border-black px-3 py-1.5" />
                        <td className="border border-black px-3 py-1.5" />
                        <td className="border border-black px-3 py-1.5" />
                        <td className="border border-black px-3 py-1.5" />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Global Print Media Rules for A4 Portrait */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 12mm 14mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
