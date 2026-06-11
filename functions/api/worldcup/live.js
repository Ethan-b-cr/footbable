import liveScheduleUtils from "../../../live-schedule-utils.js";

const { buildMatchInsight, normalizeScoreboardEvents } = liveScheduleUtils;

const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719";

const readJson = async (origin, relativePath) => {
  const response = await fetch(new URL(relativePath, origin).toString(), {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`summary unavailable: ${relativePath} ${response.status}`);
  }

  return response.json();
};

const getScoreboard = async () => {
  const response = await fetch(SCOREBOARD_URL, {
    headers: {
      "user-agent": "WorldCupEdge/1.0",
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`scoreboard unavailable: ${response.status}`);
  }

  return response.json();
};

const formatDateCN = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(date);
};

export async function onRequestGet(context) {
  try {
    const origin = new URL(context.request.url).origin;
    const [scoreboard, teams, players] = await Promise.all([
      getScoreboard(),
      readJson(origin, "/data/summary/worldcup_team_summary.json"),
      readJson(origin, "/data/summary/worldcup_player_summary.json"),
    ]);

    const matches = normalizeScoreboardEvents(scoreboard.events || []).map((match) => {
      const insight = buildMatchInsight(match, teams, players);
      return {
        ...match,
        kickoffCN: formatDateCN(match.date),
        insight,
      };
    });

    const payload = {
      ok: true,
      source: "ESPN scoreboard + local historical summaries",
      updatedAt: new Date().toISOString(),
      matchCount: matches.length,
      openingMatch: matches[0] || null,
      secondMatch: matches[1] || null,
      matches: matches.slice(0, 36),
      lockedCount: Math.max(matches.length - 3, 0),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "live world cup feed unavailable",
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "no-store",
        },
      }
    );
  }
}
