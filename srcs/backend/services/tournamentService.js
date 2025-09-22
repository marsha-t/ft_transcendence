
export function getParentMatchIndex(matchIndex, bracketSize) {
  const round1Matches = bracketSize / 2;
  return round1Matches + Math.floor((matchIndex - 1) / 2) + 1;
}
