const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: "https://footballfantasyfront.netlify.app",
}));

const PORT = 3001;

const API_KEY = "6748b5a727b789718caac2a7c23aad5f";
const BASE_URL = "https://v3.football.api-sports.io";

const eliteDefenders = ["William Saliba", "Virgil van Dijk", "Trent Alexander-Arnold"];

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
      const cleanSheet = match.games.position.toLowerCase() !== "forward" ? (match.games.position.toLowerCase() === "goalkeeper" ? 0 : match.clean_sheet ? 1 : 0) : 0;

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

    // Boost elite defenders
    if (position === "defender" && eliteDefenders.includes(player.name)) {
      totalPoints += 5;
    }

    return Math.round(totalPoints);
  } catch (err) {
    console.error("Fantasy point calculation error:", err.message);
    return 0;
  }
}

app.get("/api/player-odds", async (req, res) => {
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
    const position = stats.games.position.toLowerCase();
    const playerId = player.player.id;

    const fantasyPoints = await calculateFantasyPoints(player.player, playerId, position);

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
