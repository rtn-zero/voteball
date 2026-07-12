// Stars effect
if (window.tsParticles) {
  tsParticles.load({
    id: 'stars',
    options: {
      fullScreen: { enable: false },
      particles: {
        number: {
          value: 100,
          density: { enable: true, area: 800 }
        },
        shape: { type: 'circle' },
        color: {
          value: ['#ffffff', '#e0f2fe', '#fef08a', '#fbcfe8']
        },
        opacity: {
          value: { min: 0.2, max: 0.6 },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
            startValue: 'random'
          }
        },
        size: {
          value: { min: 1, max: 2 },
          animation: {
            enable: true,
            speed: 2,
            sync: false
          }
        },
        move: {
          enable: true,
          speed: 0.3,
          direction: 'none',
          outModes: { default: 'out' }
        }
      }
    }
  });
}

// --- API ---------------------------------------------------------------------
// Local dev talks to the API on :3000; production talks to the deployed backend.
const API_BASE =
  ["localhost", "127.0.0.1", ""].includes(location.hostname)
    ? "http://localhost:3000"
    : "https://voteball.onrender.com"; // live backend on Render

// Matches come from the backend now (single source of truth). Each item:
// { match_id, stage, outcomes:[...], home:{code,name,flag}, away:{...}, prediction:{...}, vote_count, userChoice }
let matches = [];
let currentMatchIndex = 0;
let isThrottled = false;

async function loadMatches() {
  const res = await fetch(`${API_BASE}/api/matches`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  matches = data.matches.map((m) => ({ ...m, userChoice: null }));
  if (matches.length) updateMatchUI(0);
}

function currentMatch() {
  return matches[currentMatchIndex];
}

// --- voting (local selection) ------------------------------------------------
function handleVoteClick(choice) {
  const match = currentMatch();
  if (!match) return;
  if (!match.outcomes.includes(choice)) return; // e.g. "draw" on a knockout match
  match.userChoice = choice;
  renderButtonStates();
}

function renderButtonStates() {
  const btnHome = document.getElementById("vote-team-1");
  const btnDraw = document.getElementById("vote-draw");
  const btnAway = document.getElementById("vote-team-2");
  const currentChoice = currentMatch()?.userChoice;

  [btnHome, btnDraw, btnAway].forEach((btn) => btn.classList.remove("selected"));

  if (currentChoice === 'home') btnHome.classList.add("selected");
  if (currentChoice === 'draw') btnDraw.classList.add("selected");
  if (currentChoice === 'away') btnAway.classList.add("selected");
}

document.getElementById("vote-team-1").addEventListener("click", () => handleVoteClick('home'));
document.getElementById("vote-draw").addEventListener("click", () => handleVoteClick('draw'));
document.getElementById("vote-team-2").addEventListener("click", () => handleVoteClick('away'));

// --- submit (send vote to the backend) ---------------------------------------
const submitBtn = document.getElementById("submit-btn");
const tipEl = document.querySelector(".tip");
let tipResetTimer = null;

function flashTip(msg) {
  if (!tipEl) return;
  const original = tipEl.dataset.original || tipEl.textContent;
  tipEl.dataset.original = original;
  tipEl.textContent = msg;
  clearTimeout(tipResetTimer);
  tipResetTimer = setTimeout(() => { tipEl.textContent = original; }, 2000);
}

submitBtn.addEventListener("click", async () => {
  const match = currentMatch();
  if (!match) return;
  if (!match.userChoice) { flashTip("Pick an outcome first!"); return; }

  submitBtn.disabled = true;
  const label = submitBtn.textContent;
  try {
    const res = await fetch(`${API_BASE}/api/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: match.match_id, choice: match.userChoice }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const updated = await res.json();
    match.prediction = updated.prediction;
    match.vote_count = updated.vote_count;
    setProbabilities(match);
    submitBtn.textContent = "Voted! ✓";
    sessionStorage.setItem(`voted_${match.match_id}`, "true");
  } catch (err) {
    submitBtn.textContent = "Try again";
    console.error("vote failed", err);
  } finally {
    setTimeout(() => {
      submitBtn.textContent = label;
      submitBtn.disabled = sessionStorage.getItem(`voted_${match.match_id}`) === "true";
    }, 1500);
  }
});

// --- rendering ---------------------------------------------------------------
function setProbabilities(match) {
  const p = match.prediction || {};
  document.getElementById("prob-home").textContent = `${p.home ?? 0}%`;
  document.getElementById("prob-away").textContent = `${p.away ?? 0}%`;
  if (p.draw !== undefined) document.getElementById("prob-draw").textContent = `${p.draw}%`;
}

function updateMatchUI(index) {
  const match = matches[index];
  if (!match) return;

  document.getElementById("home-flag").src = `/assets/flags/${match.home.flag}`;
  document.getElementById("away-flag").src = `/assets/flags/${match.away.flag}`;
  document.getElementById("home-code").textContent = match.home.code;
  document.getElementById("away-code").textContent = match.away.code;
  document.getElementById("vote-team-1").textContent = match.home.name;
  document.getElementById("vote-team-2").textContent = match.away.name;

  // Draw only applies to matches that can end level (group stage).
  const drawWrapper = document.getElementById("vote-draw").parentElement;
  drawWrapper.style.display = match.outcomes.includes("draw") ? "" : "none";

  setProbabilities(match);
  renderButtonStates();
  
  submitBtn.disabled = sessionStorage.getItem(`voted_${match.match_id}`) === "true";
}

// --- match carousel (scroll / swipe) -----------------------------------------
function changeMatchWithAnimation(nextIndex, direction) {
  const teamDisplay = document.querySelector(".team-display");
  const voteButtons = document.querySelector(".vote-buttons");

  const outClass = direction === "down" ? "fade-out-down" : "fade-out-up";
  const prepareClass = direction === "down" ? "fade-prepare-down" : "fade-prepare-up";

  teamDisplay.classList.add(outClass);
  voteButtons.classList.add(outClass);

  setTimeout(() => {

    updateMatchUI(nextIndex);

    teamDisplay.classList.remove(outClass);
    voteButtons.classList.remove(outClass);
    teamDisplay.classList.add(prepareClass);
    voteButtons.classList.add(prepareClass);

    setTimeout(() => {
      teamDisplay.classList.remove(prepareClass);
      voteButtons.classList.remove(prepareClass);
    }, 10);

  }, 300);
}

window.addEventListener("wheel", (event) => {
  if (isThrottled || !matches.length) return;

  if (event.deltaY > 0) {
    currentMatchIndex = (currentMatchIndex + 1) % matches.length;
    changeMatchWithAnimation(currentMatchIndex, 'down');
    triggerThrottle();
  } else if (event.deltaY < 0) {
    currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    changeMatchWithAnimation(currentMatchIndex, 'up');
    triggerThrottle();
  }
});

let touchStartY = 0;
window.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
});

window.addEventListener("touchend", (e) => {
  if (isThrottled || !matches.length) return;
  const touchEndY = e.changedTouches[0].clientY;
  const diffY = touchStartY - touchEndY;

  if (Math.abs(diffY) > 50) {
    if (diffY > 0) {
      currentMatchIndex = (currentMatchIndex + 1) % matches.length;
      changeMatchWithAnimation(currentMatchIndex, 'down');
    } else {
      currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
      changeMatchWithAnimation(currentMatchIndex, 'up');
    }
    triggerThrottle();
  }
});

function triggerThrottle() {
  isThrottled = true;
  setTimeout(() => {
    isThrottled = false;
  }, 500);
}

// --- boot --------------------------------------------------------------------
loadMatches().catch((err) => {
  console.error("Could not load matches", err);
  flashTip("Couldn't reach the server — is the API awake?");
});
