// 1986-87 Lakers and Celtics rosters with real attributes
// Speed: 1-10 scale, Height in inches, Skills rated 1-10

export { LAKERS_BENCH, CELTICS_BENCH, CLIPPERS_BENCH } from './benchData';

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
    ftAttempts: 6.0,          // FTA per game (1986-87)
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
    ftAttempts: 5.0,
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

// 1986-87 Los Angeles Clippers roster — worst team in the NBA (12-70)
export const CLIPPERS_ROSTER = [
  {
    name: "Larry Drew",
    number: 2,
    position: "PG",
    height: 73, // 6'1"
    speed: 7,
    driveTendency: 5, // average slasher
    dunkTendency: 1, // too short to dunk
    shooting: 5,
    passing: 7,
    defense: 4,
    rebounding: 3,
    insideScoring: 5,
    threePoint: 3,
    threeAttempts: 1.2,   // 3PA per game (1986-87)
    threePct: 0.167,     // 3P% (1986-87)
    twoAttempts: 10.2,    // 2PA per game (1986-87)
    twoPct: 0.463,       // 2P% (1986-87)
    offensiveRebRate: 0.015,
    defensiveRebRate: 0.060,
    stealRate: 0.020,
    turnoverRate: 0.150, // turnover-prone
    ftAttempts: 2.5,
    ftPct: 0.800,
    blockRate: 0.002,
  },
  {
    name: "Mike Woodson",
    number: 42,
    position: "SG",
    height: 77, // 6'5"
    speed: 6,
    driveTendency: 4, // jump shooter first
    dunkTendency: 2, // rare dunker
    shooting: 7,
    passing: 4,
    defense: 3, // terrible defensive team (-11.0 SRS)
    rebounding: 3,
    insideScoring: 5,
    threePoint: 5,
    threeAttempts: 1.7,
    threePct: 0.276,
    twoAttempts: 13.6,
    twoPct: 0.457,
    offensiveRebRate: 0.015,
    defensiveRebRate: 0.060,
    stealRate: 0.018,
    turnoverRate: 0.110,
    ftAttempts: 2.75,
    ftPct: 0.800,
    blockRate: 0.003,
  },
  {
    name: "Rory White",
    number: 22,
    position: "SF",
    height: 80, // 6'8"
    speed: 6,
    driveTendency: 3, // role player, spot-up
    dunkTendency: 2,
    shooting: 5,
    passing: 3,
    defense: 4,
    rebounding: 4,
    insideScoring: 5,
    threePoint: 4,
    threeAttempts: 0.8,
    threePct: 0.250,
    twoAttempts: 7.7,
    twoPct: 0.480,
    offensiveRebRate: 0.025,
    defensiveRebRate: 0.060,
    stealRate: 0.015,
    turnoverRate: 0.100,
    ftAttempts: 1.3,
    ftPct: 0.770,
    blockRate: 0.005,
  },
  {
    name: "Michael Cage",
    number: 44,
    position: "PF",
    height: 81, // 6'9"
    speed: 7,
    driveTendency: 3, // inside player
    dunkTendency: 6, // athletic, put-back dunks
    shooting: 5,
    passing: 3,
    defense: 5,
    rebounding: 9, // 11.5 RPG — elite rebounder
    insideScoring: 7, // .521 FG% — efficient inside
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 12.1,
    twoPct: 0.521,
    offensiveRebRate: 0.090,
    defensiveRebRate: 0.200,
    stealRate: 0.012,
    turnoverRate: 0.100,
    ftAttempts: 4.5,
    ftPct: 0.690, // poor FT shooter
    blockRate: 0.015,
  },
  {
    name: "Benoit Benjamin",
    number: 0,
    position: "C",
    height: 84, // 7'0"
    speed: 6,
    driveTendency: 2, // post player
    dunkTendency: 4, // some dunks
    shooting: 5, // .449 FG% — below average for a center
    passing: 3,
    defense: 5, // decent shot blocker on a bad team
    rebounding: 7, // 8.5 RPG
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 9.9,
    twoPct: 0.449,
    offensiveRebRate: 0.061,
    defensiveRebRate: 0.241,
    stealRate: 0.010,
    turnoverRate: 0.120,
    ftAttempts: 3.65,
    ftPct: 0.600, // poor FT shooter
    blockRate: 0.040, // ~2.5 BPG
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
  clippers: {
    primary: "#006BB6",
    secondary: "#F5222D",
    text: "#FFFFFF",
    name: "Clippers",
    abbr: "LAC",
  },
};

// Team-level fast break tendency (1-10 scale)
// Based on 1986-87 pace, steals, and transition play research:
// - Lakers: Showtime — elite transition team (Pace 101.6, 8.9 SPG, Magic-led)
// - Celtics: deliberate half-court offense (Pace 98.6, 6.8 SPG, K.C. Jones system)
// - Clippers: high pace but sloppy (Pace 102.7, 9.2 SPG, 18.2 TOV/G)
export const TEAM_FAST_BREAK = {
  lakers: 9,
  celtics: 4,
  clippers: 7,
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
  // Clippers
  'Larry Drew': 26.1, 'Mike Woodson': 28.7, 'Rory White': 22.7,
  'Michael Cage': 36.5, 'Benoit Benjamin': 31.0,
  'Darnell Valentine': 27.1, 'Quintin Dailey': 18.9, 'Cedric Maxwell': 32.3,
  'Earl Cureton': 24.8, 'Kenny Fields': 19.6,
};

// Franchise stars — tolerate more fatigue, stay on the floor longer
export const STAR_PLAYERS = new Set([
  'Magic Johnson', 'Kareem Abdul-Jabbar', 'James Worthy',
  'Larry Bird', 'Kevin McHale', 'Robert Parish',
  'Michael Cage',
]);