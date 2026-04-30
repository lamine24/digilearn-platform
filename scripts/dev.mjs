import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(command, ["exec", "tsx", "watch", "server/_core/index.ts"], {
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
