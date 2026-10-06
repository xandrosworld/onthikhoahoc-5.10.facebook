'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { initials } from '@/lib/utils';

export default function AppShell({ variant, links, user, siteName, logoutAction, children }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuButton = useRef(null);
  const sidebar = useRef(null);
  useEffect(() => { if (sidebar.current) sidebar.current.inert = mobile && !open; }, [mobile, open]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)');
    const sync = () => setMobile(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector('a')?.focus();
    const close = () => { setOpen(false); menuButton.current?.focus(); };
    const keydown = e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const nodes = [...sidebar.current.querySelectorAll('a, button')];
        const first = nodes[0], last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const resize = () => { if (window.innerWidth > 900) close(); };
    window.addEventListener('keydown', keydown); window.addEventListener('resize', resize);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', keydown); window.removeEventListener('resize', resize); };
  }, [open]);
  const isActive = (l) => (l.exact ? path === l.href : path === l.href || path.startsWith(l.href + '/'));
  const current = links.find(l => l.href && !l.external && isActive(l));
  return (
    <div className={`app app-${variant}`}>
      {open && <button className="app-menu-backdrop" aria-label="Đóng menu" onClick={() => { setOpen(false); menuButton.current?.focus(); }} />}
      <aside ref={sidebar} id="app-navigation" className={`sidebar ${variant === 'admin' ? 'admin' : ''} ${open ? 'open' : ''}`} aria-label="Menu chính">
        <Link href="/" className="brand"><span className="brand-mark">π</span><span>{siteName}<small>{variant === 'admin' ? 'Quản trị' : 'Học sinh'}</small></span></Link>
        <nav className="side-nav">
          {links.map((l, i) => l.label && !l.href ? (
            <div key={i} className="side-label">{l.label}</div>
          ) : (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="side-link" aria-current={!l.external && isActive(l) ? 'page' : undefined}>
              <Icon name={l.icon} size={19} />{l.label}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-user">
            <span className="avatar">{initials(user.fullName)}</span>
            <div><b>{user.fullName}</b><span>{user.email}</span></div>
          </div>
          <form action={logoutAction}><button className="btn btn-sm btn-block btn-ghost"><Icon name="logout" size={16} />Đăng xuất</button></form>
        </div>
      </aside>
      <div className="app-main">
        <div className="app-topbar">
          <button ref={menuButton} type="button" className="btn btn-icon btn-ghost app-menu-toggle" aria-label="Mở menu" aria-expanded={open} aria-controls="app-navigation" onClick={() => setOpen(!open)}><Icon name="menu" /></button>
          <div className="workspace-path"><span>{variant === 'admin' ? 'Không gian quản trị' : 'Không gian học tập'}</span><Icon name="right" size={14} /><b>{current?.label || siteName}</b></div>
          <Link href="/" className="workspace-home"><Icon name="external" size={16} /><span>Xem website</span></Link>
          <span className="avatar workspace-avatar" title={user.fullName}>{initials(user.fullName)}</span>
        </div>
        <main id="main" className="app-content">{children}</main>
      </div>
    </div>
  );
}
