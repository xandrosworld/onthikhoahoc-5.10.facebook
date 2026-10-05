'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';

export default function PdfViewer({ url }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className="btn" onClick={() => setOpen(!open)} aria-expanded={open}><Icon name={open ? 'up' : 'eye'} size={16} />{open ? 'Ẩn bản xem trước' : 'Xem trực tiếp tài liệu'}</button>
      {open && <iframe className="pdf-viewer mt-4" src={url} title="Xem trước tài liệu PDF" />}
    </div>
  );
}
