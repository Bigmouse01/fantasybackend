const fs = require('fs');
const path = require('path');

const rawData = fs.readFileSync(path.resolve(__dirname, './premier-player-23-24.json'));
const players = JSON.parse(rawData);

function calculateFantasyPoints(player) {
  let points = 0;
  const position = player.Pos?.toUpperCase();

  const goals = player.Gls || 0;
  const assists = player.Ast || 0;
  const yellowCards = player.CrdY || 0;
  const redCards = player.CrdR || 0;

  // Basic fantasy rules (based on common platforms like FPL)
  switch (position) {
    case 'GK':
    case 'DF':
      points += goals * 6;
      points += assists * 3;
      break;
    case 'MF':
      points += goals * 5;
      points += assists * 3;
      break;
    case 'FW':
      points += goals * 4;
      points += assists * 3;
      break;
    default:
      points += goals * 4;
      points += assists * 3;
  }

  // Apply card deductions
  points -= yellowCards * 1;
  points -= redCards * 3;

  // Optionally: Add more factors (e.g., clean sheets, saves for GK, etc.)
  return points;
}

module.exports = (req, res) => {
  const { name } = req.query;
  if (name) {
    const player = players.find(p => p.Player === name);
    if (player) {
      const points = calculateFantasyPoints(player);
      res.status(200).json({ ...player, fantasyPoints: points });
    } else {
      res.status(404).json({ error: 'Player not found' });
    }
  } else {
    // return all players sorted by fantasy points descending
    const withPoints = players.map(p => ({
      ...p,
      fantasyPoints: calculateFantasyPoints(p)
    })).sort((a, b) => b.fantasyPoints - a.fantasyPoints);
    res.status(200).json(withPoints);
  }
};