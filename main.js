import { GoogleGenAI } from "@google/genai";
import { localQuestions } from "./questions.js";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

let selectedPoints = 0;
let countdownTimer;

const tribes = ["Flame Tribe", "Aqua Tribe", "Earth Tribe", "Wind Tribe"];

/* SELECTION */

window.selectDifficulty = (pts, el) => {
  selectedPoints = pts;
  document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
};

window.startTrial = () => {
  if (!selectedPoints) return alert("Select a difficulty.");

  document.getElementById("selection-screen").classList.add("hidden");
  document.getElementById("trial-screen").classList.remove("hidden");

  document.getElementById("difficulty-badge").innerText =
    `${selectedPoints} Point Trial`;

  document.getElementById("tribe-header").innerText =
    tribes[Math.floor(Math.random() * tribes.length)];
};

/* QUESTION */

window.generateQuestion = async () => {
  const area = document.getElementById("question-area");
  const grid = document.getElementById("options-grid");
  const feedback = document.getElementById("feedback");

  area.innerHTML = `<div class="loader">Consulting the Spirits of Eternum...</div>`;
  grid.classList.add("hidden");
  feedback.innerText = "";

  const topic =
    selectedPoints === 5
      ? "General Knowledge or Aptitude"
      : selectedPoints === 10
      ? "Basic Computer Science or IT fundamentals"
      : "Programming logic or implementation-based concepts";

  const prompt = `
You are a quiz master.
Generate ONE concise MCQ.
Topic: ${topic}.
Difficulty: ${selectedPoints} points.

Rules:
- Question must be SHORT and clear.
- Options must be brief.
- Avoid long descriptions.
- Output STRICT JSON only.

{
  "question": "...",
  "options": ["A","B","C","D"],
  "answer": "Exact correct option"
}
`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const raw = res.text.trim();
    const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    renderQuestion(json);

  } catch {
    const bank = localQuestions[selectedPoints];
    renderQuestion(bank[Math.floor(Math.random() * bank.length)]);
  }
};

/* GAME FLOW */

function renderQuestion(q) {
  const area = document.getElementById("question-area");

  area.innerHTML = `
    <div class="question-card">
      <div class="question-text">
        <strong>Q.</strong> ${q.question}
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
    btn.onclick = () => {
      disableOptions(true);
      verifyAnswer(opt, q.answer);
    };
    grid.appendChild(btn);
  });

  disableOptions(true);

  setTimeout(() => {
    disableOptions(false);
    startCountdown();
  }, 4000);
}

/* TIMER */

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
      endTurn(false, "Time has claimed the tribe.");
    }
  }, 1000);
}

/* ANSWERS */

function verifyAnswer(sel, correct) {
  clearInterval(countdownTimer);
  markResult(sel, correct);

  endTurn(
    sel === correct,
    sel === correct
      ? "Victory! The path opens."
      : `Defeat! Correct answer: ${correct}`
  );
}

function markResult(sel, correct) {
  document.querySelectorAll(".option-btn").forEach(b => {
    if (b.innerText === correct) b.classList.add("option-correct");
    if (b.innerText === sel && sel !== correct) b.classList.add("option-wrong");
  });
}

function disableOptions(v) {
  document.querySelectorAll(".option-btn").forEach(b => b.disabled = v);
}

function endTurn(win, msg) {
  const f = document.getElementById("feedback");
  f.innerText = msg;
  f.style.color = win ? "#2ecc71" : "#e74c3c";
  setTimeout(() => location.reload(), 12000);
}
