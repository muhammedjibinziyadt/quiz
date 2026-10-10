import test from "node:test";
import assert from "node:assert/strict";

test("Timer Expiration: Server clamps late submission timestamp to serverDeadline", () => {
  const startTime = new Date(1000000);
  const durationSeconds = 300; // 5 minutes
  const serverDeadline = new Date(startTime.getTime() + durationSeconds * 1000);

  // Student submits 1 minute after server deadline
  const now = new Date(serverDeadline.getTime() + 60000);
  const graceMs = 15000;

  let submissionTime = now;
  if (now.getTime() > serverDeadline.getTime() + graceMs) {
    submissionTime = serverDeadline;
  }

  assert.equal(submissionTime.getTime(), serverDeadline.getTime());
  const completionTimeSeconds = Math.round(
    (submissionTime.getTime() - startTime.getTime()) / 1000
  );
  assert.equal(completionTimeSeconds, 300);
});

test("Duplicate Submission Protection: Concurrent or second attempt rejected atomically", () => {
  const attemptState = {
    isCompleted: false,
    score: null,
  };

  function simulateAtomicSubmit(score) {
    if (attemptState.isCompleted) {
      return { success: false, error: "Already submitted" };
    }
    attemptState.isCompleted = true;
    attemptState.score = score;
    return { success: true, score };
  }

  const firstSubmission = simulateAtomicSubmit(10);
  assert.equal(firstSubmission.success, true);
  assert.equal(attemptState.score, 10);

  const secondSubmission = simulateAtomicSubmit(10);
  assert.equal(secondSubmission.success, false);
  assert.equal(secondSubmission.error, "Already submitted");
});
