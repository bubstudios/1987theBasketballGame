// defenseData.js — 1986-87 Lakers & Celtics multi-dimensional defensive ratings,
// team defensive tendencies, and default matchup assignments.
// All player ratings are out of 99.

// Player defensive rating profiles keyed by name.
// Fields: perimeterDef, postDef, helpDef, screenNav, stealDef, blockDef,
//         dRebound, discipline, versatility, transitionDef
export const LAKERS_DEFENSE = {
  'Magic Johnson':       { perimeterDef: 82, postDef: 88, helpDef: 86, screenNav: 68, stealDef: 89, blockDef: 62, dRebound: 87, discipline: 79, versatility: 94, transitionDef: 82 },
  'Byron Scott':          { perimeterDef: 86, postDef: 54, helpDef: 78, screenNav: 88, stealDef: 88, blockDef: 38, dRebound: 52, discipline: 82, versatility: 82, transitionDef: 86 },
  'James Worthy':         { perimeterDef: 83, postDef: 77, helpDef: 87, screenNav: 78, stealDef: 83, blockDef: 76, dRebound: 75, discipline: 81, versatility: 90, transitionDef: 90 },
  'A.C. Green':           { perimeterDef: 72, postDef: 86, helpDef: 86, screenNav: 72, stealDef: 72, blockDef: 75, dRebound: 94, discipline: 88, versatility: 85, transitionDef: 82 },
  'Kareem Abdul-Jabbar':  { perimeterDef: 47, postDef: 86, helpDef: 88, screenNav: 42, stealDef: 47, blockDef: 90, dRebound: 85, discipline: 81, versatility: 58, transitionDef: 48 },
  'Michael Cooper':       { perimeterDef: 99, postDef: 78, helpDef: 94, screenNav: 96, stealDef: 94, blockDef: 65, dRebound: 59, discipline: 94, versatility: 98, transitionDef: 86 },
  'Mychal Thompson':      { perimeterDef: 53, postDef: 90, helpDef: 82, screenNav: 58, stealDef: 49, blockDef: 83, dRebound: 83, discipline: 78, versatility: 67, transitionDef: 60 },
  'Kurt Rambis':          { perimeterDef: 50, postDef: 88, helpDef: 79, screenNav: 64, stealDef: 72, blockDef: 61, dRebound: 93, discipline: 74, versatility: 65, transitionDef: 80 },
  'Billy Thompson':       { perimeterDef: 72, postDef: 72, helpDef: 77, screenNav: 70, stealDef: 67, blockDef: 74, dRebound: 76, discipline: 69, versatility: 78, transitionDef: 74 },
  'Wes Matthews':         { perimeterDef: 77, postDef: 35, helpDef: 63, screenNav: 82, stealDef: 80, blockDef: 25, dRebound: 30, discipline: 68, versatility: 66, transitionDef: 78 },
};

export const CELTICS_DEFENSE = {
  'Dennis Johnson':      { perimeterDef: 96, postDef: 82, helpDef: 92, screenNav: 90, stealDef: 88, blockDef: 55, dRebound: 65, discipline: 94, versatility: 94, transitionDef: 88 },
  'Danny Ainge':         { perimeterDef: 82, postDef: 45, helpDef: 77, screenNav: 80, stealDef: 88, blockDef: 32, dRebound: 50, discipline: 77, versatility: 78, transitionDef: 80 },
  'Larry Bird':          { perimeterDef: 79, postDef: 83, helpDef: 94, screenNav: 72, stealDef: 92, blockDef: 72, dRebound: 93, discipline: 91, versatility: 89, transitionDef: 76 },
  'Kevin McHale':        { perimeterDef: 83, postDef: 97, helpDef: 98, screenNav: 75, stealDef: 62, blockDef: 96, dRebound: 92, discipline: 86, versatility: 96, transitionDef: 68 },
  'Robert Parish':       { perimeterDef: 56, postDef: 93, helpDef: 92, screenNav: 52, stealDef: 66, blockDef: 94, dRebound: 96, discipline: 82, versatility: 68, transitionDef: 58 },
  'Jerry Sichting':      { perimeterDef: 76, postDef: 31, helpDef: 69, screenNav: 78, stealDef: 74, blockDef: 20, dRebound: 27, discipline: 86, versatility: 62, transitionDef: 72 },
  'Bill Walton':          { perimeterDef: 56, postDef: 91, helpDef: 97, screenNav: 56, stealDef: 65, blockDef: 91, dRebound: 91, discipline: 93, versatility: 77, transitionDef: 54 },
  'Fred Roberts':        { perimeterDef: 60, postDef: 79, helpDef: 73, screenNav: 62, stealDef: 55, blockDef: 61, dRebound: 76, discipline: 75, versatility: 68, transitionDef: 64 },
  'Darren Daye':         { perimeterDef: 70, postDef: 66, helpDef: 72, screenNav: 68, stealDef: 61, blockDef: 62, dRebound: 69, discipline: 66, versatility: 73, transitionDef: 68 },
  'Greg Kite':            { perimeterDef: 31, postDef: 86, helpDef: 77, screenNav: 40, stealDef: 39, blockDef: 75, dRebound: 87, discipline: 58, versatility: 45, transitionDef: 45 },
};

// 1986-87 Houston Rockets — elite interior length, rim protection, help defense.
export const ROCKETS_DEFENSE = {
  'Akeem Olajuwon':    { perimeterDef: 70, postDef: 97, helpDef: 99, screenNav: 45, stealDef: 92, blockDef: 99, dRebound: 96, discipline: 74, versatility: 95, transitionDef: 55 },
  'Ralph Sampson':     { perimeterDef: 65, postDef: 90, helpDef: 92, screenNav: 48, stealDef: 69, blockDef: 90, dRebound: 92, discipline: 70, versatility: 84, transitionDef: 60 },
  'Rodney McCray':     { perimeterDef: 95, postDef: 88, helpDef: 95, screenNav: 88, stealDef: 84, blockDef: 78, dRebound: 89, discipline: 95, versatility: 99, transitionDef: 92 },
  'Robert Reid':       { perimeterDef: 88, postDef: 82, helpDef: 87, screenNav: 84, stealDef: 80, blockDef: 54, dRebound: 72, discipline: 89, versatility: 93, transitionDef: 82 },
  'Dirk Minniefield':  { perimeterDef: 82, postDef: 38, helpDef: 75, screenNav: 80, stealDef: 86, blockDef: 24, dRebound: 45, discipline: 74, versatility: 70, transitionDef: 84 },
  'Allen Leavell':     { perimeterDef: 80, postDef: 34, helpDef: 74, screenNav: 78, stealDef: 87, blockDef: 28, dRebound: 32, discipline: 86, versatility: 68, transitionDef: 80 },
  'Lewis Lloyd':       { perimeterDef: 76, postDef: 68, helpDef: 72, screenNav: 72, stealDef: 67, blockDef: 42, dRebound: 42, discipline: 74, versatility: 79, transitionDef: 84 },
  'Mitchell Wiggins':  { perimeterDef: 89, postDef: 58, helpDef: 83, screenNav: 82, stealDef: 93, blockDef: 24, dRebound: 77, discipline: 77, versatility: 86, transitionDef: 90 },
  'Jim Petersen':      { perimeterDef: 56, postDef: 85, helpDef: 89, screenNav: 50, stealDef: 58, blockDef: 88, dRebound: 92, discipline: 78, versatility: 69, transitionDef: 58 },
  'Buck Johnson':      { perimeterDef: 74, postDef: 72, helpDef: 79, screenNav: 68, stealDef: 73, blockDef: 76, dRebound: 69, discipline: 70, versatility: 80, transitionDef: 76 },
};

// 1986-87 Detroit Pistons — physical, disruptive, high-pressure Bad Boys defense.
// More fouls/contact than Boston, more half-court toughness than LA.
export const PISTONS_DEFENSE = {
  'Isiah Thomas':    { perimeterDef: 88, postDef: 45, helpDef: 82, screenNav: 78, stealDef: 95, blockDef: 24, dRebound: 62, discipline: 72, versatility: 78, transitionDef: 88 },
  'Joe Dumars':      { perimeterDef: 94, postDef: 62, helpDef: 86, screenNav: 88, stealDef: 82, blockDef: 24, dRebound: 50, discipline: 94, versatility: 86, transitionDef: 86 },
  'Adrian Dantley':  { perimeterDef: 58, postDef: 70, helpDef: 62, screenNav: 70, stealDef: 54, blockDef: 20, dRebound: 58, discipline: 72, versatility: 62, transitionDef: 72 },
  'Sidney Green':    { perimeterDef: 60, postDef: 78, helpDef: 76, screenNav: 68, stealDef: 55, blockDef: 68, dRebound: 90, discipline: 72, versatility: 70, transitionDef: 78 },
  'Bill Laimbeer':   { perimeterDef: 52, postDef: 88, helpDef: 82, screenNav: 48, stealDef: 58, blockDef: 74, dRebound: 97, discipline: 70, versatility: 66, transitionDef: 50 },
  'Vinnie Johnson':  { perimeterDef: 72, postDef: 44, helpDef: 66, screenNav: 74, stealDef: 78, blockDef: 24, dRebound: 48, discipline: 72, versatility: 70, transitionDef: 82 },
  'Rick Mahorn':     { perimeterDef: 42, postDef: 91, helpDef: 82, screenNav: 50, stealDef: 55, blockDef: 76, dRebound: 90, discipline: 62, versatility: 62, transitionDef: 48 },
  'Dennis Rodman':   { perimeterDef: 89, postDef: 82, helpDef: 92, screenNav: 82, stealDef: 78, blockDef: 78, dRebound: 94, discipline: 78, versatility: 97, transitionDef: 88 },
  'John Salley':     { perimeterDef: 58, postDef: 84, helpDef: 90, screenNav: 58, stealDef: 62, blockDef: 94, dRebound: 80, discipline: 58, versatility: 78, transitionDef: 68 },
  'Tony Campbell':   { perimeterDef: 68, postDef: 58, helpDef: 66, screenNav: 68, stealDef: 60, blockDef: 34, dRebound: 55, discipline: 66, versatility: 70, transitionDef: 74 },
};

// Team defensive tendency multipliers (1.0 = league baseline).
// Lakers: active, opportunistic, gambling, fast-break-creating.
// Celtics: structured, physical, disciplined, rim-protecting.
export const TEAM_DEFENSE_TENDENCIES = {
  lakers: {
    stealAttemptFreq: 1.10,
    passingLaneDenial: 1.10,
    hardDoubleFreq: 0.95,
    helpAtRim: 1.05,
    fullSwitching: 0.85,
    dropCoverageCenter: 1.15,
    defRebEmphasis: 0.98,
    foulAggression: 1.03,
    halfcourtDiscipline: 1.0,
  },
  celtics: {
    stealAttemptFreq: 0.92,
    passingLaneDenial: 0.97,
    hardDoubleFreq: 0.94,
    helpAtRim: 1.15,
    fullSwitching: 0.88,
    dropCoverageCenter: 1.12,
    defRebEmphasis: 1.05,
    foulAggression: 0.94,
    halfcourtDiscipline: 1.15,
  },
  // Rockets: elite rim protection, high help defense, strong defensive rebounding,
  // moderate pressure and switching. Funnel drives toward the Twin Towers.
  rockets: {
    stealAttemptFreq: 1.05,
    passingLaneDenial: 1.00,
    hardDoubleFreq: 0.95,
    helpAtRim: 1.20,
    fullSwitching: 0.80,
    dropCoverageCenter: 1.15,
    defRebEmphasis: 1.10,
    foulAggression: 1.00,
    halfcourtDiscipline: 1.05,
  },
  // Pistons: Bad Boys — high pressure, high physicality, high foul risk.
  // Isiah/Dumars pressure the ball; Laimbeer/Mahorn provide body contact.
  pistons: {
    stealAttemptFreq: 1.15,
    passingLaneDenial: 1.12,
    hardDoubleFreq: 1.00,
    helpAtRim: 1.05,
    fullSwitching: 0.85,
    dropCoverageCenter: 1.05,
    defRebEmphasis: 1.10,
    foulAggression: 1.15, // foul more than Boston, more contact than LA
    halfcourtDiscipline: 0.95, // aggressive but less disciplined than Boston
  },
};

// Default man-to-man matchups: defenseTeam → { offenseName: defenderName }
export const DEFAULT_MATCHUPS = {
  // Celtics defending Lakers
  celtics: {
    'Magic Johnson': 'Dennis Johnson',
    'Byron Scott': 'Danny Ainge',
    'James Worthy': 'Larry Bird',
    'A.C. Green': 'Kevin McHale',
    'Kareem Abdul-Jabbar': 'Robert Parish',
    // vs Rockets
    'Akeem Olajuwon': 'Robert Parish',
    'Ralph Sampson': 'Kevin McHale',
    'Rodney McCray': 'Larry Bird',
    'Robert Reid': 'Danny Ainge',
    'Dirk Minniefield': 'Dennis Johnson',
    // vs Pistons
    'Isiah Thomas': 'Dennis Johnson',
    'Joe Dumars': 'Danny Ainge',
    'Adrian Dantley': 'Larry Bird',
    'Sidney Green': 'Kevin McHale',
    'Bill Laimbeer': 'Robert Parish',
  },
  // Lakers defending Celtics
  lakers: {
    'Dennis Johnson': 'Magic Johnson',
    'Danny Ainge': 'Byron Scott',
    'Larry Bird': 'Michael Cooper',
    'Kevin McHale': 'A.C. Green',
    'Robert Parish': 'Kareem Abdul-Jabbar',
    // vs Rockets
    'Akeem Olajuwon': 'Kareem Abdul-Jabbar',
    'Ralph Sampson': 'A.C. Green',
    'Rodney McCray': 'James Worthy',
    'Robert Reid': 'Byron Scott',
    'Dirk Minniefield': 'Magic Johnson',
    // vs Pistons
    'Isiah Thomas': 'Byron Scott',
    'Joe Dumars': 'Magic Johnson',
    'Adrian Dantley': 'Michael Cooper',
    'Sidney Green': 'A.C. Green',
    'Bill Laimbeer': 'Kareem Abdul-Jabbar',
  },
  // Rockets defending (covers both Lakers and Celtics offenses)
  rockets: {
    // vs Lakers
    'Magic Johnson': 'Robert Reid',
    'Byron Scott': 'Dirk Minniefield',
    'James Worthy': 'Rodney McCray',
    'A.C. Green': 'Ralph Sampson',
    'Kareem Abdul-Jabbar': 'Akeem Olajuwon',
    // vs Celtics
    'Dennis Johnson': 'Dirk Minniefield',
    'Danny Ainge': 'Robert Reid',
    'Larry Bird': 'Rodney McCray',
    'Kevin McHale': 'Ralph Sampson',
    'Robert Parish': 'Akeem Olajuwon',
    // vs Pistons
    'Isiah Thomas': 'Dirk Minniefield',
    'Joe Dumars': 'Robert Reid',
    'Adrian Dantley': 'Rodney McCray',
    'Sidney Green': 'Ralph Sampson',
    'Bill Laimbeer': 'Akeem Olajuwon',
  },
  // Pistons defending (covers Lakers, Celtics, Rockets offenses)
  pistons: {
    // vs Lakers
    'Magic Johnson': 'Joe Dumars',
    'Byron Scott': 'Isiah Thomas',
    'James Worthy': 'Adrian Dantley',
    'A.C. Green': 'Sidney Green',
    'Kareem Abdul-Jabbar': 'Bill Laimbeer',
    // vs Celtics
    'Dennis Johnson': 'Isiah Thomas',
    'Danny Ainge': 'Joe Dumars',
    'Larry Bird': 'Adrian Dantley',
    'Kevin McHale': 'Rick Mahorn',
    'Robert Parish': 'Bill Laimbeer',
    // vs Rockets
    'Dirk Minniefield': 'Isiah Thomas',
    'Robert Reid': 'Joe Dumars',
    'Rodney McCray': 'Adrian Dantley',
    'Ralph Sampson': 'Rick Mahorn',
    'Akeem Olajuwon': 'Bill Laimbeer',
  },
};

// Influence weights for the containment score (per spec: 55/20/15/10)
export const SCHEME_WEIGHTS = {
  primary: 0.55,
  help: 0.20,
  scheme: 0.15,
  matchup: 0.10,
};

// Registry mapping team key → defensive rating profiles.
// Extensible: add a new team's defense map here.
export const TEAM_DEFENSE_MAP = {
  lakers: LAKERS_DEFENSE,
  celtics: CELTICS_DEFENSE,
  rockets: ROCKETS_DEFENSE,
  pistons: PISTONS_DEFENSE,
};