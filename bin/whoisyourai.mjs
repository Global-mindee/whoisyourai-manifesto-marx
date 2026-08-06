#!/usr/bin/env node
// 『공산주의자 선언』 MCP — 동봉된 암호화 팩으로 core 엔진을 띄운다.
// 명령: (없음)|serve → MCP stdio 서버 / init → 클라이언트 등록

import { serve } from "whoisyourai-core";
import { runInstall } from "whoisyourai-core/install";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// MCP 등록에 기록될 설치 소스. npm 미배포 상태이므로 GitHub 스펙을 쓴다.
// npm 공개 배포로 전환하면 "whoisyourai-manifesto-marx" 로 되돌린다.
const PKG = process.env.WHOISYOURAI_PKG_SPEC || "github:Global-mindee/whoisyourai-manifesto-marx";
const SERVER_NAME = "marx-manifesto";
const AUTHOR = "카를 마르크스";
const TITLE = "공산주의자 선언";
const packPath = join(dirname(fileURLToPath(import.meta.url)), "..", "pack", "marx-manifesto-1848.bookpack.json");

const cmd = process.argv[2];
if (cmd === "init") {
  await runInstall(SERVER_NAME, PKG, AUTHOR, TITLE);
} else {
  await serve({ packPath, personaPromptName: SERVER_NAME });
}
