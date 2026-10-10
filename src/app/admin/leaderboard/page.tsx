"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminNav } from "@/components/AdminNav";
import { getPusherClient } from "@/lib/pusher-client";
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  Radio,
  Users,
  Award,
  RefreshCw,
  Sparkles,
  Crown,
  Medal,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  rankChange?: number;
  studentId: string;
  studentName: string;
  phone: string;
  place: string;
  score: number;
  totalPossibleMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  completionTimeSeconds: number;
  submittedAt: string;
  attemptId: string;
}

interface QuizOption {
  _id: string;
  title: string;
}

export default function AdminLiveLeaderboardPage() {
  const router = useRouter();

  // Selected quiz
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [selectedQuizTitle, setSelectedQuizTitle] = useState<string>("");

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [pusherConnected, setPusherConnected] = useState(false);
  const [newlySubmittedStudentId, setNewlySubmittedStudentId] = useState<string | null>(null);

  // Load quizzes list
  useEffect(() => {
    async function fetchQuizzesList() {
      try {
        const res = await fetch("/api/admin/quizzes");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        const list = data.quizzes || [];
        setQuizzes(list);
        if (list.length > 0) {
          setSelectedQuizId(list[0]._id);
          setSelectedQuizTitle(list[0].title);
        }
      } catch (err) {
        console.error("Failed to load quizzes list:", err);
      }
    }
    fetchQuizzesList();
  }, [router]);

  // Fetch leaderboard data for selected quiz
  const fetchLeaderboard = async (quizId: string) => {
    if (!quizId) return;
    try {
      const res = await fetch(`/api/admin/leaderboard/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setTotalParticipants(data.totalParticipants || 0);
        setLastUpdatedAt(new Date().toLocaleTimeString());
        if (data.quiz?.title) {
          setSelectedQuizTitle(data.quiz.title);
        }
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch whenever selectedQuizId changes
  useEffect(() => {
    if (selectedQuizId) {
      setLoading(true);
      fetchLeaderboard(selectedQuizId);
    }
  }, [selectedQuizId]);

  // Pusher Realtime Subscription + Resilient Fallback Polling
  useEffect(() => {
    if (!selectedQuizId) return;

    const pusher = getPusherClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;

    if (pusher) {
      const channelName = `admin-leaderboard-${selectedQuizId}`;
      channel = pusher.subscribe(channelName);
      setPusherConnected(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channel.bind("ranking-updated", (data: any) => {
        console.log("[Pusher Event Received] ranking-updated:", data);
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
          setTotalParticipants(data.totalParticipants || data.leaderboard.length);
          setLastUpdatedAt(new Date().toLocaleTimeString());

          // Highlight top updated student
          if (data.leaderboard.length > 0) {
            setNewlySubmittedStudentId(data.leaderboard[0].studentId);
            setTimeout(() => setNewlySubmittedStudentId(null), 3000);
          }
        }
      });
    } else {
      setPusherConnected(false);
    }

    // Fallback polling every 5s to guarantee live updates regardless of Pusher configuration
    const pollTimer = setInterval(() => {
      fetchLeaderboard(selectedQuizId);
    }, 5000);

    return () => {
      clearInterval(pollTimer);
      if (pusher && channel) {
        pusher.unsubscribe(`admin-leaderboard-${selectedQuizId}`);
      }
    };
  }, [selectedQuizId]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Top 3 for Podium
  const rank1 = leaderboard[0];
  const rank2 = leaderboard[1];
  const rank3 = leaderboard[2];

  // Data for Recharts Bar Chart (Top 10)
  const chartData = leaderboard.slice(0, 10).map((entry) => ({
    name: entry.studentName.split(" ")[0],
    score: entry.score,
    time: entry.completionTimeSeconds,
    fullName: entry.studentName,
  }));

  const chartColors = [
    "#F59E0B", // Gold 1st
    "#94A3B8", // Silver 2nd
    "#D97706", // Bronze 3rd
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#10B981",
    "#06B6D4",
    "#64748B",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14]">
      <Header isAdmin />
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Header & Quiz Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live Evaluation Stream
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-amber-400" />
              Real-time Competition Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live ranking animations, podium standings, and Pusher-synchronized scores.
            </p>
          </div>

          {/* Quiz Selector & Connection Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  pusherConnected ? "bg-emerald-400 animate-ping" : "bg-blue-400 animate-pulse"
                }`}
              />
              <span className="text-slate-300 font-medium">
                {pusherConnected ? "Pusher Realtime Active" : "Live Stream Active"}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Updated {lastUpdatedAt || "just now"}</span>
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedQuizId}
                onChange={(e) => {
                  setSelectedQuizId(e.target.value);
                  const found = quizzes.find((q) => q._id === e.target.value);
                  if (found) setSelectedQuizTitle(found.title);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              >
                {quizzes.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {!loading && leaderboard.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" /> Top Performers Podium
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto items-end pt-4">
              {/* 2nd Place (Silver) */}
              <div className="flex flex-col items-center">
                {rank2 ? (
                  <div className="w-full text-center">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-slate-300 font-black text-lg sm:text-xl shadow-lg">
                        <Medal className="w-6 h-6 text-slate-300" />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-slate-400 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        2
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-xs sm:text-sm truncate max-w-[130px] mx-auto">
                      {rank2.studentName}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">{rank2.place}</p>
                    <p className="text-sm sm:text-base font-extrabold text-slate-200 mt-1">
                      {rank2.score} pts
                    </p>
                    <p className="text-[10px] text-slate-500">{formatTime(rank2.completionTimeSeconds)}</p>

                    {/* Pedestal */}
                    <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-slate-900 to-slate-800 rounded-t-2xl border-t-2 border-x border-slate-700 mt-3 flex items-center justify-center">
                      <span className="text-xl sm:text-3xl font-black text-slate-600">2nd</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 border border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 text-xs">
                    Pending
                  </div>
                )}
              </div>

              {/* 1st Place (Gold) */}
              <div className="flex flex-col items-center">
                {rank1 ? (
                  <div className="w-full text-center">
                    <div className="relative mb-2">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 flex items-center justify-center text-slate-950 font-black text-xl sm:text-2xl shadow-xl fest-glow-gold">
                        <Crown className="w-8 h-8 text-slate-950" />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow">
                        1
                      </span>
                    </div>
                    <h3 className="font-black text-white text-sm sm:text-base truncate max-w-[150px] mx-auto">
                      {rank1.studentName}
                    </h3>
                    <p className="text-xs text-amber-400/90 truncate font-semibold">{rank1.place}</p>
                    <p className="text-lg sm:text-2xl font-black text-amber-400 mt-1">
                      {rank1.score} pts
                    </p>
                    <p className="text-xs text-slate-400">{formatTime(rank1.completionTimeSeconds)}</p>

                    {/* Pedestal */}
                    <div className="w-full h-32 sm:h-44 bg-gradient-to-t from-amber-950/40 via-amber-900/20 to-slate-800 rounded-t-2xl border-t-2 border-x border-amber-500/50 mt-3 flex items-center justify-center fest-glow-gold">
                      <span className="text-2xl sm:text-4xl font-black text-amber-400">1st</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-40 border border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 text-xs">
                    Pending
                  </div>
                )}
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="flex flex-col items-center">
                {rank3 ? (
                  <div className="w-full text-center">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center text-amber-600 font-black text-lg sm:text-xl shadow-lg">
                        <Medal className="w-6 h-6 text-amber-600" />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        3
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-xs sm:text-sm truncate max-w-[130px] mx-auto">
                      {rank3.studentName}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">{rank3.place}</p>
                    <p className="text-sm sm:text-base font-extrabold text-amber-500 mt-1">
                      {rank3.score} pts
                    </p>
                    <p className="text-[10px] text-slate-500">{formatTime(rank3.completionTimeSeconds)}</p>

                    {/* Pedestal */}
                    <div className="w-full h-20 sm:h-28 bg-gradient-to-t from-slate-900 to-slate-800 rounded-t-2xl border-t-2 border-x border-slate-700 mt-3 flex items-center justify-center">
                      <span className="text-xl sm:text-3xl font-black text-amber-700">3rd</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-28 border border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 text-xs">
                    Pending
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Recharts Chart (Visual Score Comparison) */}
        {!loading && chartData.length > 0 && (
          <div className="fest-glass rounded-2xl p-6 border border-slate-800 mb-10 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Top Participants Score Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs shadow-2xl">
                            <p className="font-bold text-white mb-1">{d.fullName}</p>
                            <p className="text-amber-400 font-semibold">Score: {d.score} pts</p>
                            <p className="text-slate-400">Time: {formatTime(d.time)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Live Ranking Cards Table with Rank Up/Down Animations */}
        <div className="fest-glass rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Official Standings</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                  {totalParticipants} Competitors
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ranking criteria: 1. Higher Score → 2. Shorter Completion Time → 3. Earlier Valid Submission.
              </p>
            </div>

            <button
              onClick={() => fetchLeaderboard(selectedQuizId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0b1222] text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-20">Rank</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Accuracy</th>
                  <th className="py-3.5 px-4">Completion Time</th>
                  <th className="py-3.5 px-4 text-right">Submission Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                      Loading live leaderboard data...
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                      No participants have completed this quiz yet. Standings will appear in real time once submissions are recorded.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item) => {
                    const isRankUp = (item.rankChange || 0) > 0;
                    const isRankDown = (item.rankChange || 0) < 0;
                    const isNewlySubmitted = newlySubmittedStudentId === item.studentId;

                    return (
                      <tr
                        key={item.studentId}
                        className={`transition-all duration-300 ${
                          isRankUp ? "animate-rank-up bg-emerald-950/20" : ""
                        } ${isRankDown ? "animate-rank-down bg-red-950/20" : ""} ${
                          isNewlySubmitted ? "bg-blue-900/30 font-semibold" : "hover:bg-slate-800/40"
                        }`}
                      >
                        {/* Rank Badge with Movement Arrow */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                                item.rank === 1
                                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/40"
                                  : item.rank === 2
                                  ? "bg-slate-300 text-slate-950"
                                  : item.rank === 3
                                  ? "bg-amber-700 text-white"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {item.rank}
                            </span>

                            {/* Rank movement indicator */}
                            {isRankUp && (
                              <span
                                className="flex items-center text-[10px] font-bold text-emerald-400"
                                title={`Moved up by ${item.rankChange} positions`}
                              >
                                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                                {item.rankChange}
                              </span>
                            )}
                            {isRankDown && (
                              <span
                                className="flex items-center text-[10px] font-bold text-red-400"
                                title={`Moved down by ${Math.abs(item.rankChange!)} positions`}
                              >
                                <ArrowDown className="w-3.5 h-3.5 text-red-400" />
                                {Math.abs(item.rankChange!)}
                              </span>
                            )}
                            {!isRankUp && !isRankDown && (
                              <span className="text-slate-600">
                                <Minus className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{item.studentName}</span>
                            {item.rank <= 3 && (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Podium
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{item.phone}</span>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-xs text-slate-300">
                          {item.place}
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-4">
                          <span className="font-black text-base text-amber-400">
                            {item.score}
                          </span>
                          <span className="text-xs text-slate-500">
                            {" "}
                            / {item.totalPossibleMarks}
                          </span>
                        </td>

                        {/* Accuracy */}
                        <td className="py-3.5 px-4 text-xs">
                          <span className="text-emerald-400 font-semibold">
                            {item.correctCount} correct
                          </span>
                          <span className="text-slate-500"> • </span>
                          <span className="text-red-400">{item.incorrectCount} wrong</span>
                        </td>

                        {/* Completion Time */}
                        <td className="py-3.5 px-4 text-xs font-mono font-semibold text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatTime(item.completionTimeSeconds)}</span>
                          </div>
                        </td>

                        {/* Submission Timestamp */}
                        <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono">
                          {item.submittedAt
                            ? new Date(item.submittedAt).toLocaleTimeString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
