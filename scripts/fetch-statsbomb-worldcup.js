const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_DIR = path.join(__dirname, "..", "data");
const RAW_DIR = path.join(DATA_DIR, "raw", "statsbomb");
const SUMMARY_DIR = path.join(DATA_DIR, "summary");
const COMPETITIONS_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json";
const MATCHES_BASE_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches";
const LINEUPS_BASE_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data/lineups";
const EVENTS_BASE_URL =
  "https://raw.githubusercontent.com/statsbomb/open-data/master/data/events";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed: ${url} (${res.statusCode})`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function normalizeTeamName(team) {
  return team?.home_team_name || team?.away_team_name || team?.team_name || "Unknown";
}

async function main() {
  ensureDir(RAW_DIR);
  ensureDir(SUMMARY_DIR);

  const competitions = await fetchJson(COMPETITIONS_URL);
  const worldCupSeasons = competitions.filter(
    (item) =>
      item.competition_name === "FIFA World Cup" &&
      item.competition_gender === "male" &&
      !item.competition_youth
  );

  const selectedSeasons = worldCupSeasons
    .filter((season) => Number(season.season_name) >= 1970)
    .sort((a, b) => Number(a.season_name) - Number(b.season_name));

  const allMatches = [];
  const teamStats = new Map();
  const playerStats = new Map();
  const managerStats = new Map();

  for (const season of selectedSeasons) {
    const fileName = `${season.competition_id}-${season.season_id}.json`;
    const filePath = path.join(RAW_DIR, fileName);
    const seasonUrl = `${MATCHES_BASE_URL}/${season.competition_id}/${season.season_id}.json`;
    const matches = await fetchJson(seasonUrl);

    fs.writeFileSync(filePath, JSON.stringify(matches, null, 2), "utf8");

    for (const match of matches) {
      allMatches.push({
        season: season.season_name,
        match_id: match.match_id,
        home_team: match.home_team.home_team_name,
        away_team: match.away_team.away_team_name,
        home_score: match.home_score,
        away_score: match.away_score,
        match_date: match.match_date,
        stage: match.competition_stage?.name || "",
      });

      const home = match.home_team.home_team_name;
      const away = match.away_team.away_team_name;
      const homeStat = teamStats.get(home) || {
        team: home,
        matches: 0,
        goals_for: 0,
        goals_against: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        shots: 0,
        shots_on_target: 0,
        xg_for: 0,
        xg_against: 0,
      };
      const awayStat = teamStats.get(away) || {
        team: away,
        matches: 0,
        goals_for: 0,
        goals_against: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        shots: 0,
        shots_on_target: 0,
        xg_for: 0,
        xg_against: 0,
      };

      homeStat.matches += 1;
      awayStat.matches += 1;
      homeStat.goals_for += match.home_score;
      homeStat.goals_against += match.away_score;
      awayStat.goals_for += match.away_score;
      awayStat.goals_against += match.home_score;

      if (match.home_score > match.away_score) {
        homeStat.wins += 1;
        awayStat.losses += 1;
      } else if (match.home_score < match.away_score) {
        awayStat.wins += 1;
        homeStat.losses += 1;
      } else {
        homeStat.draws += 1;
        awayStat.draws += 1;
      }

      teamStats.set(home, homeStat);
      teamStats.set(away, awayStat);

      const managers = [...(match.home_team.managers || []), ...(match.away_team.managers || [])];
      for (const manager of managers) {
        const key = manager.name;
        const stat = managerStats.get(key) || {
          name: key,
          role: "manager",
          appearances: 0,
        };
        stat.appearances += 1;
        managerStats.set(key, stat);
      }

      const lineupUrl = `${LINEUPS_BASE_URL}/${match.match_id}.json`;
      const lineups = await fetchJson(lineupUrl);
      for (const teamLineup of lineups) {
        for (const player of teamLineup.lineup || []) {
          const playerKey = `${player.player_id}`;
          const existing = playerStats.get(playerKey) || {
            player_id: player.player_id,
            player_name: player.player_name,
            team_name: teamLineup.team_name,
            country_name: player.country?.name || "",
            appearances: 0,
            starts: 0,
            minutes_estimate: 0,
          };

          existing.appearances += 1;

          const positions = player.positions || [];
          if (positions.length > 0 && positions[0].start_reason === "Starting XI") {
            existing.starts += 1;
          }

          for (const position of positions) {
            if (position.from === "00:00") {
              existing.minutes_estimate += 90;
              break;
            }
          }

          playerStats.set(playerKey, existing);
        }
      }

      const eventsUrl = `${EVENTS_BASE_URL}/${match.match_id}.json`;
      const events = await fetchJson(eventsUrl);
      for (const event of events) {
        const teamName = event.team?.name;
        if (!teamName) continue;

        const isHome = teamName === home;
        const currentTeam = teamStats.get(teamName);
        const opponentTeam = teamStats.get(isHome ? away : home);

        if (event.type?.name === "Shot" && currentTeam) {
          currentTeam.shots += 1;
          const xg = Number(event.shot?.statsbomb_xg || 0);
          currentTeam.xg_for += xg;
          if (opponentTeam) {
            opponentTeam.xg_against += xg;
          }

          const shotOutcome = event.shot?.outcome?.name || "";
          if (["Goal", "Saved", "Saved To Post"].includes(shotOutcome)) {
            currentTeam.shots_on_target += 1;
          }

          const playerKey = String(event.player?.id || "");
          if (playerKey && playerStats.has(playerKey)) {
            const player = playerStats.get(playerKey);
            player.shots = (player.shots || 0) + 1;
            player.xg = Number((player.xg || 0) + xg);
            if (shotOutcome === "Goal") {
              player.goals = (player.goals || 0) + 1;
            }
            if (["Goal", "Saved", "Saved To Post"].includes(shotOutcome)) {
              player.shots_on_target = (player.shots_on_target || 0) + 1;
            }
            playerStats.set(playerKey, player);
          }
        }

        if (event.type?.name === "Pass") {
          const playerKey = String(event.player?.id || "");
          if (playerKey && playerStats.has(playerKey)) {
            const player = playerStats.get(playerKey);
            player.passes = (player.passes || 0) + 1;
            if (!event.pass?.outcome?.name) {
              player.completed_passes = (player.completed_passes || 0) + 1;
            }
            if (event.pass?.goal_assist) {
              player.assists = (player.assists || 0) + 1;
            }
            playerStats.set(playerKey, player);
          }
        }
      }

      if (match.match_id === selectedSeasons[selectedSeasons.length - 1] && false) {
        console.log(home, teamStats.get(home));
      }
    }
  }

  const teamSummary = [...teamStats.values()].sort((a, b) => b.matches - a.matches);
  const playerSummary = [...playerStats.values()].sort((a, b) => b.appearances - a.appearances);
  const managerSummary = [...managerStats.values()].sort((a, b) => b.appearances - a.appearances);

  fs.writeFileSync(
    path.join(SUMMARY_DIR, "worldcup_matches.json"),
    JSON.stringify(allMatches, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(SUMMARY_DIR, "worldcup_team_summary.json"),
    JSON.stringify(teamSummary, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(SUMMARY_DIR, "worldcup_person_summary.json"),
    JSON.stringify(managerSummary, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(SUMMARY_DIR, "worldcup_player_summary.json"),
    JSON.stringify(playerSummary, null, 2),
    "utf8"
  );

  const outputFiles = [
    "worldcup_matches.json",
    "worldcup_team_summary.json",
    "worldcup_person_summary.json",
    "worldcup_player_summary.json",
  ];

  for (const file of outputFiles) {
    const outputPath = path.join(SUMMARY_DIR, file);
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Expected output missing: ${outputPath}`);
    }
  }

  console.log(`Saved ${allMatches.length} matches from ${selectedSeasons.length} World Cup seasons.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
