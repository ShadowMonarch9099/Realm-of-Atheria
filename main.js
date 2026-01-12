import { GoogleGenAI } from "@google/genai";
import { localQuestions } from "./questions.js";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

let selectedPoints = 0;
let countdownTimer;

const tribes = ["Flame Tribe", "Aqua Tribe", "Earth Tribe", "Wind Tribe"];

/* ===================== SELECTION ===================== */

window.selectDifficulty = (pts, el) => {
  selectedPoints = pts;
  document
    .querySelectorAll(".stone-tablet")
    .forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
};

window.startTrial = () => {
  if (!selectedPoints) {
    alert("Select a difficulty.");
    return;
  }

  document.querySelector(".first-screen").classList.add("hidden");
  document.getElementById("trial-screen").classList.remove("hidden");

  document.getElementById("difficulty-badge").innerText =
    `${selectedPoints} Point Trial`;

  document.getElementById("tribe-header").innerText =
    tribes[Math.floor(Math.random() * tribes.length)];
};

/* ===================== QUESTION ===================== */

window.generateQuestion = async () => {
  const area = document.getElementById("question-area");
  const grid = document.getElementById("options-grid");
  const timer = document.getElementById("global-timer");

  area.innerHTML = "<p>Consulting the Spirits of Atheria...</p>";
  grid.classList.add("hidden");
  timer.classList.add("hidden");

  const prompt = `
You are an expert quiz master designing questions for a LIVE, time-bound fantasy board game called "Realm of Atheria".

Difficulty and timing:
- 5 points → 10 seconds → logical reasoning, mental math, aptitude
- 10 points → 15 seconds → core CS / IT fundamentals
- 15 points → 20 seconds → programming logic, code reasoning, edge cases

Rules:
- Questions must be challenging but solvable within the time limit.
- Avoid trivial or one-glance answers.
- Avoid excessive text; focus on thinking, not reading speed.
- If code is involved, include it clearly.

Output rules:
- EXACTLY one MCQ
- EXACTLY 4 options
- ONLY one correct answer
- No explanations
- STRICT JSON only
- If code is included, wrap it in triple backticks

Format:
{
  "question": "Question text (code allowed)",
  "options": ["A", "B", "C", "D"],
  "answer": "Correct option"
}
`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const raw = res.text.trim();
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const q = JSON.parse(json);
    renderQuestion(q);

  } catch (err) {
    console.warn("API failed, using local fallback", err);
    const bank = localQuestions[selectedPoints];
    const fallback =
      bank[Math.floor(Math.random() * bank.length)];
    renderQuestion(fallback);
  }
};

/* ===================== RENDER ===================== */

function renderQuestion(q) {
  const formattedQuestion = q.question.replace(
    /```([\s\S]*?)```/g,
    '<pre class="code-block">$1</pre>'
  );

  document.getElementById("question-area").innerHTML = `
    <div class="question-card">
      <div class="question-text">
        <strong>Q.</strong> ${formattedQuestion}
      </div>
    </div>
  `;

  const grid = document.getElementById("options-grid");
  grid.innerHTML = "";
  grid.classList.remove("hidden");

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt;
    btn.disabled = true; // disabled during reading time
    btn.onclick = () => verifyAnswer(opt, q.answer);
    grid.appendChild(btn);
  });

  // ⏳ Reading time before countdown
  setTimeout(() => {
    document
      .querySelectorAll(".option-btn")
      .forEach(btn => (btn.disabled = false));
    startCountdown();
  }, 4000);
}

/* ===================== TIMER ===================== */

function startCountdown() {
  let time =
    selectedPoints === 5 ? 10 :
    selectedPoints === 10 ? 15 : 20;

  const timer = document.getElementById("global-timer");
  timer.classList.remove("hidden");
  timer.innerText = `${time} seconds left`;

  countdownTimer = setInterval(() => {
    time--;
    timer.innerText = `${time} seconds left`;

    if (time <= 0) {
      clearInterval(countdownTimer);
      endTurn(false, "Time has run out.");
    }
  }, 1000);
}

/* ===================== ANSWERS ===================== */

function verifyAnswer(selected, correct) {
  clearInterval(countdownTimer);

  document.querySelectorAll(".option-btn").forEach(btn => {
    if (btn.innerText === correct)
      btn.classList.add("option-correct");
    if (btn.innerText === selected && selected !== correct)
      btn.classList.add("option-wrong");
    btn.disabled = true;
  });

  const win = selected === correct;

  endTurn(
    win,
    win
      ? "Correct! The tribe advances."
      : `Wrong! Correct answer: ${correct}`
  );
}

/* ===================== END TURN ===================== */

function endTurn(win, message) {
  const feedback = document.getElementById("feedback");
  feedback.innerText = message;
  feedback.style.color = win ? "#6fbf8a" : "#c56b6b";

  // Allow players to read result clearly
  setTimeout(() => {
    location.reload();
  }, 12000);
}
