import { build } from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { minifyHTMLLiteralsPlugin } from "esbuild-plugin-minify-html-literals";
import * as fs from "fs/promises";
import { minify } from "html-minifier-terser";

// Очищаем директорию dist перед сборкой
await fs.rm("dist", { recursive: true, force: true });

// Собираем CSS отдельно
await build({
  entryPoints: ["public/index.css"],
  bundle: true,
  minify: true,
  target: "esnext",
  outfile: "dist/styles.css",
});

// Читаем собранный CSS
const cssContent = await fs.readFile("./dist/styles.css", "utf-8");

// Собираем JavaScript
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

// Читаем HTML и встраиваем CSS
const htmlContent = await fs.readFile("./public/index.html", "utf-8");
const htmlWithCss = htmlContent.replace(
  /<link[^>]*href="[^"]*index\.css"[^>]*>/,
  `<style>${cssContent}</style>`,
);

// Минифицируем HTML с встроенным CSS
const minifiedHtml = await minify(htmlWithCss, {
  removeComments: true,
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
});
await fs.writeFile("./dist/index.html", minifiedHtml);

// Удаляем отдельный CSS файл, так как он теперь встроен в HTML
await fs.unlink("./dist/styles.css");
