const state = {
  member: readMemberSession(),
  snapshot: null,
  teams: [],
  players: [],
  matches: [],
  liveSchedule: null,
};

const LIVE_REFRESH_INTERVAL_MS = 60000;
const predictionUtils = window.LiveScheduleUtils || {};
const LIVE_SCHEDULE_ENDPOINT = `/api/worldcup/live?v=20260617b`;

function readMemberSession() {
  const raw = window.localStorage.getItem("worldCupEdgeMember");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isMember() {
  return Boolean(state.member?.email);
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function formatNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function perMatch(value, matches, digits = 2) {
  return matches > 0 ? Number(value / matches).toFixed(digits) : Number(0).toFixed(digits);
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const teamArtwork = {
  Argentina: "assets/images/argentina-team.png",
  France: "assets/images/france-team.png",
  Brazil: "assets/images/brazil-team.png",
  England: "assets/images/england-team.png",
  Croatia: "assets/images/france-team.png",
  Morocco: "assets/images/argentina-team.png",
  Netherlands: "assets/images/england-team.png",
  Portugal: "assets/images/portugal-team.png",
  Belgium: "assets/images/belgium-team.png",
  Spain: "assets/images/france-team.png",
};

const teamBackdropArtwork = {
  Argentina: "assets/images/argentina-champion.jpg",
  France: "assets/images/argentina-champion.jpg",
  Brazil: "assets/images/argentina-champion.jpg",
  England: "assets/images/argentina-champion.jpg",
  Croatia: "assets/images/argentina-champion.jpg",
  Morocco: "assets/images/argentina-champion.jpg",
  Netherlands: "assets/images/argentina-champion.jpg",
  Portugal: "assets/images/argentina-champion.jpg",
  Belgium: "assets/images/argentina-champion.jpg",
  Spain: "assets/images/argentina-champion.jpg",
};

const playerArtwork = {
  "Lionel Andres Messi Cuccittini": "assets/images/messi.jpg",
  "Kylian Mbappe Lottin": "assets/images/mbappe.jpg",
  "Antoine Griezmann": "assets/images/mbappe.jpg",
  "Luka Modric": "assets/images/modric.jpg",
  "Harry Kane": "assets/images/harry-kane.jpg",
  "Kevin De Bruyne": "assets/images/ronaldo.jpg",
  "Olivier Giroud": "assets/images/mbappe.jpg",
  "Achraf Hakimi Mouh": "assets/images/mbappe.jpg",
  "Neymar da Silva Santos Junior": "assets/images/ronaldo.jpg",
  "Cristiano Ronaldo dos Santos Aveiro": "assets/images/ronaldo.jpg",
  "Jair Ventura Filho": "assets/images/ronaldo.jpg",
};

const fallbackArtwork = {
  team: "assets/images/argentina-champion.jpg",
  player: "assets/images/mbappe.jpg",
};

const featuredTeamOrder = ["Argentina", "Brazil", "France", "England", "Belgium", "Portugal"];
const featuredPlayerOrder = [
  "Lionel Andres Messi Cuccittini",
  "Kylian Mbappe Lottin",
  "Cristiano Ronaldo dos Santos Aveiro",
  "Harry Kane",
  "Luka Modric",
  "Olivier Giroud",
];

const liveCardArtwork = [
  "assets/images/argentina-champion.jpg",
  "assets/images/messi.jpg",
  "assets/images/mbappe.jpg",
  "assets/images/ronaldo.jpg",
];

const FREE_TEAM_LIMIT = 3;
const FREE_PLAYER_LIMIT = 3;

const articleTeamAliases = {
  "South Korea": "Korea Republic",
  Korea: "Korea Republic",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  USA: "United States",
  "United States of America": "United States",
};

const liveSourceKeys = ["statsbomb_open", "fifa_platform"];

function canonicalTeamName(name) {
  return articleTeamAliases[name] || name;
}

function sameTeam(left, right) {
  const a = normalizeName(canonicalTeamName(left));
  const b = normalizeName(canonicalTeamName(right));
  return Boolean(a && b) && (a === b || a.includes(b) || b.includes(a));
}

function getPlayerImage(playerName) {
  return (
    Object.entries(playerArtwork).find(([name]) => normalizeName(name) === normalizeName(playerName))?.[1] ||
    fallbackArtwork.player
  );
}

function getTeamImage(teamName) {
  return teamArtwork[teamName] || "assets/images/argentina-team.png";
}

function getTeamBackdrop(teamName) {
  return teamBackdropArtwork[teamName] || fallbackArtwork.team;
}

function pickFeaturedTeams(teams) {
  const featured = featuredTeamOrder.map((name) => teams.find((team) => team.team === name)).filter(Boolean);
  const remainder = teams.filter((team) => !featured.some((item) => item.team === team.team));
  return [...featured, ...remainder];
}

function pickFeaturedPlayers(players) {
  const featured = featuredPlayerOrder
    .map((name) => players.find((player) => normalizeName(player.player_name) === normalizeName(name)))
    .filter(Boolean);
  const remainder = players.filter(
    (player) => !featured.some((item) => String(item.player_id) === String(player.player_id))
  );
  return [...featured, ...remainder];
}

function playerScore(player) {
  return (
    (player.goals || 0) * 4 +
    (player.assists || 0) * 3 +
    (player.xg || 0) * 2 +
    (player.shots_on_target || 0) * 0.8 +
    (player.starts || 0) * 0.3
  );
}

function buildTeamModel(team) {
  if (!team) return null;
  const matches = Math.max(team.matches || 1, 1);
  return {
    winRate: formatPercent(((team.wins || 0) / matches) * 100),
    goalsForRate: perMatch(team.goals_for || 0, matches, 2),
    goalsAgainstRate: perMatch(team.goals_against || 0, matches, 2),
    xgForRate: perMatch(team.xg_for || 0, matches, 2),
    xgAgainstRate: perMatch(team.xg_against || 0, matches, 2),
    shotRate: perMatch(team.shots || 0, matches, 1),
    shotAccuracy: team.shots > 0 ? formatPercent(((team.shots_on_target || 0) / team.shots) * 100) : "0.0%",
    edgeScore:
      ((team.wins || 0) / matches) * 46 +
      (((team.xg_for || 0) - (team.xg_against || 0)) / matches) * 13 +
      (((team.goals_for || 0) - (team.goals_against || 0)) / matches) * 9 +
      ((team.shots_on_target || 0) / matches) * 1.8,
  };
}

function findTeamSummary(teamName) {
  return state.teams.find((team) => sameTeam(team.team, teamName)) || null;
}

function findTeamPlayers(teamName) {
  return state.players.filter((player) => sameTeam(player.team_name, teamName));
}

function getTopPlayersByTeam(teamName, limit = 3) {
  return [...findTeamPlayers(teamName)].sort((a, b) => playerScore(b) - playerScore(a)).slice(0, limit);
}

function getRecentMatchesByTeam(teamName, limit = 3) {
  return [...state.matches]
    .filter((match) => sameTeam(match.home_team, teamName) || sameTeam(match.away_team, teamName))
    .sort((a, b) => String(b.match_date).localeCompare(String(a.match_date)))
    .slice(0, limit);
}

function getHeadToHead(homeTeam, awayTeam, limit = 3) {
  return [...state.matches]
    .filter(
      (match) =>
        (sameTeam(match.home_team, homeTeam) && sameTeam(match.away_team, awayTeam)) ||
        (sameTeam(match.home_team, awayTeam) && sameTeam(match.away_team, homeTeam))
    )
    .sort((a, b) => String(b.match_date).localeCompare(String(a.match_date)))
    .slice(0, limit);
}

function getLiveCardArtwork(index) {
  return liveCardArtwork[index % liveCardArtwork.length];
}

function getMatchDetailHref(match) {
  return `article.html?match=${encodeURIComponent(match.eventId)}`;
}

function localizeMatchStageLabel(stage, state) {
  if (predictionUtils.localizeMatchStage) {
    return predictionUtils.localizeMatchStage(stage, state);
  }
  if (state === "post") return "赛果复盘";
  if (state === "in") return "实时进程";
  return stage || "赛前分析";
}

function buildPhaseFallback(match) {
  if (match?.statusState === "post") {
    return { label: "赛果复盘", badge: "全场结束", summary: "" };
  }
  if (match?.statusState === "in") {
    return { label: "实时进程", badge: match?.minuteText || "比赛进行中", summary: "" };
  }
  return { label: "赛前分析", badge: match?.minuteText || "即将开球", summary: "" };
}

function getPredictionDisplayLabel(view) {
  if (view?.displayScore) return view.displayScore;
  return isMember() ? "模型生成中" : "会员可见";
}

function getPredictionFocusText(view) {
  if (view?.locked) return "比分预测已生成，开通会员后查看具体分数与置信度";
  if (view?.displayScore) return `当前预测 ${view.displayScore}`;
  return "预测模型会随实时赛程与历史样本持续修正";
}

function buildPredictionMarkup(prediction, compact = false) {
  const view = predictionUtils.buildPredictionViewModel
    ? predictionUtils.buildPredictionViewModel(prediction, isMember())
    : null;
  if (!view) return "";
  return `
    <div class="prediction-box ${compact ? "prediction-box-compact" : ""} ${view.locked ? "prediction-box-locked" : ""}">
      <span>${view.title}</span>
      <strong>${view.displayScore}</strong>
      <p>${view.summary}${view.confidenceLabel ? ` · 置信 ${view.confidenceLabel}` : ""}</p>
    </div>
  `;
}

function buildHeroTeamPanel(teamName, side) {
  const fallbackTeam = pickFeaturedTeams(state.teams)[side === "home" ? 0 : 1] || state.teams[0] || null;
  const resolvedName = teamName || fallbackTeam?.team || (side === "home" ? "主队" : "客队");
  const team = findTeamSummary(resolvedName);
  const model = buildTeamModel(team);
  const summaryNode = qs(`#hero-${side}-team-summary`);
  const metricsNode = qs(`#hero-${side}-team-metrics`);
  const nameNode = qs(`#hero-${side}-team-name`);
  const badgeNode = qs(`#hero-${side}-team-badge`);
  const panelNode = qs(`.hero-team-${side}`);

  if (nameNode) nameNode.textContent = resolvedName;
  if (badgeNode) {
    badgeNode.src = getTeamImage(resolvedName);
    badgeNode.alt = `${resolvedName}队徽`;
  }
  if (panelNode) {
    panelNode.style.setProperty(
      side === "home" ? "--hero-home-cover" : "--hero-away-cover",
      `url('${getTeamBackdrop(resolvedName)}')`
    );
  }

  if (summaryNode) {
    if (team && model) {
      summaryNode.textContent = `${team.matches} 场真实样本，胜率 ${model.winRate}，重点先看 ${model.xgForRate} 场均 xG 和 ${model.goalsForRate} 场均进球。`;
    } else {
      summaryNode.textContent = "正在读取该队历史样本与公开判断。";
    }
  }

  if (metricsNode) {
    if (team && model) {
      metricsNode.innerHTML = [
        `胜率 ${model.winRate}`,
        `场均 xG ${model.xgForRate}`,
        `场均进球 ${model.goalsForRate}`,
      ]
        .map((item) => `<span>${item}</span>`)
        .join("");
    } else {
      metricsNode.innerHTML = ["胜率 --", "场均 xG --", "场均进球 --"].map((item) => `<span>${item}</span>`).join("");
    }
  }
}

function chooseFeaturedMatches(matches) {
  const list = [...(matches || [])];
  if (!list.length) {
    return { featured: null, nextMatch: null, rail: [] };
  }

  const liveIndex = list.findIndex((match) => match.statusState === "in");
  if (liveIndex >= 0) {
    return {
      featured: list[liveIndex],
      nextMatch: list[liveIndex + 1] || list[liveIndex - 1] || null,
      rail: list.slice(liveIndex, liveIndex + 3),
    };
  }

  const upcomingIndex = list.findIndex((match) => match.statusState === "pre");
  if (upcomingIndex > 0) {
    return {
      featured: list[upcomingIndex - 1],
      nextMatch: list[upcomingIndex],
      rail: list.slice(Math.max(0, upcomingIndex - 1), upcomingIndex + 2),
    };
  }

  if (upcomingIndex === 0) {
    return {
      featured: list[0],
      nextMatch: list[1] || null,
      rail: list.slice(0, 3),
    };
  }

  return {
    featured: list[list.length - 1],
    nextMatch: list[list.length - 2] || null,
    rail: list.slice(Math.max(0, list.length - 3)),
  };
}

function isFreeTeam(teamName, teams = state.teams) {
  return (
    isMember() ||
    pickFeaturedTeams(teams)
      .slice(0, FREE_TEAM_LIMIT)
      .some((team) => String(team.team) === String(teamName))
  );
}

function isFreePlayer(playerId, players = state.players) {
  return (
    isMember() ||
    pickFeaturedPlayers(players)
      .slice(0, FREE_PLAYER_LIMIT)
      .some((player) => String(player.player_id) === String(playerId))
  );
}

function setHeaderState() {
  const loginLink = qs(".header-link");
  const logoutButton = qs("#logout-button");

  if (loginLink && isMember()) {
    loginLink.textContent = "会员已登录";
    loginLink.href = "members.html";
  }

  if (logoutButton && isMember()) {
    logoutButton.hidden = false;
    logoutButton.addEventListener("click", () => {
      window.localStorage.removeItem("worldCupEdgeMember");
      window.location.href = "index.html";
    });
  }
}

function setRevealAnimations() {
  const animatedSections = document.querySelectorAll(".hero-copy, .hero-panel, .site-footer");
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.16 }
  );
  animatedSections.forEach((section) => {
    section.classList.add("reveal");
    observer.observe(section);
  });
}

function buildTable(headers, rows) {
  if (!rows.length) {
    return '<p class="table-empty">当前暂无可展示内容。</p>';
  }
  return `
    <table class="data-table">
      <thead>
        <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function buildEntityCard(teamOrPlayer, options) {
  if (options.type === "team") {
    const team = teamOrPlayer;
    const locked = options.locked;
    const href = locked ? "members.html" : `team.html?team=${encodeURIComponent(team.team)}`;
    const badgeText = locked ? "完整版本" : "球队分析";
    const linkText = locked ? "查看完整页" : "进入球队页面";
    const winRate = formatPercent((team.wins / Math.max(team.matches, 1)) * 100);
    const lockHint = locked ? "解锁该球队的完整样本、对照与深度判断" : "";
    return `
      <article class="entity-card ${locked ? "locked-card" : ""}">
        <div class="entity-media team-stage-media">
          <img class="team-stage-photo" src="${getTeamBackdrop(team.team)}" alt="${team.team} 球队画面" loading="lazy">
          <img class="team-badge-image" src="${getTeamImage(team.team)}" alt="" loading="lazy" aria-hidden="true">
        </div>
        <div class="entity-body">
          <span class="article-meta">${badgeText}</span>
          <h3>${team.team}</h3>
          <p>${team.matches} 场样本，胜率 ${winRate}，场均射门 ${perMatch(team.shots || 0, team.matches, 1)}，场均 xG ${perMatch(team.xg_for || 0, team.matches, 2)}。</p>
          <div class="entity-tags">
            <span>${team.goals_for} 进球</span>
            <span>${team.goals_against} 失球</span>
            <span>${team.shots_on_target || 0} 次射正</span>
          </div>
          ${locked ? `<div class="entity-lock-copy">${lockHint}</div>` : ""}
          <a class="article-link" href="${href}">${linkText}</a>
        </div>
      </article>
    `;
  }

  const player = teamOrPlayer;
  const locked = options.locked;
  const href = locked ? "members.html" : `player.html?id=${player.player_id}`;
  const badgeText = locked ? "完整版本" : "球员分析";
  const linkText = locked ? "查看完整页" : "进入球员页面";
  const passRate = player.passes > 0 ? formatPercent((player.completed_passes / player.passes) * 100) : "0.0%";
  const lockHint = locked ? "解锁该球员的完整效率、角色和重点比赛样本" : "";

  return `
    <article class="entity-card ${locked ? "locked-card" : ""}">
      <div class="entity-media">
        <img src="${getPlayerImage(player.player_name)}" alt="${player.player_name} 球员画面" loading="lazy">
      </div>
      <div class="entity-body">
        <span class="article-meta">${badgeText}</span>
        <h3>${player.player_name}</h3>
        <p>${player.team_name}，${player.appearances} 次出场，${player.goals || 0} 球，xG ${formatNumber(player.xg || 0, 2)}。</p>
        <div class="entity-tags">
          <span>${player.starts || 0} 次首发</span>
          <span>${passRate} 传球成功率</span>
          <span>${player.shots || 0} 次射门</span>
        </div>
        ${locked ? `<div class="entity-lock-copy">${lockHint}</div>` : ""}
        <a class="article-link" href="${href}">${linkText}</a>
      </div>
    </article>
  `;
}

function buildLiveMatchCard(match, index) {
  const insight = match.insight || {};
  const prediction = match.prediction || null;
  const phase = predictionUtils.buildMatchPhaseViewModel
    ? predictionUtils.buildMatchPhaseViewModel(match)
    : buildPhaseFallback(match);
  const scoreText = match.statusState === "pre" ? "VS" : `${match.homeScore}-${match.awayScore}`;
  const statusText = phase.badge;
  const ctaText = isMember() ? "进入完整比赛页" : "进入比赛页";
  return `
    <article class="live-match-card" style="--card-cover:url('${getLiveCardArtwork(index)}')">
      <div class="card-top">
        <span class="time-badge">Match ${String(match.matchNumber).padStart(2, "0")}</span>
        <span class="access access-free">${phase.label}</span>
      </div>
      <div class="live-card-body">
        <div>
          <strong>${match.kickoffCN}</strong>
          <h4>${match.homeTeam} vs ${match.awayTeam}</h4>
          <p>${match.venue || "世界杯赛场"}${match.city ? ` · ${match.city}` : ""}</p>
        </div>
        <div class="live-card-score">
          <div class="live-team-stack">
            <span>主队</span>
            <strong>${match.homeTeam}</strong>
          </div>
          <strong>${scoreText}</strong>
          <div class="live-team-stack">
            <span>客队</span>
            <strong>${match.awayTeam}</strong>
          </div>
        </div>
        <div class="live-insight-copy">
          <p>${insight.primary || "先看开场 20 分钟的压制和机会质量。"}</p>
          <p>${insight.secondary || "历史样本和实时状态会一起修正判断。"}</p>
          <p>${insight.keyPlayer || ""}</p>
        </div>
        ${buildPredictionMarkup(prediction, true)}
        <div class="live-footer-row">
          <span class="live-chip">${statusText}</span>
          <a class="article-link" href="${getMatchDetailHref(match)}">${ctaText}</a>
        </div>
      </div>
    </article>
  `;
}

function renderLiveSchedule() {
  const payload = state.liveSchedule;
  if (!payload?.matches?.length) {
    renderLiveFallback();
    return;
  }

  const opening = payload.openingMatch;
  const second = payload.secondMatch;
  const { featured, nextMatch, rail } = chooseFeaturedMatches(payload.matches);
  if (!featured) {
    renderLiveFallback();
    return;
  }

  const homeHero = qs("#live-schedule-hero");
  const homeMeta = qs("#live-schedule-meta");
  const homeGrid = qs("#live-match-grid");
  const homeFooter = qs("#live-schedule-footer");
  const heroMatchTitle = qs("#hero-match-title");
  const heroMatchCopy = qs("#hero-match-copy");
  const heroMatchTags = qs("#hero-match-tags");
  const heroMatchPrimary = qs("#hero-match-primary");
  const heroMatchNumber = qs("#hero-match-number");
  const heroVsStatus = qs("#hero-vs-status");
  const heroNextMatchTitle = qs("#hero-next-match-title");
  const heroNextMatchCopy = qs("#hero-next-match-copy");
  const heroNextMatchLink = qs("#hero-next-match-link");
  const publicGrid = qs("#public-live-match-grid");
  const memberHero = qs("#member-live-schedule-hero");
  const memberMeta = qs("#member-live-schedule-meta");
  const memberGrid = qs("#member-live-match-grid");

  if (heroMatchTitle && heroMatchCopy && heroMatchTags) {
    const featuredPrediction = predictionUtils.buildPredictionViewModel
      ? predictionUtils.buildPredictionViewModel(featured.prediction, isMember())
      : null;
    const featuredPhase = predictionUtils.buildMatchPhaseViewModel
      ? predictionUtils.buildMatchPhaseViewModel(featured)
      : buildPhaseFallback(featured);
    heroMatchTitle.textContent = `${featured.homeTeam} vs ${featured.awayTeam}`;
    heroMatchCopy.textContent = `${featured.kickoffCN} 开球，当前阶段 ${featuredPhase?.label || "赛前分析"}。公开层先给比赛轮廓，具体比分预测继续放在完整版本里。`;
    heroMatchTags.innerHTML = [
      `${featuredPhase?.label || "焦点战"} ${featured.homeTeam} vs ${featured.awayTeam}`,
      nextMatch ? `下一场 ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}` : `开幕战 ${opening?.homeTeam || ""} vs ${opening?.awayTeam || ""}`,
      `比分 ${getPredictionDisplayLabel(featuredPrediction)}`,
    ]
      .map((item) => `<span>${item}</span>`)
      .join("");

    if (heroMatchPrimary) heroMatchPrimary.href = getMatchDetailHref(featured);
    if (heroMatchNumber) heroMatchNumber.textContent = `Match ${String(featured.matchNumber).padStart(2, "0")}`;
    if (heroVsStatus) heroVsStatus.textContent = featuredPhase?.badge || "实时同步";

    buildHeroTeamPanel(featured.homeTeam, "home");
    buildHeroTeamPanel(featured.awayTeam, "away");

    if (heroNextMatchTitle && nextMatch) {
      const nextPrediction = predictionUtils.buildPredictionViewModel
        ? predictionUtils.buildPredictionViewModel(nextMatch.prediction, isMember())
        : null;
      heroNextMatchTitle.textContent = `${nextMatch.homeTeam} vs ${nextMatch.awayTeam}`;
      if (heroNextMatchCopy) {
        heroNextMatchCopy.textContent = `${nextMatch.kickoffCN} 开球，先看公开分析；比分预测显示为 ${getPredictionDisplayLabel(nextPrediction)}，完整判断继续放在会员层。`;
      }
      if (heroNextMatchLink) heroNextMatchLink.href = getMatchDetailHref(nextMatch);
    }

    updateHeroCinematic(featured);
  }

  if (homeHero && homeGrid && homeFooter) {
    const featuredPhase = predictionUtils.buildMatchPhaseViewModel
      ? predictionUtils.buildMatchPhaseViewModel(featured)
      : buildPhaseFallback(featured);
    homeHero.innerHTML = `
      <div class="live-schedule-copy">
        <span class="article-meta">2026 美加墨世界杯</span>
        <h3>${featuredPhase?.label || "当前焦点战"} ${featured.homeTeam} vs ${featured.awayTeam}</h3>
        <p>${nextMatch ? `下一场 ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}。` : ""}今日比赛已同步到站内，点击单场直接进入公开分析页。</p>
      </div>
      <div class="live-schedule-meta">
        <span>更新 ${new Date(payload.updatedAt).toLocaleString("zh-CN", { hour12: false })}</span>
        <span>总赛程 ${payload.matchCount} 场</span>
        <span>实时赛程 + 历史样本</span>
      </div>
    `;
    homeGrid.innerHTML = (rail.length ? rail : payload.matches.slice(0, 3)).map((match, index) => buildLiveMatchCard(match, index)).join("");
    homeFooter.innerHTML = `
      <span>全部比赛持续更新，单场入口已全部打开。</span>
      <a class="article-link" href="data.html">查看全部比赛</a>
    `;
    if (homeMeta) {
      homeMeta.innerHTML = `
        <span>焦点战 ${featured.kickoffCN || ""}</span>
        <span>${nextMatch ? `下一场 ${nextMatch.kickoffCN || ""}` : `开幕战 ${opening?.kickoffCN || ""}`}</span>
        <span>已接入 ${payload.matches.length} 场</span>
      `;
    }
  }

  if (publicGrid) {
    publicGrid.innerHTML = payload.matches.map((match, index) => buildLiveMatchCard(match, index)).join("");
  }

  if (memberHero && memberGrid) {
    memberHero.innerHTML = `
      <div class="live-schedule-copy">
        <span class="article-meta">会员赛程</span>
        <h3>完整赛程 + 单场深度入口</h3>
        <p>从开幕战到决赛，全部比赛都可以从这里直接进入单场详情与完整版本，重点场次会持续补齐修正。</p>
      </div>
      <div class="live-schedule-meta">
        <span>首场 ${opening?.homeTeam || ""} vs ${opening?.awayTeam || ""}</span>
        <span>次场 ${second?.homeTeam || ""} vs ${second?.awayTeam || ""}</span>
        <span>总数 ${payload.matchCount} 场</span>
      </div>
    `;
    memberGrid.innerHTML = payload.matches.map((match, index) => buildLiveMatchCard(match, index)).join("");
    if (memberMeta) {
      memberMeta.innerHTML = `
        <span>更新 ${new Date(payload.updatedAt).toLocaleString("zh-CN", { hour12: false })}</span>
        <span>已接入 ${payload.matches.length} 场</span>
        <span>登录状态已同步</span>
      `;
    }
  }
}

function renderLiveFallback() {
  const targets = [
    { hero: qs("#live-schedule-hero"), grid: qs("#live-match-grid"), footer: qs("#live-schedule-footer") },
    { hero: qs("#member-live-schedule-hero"), grid: qs("#member-live-match-grid"), footer: null },
  ];
  targets.forEach(({ hero, grid, footer }) => {
    if (hero) {
      hero.innerHTML = `
        <div class="live-schedule-copy">
          <span class="article-meta">实时赛程</span>
          <h3>赛程接口暂时不可用</h3>
          <p>刷新后会继续接入实时世界杯赛程和浅层分析。</p>
        </div>
        <div class="live-schedule-meta">
          <span>等待恢复</span>
        </div>
      `;
    }
    if (grid) {
      grid.innerHTML = `
        <article class="live-match-card loading-card" style="--card-cover:url('assets/images/argentina-champion.jpg')">
          <span class="time-badge">Live</span>
          <strong>稍后刷新</strong>
        </article>
      `;
    }
    if (footer) {
      footer.innerHTML = `<span>实时接口恢复后会继续更新</span><a class="article-link" href="members.html">查看完整内容</a>`;
    }
  });

  const publicGrid = qs("#public-live-match-grid");
  if (publicGrid) {
    publicGrid.innerHTML = `
      <article class="live-match-card loading-card" style="--card-cover:url('assets/images/argentina-champion.jpg')">
        <span class="time-badge">Live</span>
        <strong>比赛流稍后刷新</strong>
      </article>
    `;
  }

  buildHeroTeamPanel("", "home");
  buildHeroTeamPanel("", "away");

  const heroMatchNumber = qs("#hero-match-number");
  const heroMatchTitle = qs("#hero-match-title");
  const heroMatchCopy = qs("#hero-match-copy");
  const heroMatchTags = qs("#hero-match-tags");
  const heroVsStatus = qs("#hero-vs-status");
  const heroNextMatchTitle = qs("#hero-next-match-title");
  const heroNextMatchCopy = qs("#hero-next-match-copy");
  if (heroMatchNumber) heroMatchNumber.textContent = "焦点战";
  if (heroMatchTitle) heroMatchTitle.textContent = "今日重点场正在同步";
  if (heroMatchCopy) heroMatchCopy.textContent = "实时赛程恢复前，先看热门球队真实样本与公开判断结构。";
  if (heroMatchTags) {
    heroMatchTags.innerHTML = ["公开分析", "实时同步", "会员预测"].map((item) => `<span>${item}</span>`).join("");
  }
  if (heroVsStatus) heroVsStatus.textContent = "等待同步";
  if (heroNextMatchTitle) heroNextMatchTitle.textContent = "正在载入第二场比赛";
  if (heroNextMatchCopy) heroNextMatchCopy.textContent = "下一场比赛的对阵、公开判断和会员预测入口会继续在这里展示。";
}

function renderSnapshotCards() {
  const snapshot = state.snapshot;
  if (!snapshot) return;

  const summaryCards = qs("#data-summary-cards");
  if (summaryCards) {
    summaryCards.innerHTML = `
      <article class="article-card">
        <span class="article-meta">历史比赛</span>
        <h3>${snapshot.match_count} 场</h3>
        <p>当前本地快照已整理的世界杯比赛总量。</p>
      </article>
      <article class="article-card">
        <span class="article-meta">球队样本</span>
        <h3>${snapshot.team_count} 支</h3>
        <p>已整理球队层的胜平负、进失球、射门和 xG。</p>
      </article>
      <article class="article-card">
        <span class="article-meta">人员记录</span>
        <h3>${snapshot.person_count} 条</h3>
        <p>包含教练组与其他关键人员的公开记录。</p>
      </article>
      <article class="article-card">
        <span class="article-meta">球员样本</span>
        <h3>${snapshot.player_count} 人</h3>
        <p>覆盖出场、首发、分钟、射门、xG 与传球数据。</p>
      </article>
    `;
  }

  const dataStatus = qs("#data-status-text");
  if (dataStatus) {
    dataStatus.textContent = `最近更新：${snapshot.updated_at}。当前包含 ${snapshot.match_count} 场比赛、${snapshot.team_count} 支球队、${snapshot.player_count} 名球员。`;
  }

  const leadScorer = snapshot.top_scorers?.[0];
  const latestFinal = snapshot.latest_matches?.[0];

  const insightBoard = qs("#data-insight-board");
  if (insightBoard) {
    insightBoard.innerHTML = `
      <article class="insight-card">
        <span>最新快照</span>
        <strong>${String(snapshot.updated_at).slice(0, 10)}</strong>
        <p>${snapshot.match_count} 场历史比赛，${snapshot.team_count} 支球队，${snapshot.player_count} 名球员。</p>
      </article>
      <article class="insight-card muted">
        <span>完整版本</span>
        <strong>完整比赛页 + 资料库</strong>
        <p>重点比赛、球队库和球员库都已接入站内浏览路径。</p>
      </article>
    `;
  }

  const scorerSpotlight = qs("#homepage-scorer-spotlight");
  if (scorerSpotlight && leadScorer) {
    scorerSpotlight.innerHTML = `
      <article class="pulse-media-card">
        <img src="${getPlayerImage(leadScorer.player_name)}" alt="${leadScorer.player_name} 球员画面" loading="lazy">
        <div class="pulse-media-copy">
          <span>头号球星</span>
          <h2>${leadScorer.player_name}</h2>
          <p>${leadScorer.team_name}，进球效率、射门质量与关键回合参与度都处于高位。</p>
          <div class="stat-chip-row">
            <span>${leadScorer.goals || 0} 球</span>
            <span>${formatNumber(leadScorer.xg || 0, 2)} xG</span>
            <span>${leadScorer.appearances || 0} 场</span>
          </div>
          <a class="article-link" href="player.html?id=${leadScorer.player_id}">查看球员</a>
        </div>
      </article>
    `;
  }

  const finalsBoard = qs("#homepage-finals-board");
  if (finalsBoard && latestFinal) {
    finalsBoard.innerHTML = `
      <article class="pulse-media-card pulse-media-card-final">
        <img src="assets/images/argentina-champion.jpg" alt="冠军比赛画面" loading="lazy">
        <div class="pulse-media-copy">
          <span>冠军样本</span>
          <h2>${latestFinal.home_team} vs ${latestFinal.away_team}</h2>
          <p>${latestFinal.stage}，比分 ${latestFinal.home_score}-${latestFinal.away_score}。</p>
          <div class="stat-chip-row">
            <span>${latestFinal.match_date}</span>
            <span>${latestFinal.stage}</span>
            <span>${latestFinal.home_score}-${latestFinal.away_score}</span>
          </div>
          <a class="article-link" href="data.html">查看数据</a>
        </div>
      </article>
    `;
  }

  const teamSpotlight = qs("#homepage-team-spotlight");
  const featuredTeam = pickFeaturedTeams(state.teams)[1] || pickFeaturedTeams(state.teams)[0];
  if (teamSpotlight && featuredTeam) {
    const teamModel = buildTeamModel(featuredTeam);
    teamSpotlight.innerHTML = `
      <article class="pulse-media-card">
        <img src="${getTeamBackdrop(featuredTeam.team)}" alt="${featuredTeam.team} 球队画面" loading="lazy">
        <div class="pulse-media-copy">
          <span>焦点球队</span>
          <h2>${featuredTeam.team}</h2>
          <p>${featuredTeam.team} 的强弱边、推进质量与代表性比赛样本已经整理到球队页。</p>
          <div class="stat-chip-row">
            <span>${featuredTeam.matches} 场</span>
            <span>${teamModel?.xgForRate || "0.00"} xG</span>
            <span>${featuredTeam.wins || 0} 胜</span>
          </div>
          <a class="article-link" href="team.html?team=${encodeURIComponent(featuredTeam.team)}">查看球队</a>
        </div>
      </article>
    `;
  }

  const dataScorer = qs("#data-scorer-spotlight");
  if (dataScorer && leadScorer) {
    dataScorer.innerHTML = `
      <div class="spotlight-stat-card">
        <p class="eyebrow">头部球星快照</p>
        <h3>${leadScorer.player_name}</h3>
        <p>${leadScorer.team_name} 的终结样本已经足够直接，进球、射正和 xG 一眼就能读出来。</p>
        <div class="stat-chip-row">
          <span>${leadScorer.goals || 0} 球</span>
          <span>${leadScorer.shots_on_target || 0} 次射正</span>
          <span>${formatNumber(leadScorer.xg || 0, 2)} xG</span>
        </div>
        <a class="article-link" href="player.html?id=${leadScorer.player_id}">查看球员详情</a>
      </div>
    `;
  }

  const dataFinal = qs("#data-final-snapshot");
  if (dataFinal && latestFinal) {
    dataFinal.innerHTML = `
      <div class="spotlight-stat-card">
        <p class="eyebrow">冠军阶段样本</p>
        <h3>${latestFinal.home_team} ${latestFinal.home_score}-${latestFinal.away_score} ${latestFinal.away_team}</h3>
        <p>${latestFinal.season} 年 ${latestFinal.stage} 的关键比分、阶段和对阵关系已经直接落进快照。</p>
        <div class="stat-chip-row">
          <span>${latestFinal.match_date}</span>
          <span>${latestFinal.stage}</span>
          <span>${latestFinal.home_team}</span>
          <span>${latestFinal.away_team}</span>
        </div>
      </div>
    `;
  }
}

function renderTables() {
  const snapshot = state.snapshot;
  if (!snapshot) return;

  const teamTable = qs("#team-summary-table");
  if (teamTable) {
    teamTable.innerHTML = buildTable(
      ["球队", "场次", "胜", "平", "负", "进球", "失球"],
      snapshot.top_teams.map((team) => [
        `<a href="${isFreeTeam(team.team, snapshot.top_teams) ? `team.html?team=${encodeURIComponent(team.team)}` : "members.html"}">${team.team}</a>`,
        team.matches,
        team.wins,
        team.draws,
        team.losses,
        team.goals_for,
        team.goals_against,
      ])
    );
  }

  const latestMatches = qs("#latest-matches-table");
  if (latestMatches) {
    latestMatches.innerHTML = buildTable(
      ["赛季", "比赛", "比分", "日期"],
      snapshot.latest_matches.map((match) => [
        match.season,
        `${match.home_team} vs ${match.away_team}`,
        `${match.home_score}-${match.away_score}`,
        match.match_date,
      ])
    );
  }

  const playerTable = qs("#player-summary-table");
  if (playerTable) {
    playerTable.innerHTML = buildTable(
      ["球员", "球队", "出场", "首发", "分钟", "进球", "xG"],
      snapshot.top_players.map((player) => [
        `<a href="${isFreePlayer(player.player_id, snapshot.top_players) ? `player.html?id=${player.player_id}` : "members.html"}">${player.player_name}</a>`,
        player.team_name,
        player.appearances,
        player.starts,
        player.minutes_estimate,
        player.goals || 0,
        formatNumber(player.xg || 0, 2),
      ])
    );
  }

  const scorerTable = qs("#scorer-summary-table");
  if (scorerTable) {
    scorerTable.innerHTML = buildTable(
      ["球员", "球队", "进球", "射门", "射正", "xG"],
      snapshot.top_scorers.map((player) => [
        `<a href="${isFreePlayer(player.player_id, snapshot.top_scorers) ? `player.html?id=${player.player_id}` : "members.html"}">${player.player_name}</a>`,
        player.team_name,
        player.goals || 0,
        player.shots || 0,
        player.shots_on_target || 0,
        formatNumber(player.xg || 0, 2),
      ])
    );
  }
}

function renderTeamCards() {
  const homeList = qs("#team-library-list");
  const pageList = qs("#teams-page-list");
  const featured = pickFeaturedTeams(state.teams);

  if (homeList) {
    homeList.innerHTML = featured
      .slice(0, 6)
      .map((team, index) => buildEntityCard(team, { type: "team", locked: index >= FREE_TEAM_LIMIT }))
      .join("");
  }

  if (pageList) {
    const render = (items) => {
      pageList.innerHTML = items
        .slice(0, 24)
        .map((team, index) => buildEntityCard(team, { type: "team", locked: index >= FREE_TEAM_LIMIT }))
        .join("");
    };
    render(featured);
    const searchInput = qs("#team-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const keyword = searchInput.value.trim().toLowerCase();
        render(featured.filter((team) => team.team.toLowerCase().includes(keyword)));
      });
    }
  }

  const heroStrip = qs("#hero-team-strip");
  if (heroStrip) {
    heroStrip.innerHTML = featured
      .slice(0, 3)
      .map(
        (team) => `
          <a class="hero-strip-card" href="team.html?team=${encodeURIComponent(team.team)}">
            <strong>${team.team}</strong>
            <span>${team.matches} 场真实样本</span>
          </a>
        `
      )
      .join("");
  }
}

function renderPlayerCards() {
  const visiblePlayers = [...state.players].filter((player) => player.appearances >= 3);
  const featured = pickFeaturedPlayers(visiblePlayers);
  const homeList = qs("#player-library-list");
  const pageList = qs("#players-page-list");

  if (homeList) {
    homeList.innerHTML = featured
      .slice(0, 6)
      .map((player, index) => buildEntityCard(player, { type: "player", locked: index >= FREE_PLAYER_LIMIT }))
      .join("");
  }

  if (pageList) {
    const render = (items) => {
      pageList.innerHTML = items
        .slice(0, 24)
        .map((player, index) => buildEntityCard(player, { type: "player", locked: index >= FREE_PLAYER_LIMIT }))
        .join("");
    };
    render(featured);
    const searchInput = qs("#player-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const keyword = normalizeName(searchInput.value.trim());
        render(featured.filter((player) => normalizeName(player.player_name).includes(keyword)));
      });
    }
  }

  const heroStrip = qs("#hero-player-strip");
  if (heroStrip) {
    heroStrip.innerHTML = featured
      .slice(0, 3)
      .map(
        (player) => `
          <a class="hero-strip-card" href="player.html?id=${player.player_id}">
            <strong>${player.player_name}</strong>
            <span>${player.team_name} / ${player.goals || 0} 球</span>
          </a>
        `
      )
      .join("");
  }
}

function renderMemberPage() {
  const statusTitle = qs("#member-status-title");
  const statusText = qs("#member-status-text");
  const primaryAction = qs("#member-primary-action");
  const emailCard = qs("#member-email-card");
  const emailText = qs("#member-email-text");
  const library = qs("#member-library-list");

  if (statusTitle && statusText && primaryAction) {
    if (isMember()) {
      statusTitle.textContent = "当前已登录";
      statusText.textContent = `账号 ${state.member.email} 已进入完整版本，可直接查看单场全景页、球队库和球员库。`;
      primaryAction.textContent = "继续查看完整版本";
      primaryAction.href = "article.html?match=760415";
      if (emailCard && emailText) {
        emailCard.hidden = false;
        emailText.textContent = state.member.email;
      }
    } else {
      statusTitle.textContent = "查看完整版本";
      statusText.textContent = "登录或开通后，可直接进入单场全景页、球队库和球员库。";
      primaryAction.textContent = "查看方案";
      primaryAction.href = "pay.html";
    }
  }

  if (library && window.worldCupArticles) {
    library.innerHTML = Object.values(window.worldCupArticles)
      .map((article) => {
        const locked = article.requiresMember && !isMember();
        const href = locked ? "login.html" : `article.html?slug=${article.slug}`;
        return `
          <article class="article-card ${locked ? "locked-card" : ""}">
            <span class="article-meta">${article.category}</span>
            <h3>${article.title}</h3>
            <p>${article.summary}</p>
            ${locked ? `<div class="entity-lock-copy">登录后直接进入完整文章、临场修正和后半段推演。</div>` : ""}
            <div class="library-row">
              <span class="library-badge">${article.requiresMember ? "完整版本" : "公开分析"}</span>
              <a class="article-link" href="${href}">${locked ? "登录后查看" : "进入内容"}</a>
            </div>
          </article>
        `;
      })
      .join("");
  }
}

function renderSourcesPage() {
  const cards = qs("#source-cards");
  if (cards && window.worldCupDataSources) {
    cards.innerHTML = Object.values(window.worldCupDataSources)
      .map(
        (source) => `
          <article class="article-card">
            <span class="article-meta">${source.type}</span>
            <h3>${source.name}</h3>
            <p><strong>覆盖范围：</strong>${source.coverage}</p>
            <p>${source.note}</p>
            <a class="article-link" href="${source.link}" target="_blank" rel="noreferrer">查看来源</a>
          </article>
        `
      )
      .join("");
  }
}

function renderPaymentPage() {
  const paymentModeCopy = qs("#payment-mode-copy");
  const primaryButtons = qsa(".pricing-card .button.button-primary");
  const secondaryButtons = qsa(".pricing-card .button.button-secondary");
  if (paymentModeCopy && window.FOOTBABLE_CONFIG?.paymentMode === "public-self-host") {
    paymentModeCopy.textContent = "网页端优先支付宝，手机端可直接走微信，支付成功后进入站内承接页。";
  }
  primaryButtons.forEach((button) => {
    button.textContent = "支付宝开通";
  });
  secondaryButtons.forEach((button) => {
    button.textContent = "微信扫码开通";
  });
}

function renderCheckoutPage() {
  const heading = qs("#checkout-heading");
  const lead = qs("#checkout-lead");
  const primary = qs("#checkout-primary-action");
  const secondary = qs("#checkout-secondary-action");
  const statusTitle = qs("#checkout-status-title");
  const statusText = qs("#checkout-status-text");
  const metaRow = qs("#checkout-meta-row");
  const providerPill = qs("#checkout-provider-pill");
  const planPill = qs("#checkout-plan-pill");
  if (!heading || !lead || !primary || !secondary || !statusTitle || !statusText || !metaRow || !providerPill || !planPill) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const provider = params.get("provider") || "alipay";
  const plan = params.get("plan") || "monthly";
  const providerLabel = provider === "wechat" ? "微信" : "支付宝";
  const planLabelMap = { monthly: "月会员", quarterly: "季会员", single: "单场包" };
  const amountMap = { monthly: "¥39", quarterly: "¥99", single: "¥19" };
  const planLabel = planLabelMap[plan] || "会员方案";
  const amountLabel = amountMap[plan] || "待确认";

  providerPill.textContent = providerLabel;
  planPill.textContent = `${planLabel} · ${amountLabel}`;
  heading.textContent = `${providerLabel} 开通页`;
  lead.textContent = "正在读取当前支付通道状态。";
  statusTitle.textContent = "当前状态";
  statusText.textContent = "正在连接支付承接接口。";
  metaRow.innerHTML = `<span>${providerLabel}</span><span>${planLabel}</span><span>${amountLabel}</span>`;

  const apiBase = (window.FOOTBABLE_CONFIG?.paymentApiBase || window.location.origin).replace(/\/$/, "");
  fetch(`${apiBase}/api/pay/${provider}?plan=${encodeURIComponent(plan)}`)
    .then(async (response) => {
      if (!response.ok) return null;
      const type = response.headers.get("content-type") || "";
      return type.includes("application/json") ? response.json() : null;
    })
    .then((payload) => {
      if (payload?.message) {
        statusText.textContent = payload.message;
      } else {
        statusText.textContent = "支付承接页已就位，当前先保留在站内。";
      }
    })
    .catch(() => {
      statusText.textContent = "支付承接页已就位，接口暂时没有返回更多结果。";
    });
}

function renderLoginPage() {
  const form = qs("#login-form");
  const status = qs("#login-status");
  if (!form || !status) return;

  if (isMember()) {
    status.textContent = `已识别账号 ${state.member.email}，正在进入完整内容。`;
    window.setTimeout(() => {
      window.location.href = "members.html";
    }, 700);
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = qs("#login-email")?.value.trim();
    const password = qs("#login-password")?.value.trim();
    if (!email || !password) {
      status.textContent = "请先填写邮箱和密码。";
      return;
    }
    const member = { email, loggedInAt: new Date().toISOString() };
    window.localStorage.setItem("worldCupEdgeMember", JSON.stringify(member));
    status.textContent = `登录成功，正在进入完整内容：${email}`;
    window.location.href = "members.html";
  });
}

function buildTeamNarrative(team) {
  const winRate = formatPercent((team.wins / Math.max(team.matches, 1)) * 100);
  const drawRate = formatPercent((team.draws / Math.max(team.matches, 1)) * 100);
  const goalDiff = team.goals_for - team.goals_against;
  const shotRate = perMatch(team.shots || 0, team.matches, 1);
  const xgForRate = perMatch(team.xg_for || 0, team.matches, 2);
  const xgAgainstRate = perMatch(team.xg_against || 0, team.matches, 2);
  const onTargetRate = team.shots > 0 ? formatPercent(((team.shots_on_target || 0) / team.shots) * 100) : "0.0%";
  return `
    <div class="analysis-stack">
      <p>${team.team} 当前历史样本共 ${team.matches} 场，胜率 ${winRate}，平局占比 ${drawRate}，净胜球 ${goalDiff}。这决定了它在世界杯舞台上的基本稳定性。</p>
      <p>进攻端场均射门 ${shotRate}，场均 xG ${xgForRate}；防守端场均被打出 xG ${xgAgainstRate}。如果一支球队长期 xG 高于实际进球，通常说明创造机会能力不差，但终结效率仍有波动。</p>
      <p>射门转化上，本队共有 ${team.shots_on_target || 0} 次射正，射正占比 ${onTargetRate}。这些稳定指标能帮助判断这支球队的真实进攻质量和比赛上限。</p>
    </div>
  `;
}

function buildTeamEfficiency(team) {
  return `
    <div class="metric-grid">
      <article><span>胜率</span><strong>${formatPercent((team.wins / Math.max(team.matches, 1)) * 100)}</strong><p>衡量长期结果兑现能力。</p></article>
      <article><span>场均进球</span><strong>${perMatch(team.goals_for || 0, team.matches, 2)}</strong><p>反映进攻产出的基础强度。</p></article>
      <article><span>场均失球</span><strong>${perMatch(team.goals_against || 0, team.matches, 2)}</strong><p>反映防线稳定程度。</p></article>
      <article><span>射正率</span><strong>${team.shots > 0 ? formatPercent(((team.shots_on_target || 0) / team.shots) * 100) : "0.0%"}</strong><p>看射门质量是否稳定落在门框范围内。</p></article>
    </div>
  `;
}

function buildTeamStyleTags(team) {
  const tags = [];
  if ((team.xg_for || 0) > (team.goals_for || 0)) tags.push("机会创造型");
  if ((team.goals_for || 0) > (team.xg_for || 0)) tags.push("终结兑现型");
  if ((team.xg_against || 0) < 1.1 * team.matches) tags.push("防守纪律强");
  if ((team.shots || 0) / Math.max(team.matches, 1) > 12) tags.push("主动推进型");
  if ((team.goals_against || 0) / Math.max(team.matches, 1) < 1) tags.push("低失球结构");
  if (!tags.length) tags.push("样本中性", "需要更多临场修正");
  return `<div class="stat-chip-row">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`;
}

function buildPlayerNarrative(player) {
  const startRate = player.appearances > 0 ? formatPercent((player.starts / player.appearances) * 100) : "0.0%";
  const passRate = player.passes > 0 ? formatPercent((player.completed_passes / player.passes) * 100) : "0.0%";
  const shotAccuracy = player.shots > 0 ? formatPercent(((player.shots_on_target || 0) / player.shots) * 100) : "0.0%";
  return `
    <div class="analysis-stack">
      <p>${player.player_name} 当前样本出场 ${player.appearances} 次，首发率 ${startRate}，估算分钟 ${player.minutes_estimate}。这能先判断他是核心球员、轮换球员还是边缘补位球员。</p>
      <p>进攻侧记录为进球 ${player.goals || 0}、助攻 ${player.assists || 0}、射门 ${player.shots || 0}、xG ${formatNumber(player.xg || 0, 2)}。如果 xG 高但进球低，通常意味着机会质量不差但终结波动较大。</p>
      <p>组织侧传球成功率 ${passRate}，射门命中率 ${shotAccuracy}。这些指标能帮助判断他的职责、效率和在比赛里的真实作用。</p>
    </div>
  `;
}

function buildPlayerEfficiency(player) {
  const shotAccuracy = player.shots > 0 ? formatPercent(((player.shots_on_target || 0) / player.shots) * 100) : "0.0%";
  const passRate = player.passes > 0 ? formatPercent((player.completed_passes / player.passes) * 100) : "0.0%";
  const xgPerShot = player.shots > 0 ? formatNumber((player.xg || 0) / player.shots, 2) : "0.00";
  const goalRate = player.appearances > 0 ? formatNumber((player.goals || 0) / player.appearances, 2) : "0.00";
  return `
    <div class="metric-grid">
      <article><span>每场进球</span><strong>${goalRate}</strong><p>看结果端的稳定输出。</p></article>
      <article><span>射门命中率</span><strong>${shotAccuracy}</strong><p>看射门是否能稳定形成门框威胁。</p></article>
      <article><span>传球成功率</span><strong>${passRate}</strong><p>看持球处理是否稳定。</p></article>
      <article><span>单次射门 xG</span><strong>${xgPerShot}</strong><p>看出手位置与机会质量。</p></article>
    </div>
  `;
}

function buildPlayerRoleTags(player) {
  const tags = [];
  if ((player.goals || 0) >= 5) tags.push("终结核心");
  if ((player.assists || 0) >= 2) tags.push("组织支点");
  if (player.starts >= Math.max(3, Math.floor((player.appearances || 0) * 0.7))) tags.push("稳定首发");
  if ((player.shots || 0) >= 10) tags.push("高出手机器");
  if ((player.completed_passes || 0) >= 100) tags.push("参与构建");
  if (!tags.length) tags.push("轮换角色", "样本待扩充");
  return `<div class="stat-chip-row">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`;
}

function buildTeamSignalCards(team) {
  const winRate = (team.wins / Math.max(team.matches, 1)) * 100;
  const shotsPerMatch = Number(perMatch(team.shots || 0, team.matches, 1));
  const goalsPerMatch = Number(perMatch(team.goals_for, team.matches, 2));
  const goalsAgainstPerMatch = Number(perMatch(team.goals_against, team.matches, 2));
  const publicLabel = goalsPerMatch >= 1.8 ? "前场压制明显" : goalsPerMatch >= 1.2 ? "进攻轮廓稳定" : "更依赖机会质量";
  const rhythmLabel = shotsPerMatch >= 12 ? "节奏更主动" : "节奏更克制";
  const memberLabel = winRate >= 60 ? "适合强势场次深挖" : "适合博弈场次深挖";
  return `
    <article>
      <span>公开结论</span>
      <strong>${publicLabel}</strong>
      <p>免费区先看这支球队能不能稳定把比赛推到自己熟悉的进攻区域。</p>
    </article>
    <article>
      <span>节奏倾向</span>
      <strong>${rhythmLabel}</strong>
      <p>${goalsAgainstPerMatch <= 1 ? "失球压力控制得更稳，比赛形态更容易由自己主导。" : "防线波动会放大比赛起伏，节奏更容易被对手带动。"} </p>
    </article>
    <article>
      <span>会员深读</span>
      <strong>${memberLabel}</strong>
      <p>下一层继续拆对位克制、赛段变化和临场名单修正后的方向判断。</p>
    </article>
  `;
}

function buildPlayerSignalCards(player) {
  const goalRate = player.appearances > 0 ? (player.goals || 0) / player.appearances : 0;
  const xgPerShot = player.shots > 0 ? (player.xg || 0) / player.shots : 0;
  const passRate = player.passes > 0 ? (player.completed_passes / player.passes) * 100 : 0;
  const publicLabel = goalRate >= 0.6 ? "终结价值直接" : goalRate >= 0.3 ? "持续参与进攻" : "更依赖比赛场景";
  const roleLabel = passRate >= 82 ? "能参与串联" : xgPerShot >= 0.15 ? "偏禁区终结" : "更看体系支持";
  const memberLabel = player.starts >= Math.max(3, Math.floor((player.appearances || 0) * 0.6)) ? "适合首发场景深挖" : "适合轮换场景深挖";
  return `
    <article>
      <span>公开结论</span>
      <strong>${publicLabel}</strong>
      <p>免费区先看他能不能稳定把机会转成直接产出。</p>
    </article>
    <article>
      <span>角色强度</span>
      <strong>${roleLabel}</strong>
      <p>结合出手质量、传球参与和首发比重判断他在体系里的真实份量。</p>
    </article>
    <article>
      <span>会员深读</span>
      <strong>${memberLabel}</strong>
      <p>下一层继续看对位差异、换人后站位变化和重点场次拆解。</p>
    </article>
  `;
}

function buildTeamMemberNarrative(team) {
  const shotsPerMatch = Number(perMatch(team.shots || 0, team.matches, 1));
  const xgPerMatch = Number(perMatch(team.xg_for || 0, team.matches, 2));
  return `
    <p>开通后继续看 ${team.team} 在不同强度对手面前的推进落点、边路提速点和领先/落后时的比赛形态。</p>
    <p>${shotsPerMatch >= 12 ? "这支球队的出手量足够高，深度层更值得拆哪一侧最容易形成连续压制。" : "这支球队更依赖高质量机会，深度层更值得拆哪些时段最容易形成致命一击。"} 当前场均 xG ${xgPerMatch}，会员页会继续按赛段和对位拆开。</p>
  `;
}

function buildPlayerMemberNarrative(player, team) {
  return `
    <div class="analysis-stack">
      <p>开通后继续看 ${player.player_name} 在不同对位里的拿球位置、射门场景和与 ${player.team_name} 进攻主轴的连接方式。</p>
      <p>${player.starts >= Math.max(3, Math.floor((player.appearances || 0) * 0.6)) ? "他的首发比重不低，深度区更适合做赛前名单确认后的精细判断。" : "他的轮换属性更明显，深度区更适合看替补登场后的节奏变化。"}${team ? ` 结合 ${team.team} 的整体样本一起看，判断会更稳。` : ""}</p>
      <div class="detail-member-pills">
        <span>对位样本</span>
        <span>名单影响</span>
        <span>临场修正</span>
      </div>
    </div>
  `;
}

function buildArticleSignalCards(match, phase, predictionView, favoredTeam) {
  return `
    <article>
      <span>比赛底图</span>
      <strong>${favoredTeam}</strong>
      <p>${phase.label}阶段先看哪一边更像先手，公开区先给你比赛轮廓。</p>
    </article>
    <article>
      <span>比分预测</span>
      <strong>${getPredictionDisplayLabel(predictionView)}</strong>
      <p>${predictionView?.locked ? "具体分数继续锁定在会员层。" : "当前公开显示的是最新预测标签。"} </p>
    </article>
    <article>
      <span>完整版本</span>
      <strong>${match.kickoffCN}</strong>
      <p>名单变化、节奏分支和最终落点都继续放在下一层更新。</p>
    </article>
  `;
}

function updateHeroCinematic(featuredMatch) {
  const cinematicImage = qs("#hero-cinematic-image");
  const cinematicKicker = qs("#hero-cinematic-kicker");
  const cinematicTitle = qs("#hero-cinematic-title");
  const cinematicText = qs("#hero-cinematic-text");
  const playerImage = qs("#hero-cinematic-player-image");
  const playerLabel = qs("#hero-cinematic-player-label");
  const teamImage = qs("#hero-cinematic-team-image");
  const teamLabel = qs("#hero-cinematic-team-label");
  if (!cinematicImage || !cinematicKicker || !cinematicTitle || !cinematicText || !playerImage || !playerLabel || !teamImage || !teamLabel) return;

  if (!featuredMatch) return;

  const phase = predictionUtils.buildMatchPhaseViewModel
    ? predictionUtils.buildMatchPhaseViewModel(featuredMatch)
    : buildPhaseFallback(featuredMatch);
  const focusedTeam = findTeamSummary(featuredMatch.homeTeam) || findTeamSummary(featuredMatch.awayTeam);
  const focusedPlayer =
    getTopPlayersByTeam(featuredMatch.homeTeam, 1)[0] ||
    getTopPlayersByTeam(featuredMatch.awayTeam, 1)[0];
  const visualTeam = focusedTeam?.team || featuredMatch.homeTeam;

  cinematicImage.src = getTeamBackdrop(visualTeam);
  cinematicImage.alt = `${featuredMatch.homeTeam} vs ${featuredMatch.awayTeam}`;
  cinematicKicker.textContent = phase.label;
  cinematicTitle.textContent = `${featuredMatch.homeTeam} vs ${featuredMatch.awayTeam}`;
  cinematicText.textContent = `${featuredMatch.kickoffCN} 开球，先看谁能把比赛推进到自己的节奏区。`;

  if (focusedPlayer) {
    playerImage.src = getPlayerImage(focusedPlayer.player_name);
    playerImage.alt = focusedPlayer.player_name;
    playerLabel.textContent = focusedPlayer.player_name;
  }

  teamImage.src = getTeamImage(visualTeam);
  teamImage.alt = visualTeam;
  teamLabel.textContent = visualTeam;
}

function renderTeamPage() {
  const title = qs("#team-title");
  const summary = qs("#team-summary-text");
  const statList = qs("#team-stat-list");
  const matchesTable = qs("#team-matches-table");
  const analysisBox = qs("#team-analysis-box");
  const playersTable = qs("#team-players-table");
  const heroImage = qs("#team-hero-image");
  const comparisonTable = qs("#team-comparison-table");
  const efficiencyBox = qs("#team-efficiency-box");
  const styleBox = qs("#team-style-box");
  const heroHighlights = qs("#team-hero-highlights");
  const signalGrid = qs("#team-signal-grid");
  const visualTitle = qs("#team-visual-title");
  const visualText = qs("#team-visual-text");
  const memberCopy = qs("#team-member-copy");
  if (!title || !summary || !statList || !matchesTable || !analysisBox || !playersTable) return;

  const currentTeamName = new URLSearchParams(window.location.search).get("team");
  const team = state.teams.find((item) => item.team === currentTeamName) || state.teams[0];
  if (!team) return;
  if (!isFreeTeam(team.team)) {
    window.location.href = "members.html";
    return;
  }

  const recentMatches = [...state.matches]
    .filter((match) => sameTeam(match.home_team, team.team) || sameTeam(match.away_team, team.team))
    .sort((a, b) => String(b.match_date).localeCompare(String(a.match_date)))
    .slice(0, 8);
  const teamPlayers = [...state.players]
    .filter((player) => sameTeam(player.team_name, team.team))
    .sort((a, b) => (b.goals || 0) - (a.goals || 0))
    .slice(0, 12);

  title.textContent = `${team.team} 球队分析页`;
  summary.textContent = `${team.team} 在当前世界杯历史样本中共 ${team.matches} 场，进球 ${team.goals_for}，失球 ${team.goals_against}。这里会集中展示这支球队的样本、效率和比赛轮廓。`;
  if (heroImage) {
    heroImage.src = getTeamBackdrop(team.team);
    heroImage.alt = `${team.team} 球队画面`;
  }
  if (heroHighlights) {
    heroHighlights.innerHTML = [
      `${team.matches} 场样本`,
      `胜率 ${formatPercent((team.wins / Math.max(team.matches, 1)) * 100)}`,
      `${team.goals_for} 进球`,
      `${formatNumber(team.xg_for || 0, 2)} xG`,
    ]
      .map((item) => `<span>${item}</span>`)
      .join("");
  }
  if (signalGrid) signalGrid.innerHTML = buildTeamSignalCards(team);
  if (visualTitle) visualTitle.textContent = `${team.team} 比赛样本轮廓`;
  if (visualText) visualText.textContent = `${team.team} 的公开页先给你比赛面貌、效率和代表样本，深度区再继续下钻到对位与节奏切换。`;
  if (memberCopy) memberCopy.innerHTML = buildTeamMemberNarrative(team);

  statList.innerHTML = `
    <li>历史场次：${team.matches}</li>
    <li>胜平负：${team.wins} / ${team.draws} / ${team.losses}</li>
    <li>场均进球：${perMatch(team.goals_for, team.matches, 2)}</li>
    <li>场均失球：${perMatch(team.goals_against, team.matches, 2)}</li>
    <li>射门：${team.shots || 0}</li>
    <li>射正：${team.shots_on_target || 0}</li>
    <li>xG：${formatNumber(team.xg_for || 0, 2)}</li>
    <li>xGA：${formatNumber(team.xg_against || 0, 2)}</li>
  `;

  analysisBox.innerHTML = buildTeamNarrative(team);
  if (efficiencyBox) efficiencyBox.innerHTML = buildTeamEfficiency(team);
  if (styleBox) styleBox.innerHTML = buildTeamStyleTags(team);

  matchesTable.innerHTML = buildTable(
    ["赛季", "阶段", "比赛", "比分"],
    recentMatches.map((match) => [
      match.season,
      match.stage,
      `${match.home_team} vs ${match.away_team}`,
      `${match.home_score}-${match.away_score}`,
    ])
  );

  playersTable.innerHTML = buildTable(
    ["球员", "出场", "首发", "进球", "xG", "传球成功率"],
    teamPlayers.map((player) => [
      `<a href="player.html?id=${player.player_id}">${player.player_name}</a>`,
      player.appearances,
      player.starts,
      player.goals || 0,
      formatNumber(player.xg || 0, 2),
      player.passes > 0 ? formatPercent((player.completed_passes / player.passes) * 100) : "0.0%",
    ])
  );

  if (comparisonTable) {
    const comparisonPool = state.teams.filter((item) => item.team !== team.team).slice(0, 5);
    comparisonTable.innerHTML = buildTable(
      ["球队", "胜率", "场均射门", "场均 xG"],
      [
        [
          team.team,
          formatPercent((team.wins / Math.max(team.matches, 1)) * 100),
          perMatch(team.shots || 0, team.matches, 1),
          perMatch(team.xg_for || 0, team.matches, 2),
        ],
        ...comparisonPool.map((item) => [
          item.team,
          formatPercent((item.wins / Math.max(item.matches, 1)) * 100),
          perMatch(item.shots || 0, item.matches, 1),
          perMatch(item.xg_for || 0, item.matches, 2),
        ]),
      ]
    );
  }
}

function renderPlayerPage() {
  const title = qs("#player-title");
  const summary = qs("#player-summary-text");
  const statList = qs("#player-stat-list");
  const analysisBox = qs("#player-analysis-box");
  const memberBox = qs("#player-member-box");
  const contextBox = qs("#player-context-box");
  const heroImage = qs("#player-hero-image");
  const efficiencyBox = qs("#player-efficiency-box");
  const roleBox = qs("#player-role-box");
  const heroHighlights = qs("#player-hero-highlights");
  const signalGrid = qs("#player-signal-grid");
  const visualTitle = qs("#player-visual-title");
  const visualText = qs("#player-visual-text");
  if (!title || !summary || !statList || !analysisBox || !memberBox || !contextBox) return;

  const visiblePlayers = [...state.players].filter((player) => player.appearances >= 3);
  const currentPlayerId = new URLSearchParams(window.location.search).get("id");
  const player = state.players.find((item) => String(item.player_id) === String(currentPlayerId)) || visiblePlayers[0];
  if (!player) return;
  if (!isFreePlayer(player.player_id, visiblePlayers)) {
    window.location.href = "members.html";
    return;
  }

  const team = state.teams.find((item) => sameTeam(item.team, player.team_name));
  const teammates = state.players
    .filter((item) => sameTeam(item.team_name, player.team_name))
    .sort((a, b) => (b.goals || 0) - (a.goals || 0))
    .slice(0, 6);
  const passRate = player.passes > 0 ? formatPercent((player.completed_passes / player.passes) * 100) : "0.0%";
  const shotAccuracy = player.shots > 0 ? formatPercent(((player.shots_on_target || 0) / player.shots) * 100) : "0.0%";

  title.textContent = `${player.player_name} 球员分析页`;
  summary.textContent = `${player.player_name} 当前归属 ${player.team_name}，历史样本出场 ${player.appearances} 次。这里会集中展示他的出场样本、角色定位和效率表现。`;
  if (heroImage) {
    heroImage.src = getPlayerImage(player.player_name);
    heroImage.alt = `${player.player_name} 球员画面`;
  }
  if (heroHighlights) {
    heroHighlights.innerHTML = [
      `${player.appearances} 次出场`,
      `${player.goals || 0} 进球`,
      `${formatNumber(player.xg || 0, 2)} xG`,
      `射正率 ${shotAccuracy}`,
    ]
      .map((item) => `<span>${item}</span>`)
      .join("");
  }
  if (signalGrid) signalGrid.innerHTML = buildPlayerSignalCards(player);
  if (visualTitle) visualTitle.textContent = `${player.player_name} 角色样本`;
  if (visualText) visualText.textContent = `${player.player_name} 的公开页先看直接产出和角色定位，深度区继续拆对位差异、名单变化和重点场次。`;

  statList.innerHTML = `
    <li>球队：${player.team_name}</li>
    <li>国家：${player.country_name}</li>
    <li>出场：${player.appearances}</li>
    <li>首发：${player.starts}</li>
    <li>分钟估算：${player.minutes_estimate}</li>
    <li>进球：${player.goals || 0}</li>
    <li>助攻：${player.assists || 0}</li>
    <li>射门：${player.shots || 0}</li>
    <li>射门命中率：${shotAccuracy}</li>
    <li>传球成功率：${passRate}</li>
  `;

  analysisBox.innerHTML = buildPlayerNarrative(player);
  if (efficiencyBox) efficiencyBox.innerHTML = buildPlayerEfficiency(player);
  if (roleBox) roleBox.innerHTML = buildPlayerRoleTags(player);

  memberBox.innerHTML = buildPlayerMemberNarrative(player, team);

  contextBox.innerHTML = `
    <div class="analysis-stack">
      <p>${player.team_name} 团队当前历史样本 ${team?.matches || 0} 场，进球 ${team?.goals_for || 0}，xG ${formatNumber(team?.xg_for || 0, 2)}。单个球员的判断必须放回球队结构里看，才不会失真。</p>
    </div>
    ${buildTable(
      ["同队球员", "进球", "xG", "出场"],
      teammates.map((item) => [
        `<a href="player.html?id=${item.player_id}">${item.player_name}</a>`,
        item.goals || 0,
        formatNumber(item.xg || 0, 2),
        item.appearances,
      ])
    )}
  `;
}

function setArticleChrome(config) {
  const title = qs("#article-title");
  const eyebrow = qs("#article-eyebrow");
  const description = qs("#article-description");
  const metaRow = qs("#article-meta-row");
  const focusList = qs("#article-focus-list");
  const heroImage = qs("#article-hero-image");
  const heroHighlights = qs("#article-hero-highlights");
  const visualKicker = qs("#article-visual-kicker");
  const visualTitle = qs("#article-visual-title");
  const visualText = qs("#article-visual-text");
  const sidebarBox = qs("#article-sidebar-box");
  const primaryAction = qs("#article-primary-action");
  const secondaryAction = qs("#article-secondary-action");

  if (eyebrow) eyebrow.textContent = config.eyebrow;
  if (title) title.textContent = config.title;
  if (description) description.textContent = config.description;
  if (metaRow) metaRow.innerHTML = (config.meta || []).map((item) => `<span>${item}</span>`).join("");
  if (focusList) focusList.innerHTML = (config.focus || []).map((item) => `<li>${item}</li>`).join("");
  if (heroHighlights) heroHighlights.innerHTML = (config.highlights || []).map((item) => `<span>${item}</span>`).join("");
  if (heroImage && config.heroImage) {
    heroImage.src = config.heroImage;
    heroImage.alt = config.heroImageAlt || config.title;
  }
  if (visualKicker) visualKicker.textContent = config.visualKicker || "比赛观察";
  if (visualTitle) visualTitle.textContent = config.visualTitle || config.title;
  if (visualText) visualText.textContent = config.visualText || config.description;
  if (sidebarBox) {
    sidebarBox.innerHTML = `
      <span>${config.sidebarTitle || "本页目录"}</span>
      <ul>${(config.sidebarItems || []).map((item) => `<li>${item}</li>`).join("")}</ul>
    `;
  }
  if (primaryAction) {
    primaryAction.textContent = config.primaryActionText || "解锁完整版本";
    primaryAction.href = config.primaryActionHref || "pay.html";
  }
  if (secondaryAction) {
    secondaryAction.textContent = config.secondaryActionText || "返回今日比赛";
    secondaryAction.href = config.secondaryActionHref || "index.html#matches";
  }
  document.title = `${config.title} | World Cup Edge`;
}

function renderArticleSections(sections) {
  const articleMain = qs("#article-main");
  if (!articleMain) return;
  const lockedBlock = articleMain.querySelector(".locked-block")?.outerHTML || "";
  articleMain.innerHTML = `${sections
    .map((section) => {
      const stats = section.stats
        ? `
            <div class="article-stat-grid">
              ${section.stats
                .map(
                  (stat) => `
                    <article>
                      <span>${stat.label}</span>
                      <strong>${stat.value}</strong>
                      <p>${stat.text}</p>
                    </article>
                  `
                )
                .join("")}
            </div>
          `
        : "";
      return `
        <div class="article-block">
          <p class="eyebrow">${section.label}</p>
          <h2>${section.heading}</h2>
          <p>${section.body}</p>
          ${stats}
          ${section.html || ""}
        </div>
      `;
    })
    .join("")}${lockedBlock}`;
}

function setArticleLockState(config) {
  const description = qs("#locked-description");
  const list = qs("#locked-list");
  const primary = qs("#locked-primary-action");
  const secondary = qs("#locked-secondary-action");
  const unlocked = qs("#member-unlocked");
  const actions = qs(".locked-actions");
  if (!description || !list || !primary || !secondary || !actions) return;

  description.textContent = config.description;
  if (unlocked) unlocked.hidden = true;

  if (config.requiresMember && !config.canViewFull) {
    list.hidden = false;
    list.innerHTML = (config.bullets || []).map((item) => `<li>${item}</li>`).join("");
    primary.textContent = config.primaryText || "登录查看";
    primary.href = config.primaryHref || "login.html";
    secondary.textContent = config.secondaryText || "查看完整内容";
    secondary.href = config.secondaryHref || "members.html";
    return;
  }

  list.hidden = true;
  if (isMember() && unlocked) {
    unlocked.hidden = false;
    actions.innerHTML = `
      <a class="button button-primary" href="${config.unlockedHref || "members.html"}">继续查看完整内容</a>
      <button class="button button-secondary" type="button" id="locked-logout-button">退出当前会员</button>
    `;
    qs("#locked-logout-button")?.addEventListener("click", () => {
      window.localStorage.removeItem("worldCupEdgeMember");
      window.location.reload();
    });
  } else {
    actions.innerHTML = `
      <a class="button button-primary" href="${config.secondaryHref || "members.html"}">继续查看完整内容</a>
      <a class="button button-secondary" href="pay.html">查看开通方式</a>
    `;
  }
}

function renderArticleSources(sourceKeys) {
  const sourceList = qs("#article-source-list");
  if (!sourceList || !window.worldCupDataSources) return;
  sourceList.innerHTML = (sourceKeys || [])
    .map((key) => window.worldCupDataSources[key])
    .filter(Boolean)
    .map((source) => `<a class="source-chip" href="${source.link}" target="_blank" rel="noreferrer">${source.name}</a>`)
    .join("");
}

function buildHistoryBoard(title, rows) {
  return `
    <div class="match-history-board">
      <strong>${title}</strong>
      <div class="match-history-list">
        ${
          rows.length
            ? rows
                .map(
                  (row) => `
                    <article>
                      <span>${row.match_date || row.kickoffCN || ""}</span>
                      <strong>${row.home_team || row.homeTeam} ${
                    row.home_score !== undefined || row.homeScore !== undefined
                      ? `${row.home_score ?? row.homeScore}-${row.away_score ?? row.awayScore}`
                      : "vs"
                  } ${row.away_team || row.awayTeam}</strong>
                      <p>${localizeMatchStageLabel(row.stage || row.statusText || "", row.statusState || "")}</p>
                    </article>
                  `
                )
                .join("")
            : `<article><span>历史对照</span><strong>当前没有足够的世界杯直接样本</strong><p>先以球队长期样本和赛前状态作为主判断。</p></article>`
        }
      </div>
    </div>
  `;
}

function buildMatchTeamPanel(label, teamName, team, players, favored) {
  const model = buildTeamModel(team);
  const spotlight = players[0];
  return `
    <article class="match-team-panel ${favored ? "match-team-panel-favored" : ""}">
      <div class="match-team-panel-head">
        <span>${label}</span>
        <strong>${teamName}</strong>
      </div>
      <p>${model ? `${team.matches} 场样本，胜率 ${model.winRate}，场均 xG ${model.xgForRate}。` : "当前公开历史样本较少，更多判断要放到赛前更新和临场节奏里看。"}</p>
      <div class="match-team-tag-row">
        <span>${model ? `胜率 ${model.winRate}` : "样本补充中"}</span>
        <span>${model ? `场均射门 ${model.shotRate}` : "实时观察"}</span>
        <span>${model ? `场均 xG ${model.xgForRate}` : "模型补充中"}</span>
      </div>
      <div class="match-team-player-list">
        ${players
          .slice(0, 3)
          .map(
            (player) => `
              <a class="match-player-chip" href="player.html?id=${player.player_id}">
                <strong>${player.player_name}</strong>
                <span>${player.goals || 0} 球 / xG ${formatNumber(player.xg || 0, 2)}</span>
              </a>
            `
          )
          .join("") || `<span class="match-player-fallback">关键球员样本补充中</span>`}
      </div>
      ${spotlight ? `<a class="article-link match-panel-link" href="player.html?id=${spotlight.player_id}">进入 ${spotlight.player_name} 详情</a>` : ""}
    </article>
  `;
}

function renderStaticArticlePage() {
  if (!qs("#article-main") || !window.worldCupArticles) return;
  const slug = new URLSearchParams(window.location.search).get("slug") || "tempo-breakpoint";
  const article = window.worldCupArticles[slug] || window.worldCupArticles["tempo-breakpoint"];
  const canView = !article.requiresMember || isMember();
  setArticleChrome({
    eyebrow: article.eyebrow,
    title: article.title,
    description: article.description,
    meta: article.meta,
    focus: article.focus,
    highlights: article.meta.slice(0, 3),
    heroImage: "assets/images/argentina-champion.jpg",
    heroImageAlt: article.title,
    visualKicker: article.requiresMember ? "会员深度" : "公开分析",
    visualTitle: article.title,
    visualText: article.summary,
    sidebarTitle: article.requiresMember ? "完整版本" : "本页框架",
    sidebarItems: article.requiresMember ? ["阵容修正", "临场节奏", "最终落点"] : ["比赛背景", "数据框架", "公开判断"],
  });
  renderArticleSources(article.sourceKeys || []);
  renderArticleSections(canView ? article.sections : article.sections.slice(0, 1));
  setArticleLockState({
    requiresMember: article.requiresMember,
    canViewFull: canView,
    description: article.requiresMember
      ? "当前页会先给出核心判断，完整版本补齐名单修正、临场变化和更完整的样本对照。"
      : "这篇文章会先展示核心判断，完整版本补齐更完整的样本对照与赛前更新。",
    bullets: ["查看后半段推演", "补齐临场修正顺序", "进入完整文章"],
    secondaryHref: "members.html",
    unlockedHref: "members.html",
  });
}

function renderMatchArticlePage() {
  if (!qs("#article-main")) return false;
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get("match");
  if (!matchId) return false;

  const match = state.liveSchedule?.matches?.find((item) => String(item.eventId) === String(matchId));
  if (!match) {
    setArticleChrome({
      eyebrow: "公开分析 / 比赛详情",
      title: "比赛详情暂时不可用",
      description: "实时赛程接口暂时没有返回可用数据，稍后刷新即可恢复。",
      meta: ["实时赛程", "等待恢复"],
      focus: ["保留单场入口", "等待实时赛程恢复", "恢复后自动显示浅层分析"],
      highlights: ["实时赛程", "等待恢复"],
      heroImage: "assets/images/argentina-champion.jpg",
      visualKicker: "赛程状态",
      visualTitle: "单场详情暂时不可用",
      visualText: "接口恢复后，这里会直接显示对应比赛的赛程、公开判断和完整比赛页。",
      sidebarTitle: "稍后可看",
      sidebarItems: ["实时赛程", "比赛页入口", "关键变量"],
    });
    renderArticleSources(liveSourceKeys);
    renderArticleSections([
      {
        label: "01 / 暂时不可用",
        heading: "实时赛程接口正在等待恢复",
        body: "这页已经保留了单场详情入口，但当前没有拿到对应比赛的实时赛程数据。稍后刷新页面，就会重新接入比赛信息、公开判断和完整比赛页。",
      },
    ]);
    setArticleLockState({
      requiresMember: false,
      canViewFull: false,
      description: "赛程恢复后，这里会继续补齐对应比赛的完整页面内容。",
      bullets: ["实时赛程恢复后自动接入", "保留单场入口", "同步完整比赛页"],
    });
    return true;
  }

  const insight = match.insight || {};
  const prediction = match.prediction || null;
  const predictionView = predictionUtils.buildPredictionViewModel
    ? predictionUtils.buildPredictionViewModel(prediction, isMember())
    : null;
  const phase = predictionUtils.buildMatchPhaseViewModel
    ? predictionUtils.buildMatchPhaseViewModel(match)
    : buildPhaseFallback(match);
  const homeTeam = findTeamSummary(match.homeTeam);
  const awayTeam = findTeamSummary(match.awayTeam);
  const homePlayers = getTopPlayersByTeam(match.homeTeam, 3);
  const awayPlayers = getTopPlayersByTeam(match.awayTeam, 3);
  const homeModel = buildTeamModel(homeTeam);
  const awayModel = buildTeamModel(awayTeam);
  const favoredTeam =
    insight.edgeTeam ||
    ((homeModel?.edgeScore || 0) >= (awayModel?.edgeScore || 0) ? match.homeTeam : match.awayTeam);
  const favoredLead = getTopPlayersByTeam(favoredTeam, 1)[0];
  const heroImage =
    getTeamBackdrop(favoredTeam) ||
    getLiveCardArtwork((match.matchNumber || 1) - 1) ||
    (favoredLead && getPlayerImage(favoredLead.player_name));
  const scoreText = match.statusState === "pre" ? "VS" : `${match.homeScore}-${match.awayScore}`;
  const statusText = phase.badge;
  const headToHead = getHeadToHead(match.homeTeam, match.awayTeam, 3);
  const homeRecent = getRecentMatchesByTeam(match.homeTeam, 3);
  const awayRecent = getRecentMatchesByTeam(match.awayTeam, 3);
  const stageLabel = localizeMatchStageLabel(match.stage || "", match.statusState);
  const articleSignalGrid = qs("#article-signal-grid");

  setArticleChrome({
    eyebrow: "公开分析 / 单场详情",
    title: `${match.homeTeam} vs ${match.awayTeam}`,
    description: `每场比赛都会先给出${phase.label}、比分预测、公开判断和关键对位，完整版本继续补齐节奏分支、关键球员和赛前修正。`,
    meta: [`Match ${String(match.matchNumber).padStart(2, "0")}`, stageLabel, match.kickoffCN, match.venue || "世界杯赛场"],
    focus: [
      `${favoredTeam} 当前更像数据边所在的一侧`,
      favoredLead ? `${favoredLead.player_name} 是需要盯住的第一关键人` : "核心前场处理质量是第一观察点",
      getPredictionFocusText(predictionView),
    ],
    highlights: [match.kickoffCN, phase.label, `预测 ${getPredictionDisplayLabel(predictionView)}`, match.city || "World Cup 2026"],
    heroImage,
    heroImageAlt: `${match.homeTeam} vs ${match.awayTeam}`,
    visualKicker: isMember() ? "完整版本" : "比赛页",
    visualTitle: `${match.homeTeam} vs ${match.awayTeam}`,
    visualText: isMember()
      ? "当前账号可直接查看这场比赛的完整推演、比分预测与赛前修正。"
      : "这一页会持续同步赛程、对位、预测入口和核心判断。",
    primaryActionText: isMember() ? "查看完整推演" : "解锁完整版本",
    primaryActionHref: isMember() ? getMatchDetailHref(match) : "pay.html",
    secondaryActionText: isMember() ? "返回今日比赛" : "先看今日比赛",
    secondaryActionHref: "index.html#matches",
    sidebarTitle: isMember() ? "完整目录" : "本页目录",
    sidebarItems: isMember() ? ["比分预测", "节奏分支", "历史对照"] : ["比分预测", "公开判断", "关键变量"],
  });
  if (articleSignalGrid) {
    articleSignalGrid.innerHTML = buildArticleSignalCards(match, phase, predictionView, favoredTeam);
  }

  const sections = [
    {
      label: "01 / 比赛底图",
      heading: `${match.homeTeam} vs ${match.awayTeam} 的公开观察`,
      body: `${match.kickoffCN} 开球，当前阶段 ${phase.label}，比赛地点 ${match.venue || "世界杯赛场"}${match.city ? `，${match.city}` : ""}。公开层先给出比赛底图：${insight.edgeTeam || favoredTeam} 在历史世界杯样本里更像先手一边，重点观察开场压制、推进速度和高质量射门能否落地。`,
      stats: [
        { label: "比赛序号", value: `Match ${String(match.matchNumber).padStart(2, "0")}`, text: stageLabel },
        { label: "当前比分", value: scoreText, text: statusText },
        {
          label: "预测比分",
          value: getPredictionDisplayLabel(predictionView),
          text: predictionView?.locked ? "开通会员后查看具体预测" : (predictionView?.confidenceLabel ? `置信 ${predictionView.confidenceLabel}` : "实时修正中"),
        },
        {
          label: "数据边",
          value: insight.edgeTeam || favoredTeam,
          text: `模型边差 ${Math.abs((homeModel?.edgeScore || 0) - (awayModel?.edgeScore || 0)).toFixed(1)}`,
        },
      ],
      html: predictionView
        ? `
          <div class="prediction-panel">
            ${buildPredictionMarkup(prediction)}
            <div class="prediction-split">
              <article>
                <span>${match.homeTeam}</span>
                <strong>${predictionView.locked ? "会员可见" : prediction.homeGoals}</strong>
                <p>${predictionView.locked ? "开通会员后查看主队预期进球" : `预期进球 ${prediction.homeExpected}`}</p>
              </article>
              <article>
                <span>${match.awayTeam}</span>
                <strong>${predictionView.locked ? "会员可见" : prediction.awayGoals}</strong>
                <p>${predictionView.locked ? "开通会员后查看客队预期进球" : `预期进球 ${prediction.awayExpected}`}</p>
              </article>
            </div>
          </div>
        `
        : "",
    },
    {
      label: "02 / 双方底牌",
      heading: "两边的真实数据先对照展开",
      body: `${insight.primary || `${favoredTeam} 的长期样本更稳。`} ${insight.secondary || "真正先拉开差距的，通常是节奏与机会质量，而不是名气本身。"} ${insight.keyPlayer || ""}`,
      html: `
        <div class="match-team-grid">
          ${buildMatchTeamPanel("主队", match.homeTeam, homeTeam, homePlayers, favoredTeam === match.homeTeam)}
          ${buildMatchTeamPanel("客队", match.awayTeam, awayTeam, awayPlayers, favoredTeam === match.awayTeam)}
        </div>
      `,
    },
    {
      label: "03 / 公开判断",
      heading: "当前需要重点观察的三个点",
      body: `${favoredTeam} 更像先手的一边，但真正决定这场比赛层级的，还是开场二十分钟的推进效率、边路对位是否被打穿，以及第一脚高质量机会由谁拿到。`,
      html: `
        <div class="match-note-grid">
          <article>
            <span>看开局</span>
            <strong>${favoredTeam} 是否先压上来</strong>
            <p>${favoredTeam === match.homeTeam ? match.homeTeam : match.awayTeam} 的前场推进如果从一开始就稳定，这场公开判断会更快兑现。</p>
          </article>
          <article>
            <span>看终结</span>
            <strong>${favoredLead ? favoredLead.player_name : "核心前场"} 的第一波处理</strong>
            <p>如果第一波高质量机会就能打到门框范围内，节奏会更容易顺着强势边走。</p>
          </article>
          <article>
            <span>看反扑</span>
            <strong>${favoredTeam === match.homeTeam ? match.awayTeam : match.homeTeam} 的回收速度</strong>
            <p>弱势边能不能把空间收住，决定这场比赛会不会被快速拉开。</p>
          </article>
        </div>
      `,
    },
  ];

  if (isMember()) {
    sections.push(
      {
        label: "04 / 会员深度",
        heading: "深层推演：节奏分支怎么走",
        body: `${favoredTeam} 当前更像先手方，但真正的深层差别不在纸面强弱，而在三个分支：一是 ${favoredTeam} 是否能把高位推进直接换成禁区内机会，二是对手在第一轮压迫之后还能不能稳住第二点，三是比赛进入 60 分钟后谁还有余量继续提速。`,
        stats: [
          { label: `${match.homeTeam} 场均 xG`, value: homeModel?.xgForRate || "样本少", text: homeModel ? `场均失球 ${homeModel.goalsAgainstRate}` : "等待补足" },
          { label: `${match.awayTeam} 场均 xG`, value: awayModel?.xgForRate || "样本少", text: awayModel ? `场均失球 ${awayModel.goalsAgainstRate}` : "等待补足" },
          {
            label: "深度结论",
            value: favoredTeam,
            text: Math.abs((homeModel?.edgeScore || 0) - (awayModel?.edgeScore || 0)) > 12 ? "数据边比较明确" : "更适合临场跟修正",
          },
        ],
      },
      {
        label: "05 / 关键球员",
        heading: "深层推演：把关键人放回结构里看",
        body: `${favoredLead ? `${favoredLead.player_name} 会是这一页的第一关键人。` : "关键人样本会继续补充。"} 完整版本不只看个人数据，而是看他所在的通道会不会持续拿到球、第二落点是不是有人接、以及他在领先或落后局面下的角色会不会变化。`,
        html: `
          <div class="match-note-grid">
            <article>
              <span>${match.homeTeam}</span>
              <strong>${homePlayers[0]?.player_name || "主队核心待补足"}</strong>
              <p>${homePlayers[0] ? `${homePlayers[0].goals || 0} 球，xG ${formatNumber(homePlayers[0].xg || 0, 2)}，如果他能在前 30 分钟拿到连续终结机会，主队的强势路径会更顺。` : "历史个人样本不足，重点看实时首发与站位。"}</p>
            </article>
            <article>
              <span>${match.awayTeam}</span>
              <strong>${awayPlayers[0]?.player_name || "客队核心待补足"}</strong>
              <p>${awayPlayers[0] ? `${awayPlayers[0].goals || 0} 球，xG ${formatNumber(awayPlayers[0].xg || 0, 2)}，如果客队想把比赛拖回均衡，第一反击点必须稳定拿住。` : "历史个人样本不足，重点看客队首轮反击是否成形。"}</p>
            </article>
            <article>
              <span>临场修正</span>
              <strong>首发变化优先级最高</strong>
              <p>一旦前场核心缺席、边后卫换人或中场拦截点变化，这页的深度判断要第一时间跟着修正。</p>
            </article>
          </div>
        `,
      },
      {
        label: "06 / 历史对照",
        heading: "深层推演：把历史样本和当前比赛接起来",
        body: "完整版本不是重复首页判断，而是把历史世界杯样本、当前赛程信息和赛前变量放到同一张图里看。直接对照、各自近几场样本和临场修正，会一起决定最终结论落在哪边。",
        html: `
          <div class="match-history-grid">
            ${buildHistoryBoard("双方直接样本", headToHead)}
            ${buildHistoryBoard(`${match.homeTeam} 近几场世界杯样本`, homeRecent)}
            ${buildHistoryBoard(`${match.awayTeam} 近几场世界杯样本`, awayRecent)}
          </div>
        `,
      }
    );
  }

  renderArticleSources(liveSourceKeys);
  renderArticleSections(sections);
  setArticleLockState({
    requiresMember: true,
    canViewFull: isMember(),
    description: isMember()
      ? `当前账号 ${state.member.email} 已解锁这场比赛的完整推演。`
      : "当前已开放比赛框架和关键观察点。完整版本继续补齐节奏分支、关键球员和赛前修正。",
    bullets: ["查看节奏分支推演", "补齐关键球员与结构关系", "进入完整比赛页"],
    primaryText: "会员登录",
    primaryHref: "login.html",
    secondaryText: "查看完整版本",
    secondaryHref: "members.html",
    unlockedHref: getMatchDetailHref(match),
  });
  return true;
}

async function loadData() {
  const [snapshot, teams, players, matches, liveSchedule] = await Promise.all([
    fetch("data/snapshot.json").then((response) => response.ok ? response.json() : null).catch(() => null),
    fetch("data/summary/worldcup_team_summary.json").then((response) => response.ok ? response.json() : []).catch(() => []),
    fetch("data/summary/worldcup_player_summary.json").then((response) => response.ok ? response.json() : []).catch(() => []),
    fetch("data/summary/worldcup_matches.json").then((response) => response.ok ? response.json() : []).catch(() => []),
    fetch(LIVE_SCHEDULE_ENDPOINT, { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null),
  ]);

  state.snapshot = snapshot;
  state.teams = teams || [];
  state.players = players || [];
  state.matches = matches || [];
  state.liveSchedule = liveSchedule?.ok ? liveSchedule : null;
}

async function refreshLiveScheduleInBackground() {
  try {
    const liveSchedule = await fetch(LIVE_SCHEDULE_ENDPOINT, { cache: "no-store" }).then((response) => response.ok ? response.json() : null);
    if (!liveSchedule?.ok) return;
    state.liveSchedule = liveSchedule;
    renderLiveSchedule();
    if (!renderMatchArticlePage()) {
      renderStaticArticlePage();
    }
  } catch {
    // Keep the last good schedule on screen when refresh fails.
  }
}

function startLiveAutoRefresh() {
  window.setTimeout(() => {
    refreshLiveScheduleInBackground();
  }, 12000);
  window.setInterval(() => {
    refreshLiveScheduleInBackground();
  }, LIVE_REFRESH_INTERVAL_MS);
}

function renderEverything() {
  renderSnapshotCards();
  renderTables();
  renderTeamCards();
  renderPlayerCards();
  renderMemberPage();
  renderSourcesPage();
  renderPaymentPage();
  renderCheckoutPage();
  renderLoginPage();
  renderLiveSchedule();
  renderTeamPage();
  renderPlayerPage();
  if (!renderMatchArticlePage()) {
    renderStaticArticlePage();
  }
}

async function main() {
  setRevealAnimations();
  setHeaderState();
  await loadData();
  renderEverything();
  startLiveAutoRefresh();
}

main().catch(() => {
  renderLiveFallback();
  renderSourcesPage();
  renderPaymentPage();
  renderCheckoutPage();
  renderLoginPage();
  if (!renderMatchArticlePage()) {
    renderStaticArticlePage();
  }
});
