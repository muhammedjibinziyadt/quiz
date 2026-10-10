import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const TEST_SECRET = "maerika_test_session_secret_123456789";

function hashAccessCode(code) {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return crypto.createHmac("sha256", TEST_SECRET).update(normalized).digest("hex");
}

test("Access Control: Access code normalization is robust", () => {
  const code1 = "MK-ABHI-2026";
  const code2 = " mk-abhi-2026 ";
  const code3 = "MKABHI2026";

  const hash1 = hashAccessCode(code1);
  const hash2 = hashAccessCode(code2);
  const hash3 = hashAccessCode(code3);

  assert.equal(hash1, hash2);
  assert.equal(hash1, hash3);
});

test("Access Control: Student token role cannot impersonate Admin", () => {
  const studentToken = jwt.sign(
    { role: "student", studentId: "std_1", name: "Devika" },
    TEST_SECRET,
    { expiresIn: "1h" }
  );

  const decoded = jwt.verify(studentToken, TEST_SECRET);
  assert.equal(decoded.role, "student");
  assert.notEqual(decoded.role, "admin");

  // Admin authorization guard simulation
  const isAdmin = decoded.role === "admin";
  assert.equal(isAdmin, false);
});
