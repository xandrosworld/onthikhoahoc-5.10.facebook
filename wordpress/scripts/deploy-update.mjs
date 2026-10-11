import fs from "node:fs/promises";
import { request } from "./production-client.mjs";
const file = new URL("../dist/sonclass-1.1.2.zip", import.meta.url);
const page = await request("/wp-admin/plugin-install.php?tab=upload");
const html = await page.text();
const nonce = html.match(/name="_wpnonce"[^>]*value="([^"]+)"/)?.[1];
if (!nonce) throw new Error("Upload form unavailable");
const data = new FormData();
data.set("_wpnonce", nonce);
data.set(
  "pluginzip",
  new Blob([await fs.readFile(file)], { type: "application/zip" }),
  "sonclass-1.1.2.zip",
);
data.set("install-plugin-submit", "Install Now");
const upload = await request("/wp-admin/update.php?action=upload-plugin", {
  method: "POST",
  headers: {
    Referer: "https://sonclass.com/wp-admin/plugin-install.php?tab=upload",
    Origin: "https://sonclass.com",
  },
  body: data,
});
const result = await upload.text();
const overwrite = result
  .match(
    /href=["']([^"']*action=upload-plugin[^"']*overwrite=update-plugin[^"']*)["']/,
  )?.[1]
  ?.replaceAll("&amp;", "&");
if (!overwrite) {
  console.log(
    upload.status,
    result
      .replace(/<style[\s\S]*?<\/style>/g, "")
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(-2200),
  );
  throw new Error("Expected replacement confirmation was not returned");
}
const url = new URL(overwrite, "https://sonclass.com/wp-admin/");
if (url.origin !== "https://sonclass.com")
  throw new Error("Unexpected update destination");
const done = await request(url.pathname + url.search);
const doneText = await done.text();
if (!doneText.includes("Plugin đã được cập nhật thành công."))
  throw new Error("Update did not confirm success");
console.log("SonClass 1.1.2 updated successfully.");
