import { videoSource } from '@/lib/video';

export default function VideoPlayer({ url, title = 'Video giới thiệu' }) {
  const source = videoSource(url);
  if (!source) return null;
  return (
    <div className="video-frame">
      {source.type === 'embed' ? <iframe src={source.url} title={title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : <video src={source.url} controls playsInline preload="metadata" aria-label={title} />}
    </div>
  );
}
