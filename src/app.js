// src/app.js
const API_KEY = "946f86bc-d49b-4bae-aea6-6ab9a6f20a66";
const BASE_URL = "https://www.balldontlie.io/api/v1";

function setTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved ? saved === 'dark' : prefersDark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  setTheme(!isDark);
}

async function fetchJSON(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchPlayer(name) {
  const data = await fetchJSON(`/players?search=${encodeURIComponent(name)}&per_page=5`);
  return data.data;
}

async function getSeasonAverages(playerId, season) {
  const data = await fetchJSON(`/season_averages?season=${season}&player_ids[]=${playerId}`);
  return data.data[0] || null;
}

async function getGameLogs(playerId, season) {
  const data = await fetchJSON(`/stats?seasons[]=${season}&player_ids[]=${playerId}&per_page=25`);
  return data.data.slice(0, 10);
}

function renderSeasonAverages(avg) {
  const el = document.getElementById('seasonAverages');
  if (!avg) {
    el.textContent = 'No data available';
    return;
  }
  el.textContent = JSON.stringify(avg, null, 2);
}

function renderGameLogs(logs) {
  const tbody = document.getElementById('gameLogs');
  tbody.innerHTML = '';
  logs.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2 border border-gray-700">${new Date(l.game.date).toLocaleDateString()}</td>
      <td class="p-2 border border-gray-700">${l.pts}</td>
      <td class="p-2 border border-gray-700">${l.reb}</td>
      <td class="p-2 border border-gray-700">${l.ast}</td>
      <td class="p-2 border border-gray-700">${(l.fg_pct*100).toFixed(1)}%</td>
      <td class="p-2 border border-gray-700">${(l.fg3_pct*100).toFixed(1)}%</td>
      <td class="p-2 border border-gray-700">${(l.ft_pct*100).toFixed(1)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

async function handleSearch() {
  const query = document.getElementById('playerSearch').value.trim();
  if (!query) return;
  try {
    const results = await searchPlayer(query);
    if (results.length === 0) {
      alert('No player found');
      return;
    }
    const player = results[0];
    document.getElementById('playerName').textContent = `${player.first_name} ${player.last_name}`;
    const season = new Date().getFullYear(); // current year as season start
    const [avg, logs] = await Promise.all([
      getSeasonAverages(player.id, season),
      getGameLogs(player.id, season)
    ]);
    renderSeasonAverages(avg);
    renderGameLogs(logs);
    document.getElementById('playerInfo').classList.remove('hidden');
  } catch (err) {
    console.error(err);
    alert('Error fetching data: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('searchBtn').addEventListener('click', handleSearch);
  // Support Enter key in search input
  document.getElementById('playerSearch').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
});
