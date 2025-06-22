const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Missing player name' });
  }

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/players?search=${encodeURIComponent(name)}&league=39&season=2023`,
      {
        headers: {
          'x-apisports-key': 'ac73f34a4e2b591d2c12ad067e4a157a'
        }
      }
    );

    const data = await response.json();
    const photo = data?.response?.[0]?.player?.photo;

    if (photo) {
      return res.status(200).json({ photo });
    } else {
      return res.status(404).json({ error: 'Photo not found' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error fetching photo' });
  }
};
