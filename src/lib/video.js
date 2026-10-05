export function videoSource(value) {
  const source = String(value || '').trim();
  if (!source) return null;
  if (/^\/api\/files\/[a-z0-9._-]+\.(mp4|webm)$/i.test(source)) return { type: 'file', url: source };
  try {
    const url = new URL(source);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host === 'youtu.be' || host === 'www.youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com')) {
      const id = host.endsWith('youtu.be') ? url.pathname.split('/')[1] : url.searchParams.get('v') || (/^\/(?:embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[1]);
      if (/^[a-zA-Z0-9_-]{11}$/.test(id || '')) return { type: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}` };
      return null;
    }
    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).findLast(part => /^\d+$/.test(part));
      if (id) return { type: 'embed', url: `https://player.vimeo.com/video/${id}` };
      return null;
    }
    if (/\.(mp4|webm)$/i.test(url.pathname)) return { type: 'file', url: url.href };
  } catch {}
  return null;
}

export const validVideoUrl = value => !String(value || '').trim() || Boolean(videoSource(value));
