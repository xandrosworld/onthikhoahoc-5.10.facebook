'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Icon from './Icon';

/* ---------- Toast ---------- */
const ToastCtx = createContext({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon name={t.type === 'error' ? 'alert' : t.type === 'info' ? 'info' : 'check'} size={18} />
            <span>{t.message}</span>
            <button aria-label="Đóng thông báo" onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Hiển thị toast một lần khi mount (dùng sau server action thành công). */
export function ToastOnMount({ message, type = 'success' }) {
  const { push } = useToast();
  useEffect(() => { if (message) push(message, type); }, [message, type, push]);
  return null;
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, icon = 'alert', tone = '', children, footer, wide = false, labelledBy = 'modal-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('[data-autofocus]')?.focus(), 30);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        <div className="modal-head">
          {!wide && <span className={`modal-icon ${tone}`}><Icon name={icon} size={20} /></span>}
          <h3 id={labelledBy}>{title}</h3>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>
  );
}

/* ---------- Form helpers ---------- */
export function SubmitButton({ children, className = 'btn btn-primary', pendingText = 'Đang xử lý…', disabled = false, ...rest }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending} {...rest}>
      {pending ? (<><span className="spinner" style={{ borderTopColor: 'currentColor', borderColor: 'rgba(128,128,128,.35)', borderTopWidth: 2 }} />{pendingText}</>) : children}
    </button>
  );
}

/** Nút có hộp thoại xác nhận trước khi gọi server action (xoá, v.v.) */
export function ConfirmButton({ action, fields = {}, title = 'Xác nhận', message, confirmText = 'Xác nhận', danger = true, className = 'btn btn-sm btn-danger-outline', icon, children, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-label={ariaLabel}>{icon && <Icon name={icon} size={16} />}{children}</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        tone={danger ? 'danger' : ''}
        icon={danger ? 'trash' : 'alert'}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Hủy</button>
            <form action={action} ref={formRef} onSubmit={() => setTimeout(() => setOpen(false), 0)}>
              {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <SubmitButton className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} data-autofocus>{confirmText}</SubmitButton>
            </form>
          </>
        }
      >
        {message}
      </Modal>
    </>
  );
}

/** Nút gọi server action đơn giản (không xác nhận) */
export function ActionButton({ action, fields = {}, className = 'btn btn-sm', children, pendingText }) {
  return (
    <form action={action} style={{ display: 'inline' }}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <SubmitButton className={className} pendingText={pendingText || '…'}>{children}</SubmitButton>
    </form>
  );
}

export function PasswordInput({ id, name, label, error, autoComplete, required = true, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden="true">*</span>}</label>
      <div className="input-wrap">
        <input id={id} name={name} type={show ? 'text' : 'password'} className="input" autoComplete={autoComplete} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} onChange={onChange} placeholder={placeholder} />
        <button type="button" className="toggle" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={show}>
          <Icon name={show ? 'eyeoff' : 'eye'} size={18} />
        </button>
      </div>
      {error && <div className="field-error" id={`${id}-err`} role="alert">{error}</div>}
    </div>
  );
}

export function Field({ id, label, error, hint, required, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden="true">*</span>}</label>
      {children}
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error" id={`${id}-err`} role="alert">{error}</div>}
    </div>
  );
}

export function Switch({ name, defaultChecked, label, onChange, checked }) {
  return (
    <label className="switch">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} checked={checked} onChange={onChange} />
      <span className="track" />
      <span>{label}</span>
    </label>
  );
}

/** Mở/đóng sidebar trên mobile */
export function SidebarToggle() {
  return (
    <button type="button" className="btn btn-icon btn-ghost" aria-label="Mở menu" onClick={() => document.querySelector('.sidebar')?.classList.toggle('open')}>
      <Icon name="menu" />
    </button>
  );
}
