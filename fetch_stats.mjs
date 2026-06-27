// fetch_stats.mjs
const API_KEY = "946f86bc-d49b-4bae-aea6-6ab9a6f20a66";
const BASE_URL = "https://api.balldontlie.io/nba/v1";

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  // Search for Stephen Curry
  const playersData = await fetchJSON(`${BASE_URL}/players?search=curry&per_page=5`);
  const player = playersData.data.find(p => p.last_name.toLowerCase().includes("curry"));
  if (!player) {
    console.log("Player not found");
    return;
  }
  console.log("Player:", player.first_name, player.last_name, "ID", player.id);

  const season = 2023; // 2023-24 season
  // Season averages
  const averagesData = await fetchJSON(`${BASE_URL}/season_averages?season=${season}&player_ids[]=${player.id}`);
  console.log("Season Averages (", season, "-", season+1, "):");
  console.log(averagesData.data[0] || "No averages");

  // Game logs (latest 10)
  const statsData = await fetchJSON(`${BASE_URL}/stats?seasons[]=${season}&player_ids[]=${player.id}&per_page=25`);
  const logs = statsData.data.slice(0,10);
  console.log("Recent Game Logs (latest 10):");
  console.table(logs.map(l=>({date:l.game.date, pts:l.pts, reb:l.reb, ast:l.ast, fg_pct:l.fg_pct, fg3_pct:l.fg3_pct, ft_pct:l.ft_pct, plus_minus:l.plus_minus })));
}

main().catch(e=>console.error(e));
