// 1986-87 Lakers and Celtics rosters with real attributes
// Speed: 1-10 scale, Height in inches, Skills rated 1-10

export const LAKERS_ROSTER = [
  {
    name: "Magic Johnson",
    number: 32,
    position: "PG",
    height: 81, // 6'9"
    speed: 8,
    shooting: 7,
    passing: 10,
    defense: 6,
    rebounding: 7,
    insideScoring: 7,
    threePoint: 5,
  },
  {
    name: "Byron Scott",
    number: 4,
    position: "SG",
    height: 75, // 6'3"
    speed: 8,
    shooting: 8,
    passing: 5,
    defense: 6,
    rebounding: 4,
    insideScoring: 6,
    threePoint: 7,
  },
  {
    name: "James Worthy",
    number: 42,
    position: "SF",
    height: 81, // 6'9"
    speed: 9,
    shooting: 7,
    passing: 5,
    defense: 6,
    rebounding: 6,
    insideScoring: 9,
    threePoint: 3,
  },
  {
    name: "A.C. Green",
    number: 45,
    position: "PF",
    height: 81, // 6'9"
    speed: 7,
    shooting: 5,
    passing: 3,
    defense: 7,
    rebounding: 9,
    insideScoring: 6,
    threePoint: 2,
  },
  {
    name: "Kareem Abdul-Jabbar",
    number: 33,
    position: "C",
    height: 86, // 7'2"
    speed: 5,
    shooting: 8,
    passing: 4,
    defense: 7,
    rebounding: 8,
    insideScoring: 10,
    threePoint: 1,
  },
];

export const CELTICS_ROSTER = [
  {
    name: "Dennis Johnson",
    number: 3,
    position: "PG",
    height: 76, // 6'4"
    speed: 7,
    shooting: 6,
    passing: 8,
    defense: 9,
    rebounding: 4,
    insideScoring: 6,
    threePoint: 4,
  },
  {
    name: "Danny Ainge",
    number: 44,
    position: "SG",
    height: 77, // 6'5"
    speed: 7,
    shooting: 8,
    passing: 6,
    defense: 5,
    rebounding: 4,
    insideScoring: 5,
    threePoint: 8,
  },
  {
    name: "Larry Bird",
    number: 33,
    position: "SF",
    height: 81, // 6'9"
    speed: 6,
    shooting: 10,
    passing: 9,
    defense: 7,
    rebounding: 9,
    insideScoring: 8,
    threePoint: 9,
  },
  {
    name: "Kevin McHale",
    number: 32,
    position: "PF",
    height: 82, // 6'10"
    speed: 5,
    shooting: 7,
    passing: 4,
    defense: 8,
    rebounding: 8,
    insideScoring: 10,
    threePoint: 2,
  },
  {
    name: "Robert Parish",
    number: 0,
    position: "C",
    height: 84, // 7'0"
    speed: 6,
    shooting: 7,
    passing: 3,
    defense: 8,
    rebounding: 9,
    insideScoring: 8,
    threePoint: 1,
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
  },
  celtics: {
    primary: "#007A33",
    secondary: "#FFFFFF",
    text: "#FFFFFF",
    name: "Celtics",
  },
};