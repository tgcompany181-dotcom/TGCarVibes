'use client';

import { Car as CarIcon } from 'lucide-react';
import Image from 'next/image';
import { useId, useMemo, useState } from 'react';
import s from '@/app/site.module.css';
import { Dialog } from '@/components/ui/Dialog';
import { BUSINESS, CATEGORIES, telHref, waHref } from '@/lib/config';
import { addDays, daysBetween, fmtLong, fmtShort, isISODate } from '@/lib/dates';
import type { FleetGroup } from '@/lib/derive';
import { money, plural } from '@/lib/format';

const MIN_DAYS = BUSINESS.minWeeks * 7;

export function FleetBooking({ groups, defaultPick }: { groups: FleetGroup[]; defaultPick: string }) {
  const [pick, setPick] = useState(defaultPick);
  const [ret, setRet] = useState(addDays(defaultPick, MIN_DAYS));
  const [cat, setCat] = useState<string>('all');
  const [booking, setBooking] = useState<FleetGroup | null>(null);
  const titleId = useId();

  const valid = isISODate(pick) && isISODate(ret);
  const nDays = valid ? daysBetween(pick, ret) : 0;
  const tooShort = !valid || nDays < MIN_DAYS;
  const weeks = Math.max(BUSINESS.minWeeks, Math.ceil(nDays / 7));
  const periodText = tooShort ? 'Minimum hire is 8 weeks' : `${plural(weeks, 'week')} · ${nDays} days`;

  const onPick = (v: string) => {
    setPick(v);
    // keep the return date at least 8 weeks after pick-up
    if (isISODate(v) && (!isISODate(ret) || daysBetween(v, ret) < MIN_DAYS)) setRet(addDays(v, MIN_DAYS));
  };

  const shown = useMemo(() => groups.filter((g) => cat === 'all' || g.category === cat), [groups, cat]);

  const waText = (g: FleetGroup) =>
    g.available
      ? `Hi, I would like to book the ${g.title} from ${fmtLong(pick)} to ${fmtLong(ret)} (${plural(weeks, 'week')}, ${money(g.weeklyRate)}/week).`
      : `Hi, please add me to the waitlist for the ${g.title} (${money(g.weeklyRate)}/week), from around ${fmtLong(pick)}.`;

  return (
    <>
      <div className={s.bookingOuter}>
        <form className={s.booking} action="#cars" onSubmit={(e) => { e.preventDefault(); document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <div className={s.bookingHead}>
            <div className={s.bookingTitle}>Book a car</div>
            <a className="btn btn-ghost" href="/my">
              Manage my rental →
            </a>
          </div>
          <div className={s.bookingGrid}>
            <div className={s.cell}>
              <span className={s.cellLabel}>Pick-up location</span>
              <span className={s.cellValue}>{BUSINESS.location}</span>
            </div>
            <label className={s.cell}>
              <span className={s.cellLabel}>Pick-up date</span>
              <input type="date" className={s.cellValue} value={pick} min={defaultPick} onChange={(e) => onPick(e.target.value)} />
            </label>
            <label className={s.cell}>
              <span className={s.cellLabel}>Return date</span>
              <input type="date" className={s.cellValue} value={ret} min={isISODate(pick) ? addDays(pick, MIN_DAYS) : undefined} onChange={(e) => setRet(e.target.value)} />
            </label>
            <button type="submit" className={`btn btn-primary ${s.showCars}`}>
              Show cars <span aria-hidden>→</span>
            </button>
          </div>
          <div className={s.bookingNote}>
            <span className={tooShort ? s.bookingWarn : undefined}>{periodText}</span> · Long-term hire only, minimum 8 weeks · Bond: 2 weeks’ rent, refundable
          </div>
        </form>
      </div>

      <section id="cars" className={s.fleet}>
        <div className={s.sectionHead}>
          <div>
            <div className="kicker">The fleet</div>
            <h2 className={s.h2}>Choose your car</h2>
          </div>
          <div className="seg" role="group" aria-label="Filter by type">
            {[['all', 'All'], ...CATEGORIES.map((c) => [c, c])].map(([id, label]) => (
              <button key={id} type="button" className={cat === id ? 'on-dark' : undefined} aria-pressed={cat === id} onClick={() => setCat(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <div className={s.emptyFleet}>
            No {cat === 'all' ? '' : cat + ' '}cars listed right now. Call {BUSINESS.ownerName} on{' '}
            <a href={telHref}>{BUSINESS.ownerPhone}</a> to ask about the next one.
          </div>
        ) : (
          <div className={s.grid}>
            {shown.map((g) => (
              <article key={g.key} className={s.card}>
                <div className={s.cardPhoto}>
                  {g.photoUrl ? (
                    <Image src={g.photoUrl} alt={g.title} fill sizes="(max-width: 700px) 100vw, 400px" unoptimized={g.photoUrl.startsWith('data:')} />
                  ) : (
                    <CarIcon size={56} strokeWidth={1.5} aria-label="Photo coming soon" />
                  )}
                </div>
                <div className={s.cardBody}>
                  <div className={s.cardTop}>
                    <div className="kicker">{g.category}</div>
                    {g.available ? (
                      <span className={s.availBadge}>
                        <span className={s.availDot} aria-hidden />
                        {g.available} available now
                      </span>
                    ) : (
                      <span className={s.bookedOut}>Booked out</span>
                    )}
                  </div>
                  <h3 className={s.cardTitle}>{g.title}</h3>
                  <div className={s.specs}>
                    <div><b>{g.seats}</b>seats</div>
                    <div><b>{g.bags}</b>bags</div>
                    <div><b>Auto</b>gearbox</div>
                    <div><b>Petrol</b>fuel</div>
                  </div>
                  <div className={s.priceRow}>
                    <div>
                      <div className={s.price}>
                        {money(g.weeklyRate)}
                        <span> /week</span>
                      </div>
                      <div className={s.priceSub}>Min. 8 weeks</div>
                    </div>
                    <div className={s.bond}>
                      <div className={s.bondLabel}>Bond</div>
                      <div className={s.bondValue}>{money(g.weeklyRate * BUSINESS.bondWeeks)}</div>
                      <div className={s.bondSub}>refundable</div>
                    </div>
                  </div>
                  <button type="button" className={`btn btn-block ${s.cardCta} ${g.available ? 'btn-primary' : s.waitlistBtn}`} onClick={() => setBooking(g)}>
                    {g.available ? 'Book this car' : 'Join the waitlist'} <span aria-hidden>→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {booking && (
        <Dialog onClose={() => setBooking(null)} labelledBy={titleId}>
          <div className="kicker">{booking.category}</div>
          <div id={titleId} className={`dialog-title ${s.dialogTitle}`}>
            {booking.title}
          </div>
          <div className="rows">
            <div className="row"><span>Pick-up</span><span>{valid ? fmtShort(pick) : '—'} · {BUSINESS.location}</span></div>
            <div className="row"><span>Return</span><span>{valid ? fmtShort(ret) : '—'}</span></div>
            <div className="row"><span>Hire length</span><span className={tooShort ? s.bookingWarn : undefined}>{periodText}</span></div>
            <div className="row"><span>Weekly rate</span><span>{money(booking.weeklyRate)}</span></div>
            <div className="row"><span>Bond (2 weeks, refundable)</span><span>{money(booking.weeklyRate * BUSINESS.bondWeeks)}</span></div>
          </div>
          <div className={s.dialogNote}>
            {booking.available
              ? `Paid weekly by PayID. ${BUSINESS.ownerName} will confirm availability and send the bond details.`
              : `All of these are on hire right now. ${BUSINESS.ownerName} will message you when one comes back.`}
          </div>
          <div className={s.dialogActions}>
            <a className="btn btn-primary btn-block btn-lg" href={`${waHref}?text=${encodeURIComponent(waText(booking))}`} target="_blank" rel="noopener noreferrer">
              {booking.available ? 'Request booking on WhatsApp' : 'Join the waitlist on WhatsApp'} <span aria-hidden>→</span>
            </a>
            <a className="btn btn-secondary" href={telHref} style={{ minHeight: 44, justifyContent: 'flex-start' }}>
              Or call {BUSINESS.ownerPhone}
            </a>
          </div>
        </Dialog>
      )}
    </>
  );
}
