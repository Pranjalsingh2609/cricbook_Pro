function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateLeagueFixtures(teamIds, random = true) {
  const teams = random ? shuffle(teamIds) : [...teamIds];
  const fixtures = [];
  let matchNo = 1;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        teamA: teams[i],
        teamB: teams[j],
        roundName: 'League',
        matchNo: matchNo++
      });
    }
  }
  return random ? shuffle(fixtures).map((f, i) => ({ ...f, matchNo: i + 1 })) : fixtures;
}

export function generateKnockoutFixtures(teamIds, random = true) {
  const teams = random ? shuffle(teamIds) : [...teamIds];
  const fixtures = [];
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) {
      fixtures.push({
        teamA: teams[i],
        teamB: teams[i + 1],
        roundName: teams.length <= 4 ? 'Semi Final' : 'Quarter Final',
        matchNo: fixtures.length + 1
      });
    }
  }
  return fixtures;
}
