// Explicit deployment maintenance: remove only the inspected, inactive legacy plugins.
import fs from "node:fs/promises";
const env = Object.fromEntries(
  (await fs.readFile(new URL("../../.env", import.meta.url), "utf8"))
    .split(/\r?\n/)
    .filter((l) => l.startsWith("WORDPRESS_"))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i),
        l
          .slice(i + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2"),
      ];
    }),
);
const origin = "https://sonclass.com";
if (env.WORDPRESS_SITE_URL !== origin)
  throw new Error("Unexpected deployment origin");
const cookies = new Map();
export async function request(path, options = {}) {
  const r = await fetch(origin + path, {
    signal: AbortSignal.timeout(60000),
    ...options,
    headers: {
      ...options.headers,
      Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
    },
  });
  for (const raw of r.headers.getSetCookie()) {
    const pair = raw.split(";")[0],
      i = pair.indexOf("=");
    cookies.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return r;
}
async function boot() {
  const r = await request("/");
  const text = await r.text();
  return JSON.parse(text.match(/window\.SONCLASS=(.+?);<\/script>/s)[1]);
}
let state = await boot();
let response = await request("/wp-json/sonclass/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-WP-Nonce": state.nonce },
  body: JSON.stringify({
    email: env.WORDPRESS_USERNAME,
    password: env.WORDPRESS_PASSWORD,
  }),
});
if (!response.ok) throw new Error("WordPress login failed");
state = await boot();
if (state.user?.role !== "ADMIN")
  throw new Error("Administrator access required");
export const headers = { "X-WP-Nonce": state.nonce };
