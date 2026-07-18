import { routeAgentRequest } from "agents";
import type { Env } from "./env.d";

// 导出 Durable Object 类（Wrangler 需要在入口能找到）
export { EcoChatAgent } from "./EcoChatAgent";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // 处理 CORS 预检请求 (OPTIONS)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": req.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 1. 先尝试路由到 Agent（WebSocket / RPC）
    let routed = await routeAgentRequest(req, env);
    if (routed) {
      // 保证所有 Agent 响应都带上正确的 CORS 头部
      const origin = req.headers.get("Origin");
      const headers = new Headers(routed.headers);
      if (origin) {
        headers.set("Access-Control-Allow-Origin", origin);
        headers.set("Access-Control-Allow-Credentials", "true");
      } else {
        headers.set("Access-Control-Allow-Origin", "*");
      }
      return new Response(routed.body, {
        status: routed.status,
        statusText: routed.statusText,
        headers,
      });
    }

    // 2. 否则作为静态资源（Vite 构建产物）返回，支持 SPA fallback
    return env.ASSETS.fetch(req);
  },
};
