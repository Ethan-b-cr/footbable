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

  const snapshot = {
    updated_at: new Date().toISOString(),
    match_count: matches.length,
    team_count: teams.length,
    person_count: people.length,
    player_count: players.length,
    top_teams: teams.slice(0, 10),
    top_people: people.slice(0, 10),
    top_players: players.slice(0, 15),
    top_scorers: [...players]
      .sort((a, b) => (b.goals || 0) - (a.goals || 0))
      .slice(0, 10),
    latest_matches: matches.slice(-10).reverse(),
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Snapshot written to ${OUTPUT_FILE}`);
}

main();
