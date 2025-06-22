const fs = require('fs');
const path = require('path');

const rawData = fs.readFileSync(path.resolve(__dirname, '../premier-player-23-24.json'));
const players = JSON.parse(rawData);

function calculateFantasyPoints(player) {
  let points = 0;
  points += (player.Goals || 0) * 5;
  points += (player.Assists || 0) * 3;
  points -= (player.YellowCards || 0);
  points -= (player.RedCards || 0) * 3;
  return points;
}

module.exports = (req, res) => {
  const { name } = req.query;
  if (name) {
    const player = players.find(p => p.Name === name);
    if (player) {
      const points = calculateFantasyPoints(player);
      res.status(200).json({ ...player, fantasyPoints: points });
    } else {
      res.status(404).json({ error: 'Player not found' });
    }
  } else {
    res.status(200).json(players);
  }
};
