// 1986-87 Bench rosters for Lakers and Celtics
// Stats sourced from basketball-reference.com and landofbasketball.com
// Same attribute structure as starter rosters in gameData.js

export const LAKERS_BENCH = [
  {
    name: "Michael Cooper",
    number: 21,
    position: "SG",
    height: 77, // 6'5"
    speed: 7,
    driveTendency: 4, // more of a shooter/defender
    dunkTendency: 2, // occasional dunker
    shooting: 7,
    passing: 6,
    defense: 9, // All-Defensive First Team, DPOY votes
    rebounding: 4,
    insideScoring: 5,
    threePoint: 8,
    threeAttempts: 2.8,
    threePct: 0.385,
    twoAttempts: 6.2,
    twoPct: 0.452,
    offensiveRebRate: 0.015,
    defensiveRebRate: 0.055,
    stealRate: 0.025,
    turnoverRate: 0.109,
    ftAttempts: 1.8,
    ftPct: 0.851,
    blockRate: 0.015,
  },
  {
    name: "Mychal Thompson",
    number: 43,
    position: "C",
    height: 82, // 6'10"
    speed: 5,
    driveTendency: 2, // post player
    dunkTendency: 3, // some dunks
    shooting: 6,
    passing: 3,
    defense: 6,
    rebounding: 6,
    insideScoring: 7,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 8.2,
    twoPct: 0.480,
    offensiveRebRate: 0.040,
    defensiveRebRate: 0.080,
    stealRate: 0.011,
    turnoverRate: 0.151,
    ftAttempts: 3.1,
    ftPct: 0.743,
    blockRate: 0.036,
  },
  {
    name: "Kurt Rambis",
    number: 31,
    position: "PF",
    height: 80, // 6'8"
    speed: 6,
    driveTendency: 2, // energy player, not a driver
    dunkTendency: 4, // put-back dunks, hustle plays
    shooting: 5,
    passing: 3,
    defense: 6,
    rebounding: 7,
    insideScoring: 5,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 4.0,
    twoPct: 0.521,
    offensiveRebRate: 0.060,
    defensiveRebRate: 0.120,
    stealRate: 0.027,
    turnoverRate: 0.210,
    ftAttempts: 2.0,
    ftPct: 0.764,
    blockRate: 0.021,
  },
  {
    name: "Billy Thompson",
    number: 55,
    position: "SF",
    height: 79, // 6'7"
    speed: 6,
    driveTendency: 4, // athletic slasher
    dunkTendency: 4, // athletic forward
    shooting: 5,
    passing: 3,
    defense: 5,
    rebounding: 5,
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 4.4,
    twoPct: 0.544,
    offensiveRebRate: 0.035,
    defensiveRebRate: 0.060,
    stealRate: 0.013,
    turnoverRate: 0.168,
    ftAttempts: 1.3,
    ftPct: 0.649,
    blockRate: 0.032,
  },
  {
    name: "Wes Matthews",
    number: 1,
    position: "PG",
    height: 73, // 6'1"
    speed: 6,
    driveTendency: 4, // average slasher
    dunkTendency: 1, // too short to dunk
    shooting: 5,
    passing: 6,
    defense: 5,
    rebounding: 3,
    insideScoring: 4,
    threePoint: 3,
    threeAttempts: 0.1,
    threePct: 0.333,
    twoAttempts: 3.6,
    twoPct: 0.500,
    offensiveRebRate: 0.010,
    defensiveRebRate: 0.030,
    stealRate: 0.027,
    turnoverRate: 0.200,
    ftAttempts: 0.7,
    ftPct: 0.806,
    blockRate: 0.008,
  },
];

export const CELTICS_BENCH = [
  {
    name: "Jerry Sichting",
    number: 12,
    position: "PG",
    height: 73, // 6'1"
    speed: 6,
    driveTendency: 3, // shooter first
    dunkTendency: 1, // too short to dunk
    shooting: 7,
    passing: 6,
    defense: 5,
    rebounding: 3,
    insideScoring: 5,
    threePoint: 5,
    threeAttempts: 0.3,
    threePct: 0.269,
    twoAttempts: 4.8,
    twoPct: 0.521,
    offensiveRebRate: 0.010,
    defensiveRebRate: 0.030,
    stealRate: 0.014,
    turnoverRate: 0.131,
    ftAttempts: 0.5,
    ftPct: 0.881,
    blockRate: 0.003,
  },
  {
    name: "Bill Walton",
    number: 5,
    position: "C",
    height: 83, // 6'11"
    speed: 4, // slowed by injuries
    driveTendency: 1, // post player
    dunkTendency: 1, // rarely dunked due to injuries
    shooting: 5,
    passing: 5, // excellent passing big man
    defense: 7,
    rebounding: 7,
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 2.6,
    twoPct: 0.385,
    offensiveRebRate: 0.050,
    defensiveRebRate: 0.090,
    stealRate: 0.005,
    turnoverRate: 0.315,
    ftAttempts: 1.5,
    ftPct: 0.533,
    blockRate: 0.040,
  },
  {
    name: "Fred Roberts",
    number: 31,
    position: "PF",
    height: 82, // 6'10"
    speed: 5,
    driveTendency: 2, // inside player
    dunkTendency: 3, // some dunks
    shooting: 6,
    passing: 3,
    defense: 5,
    rebounding: 5,
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 3.7,
    twoPct: 0.515,
    offensiveRebRate: 0.030,
    defensiveRebRate: 0.070,
    stealRate: 0.012,
    turnoverRate: 0.206,
    ftAttempts: 2.1,
    ftPct: 0.810,
    blockRate: 0.016,
  },
  {
    name: "Darren Daye",
    number: 20,
    position: "SF",
    height: 80, // 6'8"
    speed: 6,
    driveTendency: 3, // spot-up wing
    dunkTendency: 2, // rare dunker
    shooting: 5,
    passing: 4,
    defense: 4,
    rebounding: 4,
    insideScoring: 5,
    threePoint: 2,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 3.3,
    twoPct: 0.500,
    offensiveRebRate: 0.025,
    defensiveRebRate: 0.060,
    stealRate: 0.019,
    turnoverRate: 0.192,
    ftAttempts: 1.1,
    ftPct: 0.523,
    blockRate: 0.007,
  },
  {
    name: "Greg Kite",
    number: 50,
    position: "C",
    height: 83, // 6'11"
    speed: 4,
    driveTendency: 1, // pure post player
    dunkTendency: 2, // occasional dunk
    shooting: 3,
    passing: 2,
    defense: 5,
    rebounding: 5,
    insideScoring: 3,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 1.5,
    twoPct: 0.427,
    offensiveRebRate: 0.040,
    defensiveRebRate: 0.070,
    stealRate: 0.011,
    turnoverRate: 0.205,
    ftAttempts: 1.0,
    ftPct: 0.382,
    blockRate: 0.048,
  },
];

// 1986-87 Houston Rockets bench (full-strength exhibition roster)
export const ROCKETS_BENCH = [
  {
    name: "Allen Leavell",
    number: 30,
    position: "PG",
    height: 73, // 6'1"
    speed: 7,
    driveTendency: 6, // penetrate-and-pass, ball-security specialist
    dunkTendency: 1, // too short to dunk
    shooting: 7,
    passing: 9,
    defense: 6,
    rebounding: 2,
    insideScoring: 4,
    threePoint: 5,
    threeAttempts: 0.7,
    threePct: 0.290,
    twoAttempts: 5.3,
    twoPct: 0.460,
    offensiveRebRate: 0.010,
    defensiveRebRate: 0.040,
    stealRate: 0.024,
    turnoverRate: 0.110,
    ftAttempts: 2.0,
    ftPct: 0.840,
    blockRate: 0.003,
  },
  {
    name: "Lewis Lloyd",
    number: 32,
    position: "SG",
    height: 78, // 6'6"
    speed: 8,
    driveTendency: 8, // aggressive bench scorer, attacks gaps
    dunkTendency: 6, // athletic finisher
    shooting: 8,
    passing: 6,
    defense: 6,
    rebounding: 4,
    insideScoring: 7,
    threePoint: 2,
    threeAttempts: 0.1,
    threePct: 0.200,
    twoAttempts: 7.4,
    twoPct: 0.475,
    offensiveRebRate: 0.025,
    defensiveRebRate: 0.060,
    stealRate: 0.018,
    turnoverRate: 0.120,
    ftAttempts: 2.0,
    ftPct: 0.756,
    blockRate: 0.005,
  },
  {
    name: "Mitchell Wiggins",
    number: 15,
    position: "SG",
    height: 77, // 6'5"
    speed: 8,
    driveTendency: 8, // athletic slasher and transition threat
    dunkTendency: 5, // explosive leaper
    shooting: 7,
    passing: 6,
    defense: 7,
    rebounding: 7, // exceptional guard rebounder (Guard Crasher)
    insideScoring: 7,
    threePoint: 1,
    threeAttempts: 0.1,
    threePct: 0.200,
    twoAttempts: 6.9,
    twoPct: 0.489,
    offensiveRebRate: 0.060, // crashes the offensive glass far more than a typical guard
    defensiveRebRate: 0.100,
    stealRate: 0.025,
    turnoverRate: 0.120,
    ftAttempts: 2.0,
    ftPct: 0.754,
    blockRate: 0.003,
  },
  {
    name: "Jim Petersen",
    number: 43,
    position: "C",
    height: 83, // 6'11"
    speed: 5,
    driveTendency: 3, // interior support scorer, not a driver
    dunkTendency: 4, // put-back dunks
    shooting: 7,
    passing: 4,
    defense: 7,
    rebounding: 8,
    insideScoring: 7,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 7.0,
    twoPct: 0.463,
    offensiveRebRate: 0.075,
    defensiveRebRate: 0.180,
    stealRate: 0.012,
    turnoverRate: 0.130,
    ftAttempts: 2.0,
    ftPct: 0.727,
    blockRate: 0.025,
  },
  {
    name: "Buck Johnson",
    number: 1,
    position: "SF",
    height: 79, // 6'7"
    speed: 7,
    driveTendency: 6, // athletic cutter and runner
    dunkTendency: 4, // energy finishes
    shooting: 5,
    passing: 4,
    defense: 7,
    rebounding: 6,
    insideScoring: 5,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 3.0,
    twoPct: 0.462,
    offensiveRebRate: 0.050,
    defensiveRebRate: 0.080,
    stealRate: 0.016,
    turnoverRate: 0.140,
    ftAttempts: 1.0,
    ftPct: 0.690,
    blockRate: 0.015,
  },
];

// 1986-87 Detroit Pistons bench (Bad Boys era)
export const PISTONS_BENCH = [
  {
    name: "Vinnie Johnson",
    number: 15,
    position: "SG",
    height: 74, // 6'2"
    speed: 7,
    driveTendency: 9, // aggressive bench scorer, attacks gaps
    dunkTendency: 2, // rare dunker
    shooting: 9, // elite midrange — "The Microwave"
    passing: 8,
    defense: 6,
    rebounding: 5,
    insideScoring: 9,
    threePoint: 3,
    threeAttempts: 0.6,
    threePct: 0.222,
    twoAttempts: 12.9,
    twoPct: 0.474,
    offensiveRebRate: 0.030,
    defensiveRebRate: 0.070,
    stealRate: 0.020,
    turnoverRate: 0.110,
    ftAttempts: 2.0,
    ftPct: 0.786,
    blockRate: 0.005,
  },
  {
    name: "Rick Mahorn",
    number: 44,
    position: "C",
    height: 82, // 6'10"
    speed: 5,
    driveTendency: 3, // interior enforcer
    dunkTendency: 3, // power finishes
    shooting: 4,
    passing: 2,
    defense: 8, // physical post defender, enforcer
    rebounding: 9,
    insideScoring: 5,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 5.5,
    twoPct: 0.521,
    offensiveRebRate: 0.075,
    defensiveRebRate: 0.165,
    stealRate: 0.013,
    turnoverRate: 0.140,
    ftAttempts: 2.0,
    ftPct: 0.821,
    blockRate: 0.040,
  },
  {
    name: "Dennis Rodman",
    number: 10,
    position: "SF",
    height: 79, // 6'7"
    speed: 7, // high motor
    driveTendency: 8, // athletic cutter
    dunkTendency: 4, // energy finishes
    shooting: 4, // almost no jumpers
    passing: 2,
    defense: 9, // elite versatile defender even as a rookie
    rebounding: 9, // elite rebound rate
    insideScoring: 5,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 5.0,
    twoPct: 0.546,
    offensiveRebRate: 0.090,
    defensiveRebRate: 0.140,
    stealRate: 0.020,
    turnoverRate: 0.130,
    ftAttempts: 1.5,
    ftPct: 0.587,
    blockRate: 0.025,
  },
  {
    name: "John Salley",
    number: 22,
    position: "C",
    height: 83, // 6'11"
    speed: 6, // mobile long big
    driveTendency: 6, // face-up runner
    dunkTendency: 5, // lob/rim finisher
    shooting: 4,
    passing: 3,
    defense: 8, // elite shot blocker (team-high 125 BLK)
    rebounding: 7,
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 5.0,
    twoPct: 0.522,
    offensiveRebRate: 0.060,
    defensiveRebRate: 0.110,
    stealRate: 0.015,
    turnoverRate: 0.130,
    ftAttempts: 1.5,
    ftPct: 0.614,
    blockRate: 0.045,
  },
  {
    name: "Tony Campbell",
    number: 24,
    position: "SF",
    height: 78, // 6'6"
    speed: 7,
    driveTendency: 8, // athletic slasher
    dunkTendency: 4,
    shooting: 6,
    passing: 4,
    defense: 6,
    rebounding: 6,
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0.1,
    threePct: 0.200,
    twoAttempts: 3.9,
    twoPct: 0.450,
    offensiveRebRate: 0.040,
    defensiveRebRate: 0.070,
    stealRate: 0.016,
    turnoverRate: 0.140,
    ftAttempts: 1.0,
    ftPct: 0.615,
    blockRate: 0.015,
  },
];

// 1986-87 Atlanta Hawks bench (Human Highlight Film era)
export const HAWKS_BENCH = [
  {
    name: "Spud Webb",
    number: 2,
    position: "PG",
    height: 67, // 5'7" — famously short, 1986 Slam Dunk Contest champion
    speed: 10, // elite quickness
    driveTendency: 9, // penetrator, changes pace
    dunkTendency: 6, // dunk contest winner despite height
    shooting: 6,
    passing: 8,
    defense: 6, // pesky ball pressure
    rebounding: 2, // too short to rebound
    insideScoring: 7,
    threePoint: 2,
    threeAttempts: 0.2,
    threePct: 0.118,
    twoAttempts: 5.7,
    twoPct: 0.473,
    offensiveRebRate: 0.015,
    defensiveRebRate: 0.040,
    stealRate: 0.030,
    turnoverRate: 0.140,
    ftAttempts: 1.5,
    ftPct: 0.762,
    blockRate: 0.003,
  },
  {
    name: "Mike McGee",
    number: 20,
    position: "SG",
    height: 77, // 6'5"
    speed: 7,
    driveTendency: 6, // bench scorer, attacks closeouts
    dunkTendency: 4,
    shooting: 7,
    passing: 4,
    defense: 5,
    rebounding: 3,
    insideScoring: 6,
    threePoint: 6,
    threeAttempts: 0.8,
    threePct: 0.375,
    twoAttempts: 6.7,
    twoPct: 0.469,
    offensiveRebRate: 0.025,
    defensiveRebRate: 0.060,
    stealRate: 0.018,
    turnoverRate: 0.120,
    ftAttempts: 1.5,
    ftPct: 0.584,
    blockRate: 0.005,
  },
  {
    name: "Cliff Levingston",
    number: 7,
    position: "PF",
    height: 80, // 6'8"
    speed: 7,
    driveTendency: 5, // energy forward, cuts and putbacks
    dunkTendency: 5,
    shooting: 5,
    passing: 3,
    defense: 7, // good help defender
    rebounding: 8,
    insideScoring: 6,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 4.8,
    twoPct: 0.506,
    offensiveRebRate: 0.075,
    defensiveRebRate: 0.170,
    stealRate: 0.018,
    turnoverRate: 0.130,
    ftAttempts: 1.7,
    ftPct: 0.731,
    blockRate: 0.025,
  },
  {
    name: "Antoine Carr",
    number: 33,
    position: "PF",
    height: 81, // 6'9"
    speed: 6,
    driveTendency: 5, // reserve interior scorer
    dunkTendency: 4,
    shooting: 6,
    passing: 3,
    defense: 6,
    rebounding: 5,
    insideScoring: 7,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 4.5,
    twoPct: 0.506,
    offensiveRebRate: 0.055,
    defensiveRebRate: 0.120,
    stealRate: 0.012,
    turnoverRate: 0.120,
    ftAttempts: 1.6,
    ftPct: 0.709,
    blockRate: 0.015,
  },
  {
    name: "Jon Koncak",
    number: 54,
    position: "C",
    height: 84, // 7'0"
    speed: 5,
    driveTendency: 2, // low-usage backup big
    dunkTendency: 3,
    shooting: 4,
    passing: 2,
    defense: 7, // backup rim protector
    rebounding: 7,
    insideScoring: 5,
    threePoint: 1,
    threeAttempts: 0,
    threePct: 0,
    twoAttempts: 3.3,
    twoPct: 0.514,
    offensiveRebRate: 0.070,
    defensiveRebRate: 0.150,
    stealRate: 0.010,
    turnoverRate: 0.110,
    ftAttempts: 1.3,
    ftPct: 0.654,
    blockRate: 0.035,
  },
];