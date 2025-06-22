const axios = require('axios');

module.exports = async (req, res) => {
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
        'x-apisports-key': 'ac73f34a4e2b591d2c12ad067e4a157a'
      },
      params: {
        search: name,
      },
    });

    const players = response.data.response;
    const lowerName = name.toLowerCase();
    const nameParts = name.toLowerCase().split(' ');

    // Try full name match
    let matched = players.find(p => {
      const full = `${p.player.firstname} ${p.player.lastname}`.toLowerCase();
      return full === lowerName;
    });

    // Try partial name match
    if (!matched) {
      matched = players.find(p => {
        const full = `${p.player.firstname} ${p.player.lastname}`.toLowerCase();
        return nameParts.every(part => full.includes(part));
      });
    }

    if (matched && matched.player.photo) {
      return res.status(200).json({ photo: matched.player.photo });
    }

    return res.status(404).json({
      error: 'Player not found in API',
      fallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`
    });

  } catch (err) {
    console.error('API fetch failed:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
