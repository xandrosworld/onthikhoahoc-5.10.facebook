'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Icon from './Icon';
import { initials } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/khoa-hoc', label: 'Khóa học' },
  { href: '/de-thi', label: 'Luyện thi' },
  { href: '/bai-viet', label: 'Tài liệu & Bài viết' },
  { href: '/dang-ky-khoa-hoc', label: 'Đăng ký học' },
];

export default function SiteHeader({ user, siteName, tagline, logoutAction }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (h) => (h === '/' ? path === '/' : path.startsWith(h));
  const dash = user?.role === 'ADMIN' ? '/admin' : '/hoc-sinh';
  return (
    <header className="site-header">
      <div className="container inner">
        <Link href="/" className="brand" aria-label={`${siteName} ${tagline} - Trang chủ`}>
          <span className="brand-mark" aria-hidden="true">π</span>
          <span>{siteName}<small>{tagline}</small></span>
        </Link>
        <nav className="nav" aria-label="Điều hướng chính">
          {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}>{n.label}</Link>)}
        </nav>
        <div className="header-actions">
          {user ? (
            <Link href={dash} className="user-chip hide-m"><span className="avatar">{initials(user.fullName)}</span>{user.fullName.split(' ').slice(-2).join(' ')}</Link>
          ) : (
            <>
              <Link href="/dang-nhap" className="btn btn-ghost hide-m">Đăng nhập</Link>
              <Link href="/dang-ky" className="btn btn-primary hide-m">Tạo tài khoản</Link>
            </>
          )}
          <button className="btn btn-icon btn-ghost menu-btn" aria-label="Mở menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'x' : 'menu'} /></button>
        </div>
      </div>
      <div className={`mobile-nav ${open ? 'open' : ''}`}>
        {NAV.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>)}
        {user ? (
          <>
            <Link href={dash} className="btn btn-primary btn-block" onClick={() => setOpen(false)}>Vào trang {user.role === 'ADMIN' ? 'quản trị' : 'học sinh'}</Link>
            <form action={logoutAction}><button className="btn btn-block" style={{ marginTop: 10 }}>Đăng xuất</button></form>
          </>
        ) : (
          <>
            <Link href="/dang-nhap" className="btn btn-block" onClick={() => setOpen(false)}>Đăng nhập</Link>
            <Link href="/dang-ky" className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={() => setOpen(false)}>Tạo tài khoản</Link>
          </>
        )}
      </div>
    </header>
  );
}
