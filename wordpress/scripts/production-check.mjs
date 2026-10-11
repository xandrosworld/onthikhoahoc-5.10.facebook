import assert from "node:assert/strict";
import { request, headers } from "./production-client.mjs";
async function api(path, body, method) {
  const r = await request("/wp-json/sonclass/v1/" + path, {
    headers: { ...headers, "Content-Type": "application/json" },
    method: method || (body ? "POST" : "GET"),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  assert.ok(r.ok, data.message);
  return data;
}
const exams = await api("admin/exams");
for (const e of exams.filter(
  (e) => e.title === "Kiểm thử triển khai — không công bố",
)) {
  const detail = await api("admin/exams/" + e.id);
  assert.equal(detail.attemptCount, 0);
  if (e.status !== "ARCHIVED")
    await api("admin/exams/" + e.id, undefined, "DELETE");
  await api("admin/exams/" + e.id + "/purge", undefined, "DELETE");
  console.log("Removed deployment-only draft.");
}
assert.equal(
  (await api("admin/exams")).filter(
    (e) => e.title === "Kiểm thử triển khai — không công bố",
  ).length,
  0,
);
for (const path of [
  "/",
  "/admin",
  "/dang-ky",
  "/dang-nhap",
  "/de-thi",
  "/khoa-hoc",
  "/bai-viet",
]) {
  const r = await request(path);
  assert.equal(r.status, 200);
  assert.ok((await r.text()).includes("window.SONCLASS="));
  console.log("OK route:", path);
}
const plugins = await request("/wp-json/wp/v2/plugins", { headers });
console.log(
  "Plugin state:",
  (await plugins.json()).map((p) => ({ plugin: p.plugin, status: p.status })),
);
for (const kind of ["posts", "pages", "media"]) {
  const r = await request("/wp-json/wp/v2/" + kind);
  assert.equal((await r.json()).length, 0);
  console.log("Empty legacy content:", kind);
}
