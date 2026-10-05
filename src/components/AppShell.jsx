'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Icon from './Icon';
import { initials } from '@/lib/utils';

export default function AppShell({ variant, links, user, siteName, logoutAction, children }) {
  const path = usePathname();
  useEffect(() => { document.querySelector('.sidebar')?.classList.remove('open'); }, [path]);
  const isActive = (l) => (l.exact ? path === l.href : path === l.href || path.startsWith(l.href + '/'));
  return (
    <div className="app">
      <aside className={`sidebar ${variant === 'admin' ? 'admin' : ''}`} aria-label="Menu chính">
        <Link href="/" className="brand"><span className="brand-mark">π</span><span>{siteName}<small>{variant === 'admin' ? 'Quản trị' : 'Học sinh'}</small></span></Link>
        <nav className="side-nav">
          {links.map((l, i) => l.label && !l.href ? (
            <div key={i} className="side-label">{l.label}</div>
          ) : (
            <Link key={l.href} href={l.href} className="side-link" aria-current={!l.external && isActive(l) ? 'page' : undefined}>
              <Icon name={l.icon} size={19} />{l.label}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-user">
            <span className="avatar">{initials(user.fullName)}</span>
            <div><b>{user.fullName}</b><span>{user.email}</span></div>
          </div>
          <form action={logoutAction}><button className={`btn btn-sm btn-block ${variant === 'admin' ? 'btn-ghost' : ''}`} style={variant === 'admin' ? { color: '#b6bdcc', border: '1px solid #2b3246' } : {}}><Icon name="logout" size={16} />Đăng xuất</button></form>
        </div>
      </aside>
      <div className="app-main">
        <div className="app-topbar">
          <button type="button" className="btn btn-icon btn-ghost" aria-label="Mở menu" onClick={() => document.querySelector('.sidebar')?.classList.toggle('open')}><Icon name="menu" /></button>
          <Link href="/" className="brand"><span className="brand-mark" style={{ width: 30, height: 30, fontSize: '1.1rem' }}>π</span>{siteName}</Link>
        </div>
        <main id="main" className="app-content">{children}</main>
      </div>
    </div>
  );
}
