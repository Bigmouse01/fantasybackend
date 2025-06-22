const axios = require('axios');
const stringSimilarity = require('string-similarity');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://footballfantasyfront.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // 1. Fetch all players from Premier League (league: 39, season: 2023)
    const response = await axios.get('https://v3.football.api-sports.io/players', {
      headers: {
        'x-apisports-key': 'ac73f34a4e2b591d2c12ad067e4a157a'
      },
      params: {
        league: 39,
        season: 2023
      }
    });

    const allPlayers = response.data.response;

    // 2. Build name map and use fuzzy match
    const nameList = allPlayers.map(p => `${p.player.firstname} ${p.player.lastname}`);
    const match = stringSimilarity.findBestMatch(name, nameList);

    const best = match.bestMatch;
    if (best.rating < 0.5) {
      return res.status(404).json({ error: 'Player not found in API' });
    }

    const matchedPlayer = allPlayers.find(p =>
      `${p.player.firstname} ${p.player.lastname}` === best.target
    );

    if (!matchedPlayer) {
      return res.status(404).json({ error: 'Matched player not found in dataset' });
    }

    return res.status(200).json({
      photo: matchedPlayer.player.photo,
      name: matchedPlayer.player.name,
      team: matchedPlayer.statistics[0]?.team?.name || 'Unknown'
    });
  } catch (err) {
    console.error('API fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch from football API' });
  }
};
