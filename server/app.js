const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// 导入路由
const pushRouter = require("./routes/push");

const app = new Koa();
const router = new Router();

// 配置跨域中间件
app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Content-Length, Authorization, Accept, X-Requested-With"
  );
  ctx.set("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
  if (ctx.method === "OPTIONS") {
    ctx.status = 204;
    return;
  }
  await next();
});

// 配置中间件
app.use(bodyParser());

// 静态文件服务
app.use(serve(path.join(__dirname, "../public")));

// 配置路由
router.use("/api", pushRouter.routes(), pushRouter.allowedMethods());

// 主页路由
router.get("/", async (ctx) => {
  ctx.redirect("/index.html");
});

// 使用路由
app.use(router.routes()).use(router.allowedMethods());

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404) {
      ctx.body = { success: false, message: "未找到请求的资源" };
    }
  } catch (err) {
    console.error("Server Error:", err);
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message || "服务器内部错误",
    };
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
