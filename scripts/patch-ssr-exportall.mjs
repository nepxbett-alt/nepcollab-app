import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = ".vercel/output/functions/__server.func/_ssr";
if (!existsSync(dir)) process.exit(0);

const helper = `var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
`;

for (const file of readdirSync(dir)) {
  if (!file.startsWith("server-") || !file.endsWith(".mjs")) continue;
  const path = join(dir, file);
  let text = readFileSync(path, "utf8");
  const re = /import \{ n as __exportAll \} from "\.\/server-[^"]+\.mjs";/;
  if (!re.test(text)) continue;
  text = text.replace(re, helper);
  writeFileSync(path, text);
  console.log("[patch-ssr-exportall] fixed", file);
}

const cfg = ".vercel/output/functions/__server.func/.vc-config.json";
if (existsSync(cfg)) {
  const j = JSON.parse(readFileSync(cfg, "utf8"));
  j.runtime = "nodejs22.x";
  writeFileSync(cfg, JSON.stringify(j) + "\n");
}
