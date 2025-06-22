// === backend/server.js ===
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "https://footballfantasyfront.netlify.app" }));

const PORT = 3001;
const API_KEY = "6748b5a727b789718caac2a7c23aad5f";
const BASE_URL = "https://v3.football.api-sports.io";

// Fantasy point logic
const eliteDefenders = ["Virgil van Dijk", "William Saliba", "Trent Alexander-Arnold"];

async function calculateFantasyPoints(player, playerId, position) {
  try {
    const statsResponse = await axios.get(`${BASE_URL}/players`, {
      headers: { "x-apisports-key": API_KEY },
      params: {
        id: playerId,
        season: 2023,
        league: 39,
      },
    });

    const matches = statsResponse.data.response[0]?.statistics || [];
    let totalPoints = 0;

    matches.forEach(match => {
      const minutes = match.games.minutes || 0;
      const goals = match.goals.total || 0;
      const assists = match.goals.assists || 0;
      const yellow = match.cards.yellow || 0;
      const red = match.cards.red || 0;
      const cleanSheet = match.clean_sheet ? 1 : 0;

      let matchPoints = 0;
      matchPoints += minutes >= 60 ? 2 : 1;
      if (position === "forward") matchPoints += goals * 4;
      else if (position === "midfielder") matchPoints += goals * 5;
      else matchPoints += goals * 6;
      matchPoints += assists * 3;
      if ((position === "defender" || position === "midfielder") && cleanSheet) {
        matchPoints += 4;
      }
      matchPoints -= yellow;
      matchPoints -= red * 3;
      totalPoints += matchPoints;
    });

    if (position === "defender" && eliteDefenders.includes(player.name)) {
      totalPoints += 5;
    }

    return Math.round(totalPoints);
  } catch (err) {
    console.error("Fantasy calculation error:", err.message);
    return 0;
  }
}

// Fetch individual player details
app.get("/api/player-odds", async (req, res) => {
  const playerName = req.query.name;
  if (!playerName) return res.status(400).json({ error: "Player name required" });

  try {
    const response = await axios.get(`${BASE_URL}/players`, {
      headers: { "x-apisports-key": API_KEY },
      params: { search: playerName, season: 2023, league: 39 },
    });

    const player = response.data.response[0];
    if (!player) return res.status(404).json({ error: "Player not found" });

    const stats = player.statistics[0];
    const position = stats.games.position.toLowerCase();
    const playerId = player.player.id;
    const fantasyPoints = await calculateFantasyPoints(player.player, playerId, position);

    res.json({
      name: player.player.name,
      team: stats.team.name,
      photo: player.player.photo,
      number: stats.games.number || "-",
      country: player.player.nationality,
      goals: stats.goals.total || 0,
      assists: stats.goals.assists || 0,
      position: stats.games.position,
      fantasyPoints,
    });
  } catch (err) {
    console.error("Backend error:", err.message);
    res.status(500).json({ error: "Failed to fetch player data" });
  }
});

// List Premier League players (paginated)
app.get("/api/players", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || "";

  try {
    const response = await axios.get(`${BASE_URL}/players`, {
      headers: { "x-apisports-key": API_KEY },
      params: {
        league: 39,
        season: 2023,
        search,
        page,
      },
    });

    const players = response.data.response.map(p => ({
      name: p.player.name,
      club: p.statistics[0].team.name,
      position: p.statistics[0].games.position,
      country: p.player.nationality,
    }));

    res.json({
      players,
      totalPages: 10,
    });
  } catch (err) {
    console.error("Player list error:", err.message);
    res.status(500).json({ error: "Failed to fetch player list" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));