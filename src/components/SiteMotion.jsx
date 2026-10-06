'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Progressive enhancement: content remains visible without JS or with reduced motion. */
export default function SiteMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};
    const setup = () => {
      dispose();
      if (preference.matches || !('IntersectionObserver' in window)) return;
      const groups = new Set();
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          entry.target.classList.add('is-shown'); observer.unobserve(entry.target);
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
      const showFocused = event => event.target.closest('.t-stagger')?.classList.add('is-shown');
      const register = () => {
      for (const group of document.querySelectorAll('.public-site .section-head, .intro-copy, .learning-facts, .home-courses, .home-posts, .benefit-grid, .journey-steps, .home-cta-panel, .public-site .section .grid:not(.home-courses)')) {
        if (groups.has(group)) continue;
        groups.add(group);
        group.classList.add('t-stagger');
        [...group.children].forEach((child, index) => {
          child.classList.add('t-stagger-line');
          child.style.setProperty('--reveal-index', Math.min(index, 5));
        });
        // Above-the-fold content never disappears while hydration finishes.
        if (group.getBoundingClientRect().top < innerHeight) group.classList.add('is-shown');
        else observer.observe(group);
      }
      };
      register();
      const contentObserver = new MutationObserver(register);
      const main = document.querySelector('.public-site main');
      if (main) contentObserver.observe(main, { childList: true, subtree: true });
      document.addEventListener('focusin', showFocused);
      dispose = () => {
        observer.disconnect(); contentObserver.disconnect(); document.removeEventListener('focusin', showFocused);
        for (const group of groups) {
          group.classList.remove('t-stagger', 'is-shown');
          [...group.children].forEach(child => { child.classList.remove('t-stagger-line'); child.style.removeProperty('--reveal-index'); });
        }
      };
    };
    setup(); preference.addEventListener('change', setup);
    return () => { dispose(); preference.removeEventListener('change', setup); };
  }, [pathname]);
  return <div className="reading-progress" aria-hidden="true" />;
}
