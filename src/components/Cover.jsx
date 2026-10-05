import Image from 'next/image';
import { VISUALS } from '@/lib/visuals';

/** Giữ bảng màu cho các biểu mẫu quản trị hiện có. */
const THEMES = {
  indigo: ['#1a256f', '#3b4fd8', '#8fa0ff'],
  navy: ['#0f2a4a', '#1f5a99', '#7fb4ea'],
  teal: ['#0b4a4a', '#16807f', '#7fd6cf'],
  amber: ['#5a3a05', '#b67403', '#f6c85f'],
  plum: ['#3b1a55', '#7a3fa8', '#cfa4ee'],
  slate: ['#1f2535', '#4a5468', '#a8b2c7'],
};
const SYMBOLS = ['∫', '∑', 'π', '√x', 'lim', 'f′(x)', 'Δ', '∞', 'sin x', 'log', 'x²', 'eˣ'];

function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function CoverArt({ theme = 'indigo', seed = '', label = '' }) {
  const [c1, c2, c3] = THEMES[theme] || THEMES.indigo;
  const h = hash(seed + theme);
  const items = Array.from({ length: 6 }, (_, i) => ({
    s: SYMBOLS[(h + i * 5) % SYMBOLS.length],
    x: 30 + ((h >> (i + 1)) % 5) * 70 + i * 12,
    y: 40 + ((i * 53 + (h % 40)) % 150),
    z: 22 + ((h >> i) % 5) * 8,
    o: 0.18 + ((i * 7) % 4) * 0.08,
  }));
  return (
    <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label || 'Ảnh bìa'}>
      <rect width="400" height="225" fill={c1} />
      <g stroke={c3} strokeOpacity=".14" strokeWidth="1">
        {Array.from({ length: 10 }, (_, i) => <line key={'v' + i} x1={i * 44} y1="0" x2={i * 44} y2="225" />)}
        {Array.from({ length: 6 }, (_, i) => <line key={'h' + i} x1="0" y1={i * 44} x2="400" y2={i * 44} />)}
      </g>
      <path d={`M0 ${150 + (h % 30)} C 90 ${70 + (h % 50)}, 190 ${210 - (h % 40)}, 400 ${90 + (h % 50)}`} stroke={c3} strokeWidth="2.5" fill="none" strokeOpacity=".7" />
      <circle cx={300 - (h % 60)} cy="70" r="46" fill={c2} fillOpacity=".55" />
      {items.map((it, i) => (
        <text key={i} x={it.x} y={it.y} fontSize={it.z} fill="#fff" fillOpacity={it.o} fontFamily="'Times New Roman', serif" fontStyle="italic">{it.s}</text>
      ))}
    </svg>
  );
}

export default function Cover({ url, theme, seed, label, className = '' }) {
  const source = url || VISUALS.library;
  return (
    <div className={`cover ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {source.startsWith('/images/') ? (
        <Image src={source} alt={label || ''} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 650px" />
      ) : <img src={source} alt={label || ''} loading="lazy" />}
    </div>
  );
}

export const THEME_KEYS = Object.keys(THEMES);
