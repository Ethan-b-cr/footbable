# World Cup Edge

`World Cup Edge` 是一个面向世界杯分析与会员转化的静态网站 MVP，适合先部署到公网，再逐步接入真实登录、支付和内容后台。

## 当前内容

- 首页首屏与转化按钮
- 今日重点比赛卡片
- 免费分析样例
- 会员权益区
- 焦点战深度页结构样板
- 会员与单场付费价格区
- 联系开通入口

## 本地预览

直接用浏览器打开 `index.html` 即可预览。

## 推荐部署方案

推荐使用 `Cloudflare Pages`，因为当前站点是纯静态文件：

- `index.html`
- `styles.css`
- `script.js`

这类项目不需要构建命令，不需要 Node 环境，也不需要服务器。

## Cloudflare Pages 上线步骤

### 第一步：把代码放到 GitHub

在当前目录执行：

```powershell
git add .
git commit -m "Initial World Cup Edge static site"
```

然后把这个仓库推到你的 GitHub 新仓库。

如果你还没连远程仓库，用：

```powershell
git remote add origin <你的 GitHub 仓库地址>
git branch -M main
git push -u origin main
```

### 第二步：进入 Cloudflare Pages

1. 登录 Cloudflare
2. 打开 `Workers & Pages`
3. 点击 `Create application`
4. 选择 `Pages`
5. 选择 `Connect to Git`
6. 连接你的 GitHub 仓库

### 第三步：导入仓库时这样填

- Production branch: `main`
- Framework preset: `None` 或 `Static`
- Build command: 留空
- Build output directory: 留空
- Root directory: 留空

因为这个项目不是 React、Vue 或 Next.js，所以不要乱填构建命令。

### 第四步：点部署

Cloudflare 会直接把仓库里的静态文件发布成一个公网网址，通常会给你一个类似下面的地址：

```text
https://your-project-name.pages.dev
```

别人拿到这个网址就能访问你的网站。

## 部署成功后建议立刻做的事

1. 绑定你自己的域名
2. 把 `mailto:` 按钮换成真实联系方式
3. 补真实比赛内容
4. 增加一个“开通会员”表单或支付入口

## 当前站点里的临时占位

目前页脚按钮还是：

```text
contact@worldcupedge.example
```

你上线前最好换成真实邮箱、微信承接页，或者表单链接。

## 第二阶段适合继续补的功能

1. 登录/注册
2. 普通会员和专业会员权限
3. 单场购买订单系统
4. 后台发布文章
5. 真实支付接口
