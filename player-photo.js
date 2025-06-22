module.exports = async (req, res) => {
  const { name } = req.query;

  if (!name) return res.status(400).json({ error: 'Missing player name' });

  const tryFetch = async (queryName) => {
    const apiRes = await fetch(
      `https://v3.football.api-sports.io/players?search=${encodeURIComponent(queryName)}&league=39&season=2023`,
      {
        headers: {
          'x-apisports-key': 'ac73f34a4e2b591d2c12ad067e4a157a'
        }
      }
    );
    const data = await apiRes.json();
    return data.response?.[0]?.player?.photo || null;
  };

  try {
    let photo = await tryFetch(name);

    // If full name fails, try last word (usually surname)
    if (!photo && name.includes(' ')) {
      const lastName = name.split(' ').slice(-1)[0];
      photo = await tryFetch(lastName);
    }

    if (photo) {
      return res.status(200).json({ photo });
    } else {
      return res.status(404).json({ error: 'Player not found in API' });
    }
  } catch (err) {
    console.error('[player-photo.js] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
