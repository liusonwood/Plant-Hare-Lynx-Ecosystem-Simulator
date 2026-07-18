import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  define: {
    // 暴露给前端的直连开关（仅本地测试用，生产走 Worker 代理）
    "import.meta.env.VITE_DIRECT_OPENAI": JSON.stringify(process.env.VITE_DIRECT_OPENAI ?? ""),
  },
});
