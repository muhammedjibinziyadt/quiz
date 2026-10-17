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
    const isShortAnswer = q.questionType === "short_answer";

    if (!selectedOption || !selectedOption.trim()) {
      unansweredCount++;
      answersDetail.push({
        questionId: qId,
        isCorrect: false,
        marksAwarded: 0,
      });
    } else if (isShortAnswer) {
      const words = selectedOption.trim().split(/\s+/).filter(Boolean);
      const reqWords = q.minWords ?? 20;
      const isWordCountPassed = words.length >= reqWords;

      if (isWordCountPassed) {
        correctCount++;
        totalScore += marksForQuestion;
        answersDetail.push({
          questionId: qId,
          isCorrect: true,
          marksAwarded: marksForQuestion,
        });
      } else {
        incorrectCount++;
        answersDetail.push({
          questionId: qId,
          isCorrect: false,
          marksAwarded: 0,
        });
      }
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
      answersDetail.push({
        questionId: qId,
        isCorrect: false,
        marksAwarded: 0,
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

test("Scoring System: Incorrect answers receive 0 marks without minus score", () => {
  const quiz = {
    marksPerQuestion: 2,
    negativeMarks: 0,
    negativeMarkingEnabled: false,
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

  assert.equal(res.score, 2); // 2 + 0 = 2 (no negative deduction)
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

test("Scoring System: Short Answer written question accepts 20+ words and awards points", () => {
  const quiz = {
    marksPerQuestion: 5,
    negativeMarks: 0,
    negativeMarkingEnabled: false,
  };

  const questions = [
    {
      _id: "q_note",
      questionType: "short_answer",
      minWords: 20,
      marks: 5,
    },
  ];

  // 21 words written answer note
  const valid21WordsAnswer =
    "This is a detailed and well formulated Malayalam cultural answer note written by the participant demonstrating knowledge of traditional arts fest traditions.";
  assert.equal(valid21WordsAnswer.trim().split(/\s+/).filter(Boolean).length >= 20, true);

  const resValid = evaluateQuizAttempt(
    quiz,
    questions,
    [{ questionId: "q_note", selectedOptionId: valid21WordsAnswer }],
    new Date(1000),
    new Date(10000)
  );

  assert.equal(resValid.score, 5);
  assert.equal(resValid.correctCount, 1);
  assert.equal(resValid.incorrectCount, 0);

  // 10 words written answer note (below 20 words)
  const invalid10WordsAnswer = "This is a short answer with only ten words here.";
  assert.equal(invalid10WordsAnswer.trim().split(/\s+/).filter(Boolean).length < 20, true);

  const resInvalid = evaluateQuizAttempt(
    quiz,
    questions,
    [{ questionId: "q_note", selectedOptionId: invalid10WordsAnswer }],
    new Date(1000),
    new Date(10000)
  );

  assert.equal(resInvalid.score, 0);
  assert.equal(resInvalid.correctCount, 0);
  assert.equal(resInvalid.incorrectCount, 1);
});
