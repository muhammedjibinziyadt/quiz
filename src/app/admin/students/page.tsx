"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Download,
  Printer,
  Edit,
  Trash2,
  History,
  X,
  Phone,
  MapPin,
  CheckCircle,
} from "lucide-react";

interface StudentRecord {
  _id: string;
  name: string;
  phone: string;
  place: string;
  accessCodePrefix?: string | null;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  totalAttempts: number;
  highestScore: number | null;
  lastAttemptAt: string | null;
}

interface AttemptItem {
  _id: string;
  quizId?: { title: string; durationSeconds: number };
  score: number;
  totalPossibleMarks: number;
  completionTimeSeconds: number;
  submittedAt: string;
}

function StudentsContent() {
  const router = useRouter();

  // State
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentHistory, setStudentHistory] = useState<AttemptItem[]>([]);

  // Feedback toast / success state
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form inputs for editing
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPlace, setFormPlace] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const q = encodeURIComponent(search.trim());
      const res = await fetch(
        `/api/admin/students?page=${page}&limit=12&q=${q}&status=${statusFilter}`
      );
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setStudents(data.students || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalStudents(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, router]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Handle Edit Student
  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/students/${selectedStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          place: formPlace,
          notes: formNotes,
          isActive: formIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update student");
      }

      setShowEditModal(false);
      setSelectedStudent(null);
      showNotification("Student information updated successfully!");
      fetchStudents();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error updating student");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? All their quiz records will be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students/${studentId}`, { method: "DELETE" });
      if (res.ok) {
        showNotification(`Deleted student "${name}".`);
        fetchStudents();
      } else {
        alert("Failed to delete student");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // View Student History
  const handleViewHistory = async (student: StudentRecord) => {
    setSelectedStudent(student);
    setShowHistoryModal(true);
    setStudentHistory([]);

    try {
      const res = await fetch(`/api/admin/students/${student._id}`);
      if (res.ok) {
        const data = await res.json();
        setStudentHistory(data.attempts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header isAdmin />
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Success toast notification */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm flex items-center gap-2.5 animate-fade-in shadow-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              Registered Participants
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live registry of self-registered participants. Students register on their own via the festival portal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/students/print"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Export A4 Sheet</span>
            </Link>

            <a
              href="/api/admin/students/export"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="fest-glass rounded-2xl p-4 border border-slate-800 mb-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone, place..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" /> Status:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">All Statuses ({totalStudents})</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="fest-glass rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0b1222] text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Contact & Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Quizzes Completed</th>
                  <th className="py-3.5 px-4">Highest Score</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                      Loading student records...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                      No registered participants found yet.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{s.name}</div>
                        {s.notes && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {s.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{s.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{s.place}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            s.isActive
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {s.isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {s.totalAttempts}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-400">
                        {s.highestScore !== null ? s.highestScore : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewHistory(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                            title="Participation History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setFormName(s.name);
                              setFormPhone(s.phone);
                              setFormPlace(s.place);
                              setFormNotes(s.notes || "");
                              setFormIsActive(s.isActive);
                              setFormError(null);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s._id, s.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing page {page} of {totalPages} ({totalStudents} total records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded bg-slate-800 text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded bg-slate-800 text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* EDIT STUDENT MODAL */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="fest-glass rounded-2xl max-w-md w-full p-6 sm:p-8 border border-slate-700 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-400" />
                Edit Student Information
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Place
                </label>
                <input
                  type="text"
                  value={formPlace}
                  onChange={(e) => setFormPlace(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">
                  Student is Active (permits quiz access)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTICIPATION HISTORY MODAL */}
      {showHistoryModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="fest-glass rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-700 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Participation History</h3>
                <p className="text-xs text-slate-400">{selectedStudent.name} • {selectedStudent.place}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 py-2">
              {studentHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  This student has not completed any quizzes yet.
                </p>
              ) : (
                studentHistory.map((att) => {
                  const mins = Math.floor(att.completionTimeSeconds / 60);
                  const secs = att.completionTimeSeconds % 60;
                  return (
                    <div
                      key={att._id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {att.quizId?.title || "Quiz"}
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Time taken: {mins}m {secs}s
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-amber-400 text-sm">
                          {att.score} / {att.totalPossibleMarks}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {new Date(att.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 text-sm">
          Loading students module...
        </div>
      }
    >
      <StudentsContent />
    </Suspense>
  );
}
