module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://footballfantasyfront.netlify.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: "Name query param required" });
  }

  try {
    const apiKey = "ac73f34a4e2b591d2c12ad067e4a157a";
    const response = await fetch(
      `https://v3.football.api-sports.io/players?search=${encodeURIComponent(name)}&league=39&season=2023`,
      {
        headers: {
          "x-apisports-key": apiKey,
        },
      }
    );

    const data = await response.json();
    const player = data.response?.[0]?.player;

    if (!player || !player.photo) {
      return res.status(404).json({ error: "Player not found in API" });
    }

    return res.status(200).json({ photo: player.photo });
  } catch (err) {
    console.error("API Fetch Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
