import assert from "node:assert/strict";
const origin = "http://127.0.0.1:9403";
export class Client {
  cookies = new Map();
  boot = null;
  async request(url, options = {}) {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(60000),
      ...options,
      headers: {
        ...options.headers,
        Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
      },
    });
    console.log(options.method || "GET", new URL(url).pathname, res.status);
    for (const raw of res.headers.getSetCookie()) {
      const pair = raw.split(";")[0],
        i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    return res;
  }
  async load() {
    const r = await this.request(origin);
    const html = await r.text();
    this.boot = JSON.parse(html.match(/window\.SONCLASS=(.+?);<\/script>/s)[1]);
  }
  async api(path, body, status = 200, method) {
    const r = await this.request(this.boot.api + path, {
      method: method || (body ? "POST" : "GET"),
      headers: {
        "X-WP-Nonce": this.boot.nonce,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json();
    assert.equal(r.status, status, `${path}: ${JSON.stringify(data)}`);
    return data;
  }
}
