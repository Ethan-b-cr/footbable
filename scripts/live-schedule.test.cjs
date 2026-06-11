const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeScoreboardEvents,
  buildMatchInsight,
  findTeamSummary,
} = require("../live-schedule-utils.js");

test("normalizeScoreboardEvents sorts by kickoff and numbers matches", () => {
  const events = [
    {
      id: "760414",
      name: "Czechia at South Korea",
      date: "2026-06-12T02:00Z",
      status: {
        type: {
          state: "pre",
          description: "Scheduled",
          detail: "Thu, June 11th at 10:00 PM EDT",
          shortDetail: "Scheduled",
          completed: false,
        },
      },
      competitions: [
        {
          venue: { fullName: "Estadio Akron", address: { city: "Guadalajara" } },
          competitors: [
            {
              homeAway: "home",
              score: "0",
              team: { displayName: "South Korea" },
            },
            {
              homeAway: "away",
              score: "0",
              team: { displayName: "Czechia" },
            },
          ],
        },
      ],
    },
    {
      id: "760415",
      name: "South Africa at Mexico",
      date: "2026-06-11T19:00Z",
      status: {
        type: {
          state: "pre",
          description: "Scheduled",
          detail: "Thu, June 11th at 3:00 PM EDT",
          shortDetail: "Scheduled",
          completed: false,
        },
      },
      competitions: [
        {
          venue: { fullName: "Estadio Banorte", address: { city: "Mexico City" } },
          competitors: [
            {
              homeAway: "home",
              score: "0",
              team: { displayName: "Mexico" },
            },
            {
              homeAway: "away",
              score: "0",
              team: { displayName: "South Africa" },
            },
          ],
        },
      ],
    },
  ];

  const normalized = normalizeScoreboardEvents(events);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].matchNumber, 1);
  assert.equal(normalized[0].homeTeam, "Mexico");
  assert.equal(normalized[0].awayTeam, "South Africa");
  assert.equal(normalized[1].matchNumber, 2);
  assert.equal(normalized[1].homeTeam, "South Korea");
  assert.equal(normalized[1].venue, "Estadio Akron");
});

test("findTeamSummary resolves aliases between live feed and historical data", () => {
  const teams = [
    { team: "Korea Republic", matches: 7 },
    { team: "Bosnia and Herzegovina", matches: 5 },
  ];

  assert.equal(findTeamSummary("South Korea", teams).team, "Korea Republic");
  assert.equal(findTeamSummary("Bosnia-Herzegovina", teams).team, "Bosnia and Herzegovina");
});

test("buildMatchInsight uses historical edge and key player support", () => {
  const teams = [
    {
      team: "Mexico",
      matches: 9,
      wins: 5,
      draws: 2,
      losses: 2,
      goals_for: 12,
      goals_against: 8,
      shots: 102,
      shots_on_target: 36,
      xg_for: 11.2,
      xg_against: 8.9,
    },
    {
      team: "South Africa",
      matches: 4,
      wins: 1,
      draws: 1,
      losses: 2,
      goals_for: 4,
      goals_against: 7,
      shots: 28,
      shots_on_target: 10,
      xg_for: 3.6,
      xg_against: 6.4,
    },
  ];

  const players = [
    {
      player_name: "Santiago Gimenez",
      team_name: "Mexico",
      goals: 4,
      xg: 2.8,
      assists: 1,
      shots: 12,
      appearances: 5,
    },
    {
      player_name: "Teboho Mokoena",
      team_name: "South Africa",
      goals: 1,
      xg: 0.7,
      assists: 1,
      shots: 5,
      appearances: 4,
    },
  ];

  const insight = buildMatchInsight(
    {
      homeTeam: "Mexico",
      awayTeam: "South Africa",
      statusText: "Scheduled",
      homeScore: 0,
      awayScore: 0,
      minuteText: "",
    },
    teams,
    players
  );

  assert.equal(insight.edgeTeam, "Mexico");
  assert.match(insight.primary, /Mexico/);
  assert.match(insight.secondary, /xG|胜率|射门/);
  assert.match(insight.keyPlayer, /Santiago Gimenez/);
});
