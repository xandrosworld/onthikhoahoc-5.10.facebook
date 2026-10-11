import React from "react";
export const boot = window.SONCLASS;
export function pathNow() {
  return boot.preview
    ? new URLSearchParams(location.search).get("sc_path") || "/"
    : location.pathname.replace(/\/$/, "") || "/";
}
export function href(path) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return boot.preview
    ? "/?sonclass_preview=1&sc_path=" + encodeURIComponent(path)
    : path;
}
export function go(path, replace = false) {
  const url = href(path);
  history[replace ? "replaceState" : "pushState"]({}, "", url);
  window.dispatchEvent(new Event("sc:navigate"));
  window.scrollTo(0, 0);
}
const router = {
  push: go,
  replace: (p) => go(p, true),
  refresh: () => window.dispatchEvent(new Event("sc:navigate")),
};
export const useRouter = () => router;
export const usePathname = () => pathNow().split("?")[0];
export const useSearchParams = () =>
  new URLSearchParams(pathNow().split("?")[1] || location.search);
export function Link({
  href: to,
  children,
  prefetch,
  replace,
  onClick,
  ...props
}) {
  return (
    <a
      {...props}
      href={href(to)}
      onClick={(e) => {
        onClick?.(e);
        if (
          !e.defaultPrevented &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          e.button === 0 &&
          to.startsWith("/") &&
          !to.startsWith("//") &&
          !props.target
        ) {
          e.preventDefault();
          go(to, replace);
        }
      }}
    >
      {children}
    </a>
  );
}
export default Link;
export function asset(src) {
  return typeof src === "string" && src.startsWith("/images/")
    ? boot.assets + src.slice(1)
    : src;
}
export function Image({
  src,
  fill,
  priority,
  fetchPriority,
  sizes,
  style,
  ...props
}) {
  return (
    <img
      {...props}
      src={asset(src)}
      sizes={sizes}
      style={{
        ...(fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }
          : {}),
        ...style,
      }}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
const nativeFetch = window.fetch.bind(window);
window.fetch = (url, opts = {}) => {
  if (typeof url === "string" && url.startsWith("/api/")) {
    const endpoint = url === "/api/upload" ? "admin/upload" : url.slice(5);
    return nativeFetch(boot.api + endpoint, {
      ...opts,
      headers: { ...opts.headers, "X-WP-Nonce": boot.nonce },
      credentials: "same-origin",
    });
  }
  return nativeFetch(url, opts);
};
export async function api(path, body, method) {
  const res = await nativeFetch(boot.api + path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: {
      "X-WP-Nonce": boot.nonce,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "same-origin",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || data.error || "Không thể xử lý yêu cầu.");
  return data;
}
export async function saveExamAction(data) {
  try {
    return await api("admin/exams", data);
  } catch (e) {
    return { error: e.message };
  }
}
export let catalog = {
  courses: [],
  posts: [],
  exams: [],
  settings: boot.settings,
};
export function setCatalog(data) {
  catalog = data;
}
export const db = {
  course: { findMany: async () => catalog.courses.slice(0, 4) },
  exam: { findMany: async () => catalog.exams.slice(0, 3) },
  post: { findMany: async () => catalog.posts.slice(0, 3) },
};
export const getSettings = async () => catalog.settings;
