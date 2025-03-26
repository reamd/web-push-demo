const Router = require("koa-router");
const webpush = require("web-push");
require("dotenv").config();

// 配置 web-push
webpush.setVapidDetails(
  process.env.WEB_PUSH_CONTACT,
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

const router = new Router();

// 存储订阅信息（在实际应用中应使用数据库存储）
let subscriptions = [];

// 获取公钥路由
router.get("/vapidPublicKey", (ctx) => {
  ctx.body = { publicKey: process.env.PUBLIC_VAPID_KEY };
});

// 验证订阅路由
router.post("/verify-subscription", async (ctx) => {
  const subscription = ctx.request.body;

  // 如果订阅不在列表中，认为是无效的
  const exists = subscriptions.find(
    (sub) => JSON.stringify(sub) === JSON.stringify(subscription)
  );

  if (exists) {
    // 订阅有效
    ctx.status = 200;
    ctx.body = { success: true, valid: true };
  } else {
    // 订阅无效或未知
    ctx.status = 404;
    ctx.body = { success: false, valid: false, message: "订阅未在服务器注册" };
  }
});

// 订阅路由
router.post("/subscribe", async (ctx) => {
  const subscription = ctx.request.body;

  // 在实际应用中，应当将订阅保存到数据库
  // 这里使用内存存储作为演示
  const exists = subscriptions.find(
    (sub) => JSON.stringify(sub) === JSON.stringify(subscription)
  );

  if (!exists) {
    subscriptions.push(subscription);
    console.log("订阅成功:", subscription);
  }

  ctx.status = 201;
  ctx.body = { success: true, message: "订阅成功" };
});

// 发送推送通知路由
router.post("/send-notification", async (ctx) => {
  const { title, body, icon, url } = ctx.request.body;

  if (subscriptions.length === 0) {
    ctx.status = 404;
    ctx.body = { success: false, message: "没有活跃的订阅" };
    return;
  }

  // 准备推送的消息内容
  const payload = JSON.stringify({
    title: title || "新通知",
    body: body || "您有一条新的通知！",
    icon: icon || "/images/icon.png",
    url: url || "/",
  });

  // 发送计数和错误计数
  let sentCount = 0;
  let failedCount = 0;

  // 使用 Promise.all 并行发送所有推送
  const pushPromises = subscriptions.map(async (subscription, index) => {
    try {
      await webpush.sendNotification(subscription, payload);
      sentCount++;
      return true;
    } catch (error) {
      console.error(`推送失败 #${index}:`, error);

      // 如果是订阅过期或无效，从列表中移除
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log("订阅过期或无效，从列表中移除");
        failedCount++;
        // 标记需要移除的索引
        return false;
      }
      failedCount++;
      return true; // 其他错误，保留订阅
    }
  });

  // 等待所有推送完成
  const results = await Promise.all(pushPromises);

  // 过滤掉无效的订阅
  subscriptions = subscriptions.filter((_, index) => results[index]);

  ctx.body = {
    success: true,
    message: `成功发送${sentCount}条通知，失败${failedCount}条`,
  };
});

// 获取当前订阅数量
router.get("/subscriptions/count", (ctx) => {
  ctx.body = { count: subscriptions.length };
});

module.exports = router;
