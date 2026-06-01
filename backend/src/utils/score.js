export function oversText(validBalls) {
  return `${Math.floor(validBalls / 6)}.${validBalls % 6}`;
}

export function runRate(runs, validBalls) {
  if (!validBalls) return '0.00';
  return ((runs / validBalls) * 6).toFixed(2);
}

export function requiredRate(target, currentRuns, ballsLeft) {
  if (ballsLeft <= 0) return '0.00';
  return (((target - currentRuns) / ballsLeft) * 6).toFixed(2);
}

export function isLegalBall(extraType) {
  return !(extraType === 'wide' || extraType === 'no_ball');
}
