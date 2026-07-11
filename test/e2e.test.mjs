// 도서 패키지 e2e — 실제 bin을 서브프로세스로 띄우고 stdio MCP로 대화 (실사용 시뮬레이션)
// 『공산주의자 선언』(카를 마르크스) 전용. 자기 레포의 bin만 참조한다(크로스 참조 없음).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const PACK_DIR = process.env.WHOISYOURAI_TEST_PACKS; // 빌드된 팩 위치를 env로 지정 (예: project02 dist/book-packs)
if (!PACK_DIR) { console.log("SKIP: WHOISYOURAI_TEST_PACKS 미지정 (빌드된 팩 경로 필요)"); process.exit(0); }
const status = JSON.parse(readFileSync(`${PACK_DIR}/status.json`, "utf8"));
// 자기 도서 bin (../bin/whoisyourai.mjs) — 레포 분리로 크로스 참조 제거
const BOOK_BIN = new URL("../bin/whoisyourai.mjs", import.meta.url).pathname;

let pass = 0, fail = 0;
const check = (n, c) => { if (c) { console.log(`  ✓ ${n}`); pass++; } else { console.log(`  ✗ ${n}`); fail++; } };

// 로컬 status 서버 (실 GitHub raw 대체)
const http = createServer((req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(status)); });
await new Promise((r) => http.listen(0, r));
const statusUrl = `http://127.0.0.1:${http.address().port}/status.json`;

console.log("== 도서 패키지 서브프로세스 MCP e2e (마르크스) ==");
const transport = new StdioClientTransport({
  command: "node",
  args: [BOOK_BIN],
  env: { ...process.env, WHOISYOURAI_STATUS_URL: statusUrl },
});
const client = new Client({ name: "e2e", version: "0" });
await client.connect(transport);

const info = client.getServerVersion();
check(`서버 기동 (${info?.name})`, info?.name === "marx-manifesto-1848");

const tools = (await client.listTools()).tools.map((t) => t.name);
check(`6개 도구 (${tools.length})`, tools.length === 6);

const r = await client.callTool({ name: "search_book", arguments: { query: "역사는 계급 투쟁", top_k: 2 } });
const txt = r.content[0].text;
check("검색 결과 반환 + chunk_id", /chunk_id/.test(txt));
check("페르소나 리마인더 hook 부착", /마르크스의 목소리 유지/.test(txt));

const prompts = (await client.listPrompts()).prompts.map((p) => p.name);
check(`페르소나 prompt: ${prompts.join(",")}`, prompts.includes("marx-manifesto"));
const gp = await client.getPrompt({ name: "marx-manifesto", arguments: {} });
check("prompt 발동 시 저자 시스템 프롬프트 반환", /마르크스|계급|프롤레타리아/.test(gp.messages[0].content.text));

await client.close();
http.close();
console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
