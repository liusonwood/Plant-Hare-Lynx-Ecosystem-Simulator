import { routeAgentRequest } from "agents";
import type { Env } from "./env.d";

// 导出 Durable Object 类（Wrangler 需要在入口能找到）
export { EcoChatAgent } from "./EcoChatAgent";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // 1. 先尝试路由到 Agent（WebSocket / RPC）
    const routed = await routeAgentRequest(req, env);
    if (routed) return routed;

    // 2. 否则作为静态资源（Vite 构建产物）返回，支持 SPA fallback
    return env.ASSETS.fetch(req);
  },
};
