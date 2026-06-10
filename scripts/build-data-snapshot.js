const fs = require("fs");
const path = require("path");

const SUMMARY_DIR = path.join(__dirname, "..", "data", "summary");
const OUTPUT_FILE = path.join(__dirname, "..", "data", "snapshot.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const matches = readJson(path.join(SUMMARY_DIR, "worldcup_matches.json"));
  const teams = readJson(path.join(SUMMARY_DIR, "worldcup_team_summary.json"));
  const people = readJson(path.join(SUMMARY_DIR, "worldcup_person_summary.json"));
  const players = readJson(path.join(SUMMARY_DIR, "worldcup_player_summary.json"));

  const latestMatches = [...matches]
    .sort((a, b) => {
      const dateCompare = String(b.match_date).localeCompare(String(a.match_date));
      if (dateCompare !== 0) return dateCompare;
      return Number(b.match_id) - Number(a.match_id);
    })
    .slice(0, 10);

  const topPlayers = [...players]
    .sort((a, b) => {
      if (b.appearances !== a.appearances) return b.appearances - a.appearances;
      if ((b.minutes_estimate || 0) !== (a.minutes_estimate || 0)) {
        return (b.minutes_estimate || 0) - (a.minutes_estimate || 0);
      }
      return (b.starts || 0) - (a.starts || 0);
    })
    .slice(0, 15);

  const topScorers = [...players]
    .filter((player) => (player.goals || 0) > 0 || (player.xg || 0) > 0 || (player.shots || 0) > 0)
    .sort((a, b) => {
      if ((b.goals || 0) !== (a.goals || 0)) return (b.goals || 0) - (a.goals || 0);
      if ((b.shots_on_target || 0) !== (a.shots_on_target || 0)) {
        return (b.shots_on_target || 0) - (a.shots_on_target || 0);
      }
      if ((b.xg || 0) !== (a.xg || 0)) return (b.xg || 0) - (a.xg || 0);
      return (b.shots || 0) - (a.shots || 0);
    })
    .slice(0, 10);

  const snapshot = {
    updated_at: new Date().toISOString(),
    match_count: matches.length,
    team_count: teams.length,
    person_count: people.length,
    player_count: players.length,
    top_teams: teams.slice(0, 10),
    top_people: people.slice(0, 10),
    top_players: topPlayers,
    top_scorers: topScorers,
    latest_matches: latestMatches,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Snapshot written to ${OUTPUT_FILE}`);
}

main();
