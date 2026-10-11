import { request, headers } from "./production-client.mjs";
let response;
response = await request("/wp-json/wp/v2/plugins", { headers });
if (!response.ok)
  throw new Error("Plugin inventory unavailable: " + response.status);
const plugins = await response.json();
const allow = [
  "advanced-appointment-booking-scheduling/advanced-appointment-booking",
  "pojo-accessibility/pojo-accessibility",
  "course-flow/course-flow",
  "elementor/elementor",
  "forminator/forminator",
  "learnpress/learnpress",
  "manage/manage",
  "mathjax-latex/mathjax-latex",
  "quiz-master-next/mlw_quizmaster2",
  "simple-mathjax/simple-mathjax",
  "woocommerce-paypal-payments/woocommerce-paypal-payments",
  "woocommerce/woocommerce",
];
console.log(
  "Inventory:",
  plugins.map((p) => ({ plugin: p.plugin, status: p.status })),
);
if (!process.argv.includes("--apply")) process.exit(0);
// Remove the WooCommerce dependent first.
for (const slug of [...allow].sort((a, b) =>
  a.startsWith("woocommerce-paypal")
    ? -1
    : b.startsWith("woocommerce-paypal")
      ? 1
      : 0,
)) {
  const plugin = plugins.find((p) => p.plugin === slug);
  if (!plugin) continue;
  if (plugin.status !== "inactive")
    throw new Error("Refusing to remove active plugin: " + slug);
  const result = await request(
    "/wp-json/wp/v2/plugins/" +
      slug.split("/").map(encodeURIComponent).join("/"),
    { method: "DELETE", headers },
  );
  const raw = await result.text();
  if (!raw.trim().startsWith("{")) {
    console.log(
      "Unexpected response:",
      result.status,
      raw
        .replace(/<style[\s\S]*?<\/style>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(-1000),
    );
    continue;
  }
  const body = JSON.parse(raw);
  if (!result.ok) {
    console.log("Cannot remove " + slug + ": " + body.message);
    continue;
  }
  console.log("Removed:", slug);
}
const final = await request("/wp-json/wp/v2/plugins", { headers });
console.log(
  "Remaining:",
  (await final.json()).map((p) => ({ plugin: p.plugin, status: p.status })),
);
