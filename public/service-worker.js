/**
 * Web Push 通知 Service Worker
 */

// 安装事件
self.addEventListener("install", (event) => {
  console.log("Service Worker 安装中...");
  // 跳过等待，直接激活
  self.skipWaiting();
});

// 激活事件
self.addEventListener("activate", (event) => {
  console.log("Service Worker 已激活");
  // 立即接管所有客户端
  event.waitUntil(clients.claim());
});

// 接收推送事件
self.addEventListener("push", (event) => {
  console.log("Service Worker 收到推送事件:", event);

  if (!event.data) {
    console.warn("收到了没有数据的推送消息");
    return;
  }

  try {
    // 解析推送消息数据
    const payload = event.data.json();
    console.log("收到推送数据:", payload);

    // 构建通知选项
    const options = {
      body: payload.body || "您有一条新的通知！",
      icon: payload.icon || "/images/icon.png",
      badge: payload.badge || "/images/badge.png",
      data: {
        url: payload.url || "/",
      },
      // 允许震动
      vibrate: [100, 50, 100],
      // 通知的重要性
      requireInteraction: payload.requireInteraction || false,
    };

    // 显示通知
    event.waitUntil(
      self.registration.showNotification(payload.title || "新通知", options)
    );
  } catch (error) {
    console.error("处理推送消息时出错:", error);
    // 显示默认通知
    event.waitUntil(
      self.registration.showNotification("新通知", {
        body: "收到一条新通知，但无法解析详细内容",
        icon: "/images/icon.png",
      })
    );
  }
});

// 点击通知事件
self.addEventListener("notificationclick", (event) => {
  console.log("通知被点击:", event);

  // 关闭通知
  event.notification.close();

  // 获取通知数据中的URL
  const targetUrl = event.notification.data?.url || "/";

  // 打开URL或聚焦已有窗口
  event.waitUntil(
    clients
      .matchAll({ type: "window" })
      .then((clientList) => {
        // 检查是否已有打开的窗口
        for (const client of clientList) {
          // 如果找到匹配的URL，则聚焦该窗口
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // 如果没有匹配的窗口，则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error("处理通知点击事件时出错:", error);
      })
  );
});

// 通知关闭事件
self.addEventListener("notificationclose", (event) => {
  console.log("通知被关闭:", event);
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestData = {
    url: request.url,
    method: request.method,
    type: request.mode,
    timestamp: Date.now(),
  };

  // 记录请求信息（可扩展存储到 IndexedDB 或发送到后端）
  console.log(3333);
  fetch(`https://www.baidu.com?v=1233`);
  // 正常响应请求（此处不修改响应）
  event.respondWith(fetch(request));
});
