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

let fixed = 0;
for (const file of readdirSync(dir)) {
  if (!file.endsWith(".mjs")) continue;
  const path = join(dir, file);
  let text = readFileSync(path, "utf8");
  // Circular: router (and others) import __exportAll from server-*.mjs
  const reImport = /import \{\s*\w+\s+as\s+__exportAll\s*\}\s+from\s+"\.\/server-[^"]+\.mjs";\s*/;
  if (reImport.test(text)) {
    text = text.replace(reImport, helper);
    writeFileSync(path, text);
    console.log("[patch-ssr-exportall] inlined import in", file);
    fixed++;
    continue;
  }
  // Older pattern
  const reOld = /import \{ n as __exportAll \} from "\.\/server-[^"]+\.mjs";/;
  if (reOld.test(text)) {
    text = text.replace(reOld, helper);
    writeFileSync(path, text);
    console.log("[patch-ssr-exportall] fixed", file);
    fixed++;
  }
}

const cfg = ".vercel/output/functions/__server.func/.vc-config.json";
if (existsSync(cfg)) {
  const j = JSON.parse(readFileSync(cfg, "utf8"));
  j.runtime = "nodejs22.x";
  writeFileSync(cfg, JSON.stringify(j) + "\n");
}

console.log("[patch-ssr-exportall] done, fixed=", fixed);
