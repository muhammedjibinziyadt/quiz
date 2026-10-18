export interface Option {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface QuestionItem {
  _id: string;
  order: number;
  questionType?: "mcq" | "short_answer";
  minWords?: number;
  questionText: string;
  questionImage?: string;
  options: Option[];
  correctOptionId?: string;
  correctAnswerText?: string;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  timeLimitSeconds?: number | null;
}

export interface QuizDetails {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  quizType?: "text" | "image" | "mixed";
  startTime?: string | null;
  endTime?: string | null;
  durationSeconds?: number;
  timeLimitPerQuestion?: number;
  marksPerQuestion: number;
  negativeMarks?: number;
  negativeMarkingEnabled?: boolean;
  maxAttempts?: number;
  status: "draft" | "published" | "archived";
  version?: number;
}

export interface PdfExportOptions {
  mode: "full" | "paper" | "key"; // full: Q+A (Answer Key), paper: Questions Only, key: Summary Key Table
  includeImages: boolean;
  includeExplanations: boolean;
  includeMeta: boolean;
  includeInstructions: boolean;
  includeStudentInfo: boolean;
}

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  mode: "full",
  includeImages: true,
  includeExplanations: true,
  includeMeta: true,
  includeInstructions: true,
  includeStudentInfo: false,
};

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateQuizPrintHtml(
  quiz: QuizDetails,
  questions: QuestionItem[],
  options: PdfExportOptions
): string {
  const mode = options.mode;
  const isAnswerKey = mode === "full";
  const isPaperOnly = mode === "paper";
  const isKeyOnly = mode === "key";

  const totalMarks = questions.reduce(
    (sum, q) => sum + (q.marks ?? quiz.marksPerQuestion ?? 1),
    0
  );

  const docTitle =
    mode === "paper"
      ? `${quiz.title} - Question Paper`
      : mode === "key"
      ? `${quiz.title} - Answer Key Summary`
      : `${quiz.title} - Questions & Answers`;

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 15mm 14mm 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      font-size: 13px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .font-malayalam {
      font-family: 'Anek Malayalam', 'Noto Sans Malayalam', sans-serif;
    }

    .container {
      max-width: 100%;
      margin: 0 auto;
    }

    /* Header */
    .header-card {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .fest-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .fest-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
    }

    .fest-text h2 {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #dc2626;
    }

    .fest-text p {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    .badge-doc-type {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      ${
        isAnswerKey
          ? "background: #ecfdf5; color: #065f46; border: 1px solid #10b981;"
          : isPaperOnly
          ? "background: #eff6ff; color: #1e40af; border: 1px solid #3b82f6;"
          : "background: #fef3c7; color: #92400e; border: 1px solid #f59e0b;"
      }
    }

    .quiz-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .quiz-description {
      font-size: 11px;
      color: #475569;
      margin-bottom: 10px;
    }

    /* Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .meta-value {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Student info box (for paper mode) */
    .student-info-box {
      margin-top: 10px;
      padding: 10px 12px;
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 12px;
      background: #ffffff;
      font-size: 11px;
    }

    .info-line {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .info-line span {
      font-weight: 600;
      color: #475569;
    }

    .info-line .fill-line {
      flex: 1;
      border-bottom: 1px solid #cbd5e1;
      height: 12px;
    }

    /* Instructions box */
    .instructions-box {
      margin: 12px 0 16px 0;
      padding: 8px 12px;
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      border-radius: 0 6px 6px 0;
      font-size: 11px;
      color: #78350f;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .instructions-title {
      font-weight: 700;
      margin-bottom: 2px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Question Card */
    .question-card {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 14px;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
    }

    .question-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .q-number-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }

    .q-badges {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .q-badge {
      font-size: 9.5px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #f1f5f9;
      color: #334155;
    }

    .q-badge.marks {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1d4ed8;
      font-weight: 700;
    }

    .question-text {
      font-size: 14.5px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.6;
      margin-bottom: 10px;
    }

    .question-image-wrap {
      margin: 8px 0 12px 0;
      text-align: center;
    }

    .question-image {
      max-height: 180px;
      max-width: 100%;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 2px;
      background: #f8fafc;
    }

    /* Options Grid */
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }

    .option-item {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      line-height: 1.4;
    }

    .option-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .opt-letter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 10.5px;
      flex-shrink: 0;
    }

    .opt-bubble {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1.5px solid #64748b;
      flex-shrink: 0;
    }

    .option-item.correct {
      background: #f0fdf4 !important;
      border: 1.5px solid #16a34a !important;
      color: #14532d !important;
      font-weight: 600;
    }

    .option-item.correct .opt-letter {
      background: #16a34a;
      color: #ffffff;
    }

    .correct-tag {
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 6px;
      background: #16a34a;
      color: #ffffff;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-left: 6px;
      flex-shrink: 0;
    }

    /* Written Note Question */
    .written-note-box {
      margin-top: 8px;
      padding: 10px 12px;
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      background: #f8fafc;
    }

    .written-note-lines {
      margin-top: 10px;
    }

    .written-line {
      border-bottom: 1px solid #cbd5e1;
      height: 24px;
    }

    .written-ref-answer {
      margin-top: 8px;
      padding: 8px 10px;
      background: #fefce8;
      border-left: 3px solid #eab308;
      font-size: 12px;
      color: #713f12;
      border-radius: 0 4px 4px 0;
    }

    /* Explanation */
    .explanation-callout {
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #2563eb;
      border-radius: 0 6px 6px 0;
      font-size: 11.5px;
      color: #334155;
    }

    .explanation-callout strong {
      color: #1d4ed8;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Summary Table (for key mode) */
    .key-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 12px;
    }

    .key-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .key-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    .key-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .key-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      background: #16a34a;
      color: #ffffff;
      font-weight: 700;
      font-size: 11px;
    }

    /* Footer */
    .footer-doc {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      color: #64748b;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header-card">
      <div class="header-top">
        <div class="fest-brand">
          <img src="/images/maerika-arts-fest-logo.png" alt="MAERIKA 2K26" class="fest-logo" onerror="this.style.display='none'" />
          <div class="fest-text">
            <h2>MAERIKA 2K26 ARTS FEST</h2>
            <p>Jawharathul Uloom Suffa Dars Online Platform</p>
          </div>
        </div>

        <span class="badge-doc-type">
          ${
            isAnswerKey
              ? "Questions &amp; Answer Key"
              : isPaperOnly
              ? "Official Question Paper"
              : "Answer Key Summary"
          }
        </span>
      </div>

      <h1 class="quiz-title font-malayalam">${escapeHtml(quiz.title)}</h1>
      ${
        quiz.description
          ? `<p class="quiz-description font-malayalam">${escapeHtml(quiz.description)}</p>`
          : ""
      }

      ${
        options.includeMeta
          ? `<div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Total Questions</span>
                <span class="meta-value">${questions.length} Questions</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Total Marks</span>
                <span class="meta-value">${totalMarks} Marks</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Time Per Question</span>
                <span class="meta-value">${quiz.timeLimitPerQuestion || 10} Seconds</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Generated Date</span>
                <span class="meta-value">${dateStr}</span>
              </div>
            </div>`
          : ""
      }

      ${
        isPaperOnly && options.includeStudentInfo
          ? `<div class="student-info-box">
              <div class="info-line"><span>Name:</span><div class="fill-line"></div></div>
              <div class="info-line"><span>Chest No:</span><div class="fill-line"></div></div>
              <div class="info-line"><span>Class:</span><div class="fill-line"></div></div>
              <div class="info-line"><span>Score:</span><div class="fill-line"></div></div>
            </div>`
          : ""
      }
    </header>

    ${
      options.includeInstructions && quiz.instructions
        ? `<div class="instructions-box">
            <div class="instructions-title">Competition Instructions</div>
            <div style="white-space: pre-line;">${escapeHtml(quiz.instructions)}</div>
          </div>`
        : ""
    }

    <!-- CONTENT BY MODE -->
    ${
      isKeyOnly
        ? `<!-- ANSWER KEY SUMMARY TABLE -->
        <table class="key-table">
          <thead>
            <tr>
              <th style="width: 50px;">Q#</th>
              <th>Question Excerpt</th>
              <th style="width: 90px; text-align: center;">Correct Opt</th>
              <th>Correct Answer Text</th>
              <th style="width: 70px; text-align: right;">Marks</th>
            </tr>
          </thead>
          <tbody>
            ${questions
              .map((q, idx) => {
                const correctOpt = q.options?.find((o) => o.id === q.correctOptionId);
                const optIndex = q.options?.findIndex((o) => o.id === q.correctOptionId);
                const letter = optIndex !== undefined && optIndex >= 0 ? ["A", "B", "C", "D"][optIndex] : "-";
                const qMarks = q.marks ?? quiz.marksPerQuestion ?? 1;

                return `<tr>
                  <td><strong>#${idx + 1}</strong></td>
                  <td class="font-malayalam">${escapeHtml(
                    q.questionText ? q.questionText.slice(0, 60) + (q.questionText.length > 60 ? "..." : "") : "(Image Question)"
                  )}</td>
                  <td style="text-align: center;">
                    ${
                      q.questionType === "short_answer"
                        ? '<span class="q-badge">Note</span>'
                        : `<span class="key-badge">(${letter})</span>`
                    }
                  </td>
                  <td class="font-malayalam" style="font-weight: 600; color: #166534;">
                    ${
                      q.questionType === "short_answer"
                        ? escapeHtml(q.correctAnswerText || `Min ${q.minWords || 20} words required`)
                        : escapeHtml(correctOpt?.text || "-")
                    }
                  </td>
                  <td style="text-align: right; font-weight: 700;">+${qMarks}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>`
        : `<!-- FULL OR PAPER QUESTIONS LIST -->
        <div class="questions-list">
          ${questions
            .map((q, idx) => {
              const qMarks = q.marks ?? quiz.marksPerQuestion ?? 1;
              const qTime = q.timeLimitSeconds ?? quiz.timeLimitPerQuestion ?? 10;
              const isWritten = q.questionType === "short_answer";

              return `<div class="question-card">
                <div class="question-top">
                  <span class="q-number-badge">#${idx + 1}</span>
                  <div class="q-badges">
                    <span class="q-badge marks">+${qMarks} Mark${qMarks > 1 ? "s" : ""}</span>
                    <span class="q-badge">${qTime}s</span>
                    ${
                      isWritten
                        ? `<span class="q-badge" style="background: #fef3c7; color: #92400e; border-color: #fde68a;">Written Note (${q.minWords || 20}+ words)</span>`
                        : `<span class="q-badge">Multiple Choice</span>`
                    }
                  </div>
                </div>

                <div class="question-text font-malayalam">
                  ${escapeHtml(q.questionText || "(Image Question)")}
                </div>

                ${
                  options.includeImages && q.questionImage
                    ? `<div class="question-image-wrap">
                        <img src="${escapeHtml(q.questionImage)}" alt="Question Image" class="question-image" />
                      </div>`
                    : ""
                }

                ${
                  isWritten
                    ? isPaperOnly
                      ? `<div class="written-note-box">
                          <p style="font-size: 11px; color: #64748b; font-style: italic;">
                            Write your answer below (Minimum ${q.minWords || 20} words):
                          </p>
                          <div class="written-note-lines">
                            <div class="written-line"></div>
                            <div class="written-line"></div>
                            <div class="written-line"></div>
                            <div class="written-line"></div>
                          </div>
                        </div>`
                      : `<div class="written-ref-answer font-malayalam">
                          <strong>Reference Answer / Note: </strong>
                          ${
                            q.correctAnswerText
                              ? escapeHtml(q.correctAnswerText)
                              : `Students provide an answer with a minimum of ${q.minWords || 20} words to be awarded full marks.`
                          }
                        </div>`
                    : `<div class="options-grid">
                        ${(q.options || [])
                          .map((opt, optIdx) => {
                            const letters = ["A", "B", "C", "D", "E", "F"];
                            const letter = letters[optIdx] || String(optIdx + 1);
                            const isCorrect = isAnswerKey && opt.id === q.correctOptionId;

                            return `<div class="option-item ${isCorrect ? "correct" : ""}">
                              <div class="option-left font-malayalam">
                                ${
                                  isPaperOnly
                                    ? `<span class="opt-bubble"></span>`
                                    : `<span class="opt-letter">${letter}</span>`
                                }
                                <span>${escapeHtml(opt.text)}</span>
                              </div>
                              ${isCorrect ? `<span class="correct-tag">✓ Correct</span>` : ""}
                            </div>`;
                          })
                          .join("")}
                      </div>`
                }

                ${
                  isAnswerKey && options.includeExplanations && q.explanation
                    ? `<div class="explanation-callout font-malayalam">
                        <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
                      </div>`
                    : ""
                }
              </div>`;
            })
            .join("")}
        </div>`
    }

    <!-- Footer -->
    <footer class="footer-doc">
      <span>MAERIKA 2K26 Arts Fest • Jawharathul Uloom Suffa Dars Online Platform</span>
      <span>Page generated from Live Quiz Portal • Page 1 of 1</span>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Creates an invisible iframe, loads the generated printable HTML with all fonts and styles,
 * and triggers the native browser print dialog (Save as PDF).
 */
export function printQuizDocument(
  quiz: QuizDetails,
  questions: QuestionItem[],
  options: PdfExportOptions = DEFAULT_PDF_OPTIONS
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const html = generateQuizPrintHtml(quiz, questions, options);

      // Create an invisible iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      iframe.setAttribute("aria-hidden", "true");

      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        iframe.remove();
        reject(new Error("Unable to access print frame document"));
        return;
      }

      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      // Give fonts and images a brief moment to render
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          // Cleanup after print window closes
          setTimeout(() => {
            iframe.remove();
          }, 3000);
        }
      }, 500);
    } catch (err) {
      reject(err);
    }
  });
}
