/* =============================================================================
 * Voteball — frontend integration
 * Paste this into script.js (BELOW the existing tsParticles stars block).
 * Renders one voting card per match into <main> and wires up voting.
 * No framework — plain DOM.
 * ============================================================================= */

// Point at localhost while developing, the live Render API in production.
const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://voteball-api.onrender.com"; // <-- replace with your real Render URL

const main = document.querySelector("main");

// --- rendering ---------------------------------------------------------------

function cardHTML(m, isNext) {
  return `
    <article class="match-card${isNext ? " match-card--next" : ""}" data-match="${m.match_id}">
      ${isNext ? `<span class="match-card__nudge">Vote on this next</span>` : ""}
      <div class="match-card__teams">
        <span class="team team--left">${m.left.code}<small>${m.left.name}</small></span>
        <span class="match-card__vs">vs</span>
        <span class="team team--right">${m.right.code}<small>${m.right.name}</small></span>
      </div>

      <div class="predbar" role="img"
           aria-label="${m.left.code} ${m.prediction}% — ${m.right.code} ${100 - m.prediction}%">
        <span class="predbar__fill" style="width:${m.prediction}%"></span>
      </div>
      <div class="predbar__labels">
        <span class="js-left-pct">${m.prediction}%</span>
        <span class="js-count">${m.vote_count} votes</span>
        <span class="js-right-pct">${100 - m.prediction}%</span>
      </div>

      <label class="vote-row">
        <span class="team--left">${m.left.code}</span>
        <input class="js-slider" type="range" min="0" max="100" value="${m.prediction}" />
        <span class="team--right">${m.right.code}</span>
      </label>
      <button class="vote-btn js-vote" type="button">
        Vote <span class="js-slider-val">${m.prediction}</span>% ${m.left.code}
      </button>
    </article>`;
}

async function loadMatches() {
  try {
    const res = await fetch(`${API_BASE}/api/matches`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { matches, next_match_id } = await res.json();
    main.innerHTML = matches.map((m) => cardHTML(m, m.match_id === next_match_id)).join("");
    matches.forEach(wireCard);
  } catch (err) {
    main.innerHTML = `<p class="load-error">Couldn't load matches. Is the API awake? (${err.message})</p>`;
  }
}

// --- interaction -------------------------------------------------------------

function wireCard(m) {
  const card = main.querySelector(`[data-match="${m.match_id}"]`);
  const slider = card.querySelector(".js-slider");
  const sliderVal = card.querySelector(".js-slider-val");
  const voteBtn = card.querySelector(".js-vote");

  slider.addEventListener("input", () => {
    sliderVal.textContent = slider.value;
  });

  voteBtn.addEventListener("click", async () => {
    voteBtn.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/api/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: m.match_id, win_rate: Number(slider.value) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      updateCard(card, updated.prediction, updated.vote_count);
    } catch (err) {
      voteBtn.textContent = "Try again";
    } finally {
      voteBtn.disabled = false;
    }
  });
}

function updateCard(card, prediction, voteCount) {
  card.querySelector(".predbar__fill").style.width = `${prediction}%`;
  card.querySelector(".js-left-pct").textContent = `${prediction}%`;
  card.querySelector(".js-right-pct").textContent = `${100 - prediction}%`;
  card.querySelector(".js-count").textContent = `${voteCount} votes`;
}

loadMatches();
