module.exports = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Missing player name' });
    }

    const apiRes = await fetch(
      `https://v3.football.api-sports.io/players?search=${encodeURIComponent(name)}&league=39&season=2023`,
      {
        headers: {
          'x-apisports-key': 'ac73f34a4e2b591d2c12ad067e4a157a'
        }
      }
    );

    const data = await apiRes.json();

    if (!data || !data.response || data.response.length === 0) {
      return res.status(404).json({ error: 'Player not found in API' });
    }

    const player = data.response[0].player;
    return res.status(200).json({ photo: player.photo });
  } catch (err) {
    console.error('[player-photo.js] Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
