import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const root = path.resolve("..");
const out = path.resolve("sonclass/assets");
await fs.mkdir(out, { recursive: true });
await build({
  absWorkingDir: path.dirname(fileURLToPath(import.meta.url)),
  entryPoints: ["frontend/app.jsx"],
  bundle: true,
  outfile: path.join(out, "app.js"),
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    "@": path.join(root, "src"),
    "next/link": path.resolve("frontend/runtime.jsx"),
    "next/navigation": path.resolve("frontend/runtime.jsx"),
    "next/image": path.resolve("frontend/image.jsx"),
    "@/app/actions/admin": path.resolve("frontend/runtime.jsx"),
    "@/lib/db": path.resolve("frontend/runtime.jsx"),
    "@/lib/site": path.resolve("frontend/runtime.jsx"),
  },
  loader: { ".woff2": "file", ".woff": "file", ".ttf": "file" },
  plugins: [
    {
      name: "port-images",
      setup(b) {
        b.onLoad({ filter: /MathField\.jsx$/ }, async (args) => ({
          contents: (await fs.readFile(args.path, "utf8"))
            .replaceAll("4 * 1024 * 1024", "2 * 1024 * 1024")
            .replaceAll("4MB", "2MB"),
          loader: "jsx",
        }));
        b.onLoad({ filter: /visuals\.js$/ }, async (args) => ({
          contents: (await fs.readFile(args.path, "utf8")).replaceAll(
            "'/images/",
            "window.SONCLASS.assets + 'images/",
          ),
          loader: "js",
        }));
      },
    },
  ],
});
await fs.cp(path.join(root, "public/images"), path.join(out, "images"), {
  recursive: true,
});
await fs.copyFile(
  "node_modules/@fontsource/be-vietnam-pro/LICENSE",
  path.join(out, "Be-Vietnam-Pro-LICENSE.txt"),
);
console.log("Built WordPress assets");
