// 1986-87 Lakers and Celtics rosters with real attributes
// Speed: 1-10 scale, Height in inches, Skills rated 1-10

import { LAKERS_BENCH, CELTICS_BENCH, ROCKETS_BENCH, PISTONS_BENCH, HAWKS_BENCH, DALLAS_BENCH } from './benchData';
export { LAKERS_BENCH, CELTICS_BENCH, ROCKETS_BENCH, PISTONS_BENCH, HAWKS_BENCH, DALLAS_BENCH };

export const LAKERS_ROSTER = [
  {
    name: "Magic Johnson",
    number: 32,
    position: "PG",
    height: 81, // 6'9"
    speed: 8,
    driveTendency: 9, // elite rim-attacking guard, 6.0 FTA
    dunkTendency: 5, // occasional fast-break dunker
    shooting: 7,
    passing: 10,
    defense: 6,
    rebounding: 7,
    insideScoring: 7,
    threePoint: 5,
    threeAttempts: 0.3,   // 3PA per game (1986-87)
    threePct: 0.200,      // 3P% (1986-87)
    twoAttempts: 17.3,    // 2PA per game (1986-87)
    twoPct: 0.480,        // 2P% (1986-87)
    offensiveRebRate: 0.048,  // OReb% (1986-87)
    defensiveRebRate: 0.165,  // DReb% (1986-87)
    stealRate: 0.029,         // STL% (1986-87)
    turnoverRate: 0.140,     // TOV% (1986-87)
    ftAttempts: 7.9,          // FTA per game (1986-87)
    ftPct: 0.840,            // FT% (1986-87)
    blockRate: 0.012,        // BLK% (1986-87)
  },
  {
    name: "Byron Scott",
    number: 4,
    position: "SG",
    height: 75, // 6'3"
    speed: 8,
    driveTendency: 5, // more of a shooter than slasher
    dunkTendency: 3, // rare dunker, mostly shoots
    shooting: 8,
    passing: 5,
    defense: 6,
    rebounding: 4,
    insideScoring: 6,
    threePoint: 7,
    threeAttempts: 2.2,
    threePct: 0.374,
    twoAttempts: 12.7,
    twoPct: 0.488,
    offensiveRebRate: 0.029,
    defensiveRebRate: 0.075,
    stealRate: 0.022,
    turnoverRate: 0.100,
    ftAttempts: 2.6,
    ftPct: 0.833,
    blockRate: 0.005,
  },
  {
    name: "James Worthy",
    number: 42,
    position: "SF",
    height: 81, // 6'9"
    speed: 9,
    driveTendency: 10, // one of the greatest slashers in NBA history
    dunkTendency: 9, // spectacular Showtime dunker
    shooting: 7,
    passing: 5,
    defense: 6,
    rebounding: 6,
    insideScoring: 9,
    threePoint: 3,
    threeAttempts: 0.1,
    threePct: 0.125,
    twoAttempts: 16.3,
    twoPct: 0.509,
    offensiveRebRate: 0.057,
    defensiveRebRate: 0.108,
    stealRate: 0.020,
    turnoverRate: 0.115,
    ftAttempts: 6.1,
    ftPct: 0.749,
    blockRate: 0.018,
  },
  {
    name: "A.C. Green",
    number: 45,
    position: "PF",
    height: 81, // 6'9"
    speed: 7,
    driveTendency: 4, // rebounder/garbage scorer, not a driver
    dunkTendency: 5, // athletic, put-back dunks
    shooting: 5,
    passing: 3,
    defense: 7,
    rebounding: 9,
    insideScoring: 6,
    threePoint: 2,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 7.9,
    twoPct: 0.519,
    offensiveRebRate: 0.071,
    defensiveRebRate: 0.132,
    stealRate: 0.015,
    turnoverRate: 0.100,
    ftAttempts: 3.2,
    ftPct: 0.662,
    blockRate: 0.015,
  },
  {
    name: "Kareem Abdul-Jabbar",
    number: 33,
    position: "C",
    height: 86, // 7'2"
    speed: 5,
    driveTendency: 2, // post player, scores with the skyhook
    dunkTendency: 1, // almost never dunked by '86-87
    shooting: 8,
    passing: 4,
    defense: 7,
    rebounding: 8,
    insideScoring: 10,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 14.6,
    twoPct: 0.473,
    offensiveRebRate: 0.050,
    defensiveRebRate: 0.120,
    stealRate: 0.012,
    turnoverRate: 0.090,
    ftAttempts: 3.5,
    ftPct: 0.737,
    blockRate: 0.035,
  },
];

export const CELTICS_ROSTER = [
  {
    name: "Dennis Johnson",
    number: 3,
    position: "PG",
    height: 76, // 6'4"
    speed: 7,
    driveTendency: 4, // mid-range/defensive guard
    dunkTendency: 2, // not known as a dunker
    shooting: 6,
    passing: 8,
    defense: 9,
    rebounding: 4,
    insideScoring: 6,
    threePoint: 4,
    threeAttempts: 0.5,
    threePct: 0.313,
    twoAttempts: 10.6,
    twoPct: 0.462,
    offensiveRebRate: 0.023,
    defensiveRebRate: 0.084,
    stealRate: 0.025,
    turnoverRate: 0.120,
    ftAttempts: 2.4,
    ftPct: 0.811,
    blockRate: 0.008,
  },
  {
    name: "Danny Ainge",
    number: 44,
    position: "SG",
    height: 77, // 6'5"
    speed: 7,
    driveTendency: 3, // primarily a shooter, 2.3 FTA
    dunkTendency: 1, // almost never dunked
    shooting: 8,
    passing: 6,
    defense: 5,
    rebounding: 4,
    insideScoring: 5,
    threePoint: 8,
    threeAttempts: 3.1,
    threePct: 0.411,
    twoAttempts: 6.7,
    twoPct: 0.418,
    offensiveRebRate: 0.020,
    defensiveRebRate: 0.076,
    stealRate: 0.023,
    turnoverRate: 0.110,
    ftAttempts: 2.3,
    ftPct: 0.893,
    blockRate: 0.003,
  },
  {
    name: "Larry Bird",
    number: 33,
    position: "SF",
    height: 81, // 6'9"
    speed: 6,
    driveTendency: 6, // crafty driver, 5.0 FTA
    dunkTendency: 2, // famously preferred layups over dunks
    shooting: 10,
    passing: 9,
    defense: 7,
    rebounding: 9,
    insideScoring: 8,
    threePoint: 9,
    threeAttempts: 1.9,
    threePct: 0.400,
    twoAttempts: 18.4,
    twoPct: 0.489,
    offensiveRebRate: 0.070,
    defensiveRebRate: 0.205,
    stealRate: 0.020,
    turnoverRate: 0.110,
    ftAttempts: 6.1,
    ftPct: 0.910,
    blockRate: 0.009,
  },
  {
    name: "Kevin McHale",
    number: 32,
    position: "PF",
    height: 82, // 6'10"
    speed: 5,
    driveTendency: 2, // post player with inside moves
    dunkTendency: 3, // some dunks but preferred post moves
    shooting: 7,
    passing: 4,
    defense: 8,
    rebounding: 8,
    insideScoring: 10,
    threePoint: 2,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 17.0,
    twoPct: 0.506,
    offensiveRebRate: 0.060,
    defensiveRebRate: 0.150,
    stealRate: 0.013,
    turnoverRate: 0.090,
    ftAttempts: 6.2,
    ftPct: 0.830,
    blockRate: 0.040,
  },
  {
    name: "Robert Parish",
    number: 0,
    position: "C",
    height: 84, // 7'0"
    speed: 6,
    driveTendency: 2, // post player, not a perimeter driver
    dunkTendency: 6, // athletic 7-footer, regular dunker
    shooting: 7,
    passing: 3,
    defense: 8,
    rebounding: 9,
    insideScoring: 8,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 13.5,
    twoPct: 0.511,
    offensiveRebRate: 0.090,
    defensiveRebRate: 0.205,
    stealRate: 0.015,
    turnoverRate: 0.090,
    ftAttempts: 3.5,
    ftPct: 0.726,
    blockRate: 0.038,
  },
];

// 1986-87 Houston Rockets (full-strength exhibition roster)
export const ROCKETS_ROSTER = [
  {
    name: "Dirk Minniefield",
    number: 10,
    position: "PG",
    height: 73, // 6'1"
    speed: 8,
    driveTendency: 6, // drive-to-pass point guard, organizes Twin Towers
    dunkTendency: 1, // too short to dunk
    shooting: 6,
    passing: 9,
    defense: 6,
    rebounding: 3,
    insideScoring: 4,
    threePoint: 5,
    threeAttempts: 0.8,
    threePct: 0.300,
    twoAttempts: 6.2,
    twoPct: 0.442,
    offensiveRebRate: 0.015,
    defensiveRebRate: 0.060,
    stealRate: 0.024,
    turnoverRate: 0.140,
    ftAttempts: 1.5,
    ftPct: 0.709,
    blockRate: 0.003,
  },
  {
    name: "Robert Reid",
    number: 33,
    position: "SG",
    height: 80, // 6'8"
    speed: 7,
    driveTendency: 5, // veteran secondary handler, midrange shooter
    dunkTendency: 4, // occasional dunker
    shooting: 8,
    passing: 8,
    defense: 7,
    rebounding: 5,
    insideScoring: 7,
    threePoint: 7, // period-appropriate open threes, occasional weapon
    threeAttempts: 1.0,
    threePct: 0.320,
    twoAttempts: 11.5,
    twoPct: 0.460,
    offensiveRebRate: 0.030,
    defensiveRebRate: 0.100,
    stealRate: 0.018,
    turnoverRate: 0.100,
    ftAttempts: 2.0,
    ftPct: 0.768,
    blockRate: 0.006,
  },
  {
    name: "Rodney McCray",
    number: 22,
    position: "SF",
    height: 79, // 6'7"
    speed: 8,
    driveTendency: 7, // point-forward, drives when lanes overplay
    dunkTendency: 5, // athletic finisher
    shooting: 6,
    passing: 9,
    defense: 9, // All-Defensive Second Team
    rebounding: 8,
    insideScoring: 7,
    threePoint: 3,
    threeAttempts: 0.2,
    threePct: 0.250,
    twoAttempts: 9.3,
    twoPct: 0.474,
    offensiveRebRate: 0.060,
    defensiveRebRate: 0.170,
    stealRate: 0.024,
    turnoverRate: 0.130,
    ftAttempts: 5.0,
    ftPct: 0.779,
    blockRate: 0.012,
  },
  {
    name: "Ralph Sampson",
    number: 50,
    position: "PF",
    height: 88, // 7'4"
    speed: 6, // unusually mobile for his size
    driveTendency: 5, // face-up attacker from the high post
    dunkTendency: 6, // lob threat and rim finisher
    shooting: 8,
    passing: 6,
    defense: 8,
    rebounding: 9,
    insideScoring: 9,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 13.5,
    twoPct: 0.486,
    offensiveRebRate: 0.085,
    defensiveRebRate: 0.220,
    stealRate: 0.013,
    turnoverRate: 0.140,
    ftAttempts: 5.0,
    ftPct: 0.624,
    blockRate: 0.025,
  },
  {
    name: "Akeem Olajuwon",
    number: 34,
    position: "C",
    height: 84, // 7'0"
    speed: 7, // remarkably agile for a center
    driveTendency: 7, // face-up and post attacker
    dunkTendency: 9, // powerful rim finisher
    shooting: 8, // excellent mid-range touch for a big
    passing: 5,
    defense: 9, // All-Defensive First Team
    rebounding: 10,
    insideScoring: 10,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 18.0,
    twoPct: 0.523,
    offensiveRebRate: 0.120,
    defensiveRebRate: 0.255,
    stealRate: 0.029,
    turnoverRate: 0.125,
    ftAttempts: 8.0,
    ftPct: 0.702,
    blockRate: 0.045,
  },
];

// 1986-87 Detroit Pistons (Bad Boys era — forming identity)
export const PISTONS_ROSTER = [
  {
    name: "Isiah Thomas",
    number: 11,
    position: "PG",
    height: 72, // 6'0"
    speed: 9, // elite quickness
    driveTendency: 9, // relentless rim-attacking guard
    dunkTendency: 2, // rare dunker
    shooting: 8,
    passing: 10,
    defense: 7,
    rebounding: 4,
    insideScoring: 9,
    threePoint: 3,
    threeAttempts: 0.9,
    threePct: 0.275,
    twoAttempts: 16.1,
    twoPct: 0.488,
    offensiveRebRate: 0.030,
    defensiveRebRate: 0.075,
    stealRate: 0.030,
    turnoverRate: 0.150,
    ftAttempts: 5.5,
    ftPct: 0.768,
    blockRate: 0.006,
  },
  {
    name: "Joe Dumars",
    number: 4,
    position: "SG",
    height: 75, // 6'3"
    speed: 7,
    driveTendency: 6, // efficient secondary guard
    dunkTendency: 2,
    shooting: 8,
    passing: 9,
    defense: 9, // elite perimeter defender
    rebounding: 4,
    insideScoring: 8,
    threePoint: 5,
    threeAttempts: 0.6,
    threePct: 0.300,
    twoAttempts: 8.9,
    twoPct: 0.485,
    offensiveRebRate: 0.020,
    defensiveRebRate: 0.060,
    stealRate: 0.024,
    turnoverRate: 0.110,
    ftAttempts: 2.5,
    ftPct: 0.748,
    blockRate: 0.005,
  },
  {
    name: "Adrian Dantley",
    number: 45,
    position: "SF",
    height: 77, // 6'5"
    speed: 6, // not fast, crafty
    driveTendency: 8, // draws contact constantly
    dunkTendency: 1, // rarely dunked
    shooting: 9,
    passing: 7,
    defense: 6, // more scorer than stopper
    rebounding: 5,
    insideScoring: 10, // elite post scorer, foul-drawing machine
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 15.5,
    twoPct: 0.543,
    offensiveRebRate: 0.055,
    defensiveRebRate: 0.090,
    stealRate: 0.018,
    turnoverRate: 0.110,
    ftAttempts: 8.0, // elite foul drawer
    ftPct: 0.812,
    blockRate: 0.005,
  },
  {
    name: "Sidney Green",
    number: 32,
    position: "PF",
    height: 81, // 6'9"
    speed: 6,
    driveTendency: 4, // rebounder/finisher, not a driver
    dunkTendency: 3,
    shooting: 6,
    passing: 3,
    defense: 7,
    rebounding: 9,
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 7.0,
    twoPct: 0.496,
    offensiveRebRate: 0.075,
    defensiveRebRate: 0.150,
    stealRate: 0.015,
    turnoverRate: 0.130,
    ftAttempts: 1.5,
    ftPct: 0.672,
    blockRate: 0.018,
  },
  {
    name: "Bill Laimbeer",
    number: 40,
    position: "C",
    height: 83, // 6'11"
    speed: 5,
    driveTendency: 3, // face-up/set shooter, not a driver
    dunkTendency: 2,
    shooting: 9, // elite set jumper for a center
    passing: 5,
    defense: 7,
    rebounding: 10, // elite rebounder
    insideScoring: 8,
    threePoint: 5, // rare top-of-key three
    threeAttempts: 0.5,
    threePct: 0.348,
    twoAttempts: 11.0,
    twoPct: 0.462,
    offensiveRebRate: 0.080,
    defensiveRebRate: 0.205,
    stealRate: 0.016,
    turnoverRate: 0.090,
    ftAttempts: 2.5,
    ftPct: 0.894, // excellent FT shooter for a center
    blockRate: 0.035,
  },
];

// 1986-87 Atlanta Hawks (Dominique Wilkins — Human Highlight Film era)
export const ATLANTA_HAWKS_ROSTER = [
  {
    name: "Doc Rivers",
    number: 31,
    position: "PG",
    height: 76, // 6'4"
    speed: 8,
    driveTendency: 7, // drive-and-dish general, 3.5 FTA
    dunkTendency: 2,
    shooting: 7,
    passing: 9,
    defense: 8,
    rebounding: 4,
    insideScoring: 6,
    threePoint: 3,
    threeAttempts: 0.8,
    threePct: 0.267,
    twoAttempts: 8.9,
    twoPct: 0.479,
    offensiveRebRate: 0.020,
    defensiveRebRate: 0.085,
    stealRate: 0.028,
    turnoverRate: 0.140,
    ftAttempts: 3.5,
    ftPct: 0.828,
    blockRate: 0.005,
  },
  {
    name: "Randy Wittman",
    number: 4,
    position: "SG",
    height: 77, // 6'5"
    speed: 7,
    driveTendency: 4, // catch-and-shoot guard, low FTA
    dunkTendency: 2,
    shooting: 8,
    passing: 6,
    defense: 6,
    rebounding: 3,
    insideScoring: 5,
    threePoint: 5,
    threeAttempts: 0.4,
    threePct: 0.333,
    twoAttempts: 9.2,
    twoPct: 0.496,
    offensiveRebRate: 0.015,
    defensiveRebRate: 0.060,
    stealRate: 0.020,
    turnoverRate: 0.110,
    ftAttempts: 1.9,
    ftPct: 0.787,
    blockRate: 0.003,
  },
  {
    name: "Dominique Wilkins",
    number: 21,
    position: "SF",
    height: 80, // 6'8"
    speed: 9, // explosive first step
    driveTendency: 10, // elite wing attacker, 8.3 FTA
    dunkTendency: 10, // Human Highlight Film — spectacular dunker
    shooting: 8,
    passing: 7,
    defense: 7, // athletic but not a lockdown stopper
    rebounding: 7,
    insideScoring: 10,
    threePoint: 3,
    threeAttempts: 0.7,
    threePct: 0.318,
    twoAttempts: 22.2,
    twoPct: 0.488,
    offensiveRebRate: 0.060,
    defensiveRebRate: 0.140,
    stealRate: 0.027,
    turnoverRate: 0.120,
    ftAttempts: 8.3,
    ftPct: 0.818,
    blockRate: 0.012,
  },
  {
    name: "Kevin Willis",
    number: 41,
    position: "PF",
    height: 83, // 6'11"
    speed: 7, // mobile for his size
    driveTendency: 5, // face-up and post scorer
    dunkTendency: 6, // athletic finisher
    shooting: 7,
    passing: 3,
    defense: 8,
    rebounding: 10, // Glass Muscle — elite rebounder
    insideScoring: 8,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 12.3,
    twoPct: 0.511,
    offensiveRebRate: 0.085,
    defensiveRebRate: 0.220,
    stealRate: 0.014,
    turnoverRate: 0.110,
    ftAttempts: 4.9,
    ftPct: 0.709,
    blockRate: 0.020,
  },
  {
    name: "Tree Rollins",
    number: 25,
    position: "C",
    height: 85, // 7'1"
    speed: 5,
    driveTendency: 2, // low-usage rim protector
    dunkTendency: 4, // standing dunks, putbacks
    shooting: 4,
    passing: 2,
    defense: 9, // elite shot blocker
    rebounding: 8,
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 4.3,
    twoPct: 0.520,
    offensiveRebRate: 0.060,
    defensiveRebRate: 0.180,
    stealRate: 0.010,
    turnoverRate: 0.090,
    ftAttempts: 1.9,
    ftPct: 0.724,
    blockRate: 0.045, // Tree at the Rim — nearly 2 BPG
  },
];

// 1986-87 Dallas Mavericks (deep, balanced, high-scoring Western contender —
// 55-27, No. 2 offense in the NBA by offensive rating, 100.5 pace)
export const DALLAS_ROSTER = [
  {
    name: "Derek Harper",
    number: 12,
    position: "PG",
    height: 76, // 6'4"
    speed: 8,
    driveTendency: 7, // two-way guard, attacks off PnR
    dunkTendency: 2,
    shooting: 7,
    passing: 9,
    defense: 8, // best Dallas perimeter defender
    rebounding: 4,
    insideScoring: 6,
    threePoint: 6,
    threeAttempts: 2.7,
    threePct: 0.333,
    twoAttempts: 9.7,
    twoPct: 0.470,
    offensiveRebRate: 0.015,
    defensiveRebRate: 0.050,
    stealRate: 0.030,
    turnoverRate: 0.130,
    ftAttempts: 4.2,
    ftPct: 0.684,
    blockRate: 0.005,
  },
  {
    name: "Rolando Blackman",
    number: 22,
    position: "SG",
    height: 78, // 6'6"
    speed: 7,
    driveTendency: 6, // smooth midrange scorer
    dunkTendency: 2,
    shooting: 9,
    passing: 6,
    defense: 6,
    rebounding: 4,
    insideScoring: 7,
    threePoint: 3,
    threeAttempts: 0.3,
    threePct: 0.330,
    twoAttempts: 16.0,
    twoPct: 0.515, // elite efficiency
    offensiveRebRate: 0.025,
    defensiveRebRate: 0.060,
    stealRate: 0.018,
    turnoverRate: 0.090,
    ftAttempts: 4.0,
    ftPct: 0.884,
    blockRate: 0.003,
  },
  {
    name: "Mark Aguirre",
    number: 24,
    position: "SF",
    height: 78, // 6'6"
    speed: 7,
    driveTendency: 8, // power wing bully, scores through contact
    dunkTendency: 3,
    shooting: 9,
    passing: 7,
    defense: 6, // offense-first but physical
    rebounding: 5,
    insideScoring: 9, // elite post/mid-post scorer
    threePoint: 4,
    threeAttempts: 0.8,
    threePct: 0.300,
    twoAttempts: 18.5,
    twoPct: 0.476,
    offensiveRebRate: 0.055,
    defensiveRebRate: 0.090,
    stealRate: 0.020,
    turnoverRate: 0.100,
    ftAttempts: 7.5, // elite foul drawer
    ftPct: 0.770,
    blockRate: 0.005,
  },
  {
    name: "Sam Perkins",
    number: 41,
    position: "PF",
    height: 81, // 6'9"
    speed: 6,
    driveTendency: 4, // face-up lefty big
    dunkTendency: 4,
    shooting: 8,
    passing: 4,
    defense: 7,
    rebounding: 8,
    insideScoring: 7,
    threePoint: 4, // occasional stretch element
    threeAttempts: 0.6,
    threePct: 0.330,
    twoAttempts: 12.1,
    twoPct: 0.480,
    offensiveRebRate: 0.075,
    defensiveRebRate: 0.170,
    stealRate: 0.015,
    turnoverRate: 0.110,
    ftAttempts: 2.9,
    ftPct: 0.828,
    blockRate: 0.020,
  },
  {
    name: "James Donaldson",
    number: 43,
    position: "C",
    height: 86, // 7'2"
    speed: 5,
    driveTendency: 2, // screen/rebound/finish center
    dunkTendency: 4,
    shooting: 5,
    passing: 2,
    defense: 7,
    rebounding: 10, // elite glass anchor
    insideScoring: 7,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 7.8,
    twoPct: 0.564, // high-efficiency finisher
    offensiveRebRate: 0.100,
    defensiveRebRate: 0.250,
    stealRate: 0.010,
    turnoverRate: 0.110,
    ftAttempts: 2.5,
    ftPct: 0.812,
    blockRate: 0.030,
  },
];

// Court dimensions (scaled for canvas)
export const COURT = {
  width: 940,   // 94 feet * 10
  height: 500,  // 50 feet * 10
  threePointRadius: 237,
  keyWidth: 160,
  keyHeight: 190,
  ftCircleRadius: 60,
  rimX: 55,     // distance from baseline
  centerX: 470,
  centerCircleRadius: 60,
  basketY: 250, // center of court
};

// Team colors
export const TEAM_COLORS = {
  lakers: {
    primary: "#552583",
    secondary: "#FDB927",
    text: "#FDB927",
    name: "Lakers",
    abbr: "LAL",
  },
  celtics: {
    primary: "#007A33",
    secondary: "#FFFFFF",
    text: "#FFFFFF",
    name: "Celtics",
    abbr: "BOS",
  },
  rockets: {
    primary: "#C8102E",
    secondary: "#FFB81C",
    text: "#FFFFFF",
    name: "Rockets",
    abbr: "HOU",
  },
  pistons: {
    primary: "#C8102E",
    secondary: "#1D42BA",
    text: "#FFFFFF",
    name: "Pistons",
    abbr: "DET",
  },
  hawks: {
    primary: "#E03A3E",
    secondary: "#FDB927",
    text: "#FFFFFF",
    name: "Hawks",
    abbr: "ATL",
  },
  dallas: {
    primary: "#00538C",
    secondary: "#B8C4CA",
    text: "#FFFFFF",
    name: "Mavericks",
    abbr: "DAL",
  },
};

// Team-level fast break tendency (1-10 scale)
// Based on 1986-87 pace, steals, and transition play research:
// - Lakers: Showtime — elite transition team (Pace 101.6, 8.9 SPG, Magic-led)
// - Celtics: deliberate half-court offense (Pace 98.6, 6.8 SPG, K.C. Jones system)
// - Rockets: moderate pace (Pace ~99.9), Twin Towers interior offense,
//   strong offensive rebounding — not a transition-first team
export const TEAM_FAST_BREAK = {
  lakers: 9,
  celtics: 4,
  rockets: 5,
  pistons: 7, // Isiah pushes tempo, but Dantley post-ups slow the half-court
  hawks: 6, // Slower than Lakers, but dangerous in transition with Dominique
  dallas: 6, // High-scoring but half-court-oriented; Harper pushes tempo selectively
};

// Central team registry — the single source of truth for the team selection page.
// To add a new team: define its roster + bench, add colors to TEAM_COLORS,
// add fast-break tendency to TEAM_FAST_BREAK, then add an entry here.
export const TEAMS = {
  lakers: {
    colors: TEAM_COLORS.lakers,
    fastBreak: TEAM_FAST_BREAK.lakers,
    roster: LAKERS_ROSTER,
    bench: LAKERS_BENCH,
  },
  celtics: {
    colors: TEAM_COLORS.celtics,
    fastBreak: TEAM_FAST_BREAK.celtics,
    roster: CELTICS_ROSTER,
    bench: CELTICS_BENCH,
  },
  rockets: {
    colors: TEAM_COLORS.rockets,
    fastBreak: TEAM_FAST_BREAK.rockets,
    roster: ROCKETS_ROSTER,
    bench: ROCKETS_BENCH,
  },
  pistons: {
    colors: TEAM_COLORS.pistons,
    fastBreak: TEAM_FAST_BREAK.pistons,
    roster: PISTONS_ROSTER,
    bench: PISTONS_BENCH,
  },
  hawks: {
    colors: TEAM_COLORS.hawks,
    fastBreak: TEAM_FAST_BREAK.hawks,
    roster: ATLANTA_HAWKS_ROSTER,
    bench: HAWKS_BENCH,
  },
  dallas: {
    colors: TEAM_COLORS.dallas,
    fastBreak: TEAM_FAST_BREAK.dallas,
    roster: DALLAS_ROSTER,
    bench: DALLAS_BENCH,
  },
};

// Minutes per game (1986-87 regular season) — drives fatigue & stamina
export const PLAYER_MPG = {
  // Lakers
  'Magic Johnson': 36.3, 'Byron Scott': 33.3, 'James Worthy': 34.4,
  'A.C. Green': 28.4, 'Kareem Abdul-Jabbar': 31.3,
  'Michael Cooper': 27.5, 'Mychal Thompson': 20.6, 'Kurt Rambis': 19.4,
  'Billy Thompson': 12.9, 'Wes Matthews': 10.6,
  // Celtics
  'Dennis Johnson': 37.1, 'Danny Ainge': 35.2, 'Larry Bird': 40.6,
  'Kevin McHale': 39.7, 'Robert Parish': 37.4,
  'Jerry Sichting': 20.1, 'Bill Walton': 11.2, 'Fred Roberts': 14.8,
  'Darren Daye': 11.9, 'Greg Kite': 10.1,
  // Rockets (full-strength 10-man rotation targets)
  'Akeem Olajuwon': 36, 'Ralph Sampson': 31, 'Rodney McCray': 36,
  'Robert Reid': 31, 'Dirk Minniefield': 24, 'Jim Petersen': 22,
  'Allen Leavell': 20, 'Lewis Lloyd': 16, 'Mitchell Wiggins': 16,
  'Buck Johnson': 8,
  // Pistons
  'Isiah Thomas': 37, 'Joe Dumars': 31, 'Adrian Dantley': 34,
  'Sidney Green': 22, 'Bill Laimbeer': 35,
  'Vinnie Johnson': 28, 'Rick Mahorn': 20, 'Dennis Rodman': 15,
  'John Salley': 18, 'Tony Campbell': 8,
  // Hawks
  'Dominique Wilkins': 38, 'Doc Rivers': 33, 'Kevin Willis': 34,
  'Randy Wittman': 30, 'Tree Rollins': 24,
  'Spud Webb': 14, 'Mike McGee': 18, 'Cliff Levingston': 20,
  'Antoine Carr': 12, 'Jon Koncak': 17,
  // Mavericks
  'Mark Aguirre': 36, 'Rolando Blackman': 35, 'Derek Harper': 34,
  'Sam Perkins': 34, 'James Donaldson': 35,
  'Detlef Schrempf': 20, 'Brad Davis': 17, 'Roy Tarpley': 18,
  'Bill Wennington': 8, 'Al Wood': 8,
};

// Franchise stars — tolerate more fatigue, stay on the floor longer
export const STAR_PLAYERS = new Set([
  'Magic Johnson', 'Kareem Abdul-Jabbar', 'James Worthy',
  'Larry Bird', 'Kevin McHale', 'Robert Parish',
  'Akeem Olajuwon', 'Ralph Sampson', 'Rodney McCray',
  'Isiah Thomas', 'Adrian Dantley', 'Bill Laimbeer',
  'Dominique Wilkins', 'Doc Rivers', 'Kevin Willis',
  'Mark Aguirre', 'Rolando Blackman', 'Derek Harper', 'Sam Perkins',
]);