export type Band =
  | 'Complete Failure'
  | 'Failure with a Plus'
  | 'Success with a Twist'
  | 'Success'
  | 'Complete Success';

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function bandFor(total: number): Band {
  if (total <= 2) return 'Complete Failure';
  if (total <= 5) return 'Failure with a Plus';
  if (total <= 8) return 'Success with a Twist';
  if (total <= 11) return 'Success';
  return 'Complete Success'; // 12+
}

export function resolveD12(mod: number) {
  // CONFIRM: bands read off die+modifier total; if rulebook says apply bands to raw d12 before
  // adding skill, change bandFor(total) to bandFor(die) — that is the only change needed.
  const die = rollDie(12);
  const total = die + mod;
  return { die, mod, total, band: bandFor(total) };
}

export function resolveDread(dieSpec: string) {
  const sides = parseInt(dieSpec.replace(/^d/i, ''), 10); // 'd8' -> 8
  const die = rollDie(sides);
  return { sides, die, damage: die };
}
