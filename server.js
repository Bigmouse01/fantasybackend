const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = 3001;

const API_KEY = "6748b5a727b789718caac2a7c23aad5f"; // Replace with your real API key
const BASE_URL = "https://v3.football.api-sports.io";

const eliteDefenders = ["William Saliba", "Virgil van Dijk", "Trent Alexander-Arnold"];

function calculateFantasyPoints(player, stats) {
  if (!stats) return 0;

  const cleanSheets = stats.clean_sheet || 0;
  const tackles = stats.tackles.total || 0;
  const interceptions = stats.interceptions || 0;
  const blocks = stats.blocks || 0;
  const clearances = stats.clearances || 0;
  const goals = stats.goals.total || 0;
  const assists = stats.goals.assists || 0;
  const yellowCards = stats.cards.yellow || 0;
  const redCards = stats.cards.red || 0;
  const minutes = stats.games.minutes || 0;

  let fantasyPoints =
    cleanSheets * 1 +
    Math.floor(tackles / 10) * 1 +
    Math.floor(interceptions / 10) * 1 +
    Math.floor(blocks / 10) * 1 +
    Math.floor(clearances / 10) * 1 +
    goals/minutes * 15 +
    assists * 3 +
    Math.floor(minutes / 60) * 1 -
    yellowCards * 0.1 -
    redCards * 0.3;

  // Position check
  const position = stats.games.position.toLowerCase();
  if (position.includes("defender")) {
    // Apply minimum floor for defenders
    if (fantasyPoints < 50) {
      fantasyPoints = 50 + fantasyPoints * 0.2;
    }
    // Boost elite defenders
    if (eliteDefenders.includes(player.name)) {
      fantasyPoints += 5;
    }
  }
  //const scalingFactor = 0.80; // <-- tweak this number for competitiveness
  //fantasyPoints = Math.round(fantasyPoints * scalingFactor);

  return Math.round(fantasyPoints);
}

app.get("/player-odds", async (req, res) => {
  const playerName = req.query.name;
  if (!playerName) {
    return res.status(400).json({ error: "Player name required" });
  }

  try {
    const searchResponse = await axios.get(`${BASE_URL}/players`, {
      headers: { "x-apisports-key": API_KEY },
      params: {
        search: playerName,
        season: 2023,
        league: 39,
      },
    });

    const player = searchResponse.data.response[0];
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    const stats = player.statistics[0];

    // Calculate fantasy points with new logic
    const fantasyPoints = calculateFantasyPoints(player.player, stats);

    // Calculate odds (example: goals per game)
    const appearances = stats.games.appearences || stats.games.appearances || 1;
    const goals = stats.goals.total || 0;
    const odds = appearances > 0 ? (goals / appearances).toFixed(2) : "0.00";

    res.json({
      name: player.player.name,
      team: stats.team.name,
      photo: player.player.photo,
      position: stats.games.position,
      fantasyPoints,
      odds,
    });
  } catch (err) {
    console.error("Backend error:", err.message);
    res.status(500).json({ error: "Failed to fetch player data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

