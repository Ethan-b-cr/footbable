# World Cup Edge

`World Cup Edge` 是一个面向世界杯分析的网站项目，目标是把它做成一个能公开访问、并且有第一层公开分析与第二层深度内容分层的网站。

当前项目已经不只是一个本地演示页，而是一个完整的静态前端站点骨架，包含：

- 首页公开分析入口
- 球队分析库与球队详情页
- 球员分析库与球员详情页
- 数据中心与数据来源页
- 动态文章详情页
- 登录页与会员中心页
- FAQ / 方法说明 / 隐私政策 / 服务条款 / 404
- 本地历史数据抓取与快照脚本

## 当前页面

- `index.html`：首页
- `article.html`：文章详情页，支持 `?slug=...`
- `members.html`：会员中心
- `login.html`：会员登录页
- `thanks.html`：咨询提交成功页
- `sources.html`：数据来源页
- `data.html`：数据中心页
- `about.html`：方法说明页
- `faq.html`：常见问题页
- `privacy.html`：隐私政策页
- `terms.html`：服务条款页
- `404.html`：404 页面
- `teams.html`：球队分析库
- `team.html`：球队详情页
- `players.html`：球员分析库
- `player.html`：球员详情页

## 动态内容文件

- `articles.js`：文章内容与结构数据
- `data-sources.js`：数据来源配置
- `script.js`：前端渲染与交互逻辑
- `styles.css`：全站样式

## 本地数据脚本

当前已经接入一条可运行的数据管线，先基于 `StatsBomb Open Data` 整理历史世界杯比赛数据。

### 1. 抓取历史世界杯比赛

```powershell
node scripts/fetch-statsbomb-worldcup.js
```

输出：

- `data/raw/statsbomb/*.json`
- `data/summary/worldcup_matches.json`
- `data/summary/worldcup_team_summary.json`
- `data/summary/worldcup_person_summary.json`
- `data/summary/worldcup_player_summary.json`

### 2. 构建站点数据快照

```powershell
node scripts/build-data-snapshot.js
```

输出：

- `data/snapshot.json`

`data.html` 会读取这个快照并展示：

- 历史比赛总数
- 球队数量
- 人员记录数量
- 球员数量
- Top 球队汇总
- 比赛记录与球员样本

## 当前真实数据基础

当前站点的真实历史快照已经包含：

- `match_count: 144`
- `team_count: 44`
- `person_count: 73`
- `player_count: 1732`

球队层已补充：

- `shots`
- `shots_on_target`
- `xg_for`
- `xg_against`

球员层已补充：

- `passes`
- `completed_passes`
- `shots`
- `shots_on_target`
- `goals`
- `assists`
- `xg`

## 当前使用 / 计划接入的数据来源

- `StatsBomb Open Data`
- `football-data.org API`
- `FIFA Football Data Platform`

其中：

- `StatsBomb Open Data` 适合做历史比赛、球队与球员事件层分析
- `football-data.org API` 适合补赛程、球队近期信息和比赛名单
- `FIFA Football Data Platform` 适合作为官方赛事背景与口径参考

## 当前会员体验

当前站点已经具备基础前端会员体验：

- 登录页会把本地会员状态存到 `localStorage`
- 会员中心会根据登录状态切换内容
- 文章详情页可区分公开内容与第二层内容
- 登录后第二层内容区会切换到已解锁状态

注意：这仍然是前端体验，不是正式后端鉴权系统。

## Cloudflare Pages 部署

当前站点适合继续部署到 `Cloudflare Pages`。

推送到 GitHub 后，在 Cloudflare Pages 里导入仓库时可使用：

- Production branch: `main`
- Framework preset: `None`
- Build command: 留空
- Build output directory: 留空
- Root directory: 留空

如果已经连接好 GitHub，后续只需要：

```powershell
git add .
git commit -m "Update World Cup Edge site"
git push origin main
```

Cloudflare Pages 会自动重新部署。

## 表单说明

咨询表单当前通过 `FormSubmit` 提交到：

- `ethan8882026@outlook.com`

首次使用时，需要去邮箱确认 `FormSubmit` 的激活邮件，否则提交不会真正生效。

## 下一阶段最应该补的能力

1. 正式用户鉴权
2. 正式会员权限控制
3. 正式支付与开通流程
4. 自动化数据同步
5. 更细的球队与球员分析模型
6. 更多历史样本与实时数据接入
