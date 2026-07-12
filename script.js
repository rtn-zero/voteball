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

/* Matches */
const matches = [
  {
    homeCode: "FRA", homeName: "France", homeProb: "62%", homeFlag: "fra.svg",
    awayCode: "MAR", awayName: "Morocco", awayProb: "16%", awayFlag: "mar.svg",
    drawProb: "22%"
  },
  {
    homeCode: "ESP", homeName: "Spain", homeProb: "58%", homeFlag: "esp.svg",
    awayCode: "BEL", awayName: "Belgium", awayProb: "17%", awayFlag: "bel.svg",
    drawProb: "25%"
  },
  {
    homeCode: "NOR", homeName: "Norway", homeProb: "25%", homeFlag: "nor.svg",
    awayCode: "ENG", awayName: "England", awayProb: "49%", awayFlag: "eng.svg",
    drawProb: "26%"
  },
  {
    homeCode: "ARG", homeName: "Argentina", homeProb: "61%", homeFlag: "arg.svg",
    awayCode: "SUI", awayName: "Switzerland", awayProb: "15%", awayFlag: "sui.svg",
    drawProb: "24%"
  }
];

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

let currentMatchIndex = 0;
let isThrottled = false;

function updateMatchUI(index) {
  const match = matches[index];
  document.getElementById("home-flag").src = `assets/flags/${match.homeFlag}`;
  document.getElementById("away-flag").src = `assets/flags/${match.awayFlag}`;
  document.getElementById("home-code").textContent = match.homeCode;
  document.getElementById("away-code").textContent = match.awayCode;
  document.getElementById("vote-team-1").textContent = match.homeName;
  document.getElementById("vote-team-2").textContent = match.awayName;
  document.getElementById("prob-home").textContent = match.homeProb;
  document.getElementById("prob-draw").textContent = match.drawProb;
  document.getElementById("prob-away").textContent = match.awayProb;
}

window.addEventListener("wheel", (event) => {
  if (isThrottled) return;

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
  if (isThrottled) return;
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
