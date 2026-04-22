import { ELO_K_FACTOR, INITIAL_ELO } from "./config.mjs";

export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

export function updateElo(ratingA, ratingB, scoreA, kFactor = ELO_K_FACTOR) {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  return {
    ratingA: ratingA + kFactor * (scoreA - expectedA),
    ratingB: ratingB + kFactor * ((1 - scoreA) - expectedB)
  };
}

export function initialRatings(agents, initialRating = INITIAL_ELO) {
  return Object.fromEntries(agents.map(agent => [agent.slug, initialRating]));
}