# Web Push 通知演示

这是一个基于 Node.js (Koa2) 和浏览器推送 API 实现的 Web Push 通知演示项目。

## 功能特点

- 基于 Koa2 框架的后端推送服务
- 支持 Web Push API 标准
- 通过 Service Worker 接收和处理推送通知
- 简单易用的订阅和推送界面
- 完整的错误处理和状态提示

## 技术栈

- 后端: Node.js, Koa2, web-push
- 前端: HTML5, CSS3, JavaScript (原生)
- 通知: Web Push API, Service Worker

## 项目结构

```
.
├── public/                # 前端静态文件
│   ├── images/            # 图片资源
│   ├── index.html         # 主页面
│   ├── main.js            # 前端 JavaScript
│   └── service-worker.js  # Service Worker 脚本
├── server/                # 后端服务
│   ├── routes/            # 路由定义
│   │   └── push.js        # 推送服务路由
│   └── app.js             # 应用入口
├── .env                   # 环境变量配置
├── package.json           # 项目依赖
└── README.md              # 项目说明
```

## 快速开始

1. 克隆仓库

```bash
git clone [仓库地址]
cd [项目目录]
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量
   编辑 `.env` 文件，设置你自己的 VAPID 密钥：

```
PORT=3000
PUBLIC_VAPID_KEY=你的公钥
PRIVATE_VAPID_KEY=你的私钥
WEB_PUSH_CONTACT="mailto:your-email@example.com"
```

可以通过以下命令生成 VAPID 密钥：

```bash
npx web-push generate-vapid-keys
```

4. 启动服务

```bash
npm start
```

5. 访问应用
   打开浏览器访问 `http://localhost:3000`

## 使用说明

1. 在网页上点击"订阅通知"按钮
2. 允许浏览器的通知权限请求
3. 填写通知标题和内容
4. 点击"发送通知"按钮
5. 查看收到的推送通知

## 注意事项

- Web Push 推送必须在 HTTPS 环境或 localhost 下使用
- 不同浏览器对 Web Push 的支持可能有所不同
- 在生产环境中，应当将订阅信息存储在数据库中

## 许可证

MIT

## 扩展与改进

- 添加数据库存储订阅信息
- 实现用户认证系统
- 增加推送通知的定时和批量功能
- 完善错误处理和日志记录

## 排查弹窗

### 一、浏览器弹窗拦截与权限配置

- ‌ 全局弹窗拦截设置 ‌
  进入 Chrome 设置 → ‌ 隐私和安全 → 网站设置 → 弹出式窗口和重定向 ‌，确保开启 ‌ 允许发送弹出式窗口并使用重定向 ‌‌
  若特定网站被拦截，需在 ‌ 允许发送弹出式窗口 ‌ 列表中添加该网站域名 ‌

- ‌ 通知权限双重验证 ‌
  检查 Chrome 通知权限：进入 chrome://settings/content/notifications，确认目标网站在 ‌ 允许 ‌ 列表中 ‌
  检查操作系统通知设置（Windows：设置 → 系统 → 通知；macOS：系统偏好设置 → 通知），确保 Chrome 有发送通知的权限 ‌

### 二、网站级配置与冲突排查

- ‌HTTP 协议限制 ‌
  非 HTTPS 网站默认无法触发系统级通知弹窗 ‌4。若为本地开发环境，需通过 localhost 或启用 HTTPS 测试 ‌。

- 焦点窗口抑制弹窗 ‌
  当浏览器窗口处于全屏模式或视频播放状态时，系统可能自动屏蔽通知弹窗。需退出全屏或暂停媒体播放测试 ‌。

- 扩展程序冲突 ‌
  禁用广告拦截插件（如 uBlock Origin、AdGuard）或隐私保护扩展，测试是否恢复弹窗 ‌

### 三、运行环境与显示问题

- ‌ 多显示器排查 ‌
  若连接多台显示器，通知可能出现在非当前活跃屏幕的角落。检查所有屏幕的通知区域 ‌。

- ‌ 通知样式兼容性 ‌
  在 Chrome 设置中尝试切换 ‌ 静默通知 ‌ 模式：进入 chrome://flags/#enable-native-notifications，禁用 ‌Enable Native Notifications‌ 标志 ‌。

- ‌ 浏览器缓存清理 ‌
  清除 Chrome 缓存：设置 → 隐私和安全 → 清除浏览数据 → 选择 ‌ 缓存的图片和文件 ‌‌
