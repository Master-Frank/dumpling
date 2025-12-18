# 冬至暖心祝福留言板（winter-solstice-blessings）

一个前后端同仓的轻量留言板：
- 前端：静态页面（`public/`）
- 后端：Node.js + Express（`server.js`）
- 存储：本地 SQLite 数据库文件（通过 `sql.js` 写入 `blessings.db`）

## 本地运行

环境要求：Node.js `>= 14`

```bash
npm install
npm run start
```

默认端口：`3000`（可通过环境变量 `PORT` 覆盖）。

启动后访问：
- 页面：`http://localhost:3000/`
- API：`http://localhost:3000/api/...`

## API

- `GET /api/blessings/count`：获取祝福条数
- `GET /api/blessings?limit=100`：获取祝福列表（默认 `100`）
- `POST /api/blessings`：新增祝福
  - Body：`{ "content": "..." }`
  - 限制：`content` 不能为空，长度不超过 `200`

## 数据文件

应用会在项目根目录创建/更新 `blessings.db`（本地数据文件）。建议不要提交到 Git。

## 部署要点（简版）

- 服务器安装 Node.js（建议 16/18 LTS）并执行 `npm ci` 或 `npm install`
- 用进程守护（PM2/systemd）运行：`node server.js`
- 用 Nginx 反向代理到 `127.0.0.1:<PORT>`

