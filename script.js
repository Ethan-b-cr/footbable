const animatedSections = document.querySelectorAll(
  ".section, .hero-copy, .hero-panel, .site-footer, .article-hero-copy, .article-side-card, .faq-item"
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.16 }
);

animatedSections.forEach((section) => {
  section.classList.add("reveal");
  observer.observe(section);
});

const teamArtwork = {
  Argentina:
    "https://upload.wikimedia.org/wikipedia/commons/0/05/Argentina_campeon_del_mundo_2022.jpg",
  France:
    "https://upload.wikimedia.org/wikipedia/commons/2/21/France_champion_of_the_Football_World_Cup_Russia_2018.jpg",
  Brazil:
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Brazil_national_football_team_training_2018.jpg",
  England:
    "https://upload.wikimedia.org/wikipedia/commons/f/f2/England_national_football_team_2022.jpg",
  Croatia:
    "https://upload.wikimedia.org/wikipedia/commons/8/89/Croatia_national_football_team_2018.jpg",
  Morocco:
    "https://upload.wikimedia.org/wikipedia/commons/b/bf/Morocco_national_football_team_2018.jpg",
  Netherlands:
    "https://upload.wikimedia.org/wikipedia/commons/5/59/Netherlands_national_football_team_2017.jpg",
  Portugal:
    "https://upload.wikimedia.org/wikipedia/commons/7/71/Portugal_national_football_team_2022.jpg",
  Belgium:
    "https://upload.wikimedia.org/wikipedia/commons/7/75/Belgium_national_football_team_2018.jpg",
  Spain:
    "https://upload.wikimedia.org/wikipedia/commons/3/31/Spain_national_football_team_2018.jpg",
};

const playerArtwork = {
  "Lionel Andrés Messi Cuccittini":
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/Lionel_Messi_20180626.jpg",
  "Kylian Mbappé Lottin":
    "https://upload.wikimedia.org/wikipedia/commons/4/44/Kylian_Mbapp%C3%A9_2022.jpg",
  "Antoine Griezmann":
    "https://upload.wikimedia.org/wikipedia/commons/5/58/Antoine_Griezmann_2018.jpg",
  "Luka Modrić":
    "https://upload.wikimedia.org/wikipedia/commons/2/20/Luka_Modric_2018.jpg",
  "Harry Kane":
    "https://upload.wikimedia.org/wikipedia/commons/d/d1/Harry_Kane_2021.jpg",
  "Kevin De Bruyne":
    "https://upload.wikimedia.org/wikipedia/commons/9/97/Kevin_De_Bruyne_201807091.jpg",
  "Olivier Giroud":
    "https://upload.wikimedia.org/wikipedia/commons/3/32/Olivier_Giroud_2018.jpg",
  "Achraf Hakimi Mouh":
    "https://upload.wikimedia.org/wikipedia/commons/4/4f/Achraf_Hakimi_2022.jpg",
  "Neymar da Silva Santos Júnior":
    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Neymar_2018.jpg",
};

const fallbackArtwork = {
  team: "https://upload.wikimedia.org/wikipedia/commons/2/21/France_champion_of_the_Football_World_Cup_Russia_2018.jpg",
  player: "https://upload.wikimedia.org/wikipedia/commons/4/44/Kylian_Mbapp%C3%A9_2022.jpg",
};

const normalizeName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getMemberSession = () => {
  const rawSession = window.localStorage.getItem("worldCupEdgeMember");
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
};

const memberSession = getMemberSession();

const formatNumber = (value, digits = 1) => Number(value || 0).toFixed(digits);
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const perMatch = (value, matches, digits = 2) =>
  matches > 0 ? Number(value / matches).toFixed(digits) : Number(0).toFixed(digits);

const byGoals = (a, b) => (b.goals || 0) - (a.goals || 0);
const byAppearances = (a, b) => (b.appearances || 0) - (a.appearances || 0);

const loginLink = document.querySelector(".header-link");
const logoutButton = document.querySelector("#logout-button");

if (loginLink && memberSession?.email) {
  loginLink.textContent = "会员已登录";
  loginLink.href = "members.html";
}

if (logoutButton && memberSession?.email) {
  logoutButton.hidden = false;
  logoutButton.addEventListener("click", () => {
    window.localStorage.removeItem("worldCupEdgeMember");
    window.location.href = "index.html";
  });
}

const contactForm = document.querySelector("#contact-form");
const contactHint = document.querySelector("#form-hint");

if (contactForm && contactHint) {
  contactForm.addEventListener("submit", () => {
    const name = document.querySelector("#contact-name")?.value.trim() || "未填写称呼";
    const plan = document.querySelector("#contact-plan")?.value.trim() || "专业会员";
    const note = document.querySelector("#contact-note")?.value.trim() || "未填写需求";
    const email = document.querySelector("#contact-email")?.value.trim() || "未填写邮箱";
    const subjectField = contactForm.querySelector('input[name="_subject"]');

    if (subjectField) {
      subjectField.value = `World Cup Edge 咨询 - ${plan} - ${name}`;
    }

    contactHint.textContent = `正在提交咨询：${plan} / ${name} / ${email}`;
    document.querySelector("#contact-note").value = `${note}\n\n联系邮箱：${email}`;
  });
}

const loginForm = document.querySelector("#login-form");
const loginStatus = document.querySelector("#login-status");

if (loginForm && loginStatus) {
  if (memberSession?.email) {
    loginStatus.textContent = `当前已登录：${memberSession.email}，正在跳转会员中心。`;
    window.setTimeout(() => {
      window.location.href = "members.html";
    }, 700);
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.querySelector("#login-email")?.value.trim();
    const password = document.querySelector("#login-password")?.value.trim();

    if (!email || !password) {
      loginStatus.textContent = "请先填写邮箱和密码。";
      return;
    }

    const nextSession = {
      email,
      loggedInAt: new Date().toISOString(),
    };

    window.localStorage.setItem("worldCupEdgeMember", JSON.stringify(nextSession));
    loginStatus.textContent = `登录成功，正在进入会员中心：${email}`;
    window.location.href = "members.html";
  });
}

const memberStatusTitle = document.querySelector("#member-status-title");
const memberStatusText = document.querySelector("#member-status-text");
const memberPrimaryAction = document.querySelector("#member-primary-action");
const memberEmailCard = document.querySelector("#member-email-card");
const memberEmailText = document.querySelector("#member-email-text");
const memberLibraryList = document.querySelector("#member-library-list");

if (memberStatusTitle && memberStatusText && memberPrimaryAction) {
  if (memberSession?.email) {
    memberStatusTitle.textContent = "当前已登录";
    memberStatusText.textContent = `当前浏览器已保存会员状态：${memberSession.email}`;
    memberPrimaryAction.textContent = "继续查看会员深度内容";
    memberPrimaryAction.href = "article.html?slug=lineup-and-odds";

    if (memberEmailCard && memberEmailText) {
      memberEmailCard.hidden = false;
      memberEmailText.textContent = memberSession.email;
    }
  }
}

const fillArticleLibrary = () => {
  if (!memberLibraryList || !window.worldCupArticles) return;

  memberLibraryList.innerHTML = Object.values(window.worldCupArticles)
    .map((article) => {
      const locked = article.requiresMember && !memberSession?.email;
      const href = locked ? "login.html" : `article.html?slug=${article.slug}`;
      const badge = article.requiresMember ? "会员深度" : "公开分析";
      const buttonLabel = locked ? "登录后查看" : "进入内容";

      return `
        <article class="article-card ${locked ? "locked-card" : ""}">
          <span class="article-meta">${article.category}</span>
          <h3>${article.title}</h3>
          <p>${article.summary}</p>
          <div class="library-row">
            <span class="library-badge">${badge}</span>
            <a class="article-link" href="${href}">${buttonLabel}</a>
          </div>
        </article>
      `;
    })
    .join("");
};

fillArticleLibrary();

const sourceCards = document.querySelector("#source-cards");
if (sourceCards && window.worldCupDataSources) {
  sourceCards.innerHTML = Object.values(window.worldCupDataSources)
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

const articleMain = document.querySelector("#article-main");
const articleSideAction = document.querySelector("#article-side-action");
const articleSourceList = document.querySelector("#article-source-list");

if (articleMain && window.worldCupArticles) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || "tempo-breakpoint";
  const article = window.worldCupArticles[slug] || window.worldCupArticles["tempo-breakpoint"];
  const requiresMember = Boolean(article.requiresMember);
  const canViewFullArticle = !requiresMember || Boolean(memberSession?.email);

  const title = document.querySelector("#article-title");
  const eyebrow = document.querySelector("#article-eyebrow");
  const description = document.querySelector("#article-description");
  const metaRow = document.querySelector("#article-meta-row");
  const focusList = document.querySelector("#article-focus-list");

  if (title) title.textContent = article.title;
  if (eyebrow) eyebrow.textContent = article.eyebrow;
  if (description) description.textContent = article.description;

  if (articleSideAction) {
    articleSideAction.textContent = requiresMember
      ? canViewFullArticle
        ? "查看完整会员内容"
        : "登录后查看完整内容"
      : "咨询本场解锁";
    articleSideAction.href = requiresMember && !canViewFullArticle ? "login.html" : "members.html";
  }

  if (metaRow) {
    metaRow.innerHTML = article.meta.map((item) => `<span>${item}</span>`).join("");
  }

  if (focusList) {
    focusList.innerHTML = article.focus.map((item) => `<li>${item}</li>`).join("");
  }

  if (articleSourceList && window.worldCupDataSources) {
    articleSourceList.innerHTML = (article.sourceKeys || [])
      .map((key) => window.worldCupDataSources[key])
      .filter(Boolean)
      .map(
        (source) => `
          <a class="source-chip" href="${source.link}" target="_blank" rel="noreferrer">
            ${source.name}
          </a>
        `
      )
      .join("");
  }

  const visibleSections = canViewFullArticle ? article.sections : article.sections.slice(0, 1);
  const blocks = visibleSections
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
        </div>
      `;
    })
    .join("");

  const lockedBlock = articleMain.querySelector(".locked-block")?.outerHTML || "";
  articleMain.innerHTML = `${blocks}${lockedBlock}`;

  const renderedLockedDescription = document.querySelector("#locked-description");
  const renderedLockedList = document.querySelector("#locked-list");
  const renderedLockedPrimary = document.querySelector("#locked-primary-action");
  const renderedLockedSecondary = document.querySelector("#locked-secondary-action");

  if (requiresMember && !canViewFullArticle) {
    if (renderedLockedDescription) {
      renderedLockedDescription.textContent =
        "这篇内容属于会员深度文章。当前仅开放第一层判断，登录后可继续查看完整结论、阵容修正和风控提示。";
    }

    if (renderedLockedList) {
      renderedLockedList.hidden = false;
      renderedLockedList.innerHTML = `
        <li>登录后解锁完整文章</li>
        <li>查看最终建议与信心分级</li>
        <li>进入会员中心查看更多深度内容</li>
      `;
    }

    if (renderedLockedPrimary) {
      renderedLockedPrimary.textContent = "登录查看完整内容";
      renderedLockedPrimary.href = "login.html";
    }

    if (renderedLockedSecondary) {
      renderedLockedSecondary.textContent = "查看会员方案";
      renderedLockedSecondary.href = "members.html";
    }
  }
}

const lockedDescription = document.querySelector("#locked-description");
const lockedList = document.querySelector("#locked-list");
const memberUnlocked = document.querySelector("#member-unlocked");
const lockedActions = document.querySelector(".locked-actions");

if (lockedDescription && lockedList && memberUnlocked && lockedActions && memberSession?.email) {
  lockedDescription.textContent = `已对当前登录会员开放完整深度内容：${memberSession.email}`;
  lockedList.hidden = true;
  memberUnlocked.hidden = false;
  lockedActions.innerHTML = `
    <a class="button button-primary" href="members.html">返回会员中心</a>
    <button class="button button-secondary" type="button" id="locked-logout-button">退出当前会员</button>
  `;

  document.querySelector("#locked-logout-button")?.addEventListener("click", () => {
    window.localStorage.removeItem("worldCupEdgeMember");
    window.location.reload();
  });
}

const dataSummaryCards = document.querySelector("#data-summary-cards");
const teamSummaryTable = document.querySelector("#team-summary-table");
const latestMatchesTable = document.querySelector("#latest-matches-table");
const playerSummaryTable = document.querySelector("#player-summary-table");
const scorerSummaryTable = document.querySelector("#scorer-summary-table");
const dataStatusText = document.querySelector("#data-status-text");
const teamLibraryList = document.querySelector("#team-library-list");
const playerLibraryList = document.querySelector("#player-library-list");
const teamsPageList = document.querySelector("#teams-page-list");
const playersPageList = document.querySelector("#players-page-list");
const teamSearchInput = document.querySelector("#team-search-input");
const playerSearchInput = document.querySelector("#player-search-input");
const heroTeamStrip = document.querySelector("#hero-team-strip");
const heroPlayerStrip = document.querySelector("#hero-player-strip");
const homepageDataBoard = document.querySelector("#homepage-data-board");
const dataInsightBoard = document.querySelector("#data-insight-board");
const homepageScorerSpotlight = document.querySelector("#homepage-scorer-spotlight");
const homepageFinalsBoard = document.querySelector("#homepage-finals-board");
const dataScorerSpotlight = document.querySelector("#data-scorer-spotlight");
const dataFinalSnapshot = document.querySelector("#data-final-snapshot");

const buildTeamCard = (team) => {
  const teamImage = teamArtwork[team.team] || fallbackArtwork.team;
  const winRate = formatPercent((team.wins / team.matches) * 100);
  const shotRate = perMatch(team.shots || 0, team.matches, 1);
  const xgRate = perMatch(team.xg_for || 0, team.matches, 2);

  return `
    <article class="entity-card">
      <div class="entity-media">
        <img src="${teamImage}" alt="${team.team} 队画面" loading="lazy">
      </div>
      <div class="entity-body">
        <span class="article-meta">球队分析 / 历史样本</span>
        <h3>${team.team}</h3>
        <p>样本 ${team.matches} 场，胜率 ${winRate}，场均射门 ${shotRate}，场均 xG ${xgRate}。</p>
        <div class="entity-tags">
          <span>${team.goals_for} 进球</span>
          <span>${team.goals_against} 失球</span>
          <span>${team.shots_on_target || 0} 次射正</span>
        </div>
        <a class="article-link" href="team.html?team=${encodeURIComponent(team.team)}">进入球队页面</a>
      </div>
    </article>
  `;
};

const buildPlayerCard = (player) => {
  const normalizedPlayerName = normalizeName(player.player_name);
  const playerImage =
    Object.entries(playerArtwork).find(([name]) => normalizeName(name) === normalizedPlayerName)?.[1] ||
    fallbackArtwork.player;
  const passRate =
    player.passes > 0 ? formatPercent((player.completed_passes / player.passes) * 100) : "0.0%";

  return `
    <article class="entity-card">
      <div class="entity-media">
        <img src="${playerImage}" alt="${player.player_name} 画面" loading="lazy">
      </div>
      <div class="entity-body">
        <span class="article-meta">球员分析 / 历史样本</span>
        <h3>${player.player_name}</h3>
        <p>${player.team_name}，出场 ${player.appearances}，进球 ${player.goals || 0}，xG ${formatNumber(
    player.xg || 0,
    2
  )}。</p>
        <div class="entity-tags">
          <span>${player.starts} 次首发</span>
          <span>${passRate} 传球成功率</span>
          <span>${player.shots || 0} 次射门</span>
        </div>
        <a class="article-link" href="player.html?id=${player.player_id}">进入球员页面</a>
      </div>
    </article>
  `;
};

const renderTeamCards = (teams, target) => {
  if (!target) return;
  target.innerHTML = teams.map(buildTeamCard).join("");
};

const renderPlayerCards = (players, target) => {
  if (!target) return;
  target.innerHTML = players.map(buildPlayerCard).join("");
};

const renderSnapshot = (snapshot) => {
  const leadScorer = snapshot.top_scorers?.[0];
  const latestFinal = snapshot.latest_matches?.[0];

  if (dataSummaryCards) {
    dataSummaryCards.innerHTML = `
      <article class="article-card">
        <span class="article-meta">历史比赛</span>
        <h3>${snapshot.match_count} 场</h3>
        <p>当前本地快照已整理的世界杯比赛总量。</p>
      </article>
      <article class="article-card">
        <span class="article-meta">球队样本</span>
        <h3>${snapshot.team_count} 支</h3>
        <p>已整理球队层面的胜平负、进失球与射门质量。</p>
      </article>
      <article class="article-card">
        <span class="article-meta">人员记录</span>
        <h3>${snapshot.person_count} 条</h3>
        <p>覆盖主教练与其他关键人员的样本记录。</p>
      </article>
      <article class="article-card">
        <span class="article-meta">球员样本</span>
        <h3>${snapshot.player_count} 人</h3>
        <p>已覆盖球员出场、首发、分钟、射门、xG 和传球。</p>
      </article>
    `;
  }

  if (homepageDataBoard) {
    homepageDataBoard.innerHTML = `
      <article>
        <span>真实历史样本</span>
        <strong>${snapshot.match_count}</strong>
        <p>所有公开判断都从真实世界杯历史数据起步。</p>
      </article>
      <article>
        <span>球队入口</span>
        <strong>${snapshot.team_count}</strong>
        <p>每支球队都能单独进入页面看结构和样本。</p>
      </article>
      <article>
        <span>球员入口</span>
        <strong>${snapshot.player_count}</strong>
        <p>核心球星和角色球员都可继续补充到页面层。</p>
      </article>
    `;
  }

  if (dataInsightBoard) {
    dataInsightBoard.innerHTML = `
      <article class="insight-card">
        <span>快照时间</span>
        <strong>${snapshot.updated_at.slice(0, 10)}</strong>
        <p>数据中心当前展示的是最近一次构建后的本地快照。</p>
      </article>
      <article class="insight-card muted">
        <span>当前阶段</span>
        <strong>真实数据底座已成型</strong>
        <p>下一步可以继续补球队风格、球员位置热区和更细粒度事件解释。</p>
      </article>
    `;
  }

  if (homepageScorerSpotlight && leadScorer) {
    homepageScorerSpotlight.innerHTML = `
      <div class="spotlight-stat-card">
        <p class="eyebrow">头号球星样本</p>
        <h2>${leadScorer.player_name}</h2>
        <p>${leadScorer.team_name} 当前位于快照射手榜前列。公开层先展示真实样本，第二层再继续延伸个人作用和对位价值。</p>
        <div class="stat-chip-row">
          <span>${leadScorer.goals || 0} 球</span>
          <span>${leadScorer.shots || 0} 次射门</span>
          <span>${formatNumber(leadScorer.xg || 0, 2)} xG</span>
          <span>${leadScorer.appearances || 0} 次出场</span>
        </div>
        <a class="article-link" href="player.html?id=${leadScorer.player_id}">进入球员页</a>
      </div>
    `;
  }

  if (homepageFinalsBoard && latestFinal) {
    homepageFinalsBoard.innerHTML = `
      <div class="spotlight-stat-card">
        <p class="eyebrow">最新淘汰赛样本</p>
        <h2>${latestFinal.home_team} vs ${latestFinal.away_team}</h2>
        <p>${latestFinal.season} 年 ${latestFinal.stage}，比分 ${latestFinal.home_score}-${latestFinal.away_score}。这种高价值样本比普通列表更能撑起站点专业感。</p>
        <div class="stat-chip-row">
          <span>${latestFinal.match_date}</span>
          <span>${latestFinal.stage}</span>
          <span>${latestFinal.home_score}-${latestFinal.away_score}</span>
        </div>
        <a class="article-link" href="data.html">进入数据中心</a>
      </div>
    `;
  }

  if (dataScorerSpotlight && leadScorer) {
    dataScorerSpotlight.innerHTML = `
      <div class="spotlight-stat-card">
        <p class="eyebrow">头号球星快照</p>
        <h3>${leadScorer.player_name}</h3>
        <p>${leadScorer.team_name} 的进攻样本目前最值得首先露出。这个区块可以让数据中心更像真实分析后台，而不是只有表格。</p>
        <div class="stat-chip-row">
          <span>${leadScorer.goals || 0} 球</span>
          <span>${leadScorer.shots_on_target || 0} 次射正</span>
          <span>${formatNumber(leadScorer.xg || 0, 2)} xG</span>
        </div>
        <a class="article-link" href="player.html?id=${leadScorer.player_id}">查看球员详情</a>
      </div>
    `;
  }

  if (dataFinalSnapshot && latestFinal) {
    dataFinalSnapshot.innerHTML = `
      <div class="spotlight-stat-card">
        <p class="eyebrow">冠军赛阶段样本</p>
        <h3>${latestFinal.home_team} ${latestFinal.home_score}-${latestFinal.away_score} ${latestFinal.away_team}</h3>
        <p>${latestFinal.season} 年的 ${latestFinal.stage} 已经进入快照头部样本，后续可以继续补充更细的事件拆解与球员层解释。</p>
        <div class="stat-chip-row">
          <span>${latestFinal.match_date}</span>
          <span>${latestFinal.stage}</span>
          <span>${latestFinal.home_team}</span>
          <span>${latestFinal.away_team}</span>
        </div>
      </div>
    `;
  }

  if (dataStatusText) {
    dataStatusText.textContent = `最近更新：${snapshot.updated_at}。当前包含 ${snapshot.match_count} 场比赛、${snapshot.team_count} 支球队、${snapshot.player_count} 名球员。`;
  }

  if (teamSummaryTable) {
    teamSummaryTable.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>球队</th>
            <th>场次</th>
            <th>胜</th>
            <th>平</th>
            <th>负</th>
            <th>进球</th>
            <th>失球</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.top_teams
            .map(
              (team) => `
                <tr>
                  <td><a href="team.html?team=${encodeURIComponent(team.team)}">${team.team}</a></td>
                  <td>${team.matches}</td>
                  <td>${team.wins}</td>
                  <td>${team.draws}</td>
                  <td>${team.losses}</td>
                  <td>${team.goals_for}</td>
                  <td>${team.goals_against}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  if (latestMatchesTable) {
    latestMatchesTable.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>赛季</th>
            <th>比赛</th>
            <th>比分</th>
            <th>日期</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.latest_matches
            .map(
              (match) => `
                <tr>
                  <td>${match.season}</td>
                  <td>${match.home_team} vs ${match.away_team}</td>
                  <td>${match.home_score}-${match.away_score}</td>
                  <td>${match.match_date}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  if (playerSummaryTable) {
    playerSummaryTable.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>球员</th>
            <th>球队</th>
            <th>出场</th>
            <th>首发</th>
            <th>分钟</th>
            <th>进球</th>
            <th>xG</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.top_players
            .map(
              (player) => `
                <tr>
                  <td><a href="player.html?id=${player.player_id}">${player.player_name}</a></td>
                  <td>${player.team_name}</td>
                  <td>${player.appearances}</td>
                  <td>${player.starts}</td>
                  <td>${player.minutes_estimate}</td>
                  <td>${player.goals || 0}</td>
                  <td>${formatNumber(player.xg || 0, 2)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  if (scorerSummaryTable) {
    scorerSummaryTable.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>球员</th>
            <th>球队</th>
            <th>进球</th>
            <th>射门</th>
            <th>射正</th>
            <th>xG</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.top_scorers
            .map(
              (player) => `
                <tr>
                  <td><a href="player.html?id=${player.player_id}">${player.player_name}</a></td>
                  <td>${player.team_name}</td>
                  <td>${player.goals || 0}</td>
                  <td>${player.shots || 0}</td>
                  <td>${player.shots_on_target || 0}</td>
                  <td>${formatNumber(player.xg || 0, 2)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }
};

const renderDataError = () => {
  if (dataSummaryCards) {
    dataSummaryCards.innerHTML = `
      <article class="article-card">
        <span class="article-meta">数据暂不可用</span>
        <h3>未能读取本地快照</h3>
        <p>请先确认 data/snapshot.json 和 summary 文件存在，再重新加载页面。</p>
      </article>
    `;
  }

  if (teamSummaryTable) teamSummaryTable.innerHTML = '<p class="table-empty">暂无球队汇总。</p>';
  if (latestMatchesTable) latestMatchesTable.innerHTML = '<p class="table-empty">暂无比赛记录。</p>';
  if (playerSummaryTable) playerSummaryTable.innerHTML = '<p class="table-empty">暂无球员汇总。</p>';
  if (scorerSummaryTable) scorerSummaryTable.innerHTML = '<p class="table-empty">暂无射手汇总。</p>';
  if (dataStatusText) dataStatusText.textContent = "当前未能读取本地快照。";
};

const teamTitle = document.querySelector("#team-title");
const teamSummaryText = document.querySelector("#team-summary-text");
const teamStatList = document.querySelector("#team-stat-list");
const teamMatchesTable = document.querySelector("#team-matches-table");
const teamAnalysisBox = document.querySelector("#team-analysis-box");
const teamPlayersTable = document.querySelector("#team-players-table");
const teamHeroImage = document.querySelector("#team-hero-image");
const teamComparisonTable = document.querySelector("#team-comparison-table");

const buildTeamNarrative = (team) => {
  const winRate = formatPercent((team.wins / team.matches) * 100);
  const drawRate = formatPercent((team.draws / team.matches) * 100);
  const goalDiff = team.goals_for - team.goals_against;
  const shotRate = perMatch(team.shots || 0, team.matches, 1);
  const xgForRate = perMatch(team.xg_for || 0, team.matches, 2);
  const xgAgainstRate = perMatch(team.xg_against || 0, team.matches, 2);
  const onTargetRate =
    team.shots > 0 ? formatPercent(((team.shots_on_target || 0) / team.shots) * 100) : "0.0%";

  return `
    <div class="analysis-stack">
      <p>${team.team} 当前历史样本共 ${team.matches} 场，胜率 ${winRate}，平局占比 ${drawRate}，净胜球 ${goalDiff}。这说明它在世界杯舞台上的成绩稳定度处于什么层级。</p>
      <p>进攻端场均射门 ${shotRate}，场均 xG ${xgForRate}；防守端场均被打出 xG ${xgAgainstRate}。如果一个队的 xG 长期高于实际进球，通常代表制造机会能力足够，但终结效率仍有波动。</p>
      <p>射门转化上，本队共有 ${team.shots_on_target || 0} 次射正，射正占比 ${onTargetRate}。公开层适合先看这种稳定指标，再决定是否进入第二层看阵容、赔率与临场修正。</p>
    </div>
  `;
};

const playerTitle = document.querySelector("#player-title");
const playerSummaryText = document.querySelector("#player-summary-text");
const playerStatList = document.querySelector("#player-stat-list");
const playerAnalysisBox = document.querySelector("#player-analysis-box");
const playerMemberBox = document.querySelector("#player-member-box");
const playerContextBox = document.querySelector("#player-context-box");
const playerHeroImage = document.querySelector("#player-hero-image");

const buildPlayerNarrative = (player) => {
  const startRate =
    player.appearances > 0 ? formatPercent((player.starts / player.appearances) * 100) : "0.0%";
  const passRate =
    player.passes > 0 ? formatPercent((player.completed_passes / player.passes) * 100) : "0.0%";
  const shotAccuracy =
    player.shots > 0 ? formatPercent(((player.shots_on_target || 0) / player.shots) * 100) : "0.0%";

  return `
    <div class="analysis-stack">
      <p>${player.player_name} 当前样本出场 ${player.appearances} 次，首发率 ${startRate}，估算分钟 ${player.minutes_estimate}。这能先判断他是核心球员、轮换球员还是边缘补位球员。</p>
      <p>进攻侧目前记录为进球 ${player.goals || 0}、助攻 ${player.assists || 0}、射门 ${player.shots || 0}、xG ${formatNumber(
    player.xg || 0,
    2
  )}。如果 xG 高但进球低，通常意味着机会质量不错但终结波动较大。</p>
      <p>组织侧传球成功率 ${passRate}，射门命中率 ${shotAccuracy}。公开层先展示这些稳定指标，第二层再延伸到对位、角色职责和临场价值。</p>
    </div>
  `;
};

Promise.all([
  fetch("data/snapshot.json").then((response) => {
    if (!response.ok) throw new Error("snapshot unavailable");
    return response.json();
  }),
  fetch("data/summary/worldcup_team_summary.json").then((response) => response.json()),
  fetch("data/summary/worldcup_player_summary.json").then((response) => response.json()),
  fetch("data/summary/worldcup_matches.json").then((response) => response.json()),
])
  .then(([snapshot, teams, players, matches]) => {
    const sortedPlayers = [...players].sort(byGoals);
    const visiblePlayers = sortedPlayers.filter((player) => player.appearances >= 3);

    renderSnapshot(snapshot);
    renderTeamCards(teams.slice(0, 6), teamLibraryList);
    renderPlayerCards(visiblePlayers.slice(0, 6), playerLibraryList);
    renderTeamCards(teams.slice(0, 24), teamsPageList);
    renderPlayerCards(visiblePlayers.slice(0, 24), playersPageList);

    if (heroTeamStrip) {
      heroTeamStrip.innerHTML = teams
        .slice(0, 5)
        .map(
          (team) => `
            <a class="hero-strip-card" href="team.html?team=${encodeURIComponent(team.team)}">
              <strong>${team.team}</strong>
              <span>${team.matches} 场历史样本</span>
            </a>
          `
        )
        .join("");
    }

    if (heroPlayerStrip) {
      heroPlayerStrip.innerHTML = visiblePlayers
        .slice(0, 5)
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

    if (teamSearchInput && teamsPageList) {
      teamSearchInput.addEventListener("input", () => {
        const keyword = teamSearchInput.value.trim().toLowerCase();
        const filtered = teams.filter((team) => team.team.toLowerCase().includes(keyword));
        renderTeamCards(filtered.slice(0, 24), teamsPageList);
      });
    }

    if (playerSearchInput && playersPageList) {
      playerSearchInput.addEventListener("input", () => {
        const keyword = playerSearchInput.value.trim().toLowerCase();
        const filtered = visiblePlayers.filter((player) =>
          normalizeName(player.player_name).toLowerCase().includes(normalizeName(keyword).toLowerCase())
        );
        renderPlayerCards(filtered.slice(0, 24), playersPageList);
      });
    }

    if (teamTitle && teamSummaryText && teamStatList && teamMatchesTable && teamAnalysisBox && teamPlayersTable) {
      const params = new URLSearchParams(window.location.search);
      const currentTeamName = params.get("team");
      const team = teams.find((item) => item.team === currentTeamName) || teams[0];
      const recentMatches = matches
        .filter((match) => match.home_team === team.team || match.away_team === team.team)
        .sort((a, b) => String(b.match_date).localeCompare(String(a.match_date)))
        .slice(0, 8);
      const teamPlayers = players
        .filter((player) => player.team_name === team.team)
        .sort(byGoals)
        .slice(0, 12);
      const averageGoalsFor = perMatch(team.goals_for, team.matches, 2);
      const averageGoalsAgainst = perMatch(team.goals_against, team.matches, 2);

      teamTitle.textContent = `${team.team} 球队分析页`;
      teamSummaryText.textContent = `${team.team} 在当前世界杯历史样本中共 ${team.matches} 场，进球 ${team.goals_for}，失球 ${team.goals_against}。第一层页面先展示结构和稳定指标，第二层再承接更深判断。`;
      if (teamHeroImage) {
        teamHeroImage.src = teamArtwork[team.team] || fallbackArtwork.team;
        teamHeroImage.alt = `${team.team} 队伍画面`;
      }

      teamStatList.innerHTML = `
        <li>历史场次：${team.matches}</li>
        <li>胜平负：${team.wins} / ${team.draws} / ${team.losses}</li>
        <li>场均进球：${averageGoalsFor}</li>
        <li>场均失球：${averageGoalsAgainst}</li>
        <li>射门：${team.shots || 0}</li>
        <li>射正：${team.shots_on_target || 0}</li>
        <li>xG：${formatNumber(team.xg_for || 0, 2)}</li>
        <li>xGA：${formatNumber(team.xg_against || 0, 2)}</li>
      `;

      teamMatchesTable.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>赛季</th>
              <th>阶段</th>
              <th>比赛</th>
              <th>比分</th>
            </tr>
          </thead>
          <tbody>
            ${recentMatches
              .map(
                (match) => `
                  <tr>
                    <td>${match.season}</td>
                    <td>${match.stage}</td>
                    <td>${match.home_team} vs ${match.away_team}</td>
                    <td>${match.home_score}-${match.away_score}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `;

      teamAnalysisBox.innerHTML = buildTeamNarrative(team);

      teamPlayersTable.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>球员</th>
              <th>出场</th>
              <th>首发</th>
              <th>进球</th>
              <th>xG</th>
              <th>传球成功率</th>
            </tr>
          </thead>
          <tbody>
            ${teamPlayers
              .map((player) => {
                const passRate =
                  player.passes > 0
                    ? formatPercent((player.completed_passes / player.passes) * 100)
                    : "0.0%";

                return `
                  <tr>
                    <td><a href="player.html?id=${player.player_id}">${player.player_name}</a></td>
                    <td>${player.appearances}</td>
                    <td>${player.starts}</td>
                    <td>${player.goals || 0}</td>
                    <td>${formatNumber(player.xg || 0, 2)}</td>
                    <td>${passRate}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      `;

      if (teamComparisonTable) {
        const comparisonPool = teams
          .filter((item) => item.team !== team.team)
          .slice(0, 5);
        teamComparisonTable.innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th>球队</th>
                <th>胜率</th>
                <th>场均射门</th>
                <th>场均 xG</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${team.team}</td>
                <td>${formatPercent((team.wins / team.matches) * 100)}</td>
                <td>${perMatch(team.shots || 0, team.matches, 1)}</td>
                <td>${perMatch(team.xg_for || 0, team.matches, 2)}</td>
              </tr>
              ${comparisonPool
                .map(
                  (item) => `
                    <tr>
                      <td>${item.team}</td>
                      <td>${formatPercent((item.wins / item.matches) * 100)}</td>
                      <td>${perMatch(item.shots || 0, item.matches, 1)}</td>
                      <td>${perMatch(item.xg_for || 0, item.matches, 2)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        `;
      }
    }

    if (playerTitle && playerSummaryText && playerStatList && playerAnalysisBox && playerMemberBox && playerContextBox) {
      const params = new URLSearchParams(window.location.search);
      const currentPlayerId = params.get("id");
      const player = players.find((item) => String(item.player_id) === String(currentPlayerId)) || visiblePlayers[0];
      const team = teams.find((item) => item.team === player.team_name);
      const teamMates = players
        .filter((item) => item.team_name === player.team_name)
        .sort(byGoals)
        .slice(0, 6);
      const passRate =
        player.passes > 0 ? formatPercent((player.completed_passes / player.passes) * 100) : "0.0%";
      const shotAccuracy =
        player.shots > 0 ? formatPercent(((player.shots_on_target || 0) / player.shots) * 100) : "0.0%";

      playerTitle.textContent = `${player.player_name} 球员分析页`;
      playerSummaryText.textContent = `${player.player_name} 当前归属 ${player.team_name}，历史样本出场 ${player.appearances} 次。第一层公开页先解释样本与角色，第二层再看更深层临场价值。`;
      if (playerHeroImage) {
        playerHeroImage.src =
          Object.entries(playerArtwork).find(
            ([name]) => normalizeName(name) === normalizeName(player.player_name)
          )?.[1] || fallbackArtwork.player;
        playerHeroImage.alt = `${player.player_name} 画面`;
      }

      playerStatList.innerHTML = `
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

      playerAnalysisBox.innerHTML = buildPlayerNarrative(player);

      playerMemberBox.innerHTML = `
        <div class="analysis-stack">
          <p>第二层会员内容会继续补充这名球员在不同对位中的价值、临场名单修正后的角色变化，以及更细的事件级解释。</p>
          <p>公开层保持克制，只展示足以建立信任的真实样本，不直接堆结论。</p>
        </div>
      `;

      playerContextBox.innerHTML = `
        <div class="analysis-stack">
          <p>${player.team_name} 团队当前历史样本 ${team?.matches || 0} 场，进球 ${
        team?.goals_for || 0
      }，xG ${formatNumber(team?.xg_for || 0, 2)}。单个球员的判断必须放回球队结构里看，才不会失真。</p>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>同队球员</th>
              <th>进球</th>
              <th>xG</th>
              <th>出场</th>
            </tr>
          </thead>
          <tbody>
            ${teamMates
              .map(
                (item) => `
                  <tr>
                    <td><a href="player.html?id=${item.player_id}">${item.player_name}</a></td>
                    <td>${item.goals || 0}</td>
                    <td>${formatNumber(item.xg || 0, 2)}</td>
                    <td>${item.appearances}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `;
    }
  })
  .catch(renderDataError);
