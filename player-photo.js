const axios = require('axios');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://footballfantasyfront.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    const response = await axios.get('https://v3.football.api-sports.io/players', {
      headers: {
        'x-apisports-key': 'ac73f34a4e2b591d2c12ad067e4a157a',
      },
      params: {
        search: name,
        league: 39,
        season: 2023,
      },
    });

    const players = response.data.response;

    // Normalize the query for fuzzy match
    const lowerName = name.trim().toLowerCase();

    const matched = players.find(p => {
      const full = `${p.player.firstname} ${p.player.lastname}`.toLowerCase();
      return full === lowerName || full.includes(lowerName) || lowerName.includes(full);
    });

    if (matched && matched.player.photo) {
      return res.status(200).json({ photo: matched.player.photo });
    }

    // Log to debug API name mismatch
    console.log('API names returned:', players.map(p => `${p.player.firstname} ${p.player.lastname}`));

    return res.status(404).json({
      error: 'Player not found in API',
      fallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
    });
  } catch (err) {
    console.error('API error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
