import { IQuiz } from "@/models/Quiz";
import { IQuestion } from "@/models/Question";
import { IAnswerResult, QuizAttempt } from "@/models/QuizAttempt";
import { broadcastLeaderboardUpdate } from "./pusher-server";

export interface EvaluationResult {
  score: number;
  totalPossibleMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  completionTimeSeconds: number;
  answersDetail: IAnswerResult[];
}

/**
 * Server-authoritative scoring engine.
 * Evaluates submitted answers against actual correct options stored in the database.
 */
export function evaluateQuizAttempt(
  quiz: IQuiz,
  questions: IQuestion[],
  savedAnswers: Array<{ questionId: string; selectedOptionId: string }>,
  startTime: Date,
  submittedAt: Date
): EvaluationResult {
  const answerMap = new Map<string, string>();
  for (const ans of savedAnswers) {
    if (ans.questionId && ans.selectedOptionId) {
      answerMap.set(String(ans.questionId), String(ans.selectedOptionId));
    }
  }

  let totalScore = 0;
  let totalPossibleMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const answersDetail: IAnswerResult[] = [];

  for (const q of questions) {
    const qId = String(q._id);
    const marksForQuestion = q.marks !== null && q.marks !== undefined ? q.marks : quiz.marksPerQuestion;
    const negMarksForQuestion = q.negativeMarks !== null && q.negativeMarks !== undefined ? q.negativeMarks : quiz.negativeMarks;

    totalPossibleMarks += marksForQuestion;
    const selectedOption = answerMap.get(qId);

    if (!selectedOption) {
      // Unanswered
      unansweredCount++;
      answersDetail.push({
        questionId: qId,
        questionText: q.questionText,
        selectedOptionId: undefined,
        correctOptionId: q.correctOptionId,
        isCorrect: false,
        marksAwarded: 0,
        explanation: q.explanation || "",
      });
    } else if (selectedOption === q.correctOptionId) {
      // Correct
      correctCount++;
      totalScore += marksForQuestion;
      answersDetail.push({
        questionId: qId,
        questionText: q.questionText,
        selectedOptionId: selectedOption,
        correctOptionId: q.correctOptionId,
        isCorrect: true,
        marksAwarded: marksForQuestion,
        explanation: q.explanation || "",
      });
    } else {
      // Incorrect
      incorrectCount++;
      const penalty = quiz.negativeMarkingEnabled ? negMarksForQuestion : 0;
      totalScore -= penalty;
      answersDetail.push({
        questionId: qId,
        questionText: q.questionText,
        selectedOptionId: selectedOption,
        correctOptionId: q.correctOptionId,
        isCorrect: false,
        marksAwarded: -penalty,
        explanation: q.explanation || "",
      });
    }
  }

  const rawSeconds = Math.round((submittedAt.getTime() - startTime.getTime()) / 1000);
  const completionTimeSeconds = Math.max(0, rawSeconds);

  return {
    score: Math.round(totalScore * 100) / 100, // clean 2-decimal precision
    totalPossibleMarks,
    correctCount,
    incorrectCount,
    unansweredCount,
    completionTimeSeconds,
    answersDetail,
  };
}

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  rankChange?: number; // >0 moved up, <0 moved down, 0 no change
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

// In-memory cache of previous rankings to compute live movement arrows (↑ green, ↓ red)
const previousRanksCache = new Map<string, Map<string, number>>();

/**
 * Calculates official leaderboard for a quiz based on strict ranking rules:
 * 1. Higher total score ranks first
 * 2. Equal scores: Shorter completion time ranks first
 * 3. Equal score and time: Earlier valid submission time ranks first (deterministic tie-breaker)
 */
export async function getQuizLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
  const attempts = await QuizAttempt.find({
    quizId,
    isCompleted: true,
  })
    .populate("studentId", "name phone place")
    .sort({
      score: -1,
      completionTimeSeconds: 1,
      submittedAt: 1,
    })
    .lean();

  // Deduplicate by student: if multiple attempts, keep highest ranking one
  const studentBestMap = new Map<string, typeof attempts[0]>();

  for (const att of attempts) {
    const sId = String(att.studentId?._id || att.studentId);
    if (!studentBestMap.has(sId)) {
      studentBestMap.set(sId, att);
    }
  }

  const sortedAttempts = Array.from(studentBestMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.completionTimeSeconds !== b.completionTimeSeconds) {
      return a.completionTimeSeconds - b.completionTimeSeconds;
    }
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return timeA - timeB;
  });

  const prevRanks = previousRanksCache.get(quizId) || new Map<string, number>();
  const currentRanks = new Map<string, number>();

  const leaderboard: LeaderboardEntry[] = sortedAttempts.map((att, index) => {
    const rank = index + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = att.studentId as any;
    const studentId = String(s?._id || att.studentId);
    currentRanks.set(studentId, rank);

    const prevRank = prevRanks.get(studentId);
    let rankChange = 0;
    if (prevRank !== undefined) {
      rankChange = prevRank - rank; // e.g. prevRank 5, rank 3 -> +2 (moved up)
    }

    return {
      rank,
      previousRank: prevRank,
      rankChange,
      studentId,
      studentName: s?.name || "Participant",
      phone: s?.phone || "",
      place: s?.place || "",
      score: att.score,
      totalPossibleMarks: att.totalPossibleMarks,
      correctCount: att.correctCount,
      incorrectCount: att.incorrectCount,
      unansweredCount: att.unansweredCount,
      completionTimeSeconds: att.completionTimeSeconds,
      submittedAt: att.submittedAt ? new Date(att.submittedAt).toISOString() : "",
      attemptId: String(att._id),
    };
  });

  // Update previous rank cache
  previousRanksCache.set(quizId, currentRanks);

  return leaderboard;
}

/**
 * Refreshes leaderboard in DB and dispatches live update via Pusher Channels
 */
export async function refreshAndBroadcastLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
  const leaderboard = await getQuizLeaderboard(quizId);
  const now = new Date().toISOString();

  await broadcastLeaderboardUpdate(quizId, {
    quizId,
    updatedAt: now,
    totalParticipants: leaderboard.length,
    leaderboard,
  });

  return leaderboard;
}
