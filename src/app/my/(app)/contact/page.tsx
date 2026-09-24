import { MessageCircle, MessageSquare, Phone } from 'lucide-react';
import { BUSINESS, smsHref, telHref, waHref } from '@/lib/config';
import s from '../../my.module.css';

export default function MyContact() {
  return (
    <div className={s.section} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="kicker">Your car owner</div>
        <h2 style={{ margin: '4px 0 0' }}>{BUSINESS.ownerName}</h2>
        <div style={{ fontSize: 18 }}>{BUSINESS.ownerPhone}</div>
      </div>
      <div className={s.contactButtons}>
        <a className="btn btn-primary" href={telHref}>
          <Phone size={20} aria-hidden /> Call
        </a>
        <a className="btn btn-secondary" href={smsHref}>
          <MessageSquare size={20} aria-hidden /> Send SMS
        </a>
        <a className="btn btn-secondary" href={waHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={20} aria-hidden /> WhatsApp
        </a>
      </div>
      <div style={{ borderTop: '2px solid var(--color-divider)', paddingTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Accident or breakdown</div>
        <div style={{ fontSize: 14, color: 'var(--color-neutral-800)' }}>
          Make sure everyone is safe, call {BUSINESS.ownerName} first, then send photos of the car and the other vehicle’s details on
          WhatsApp.
        </div>
      </div>
    </div>
  );
}
