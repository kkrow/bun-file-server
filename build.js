import { build } from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { minifyHTMLLiteralsPlugin } from "esbuild-plugin-minify-html-literals";
import * as fs from "fs/promises";
import { minify } from "html-minifier-terser";

// Clear dist directory before build
await fs.rm("dist", { recursive: true, force: true });

// Build CSS separately
await build({
  entryPoints: ["public/index.css"],
  bundle: true,
  minify: true,
  target: "esnext",
  outfile: "dist/styles.css",
});

// Read built CSS
const cssContent = await fs.readFile("./dist/styles.css", "utf-8");

// Build JavaScript
await build({
  entryPoints: ["public/index.js"],
  bundle: true,
  minify: true,
  outdir: "dist",
  target: "esnext",
  plugins: [
    minifyHTMLLiteralsPlugin(),
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["./public/index.html"],
        to: ["./dist"],
      },
    }),
  ],
});

// Read HTML and embed CSS
const htmlContent = await fs.readFile("./public/index.html", "utf-8");
const htmlWithCss = htmlContent.replace(
  /<link[^>]*href="[^"]*index\.css"[^>]*>/,
  `<style>${cssContent}</style>`,
);

// Minify HTML with embedded CSS
const minifiedHtml = await minify(htmlWithCss, {
  removeComments: true,
  collapseWhitespace: true,
  minifyJS: true,
});
await fs.writeFile("./dist/index.html", minifiedHtml);

// Remove separate CSS file as it's now embedded in HTML
await fs.unlink("./dist/styles.css");
