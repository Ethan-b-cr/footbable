const TEAM_ALIASES = {
  "South Korea": "Korea Republic",
  Korea: "Korea Republic",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  Turkiye: "Türkiye",
  Turkey: "Türkiye",
  "Ivory Coast": "Côte d’Ivoire",
  "Ivory Coast ": "Côte d’Ivoire",
  "DR Congo": "Congo DR",
  "Congo DR": "Congo DR",
};

const normalizePlain = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const canonicalTeamName = (teamName) => TEAM_ALIASES[teamName] || teamName;

function findTeamSummary(teamName, teams) {
  const canonical = canonicalTeamName(teamName);
  const normalized = normalizePlain(canonical);
  return (
    teams.find((team) => normalizePlain(team.team) === normalized) ||
    teams.find((team) => normalizePlain(team.team).includes(normalized)) ||
    null
  );
}

function normalizeScoreboardEvents(events) {
  return [...(events || [])]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((event, index) => {
      const competition = event.competitions?.[0] || {};
      const competitors = competition.competitors || [];
      const home = competitors.find((item) => item.homeAway === "home") || competitors[0] || {};
      const away = competitors.find((item) => item.homeAway === "away") || competitors[1] || {};
      const statusType = event.status?.type || {};
      return {
        matchNumber: index + 1,
        eventId: event.id,
        date: event.date,
        stage: competition.status?.type?.description || event.season?.type?.name || "",
        statusState: statusType.state || "pre",
        statusText: statusType.description || "Scheduled",
        minuteText: statusType.shortDetail && statusType.shortDetail !== "Scheduled" ? statusType.shortDetail : "",
        detailText: statusType.detail || statusType.shortDetail || "",
        isComplete: Boolean(statusType.completed),
        venue: competition.venue?.fullName || "",
        city: competition.venue?.address?.city || "",
        homeTeam: home.team?.displayName || "",
        awayTeam: away.team?.displayName || "",
        homeScore: Number(home.score || 0),
        awayScore: Number(away.score || 0),
      };
    });
}

function findKeyPlayer(teamName, players) {
  const canonical = canonicalTeamName(teamName);
  return [...(players || [])]
    .filter((player) => normalizePlain(player.team_name) === normalizePlain(canonical))
    .sort((a, b) => {
      const aScore = (a.goals || 0) * 4 + (a.assists || 0) * 2 + (a.xg || 0);
      const bScore = (b.goals || 0) * 4 + (b.assists || 0) * 2 + (b.xg || 0);
      return bScore - aScore;
    })[0] || null;
}

function buildEdge(team) {
  if (!team) return 0;
  const matches = Math.max(team.matches || 0, 1);
  const winRate = (team.wins || 0) / matches;
  const xgDiff = ((team.xg_for || 0) - (team.xg_against || 0)) / matches;
  const shotPressure = ((team.shots || 0) + (team.shots_on_target || 0)) / matches / 15;
  return winRate * 100 + xgDiff * 12 + shotPressure * 10;
}

function buildMatchInsight(match, teams, players) {
  const homeTeam = findTeamSummary(match.homeTeam, teams);
  const awayTeam = findTeamSummary(match.awayTeam, teams);
  const homeEdge = buildEdge(homeTeam);
  const awayEdge = buildEdge(awayTeam);
  const edgeTeam = homeEdge >= awayEdge ? match.homeTeam : match.awayTeam;
  const edgeValue = Math.abs(homeEdge - awayEdge);
  const leader = edgeTeam === match.homeTeam ? homeTeam : awayTeam;
  const trailer = edgeTeam === match.homeTeam ? awayTeam : homeTeam;
  const keyPlayer = findKeyPlayer(edgeTeam, players);

  const primary = leader
    ? `${edgeTeam} 的历史结构更稳，${leader.matches} 场样本里胜率 ${(((leader.wins || 0) / Math.max(leader.matches || 1, 1)) * 100).toFixed(1)}%。`
    : `${edgeTeam} 当前更像主动方，节奏和控场更值得先看。`;

  const secondary = leader && trailer
    ? `${edgeTeam} 场均 xG ${((leader.xg_for || 0) / Math.max(leader.matches || 1, 1)).toFixed(2)}，对手场均 xG ${((trailer.xg_for || 0) / Math.max(trailer.matches || 1, 1)).toFixed(2)}，边际差 ${edgeValue.toFixed(1)}。`
    : "先看射门质量和比赛前 20 分钟的压制强度，再决定是否继续追。";

  const playerLine = keyPlayer
    ? `${keyPlayer.player_name} 是这场最值得盯的个人点，样本内 ${keyPlayer.goals || 0} 球，xG ${Number(keyPlayer.xg || 0).toFixed(2)}。`
    : `${edgeTeam} 这边更需要盯住前场终结点和二次进攻。`;

  return {
    edgeTeam,
    primary,
    secondary,
    keyPlayer: playerLine,
  };
}

const exported = {
  TEAM_ALIASES,
  normalizeScoreboardEvents,
  buildMatchInsight,
  findTeamSummary,
  canonicalTeamName,
};

if (typeof module !== "undefined") {
  module.exports = exported;
}

if (typeof globalThis !== "undefined") {
  globalThis.LiveScheduleUtils = exported;
}
