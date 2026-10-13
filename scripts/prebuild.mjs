// Menjalankan stop-server.ps1 sebelum `next build` (hanya Windows),
// supaya build tidak gagal EBUSY karena server masih memegang .next/standalone.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

if (process.platform === "win32") {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "stop-server.ps1");
  try {
    execFileSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script],
      { stdio: "inherit" }
    );
  } catch (error) {
    console.warn("[prebuild] Gagal menjalankan stop-server.ps1:", error.message);
  }
}
