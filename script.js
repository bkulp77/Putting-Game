let state = {
  players: [],
  holes: 9,
  currentHole: 0,
  scores: [] // scores[hole][player][ball] = putts
};

function setPlayers(n) {
  document.getElementById('numPlayers').value = n;
  updatePlayerNameInputs();
}
function setHoles(n) {
  document.getElementById('numHoles').value = n;
}

function updatePlayerNameInputs() {
  const n = parseInt(document.getElementById('numPlayers').value) || 1;
  const container = document.getElementById('playerNames');
  container.innerHTML = '<label>Player Names (optional)</label>';
  for (let i = 0; i < n; i++) {
    const div = document.createElement('div');
    div.className = 'player-setup';
    div.innerHTML = `<span style="min-width:70px;font-weight:600;">Player ${i+1}</span>
                     <input type="text" id="pname${i}" placeholder="Name ${i+1}" value="Player ${i+1}">`;
    container.appendChild(div);
  }
}

document.getElementById('numPlayers').addEventListener('input', updatePlayerNameInputs);
updatePlayerNameInputs();

function startGame() {
  const nPlayers = Math.max(1, Math.min(12, parseInt(document.getElementById('numPlayers').value) || 1));
  const nHoles = Math.max(1, Math.min(36, parseInt(document.getElementById('numHoles').value) || 9));

  state.players = [];
  for (let i = 0; i < nPlayers; i++) {
    const name = document.getElementById(`pname${i}`)?.value.trim() || `Player ${i+1}`;
    state.players.push(name);
  }
  state.holes = nHoles;
  state.currentHole = 0;
  state.scores = Array.from({ length: nHoles }, () =>
    Array.from({ length: nPlayers }, () => [1, 1, 1])
  );

  document.getElementById('totalHoles').textContent = nHoles;
  showScreen('game');
  renderHole();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function getPlayerTotal(pIdx) {
  let total = 0;
  for (let h = 0; h <= state.currentHole; h++) {
    total += state.scores[h][pIdx].reduce((a, b) => a + b, 0);
  }
  return total;
}

function getHoleTotal(pIdx) {
  return state.scores[state.currentHole][pIdx].reduce((a, b) => a + b, 0);
}

function updateScoreboard() {
  const board = document.getElementById('scoreboard');
  if (!board) return;
  const totals = state.players.map((_, p) => getPlayerTotal(p));
  const minTotal = Math.min(...totals);
  const holesCompleted = state.currentHole + 1;

  board.innerHTML = state.players.map((name, p) => {
    const total = totals[p];
    const holeTotal = getHoleTotal(p);
    const isLeader = total === minTotal && state.players.length > 1;
    return `
      <div class="score-item ${isLeader ? 'leader' : ''}">
        <div class="name">${name}${isLeader ? ' 🏆' : ''}</div>
        <div class="total">${total}</div>
        <div class="sub">This hole: ${holeTotal} · Thru ${holesCompleted}</div>
      </div>
    `;
  }).join('');
}

function renderHole() {
  const hole = state.currentHole;
  document.getElementById('currentHoleNum').textContent = hole + 1;
  document.getElementById('holeProgress').textContent = hole + 1;

  const container = document.getElementById('playersContainer');
  container.innerHTML = '';

  state.players.forEach((name, pIdx) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.innerHTML = `<div class="player-name">${name}</div><div class="balls" id="balls-${pIdx}"></div>`;
    container.appendChild(card);

    const ballsDiv = card.querySelector('.balls');
    for (let b = 0; b < 3; b++) {
      const putts = state.scores[hole][pIdx][b];
      const ballDiv = document.createElement('div');
      ballDiv.className = 'ball';
      ballDiv.innerHTML = `
        <div class="ball-label">Ball ${b+1}</div>
        <div class="counter">
          <button onclick="changePutt(${pIdx}, ${b}, -1)">−</button>
          <span class="value" id="val-${pIdx}-${b}">${putts}</span>
          <button onclick="changePutt(${pIdx}, ${b}, 1)">+</button>
        </div>
      `;
      ballsDiv.appendChild(ballDiv);
    }
  });

  document.getElementById('prevBtn').disabled = hole === 0;
  const nextBtn = document.getElementById('nextBtn');
  if (hole === state.holes - 1) {
    nextBtn.textContent = 'Finish Round';
  } else {
    nextBtn.textContent = 'Next Hole';
  }

  updateScoreboard();
}

function changePutt(pIdx, ball, delta) {
  const hole = state.currentHole;
  let val = state.scores[hole][pIdx][ball] + delta;
  if (val < 1) val = 1;
  if (val > 10) val = 10;
  state.scores[hole][pIdx][ball] = val;
  document.getElementById(`val-${pIdx}-${ball}`).textContent = val;
  updateScoreboard();
}

function nextHole() {
  if (state.currentHole < state.holes - 1) {
    state.currentHole++;
    renderHole();
  } else {
    showSummary();
  }
}

function prevHole() {
  if (state.currentHole > 0) {
    state.currentHole--;
    renderHole();
  }
}

function showSummary() {
  const nHoles = state.holes;
  const nPlayers = state.players.length;

  // Calculate totals
  const totals = state.players.map((_, p) => {
    let total = 0;
    for (let h = 0; h < nHoles; h++) {
      total += state.scores[h][p].reduce((a, b) => a + b, 0);
    }
    return total;
  });

  const minTotal = Math.min(...totals);
  const avg = totals.reduce((a, b) => a + b, 0) / nPlayers;

  let html = '<thead><tr><th>Player</th><th>Total Putts</th><th>Avg / Hole</th><th>Balls</th></tr></thead><tbody>';
  state.players.forEach((name, p) => {
    const total = totals[p];
    const avgHole = (total / nHoles).toFixed(1);
    const isWinner = total === minTotal;
    html += `<tr class="${isWinner ? 'winner' : ''}">
      <td>${name}${isWinner && nPlayers > 1 ? ' 🏆' : ''}</td>
      <td>${total}</td>
      <td>${avgHole}</td>
      <td>${nHoles * 3}</td>
    </tr>`;
  });
  html += `<tr class="totals-row"><td>Average</td><td>${avg.toFixed(1)}</td><td>${(avg / nHoles).toFixed(1)}</td><td>—</td></tr>`;
  html += '</tbody>';

  document.getElementById('summaryTable').innerHTML = html;
  showScreen('summary');
}

function newRound() {
  showScreen('setup');
  updatePlayerNameInputs();
}

function exportResults() {
  const nHoles = state.holes;
  let text = `Putting Practice Results\nHoles: ${nHoles} | Players: ${state.players.length}\n\n`;
  state.players.forEach((name, p) => {
    let total = 0;
    text += `${name}:\n`;
    for (let h = 0; h < nHoles; h++) {
      const holePutts = state.scores[h][p];
      total += holePutts.reduce((a, b) => a + b, 0);
      text += `  Hole ${h+1}: ${holePutts.join(', ')} (sum ${holePutts.reduce((a,b)=>a+b,0)})\n`;
    }
    text += `  Total: ${total}\n\n`;
  });
  navigator.clipboard.writeText(text).then(() => {
    alert('Results copied to clipboard!');
  }).catch(() => {
    prompt('Copy these results:', text);
  });
}
