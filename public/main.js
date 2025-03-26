// 全局变量
let vapidPublicKey = null;
let subscription = null;
let isSubscribed = false;
let serviceWorkerRegistration = null;

// DOM 元素
const subscribeBtn = document.getElementById("subscribe-btn");
const sendNotificationBtn = document.getElementById("send-notification-btn");
const subscriptionStatus = document.getElementById("subscription-status");
const sendStatus = document.getElementById("send-status");
const subscribersCount = document.getElementById("subscribers-count");

// 工具函数：显示状态信息
function showStatus(element, message, type = "info") {
  console.log(`状态更新: ${message} (类型: ${type})`);
  element.innerHTML = `<div class="status ${type}">${message}</div>`;
}

// 工具函数：将Base64转换为Uint8Array (用于VAPID key)
function urlBase64ToUint8Array(base64String) {
  console.log("正在转换VAPID公钥...");
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  console.log("VAPID公钥转换完成");
  return outputArray;
}

// 更新订阅状态UI
function updateSubscriptionUI() {
  console.log(`更新UI: 订阅状态=${isSubscribed}`);
  if (isSubscribed) {
    subscribeBtn.textContent = "取消订阅";
    showStatus(subscriptionStatus, "已成功订阅推送通知！", "success");
    sendNotificationBtn.disabled = false;
  } else {
    subscribeBtn.textContent = "订阅通知";
    showStatus(subscriptionStatus, "尚未订阅推送通知", "warning");
    sendNotificationBtn.disabled = true;
  }
}

// 检查是否已经订阅
async function checkSubscription(registration) {
  console.log("检查现有订阅状态...");
  try {
    const existingSubscription =
      await registration.pushManager.getSubscription();
    console.log("现有订阅信息:", existingSubscription);

    if (existingSubscription) {
      // 验证订阅是否有效
      try {
        // 检查当前订阅是否与服务器匹配
        const response = await fetch("/api/verify-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(existingSubscription),
        });

        if (!response.ok) {
          console.warn("现有订阅可能无效，将重新订阅");
          await existingSubscription.unsubscribe();
          isSubscribed = false;
          subscription = null;
        } else {
          isSubscribed = true;
          subscription = existingSubscription;
        }
      } catch (error) {
        console.warn("验证订阅时出错，将使用现有订阅:", error);
        isSubscribed = true;
        subscription = existingSubscription;
      }
    } else {
      isSubscribed = false;
      subscription = null;
    }

    updateSubscriptionUI();
    return subscription;
  } catch (error) {
    console.error("检查订阅状态失败:", error);
    showStatus(
      subscriptionStatus,
      "检查通知权限时出错: " + error.message,
      "error"
    );
    return null;
  }
}

// 请求通知权限
async function requestNotificationPermission() {
  console.log("正在请求通知权限...");
  try {
    const permission = await Notification.requestPermission();
    console.log(`通知权限结果: ${permission}`);
    if (permission !== "granted") {
      throw new Error("需要通知权限才能接收推送");
    }
    return true;
  } catch (error) {
    console.error("请求通知权限失败:", error);
    showStatus(
      subscriptionStatus,
      "请求通知权限失败: " + error.message,
      "error"
    );
    return false;
  }
}

// 获取 VAPID 公钥
async function getVapidPublicKey() {
  console.log("正在获取VAPID公钥...");
  try {
    if (vapidPublicKey) {
      console.log("使用缓存的VAPID公钥");
      return vapidPublicKey;
    }

    console.log("从服务器获取VAPID公钥...");
    const response = await fetch("/api/vapidPublicKey");
    console.log("VAPID公钥响应状态:", response.status);
    if (!response.ok) {
      throw new Error("获取公钥失败: " + response.statusText);
    }

    const data = await response.json();
    console.log("收到VAPID公钥数据:", data);
    vapidPublicKey = data.publicKey;

    // 保存公钥到localStorage，用于后续验证
    localStorage.setItem("vapidPublicKey", vapidPublicKey);

    return vapidPublicKey;
  } catch (error) {
    console.error("获取 VAPID 公钥失败:", error);
    showStatus(
      subscriptionStatus,
      "获取推送服务配置失败: " + error.message,
      "error"
    );
    return null;
  }
}

// 订阅推送
async function subscribeToPush() {
  console.log("开始订阅推送流程...");
  try {
    // 如果已有订阅，先取消
    if (subscription) {
      console.log("发现现有订阅，先取消");
      await subscription.unsubscribe();
      subscription = null;
    }

    // 获取 VAPID 公钥
    const publicKey = await getVapidPublicKey();
    console.log("获取到公钥:", publicKey);
    if (!publicKey) return;

    // 将 Base64 公钥转换为 Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    console.log("正在创建推送订阅...");
    // 创建推送订阅
    subscription = await serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });
    console.log("推送订阅创建成功:", subscription);

    // 将订阅信息发送到服务器
    console.log("正在发送订阅信息到服务器...");
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });
    console.log("服务器响应状态:", response.status);

    if (!response.ok) {
      throw new Error("服务器拒绝了订阅请求: " + response.statusText);
    }

    isSubscribed = true;
    updateSubscriptionUI();
    updateSubscribersCount();
    return true;
  } catch (error) {
    console.error("订阅推送失败:", error);
    showStatus(subscriptionStatus, "订阅推送失败: " + error.message, "error");
    return false;
  }
}

// 取消订阅
async function unsubscribeFromPush() {
  try {
    await subscription.unsubscribe();
    subscription = null;
    isSubscribed = false;
    updateSubscriptionUI();
    updateSubscribersCount();
    showStatus(subscriptionStatus, "已成功取消订阅", "info");
    return true;
  } catch (error) {
    console.error("取消订阅失败:", error);
    showStatus(subscriptionStatus, "取消订阅失败: " + error.message, "error");
    return false;
  }
}

// 发送通知
async function sendNotification() {
  try {
    const title =
      document.getElementById("notification-title").value || "新通知";
    const body =
      document.getElementById("notification-body").value ||
      "您有一条新的通知！";
    const url = document.getElementById("notification-url").value || null;

    showStatus(sendStatus, "正在发送通知...", "info");

    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, url }),
    });

    if (!response.ok) {
      throw new Error("发送通知失败: " + response.statusText);
    }

    const result = await response.json();
    showStatus(sendStatus, result.message, "success");
    return true;
  } catch (error) {
    console.error("发送通知失败:", error);
    showStatus(sendStatus, "发送通知失败: " + error.message, "error");
    return false;
  }
}

// 更新订阅者数量
async function updateSubscribersCount() {
  try {
    const response = await fetch("/api/subscriptions/count");
    if (!response.ok) {
      throw new Error("获取订阅者数量失败");
    }

    const data = await response.json();
    subscribersCount.textContent = data.count;
  } catch (error) {
    console.error("获取订阅者数量失败:", error);
  }
}

// 注册事件监听器
function registerEventListeners() {
  // 订阅/取消订阅按钮点击事件
  subscribeBtn.addEventListener("click", async () => {
    if (isSubscribed) {
      await unsubscribeFromPush();
    } else {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await subscribeToPush();
      }
    }
  });

  // 发送通知按钮点击事件
  sendNotificationBtn.addEventListener("click", async () => {
    await sendNotification();
  });
}

// 初始化服务工作线程
async function initServiceWorker() {
  console.log("开始初始化Service Worker...");
  try {
    if (!("serviceWorker" in navigator)) {
      console.error("浏览器不支持Service Worker");
      throw new Error("您的浏览器不支持 Service Worker");
    }

    if (!("PushManager" in window)) {
      console.error("浏览器不支持Push Manager");
      throw new Error("您的浏览器不支持推送通知");
    }

    // 检查存储的公钥与服务器当前公钥是否匹配
    const storedKey = localStorage.getItem("vapidPublicKey");
    if (storedKey) {
      const currentKey = await getVapidPublicKey();
      if (storedKey !== currentKey) {
        console.warn("检测到VAPID公钥已更改，将重置订阅");
        // 如果公钥变了，需要移除所有现有Service Worker并重新注册
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
          await registration.unregister();
        }
      }
    }

    // 注册 Service Worker
    console.log("正在注册Service Worker...");
    serviceWorkerRegistration = await navigator.serviceWorker.register(
      "/service-worker.js"
    );
    console.log("Service Worker 注册成功:", serviceWorkerRegistration);

    // 等待 Service Worker 激活
    if (serviceWorkerRegistration.installing) {
      console.log("Service Worker 正在安装中");
      const worker = serviceWorkerRegistration.installing;

      worker.addEventListener("statechange", () => {
        console.log(`Service Worker 状态变更: ${worker.state}`);
        if (worker.state === "activated") {
          console.log("Service Worker 已激活");
        }
      });
    } else if (serviceWorkerRegistration.active) {
      console.log("Service Worker 已经处于活跃状态");
    }

    // 检查现有的订阅
    await checkSubscription(serviceWorkerRegistration);

    // 更新订阅者数量
    await updateSubscribersCount();

    return true;
  } catch (error) {
    console.error("初始化 Service Worker 失败:", error);
    showStatus(subscriptionStatus, "初始化失败: " + error.message, "error");
    return false;
  }
}

// 页面加载完成后初始化
window.addEventListener("load", async () => {
  console.log("页面加载完成，开始初始化...");

  // 初始化 Service Worker
  await initServiceWorker();

  // 注册事件监听器
  registerEventListeners();
  console.log("事件监听器注册完成");
});
