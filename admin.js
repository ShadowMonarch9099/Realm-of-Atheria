const socket = io("http://localhost:3000");

socket.on("leaderboard-update", (players) => {
  const live = document.getElementById("livePlayers");
  const top = document.getElementById("topPlayers");

  live.innerHTML = "";
  top.innerHTML = "";

  /* ---------------- LIVE PLAYERS ---------------- */
  const live = document.getElementById("livePlayers");
  const top = document.getElementById("topPlayers");
  const tribeTotalsEl = document.getElementById("tribeTotals");

  live.innerHTML = "";
  top.innerHTML = "";
  tribeTotalsEl.innerHTML = "";

  /* ---------------- TRIBE TOTALS ---------------- */
  const tribeTotals = {
    Flame: 0,
    Aqua: 0,
    Wind: 0,
    Earth: 0
  };

  players.forEach(p => {
    if (tribeTotals[p.tribe] !== undefined) {
      tribeTotals[p.tribe] += p.score;
    }
  });

  const tribeConfig = [
    { name: "Flame", icon: "🔥", cls: "tribe-flame" },
    { name: "Aqua",  icon: "💧", cls: "tribe-aqua" },
    { name: "Wind",  icon: "🍃", cls: "tribe-wind" },
    { name: "Earth", icon: "🌱", cls: "tribe-earth" }
  ];

  tribeConfig.forEach(t => {
    const li = document.createElement("li");
    li.className = `tribe-row ${t.cls}`;
    li.innerHTML = `
      <span>${t.icon} ${t.name} Tribe</span>
      <span>${tribeTotals[t.name]} pts</span>
    `;
    tribeTotalsEl.appendChild(li);
  });

  /* ---------------- LIVE PLAYERS ---------------- */
  players.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `${p.name} (${p.tribe}) — ${p.score} pts`;
    live.appendChild(li);
  });

  /* ---------------- TOP PERFORMERS ---------------- */
  [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `🏆 ${p.name} — ${p.score} pts`;
      top.appendChild(li);
    });

});
