'use client';
import { useState } from 'react';
import UploadField from './UploadField';
import VideoPlayer from './VideoPlayer';

export default function CourseVideoField({ defaultValue = '', error, onBusyChange }) {
  const [url, setUrl] = useState(defaultValue || '');
  const [uploading, setUploading] = useState(false);
  const busyChanged = busy => { setUploading(busy); onBusyChange?.(busy); };
  return (
    <>
      <label className="label" htmlFor="videoUrl">Liên kết video giới thiệu</label>
      <input id="videoUrl" name="videoUrl" className="input" value={url} disabled={uploading} onChange={event => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=…" aria-invalid={!!error} aria-describedby="course-video-hint" />
      <p id="course-video-hint" className="field-hint">Hỗ trợ YouTube, Vimeo và liên kết MP4/WEBM. Để trống nếu chưa có video.</p>
      {error && <div className="field-error" role="alert">{error}</div>}
      <UploadField key={url.startsWith('/api/files/') ? url : 'video-upload'} kind="VIDEO" name="_videoFile" label="Hoặc chọn tệp video" defaultUrl={url.startsWith('/api/files/') ? url : ''} accept="video/mp4,video/webm" maxSize={4 * 1024 * 1024} onBusyChange={busyChanged} onUploaded={file => setUrl(file ? file.url : '')} hint="MP4/WEBM tối đa 4MB. Với video dài, hãy dùng liên kết YouTube hoặc Vimeo." />
      {url && <div className="course-video-preview"><VideoPlayer url={url} title="Xem trước video giới thiệu khóa học" /></div>}
      {url && <button type="button" className="btn btn-sm btn-ghost" disabled={uploading} onClick={() => setUrl('')}>Bỏ video giới thiệu</button>}
    </>
  );
}
