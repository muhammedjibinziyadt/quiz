import test from "node:test";
import assert from "node:assert/strict";

// Scoring test simulation logic equivalent to src/lib/scoring.ts
function evaluateQuizAttempt(
  quiz,
  questions,
  savedAnswers,
  startTime,
  submittedAt
) {
  const answerMap = new Map();
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
  const answersDetail = [];

  for (const q of questions) {
    const qId = String(q._id);
    const marksForQuestion = q.marks !== null && q.marks !== undefined ? q.marks : quiz.marksPerQuestion;
    const negMarksForQuestion = q.negativeMarks !== null && q.negativeMarks !== undefined ? q.negativeMarks : quiz.negativeMarks;

    totalPossibleMarks += marksForQuestion;
    const selectedOption = answerMap.get(qId);

    if (!selectedOption) {
      unansweredCount++;
      answersDetail.push({
        questionId: qId,
        isCorrect: false,
        marksAwarded: 0,
      });
    } else if (selectedOption === q.correctOptionId) {
      correctCount++;
      totalScore += marksForQuestion;
      answersDetail.push({
        questionId: qId,
        isCorrect: true,
        marksAwarded: marksForQuestion,
      });
    } else {
      incorrectCount++;
      const penalty = quiz.negativeMarkingEnabled ? negMarksForQuestion : 0;
      totalScore -= penalty;
      answersDetail.push({
        questionId: qId,
        isCorrect: false,
        marksAwarded: -penalty,
      });
    }
  }

  const rawSeconds = Math.round((submittedAt.getTime() - startTime.getTime()) / 1000);
  const completionTimeSeconds = Math.max(0, rawSeconds);

  return {
    score: Math.round(totalScore * 100) / 100,
    totalPossibleMarks,
    correctCount,
    incorrectCount,
    unansweredCount,
    completionTimeSeconds,
    answersDetail,
  };
}

test("Scoring System: Perfect Score calculation", () => {
  const quiz = {
    marksPerQuestion: 2,
    negativeMarks: 0.5,
    negativeMarkingEnabled: true,
  };

  const questions = [
    { _id: "q1", correctOptionId: "opt_2", marks: 2 },
    { _id: "q2", correctOptionId: "opt_1", marks: 2 },
  ];

  const answers = [
    { questionId: "q1", selectedOptionId: "opt_2" },
    { questionId: "q2", selectedOptionId: "opt_1" },
  ];

  const start = new Date(100000);
  const end = new Date(140000); // 40 seconds

  const res = evaluateQuizAttempt(quiz, questions, answers, start, end);

  assert.equal(res.score, 4);
  assert.equal(res.correctCount, 2);
  assert.equal(res.incorrectCount, 0);
  assert.equal(res.unansweredCount, 0);
  assert.equal(res.completionTimeSeconds, 40);
});

test("Scoring System: Negative marking deducted properly when enabled", () => {
  const quiz = {
    marksPerQuestion: 2,
    negativeMarks: 0.5,
    negativeMarkingEnabled: true,
  };

  const questions = [
    { _id: "q1", correctOptionId: "opt_2", marks: 2 },
    { _id: "q2", correctOptionId: "opt_1", marks: 2 },
  ];

  // 1 correct, 1 wrong
  const answers = [
    { questionId: "q1", selectedOptionId: "opt_2" },
    { questionId: "q2", selectedOptionId: "opt_wrong" },
  ];

  const start = new Date(100000);
  const end = new Date(160000);

  const res = evaluateQuizAttempt(quiz, questions, answers, start, end);

  assert.equal(res.score, 1.5); // 2 - 0.5 = 1.5
  assert.equal(res.correctCount, 1);
  assert.equal(res.incorrectCount, 1);
  assert.equal(res.unansweredCount, 0);
});

test("Scoring System: Unanswered questions receive zero marks", () => {
  const quiz = {
    marksPerQuestion: 2,
    negativeMarks: 0.5,
    negativeMarkingEnabled: true,
  };

  const questions = [
    { _id: "q1", correctOptionId: "opt_2", marks: 2 },
    { _id: "q2", correctOptionId: "opt_1", marks: 2 },
  ];

  // Only q1 answered, q2 omitted
  const answers = [{ questionId: "q1", selectedOptionId: "opt_2" }];

  const start = new Date(100000);
  const end = new Date(130000);

  const res = evaluateQuizAttempt(quiz, questions, answers, start, end);

  assert.equal(res.score, 2); // 2 + 0 = 2
  assert.equal(res.correctCount, 1);
  assert.equal(res.incorrectCount, 0);
  assert.equal(res.unansweredCount, 1);
});
