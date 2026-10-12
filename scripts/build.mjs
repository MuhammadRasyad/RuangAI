import { build } from "esbuild";

await build({
  entryPoints: ["src/ui.tsx"],
  bundle: true,
  format: "iife",
  target: "es2020",
  jsxFactory: "h",
  jsxFragment: "Fragment",
  outfile: "public/ui.js",
});
console.log("RuangAI siap: public/ui.js diperbarui");
await build({
  entryPoints: ["src/markdown.js"],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: "public/markdown.js",
  minify: true,
});
console.log("Renderer Markdown siap: public/markdown.js diperbarui");
