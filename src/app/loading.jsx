export default function Loading() {
  return (
    <div className="container" style={{ padding: '64px 24px' }} aria-busy="true" aria-live="polite">
      <div className="skeleton" style={{ height: 36, width: '40%', marginBottom: 24 }} />
      <div className="grid c3">
        {[0, 1, 2].map((i) => <div key={i} className="card card-pad"><div className="skeleton sk-block mb-4" /><div className="skeleton sk-line" style={{ width: '70%' }} /><div className="skeleton sk-line" /></div>)}
      </div>
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
