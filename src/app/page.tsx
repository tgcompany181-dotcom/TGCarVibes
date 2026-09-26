import { Car, MapPin, MessageCircle, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FleetBooking } from '@/components/site/FleetBooking';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { HeroCarousel } from '@/components/site/HeroCarousel';
import { BUSINESS, telHref, waHref } from '@/lib/config';
import { getRepo } from '@/lib/data';
import { addDays, todaySydney } from '@/lib/dates';
import { groupFleet } from '@/lib/derive';
import { money } from '@/lib/format';
import s from './site.module.css';

export const revalidate = 60;

const GALLERY = [
  { src: 'https://images.unsplash.com/photo-1761014586544-53fe5e1f1e25', alt: 'Customer receiving the car keys', credit: 'yahdi yasya', href: 'https://unsplash.com/@yayi1077' },
  { src: 'https://images.unsplash.com/photo-1681505531034-8d67054e07f6', alt: 'Handshake over the rental agreement', credit: 'Amina Atar', href: 'https://unsplash.com/@minaslens' },
  { src: 'https://images.unsplash.com/photo-1727893512947-8bdc773ceb02', alt: 'Key handover at pick-up', credit: 'Mehmet Talha Onuk', href: 'https://unsplash.com/@mtonuk' },
  { src: 'https://images.unsplash.com/photo-1664463760781-f159dfe3af30', alt: 'Couple signing the rental agreement', credit: 'Annika Wischnewsky', href: 'https://unsplash.com/@wischn' },
];

const NAV = [
  ['#cars', 'Cars'],
  ['#how', 'How it works'],
  ['#need', 'Requirements'],
] as const;

export default async function HomePage() {
  let groups: ReturnType<typeof groupFleet> = [];
  try {
    groups = groupFleet(await getRepo().publicCars());
  } catch (e) {
    console.error('Failed to load fleet', e);
  }
  let banners: string[] = [];
  try {
    banners = (await getRepo().getBanners?.()) ?? [];
  } catch (e) {
    console.error('Failed to load cover images', e);
  }
  const defaultPick = addDays(todaySydney(), 3);

  // Top bar follows the fleet: shows what is available right now, hidden when nothing is.
  const available = groups.filter((g) => g.available > 0).sort((a, b) => a.weeklyRate - b.weeklyRate);
  const announcement =
    available.length === 0
      ? null
      : available.length === 1
        ? `${available[0].title} now available — ${money(available[0].weeklyRate)} per week, rego included. Minimum 8-week hire.`
        : `${available.reduce((n, g) => n + g.available, 0)} cars available now from ${money(available[0].weeklyRate)} per week, rego included. Minimum 8-week hire.`;
  const fromRate = groups.length ? Math.min(...groups.map((g) => g.weeklyRate)) : null;

  return (
    <div>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/" className={s.headerLogo} aria-label="Home">
            <BrandLogo height={44} priority />
          </Link>
          <nav className={s.nav} aria-label="Main">
            {NAV.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className={s.headerActions}>
            <Link className="btn btn-secondary" href="/my">
              My rental
            </Link>
            <a className="btn btn-primary" href={telHref}>
              {BUSINESS.ownerPhone}
            </a>
          </div>
        </div>
      </header>

      {announcement && (
        <>
          <a href="#cars" className={s.announce} aria-label={`${announcement} Book now`}>
            <div className={s.marquee} aria-hidden>
              {[0, 1].map((copy) => (
                <div key={copy} className={s.marqueeTrack}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={s.marqueeItem}>
                      <span className={s.marqueeDot} />
                      {announcement}
                      <span className={s.marqueeCta}>Book now →</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </a>
          <div className={s.redStrip} />
        </>
      )}

      <HeroCarousel images={banners.length ? banners : ['/images/hero-banner.jpg']} />

      <FleetBooking groups={groups} defaultPick={defaultPick} webRequests={Boolean(getRepo().addRequest)} />

      <section className={s.benefits}>
        <div className={s.benefitGrid}>
          <div className={s.benefit}>
            <b>Rego &amp; CTP</b>
            <p>Registration and green slip kept current by us.</p>
          </div>
          <div className={s.benefit}>
            <b>Servicing</b>
            <p>Logbook servicing and tyres at no extra cost.</p>
          </div>
          <div className={s.benefit}>
            <b>Talk to the owner</b>
            <p>Call or WhatsApp {BUSINESS.ownerName} directly. No call centre.</p>
          </div>
        </div>
      </section>

      <section className={s.gallery}>
        <div className={s.sectionHead}>
          <div>
            <div className="kicker">{fromRate != null ? `Petrol automatics · from ${money(fromRate)} per week` : 'Petrol automatics'}</div>
            <h2 className={s.h2}>Clean, ready, automatic</h2>
          </div>
          <div className={s.galleryHeadNote}>Every car is cleaned and checked before pick-up. Automatic gearbox, rego and servicing included.</div>
        </div>
        <div className={s.galleryGrid}>
          {GALLERY.map((p) => (
            <figure key={p.src} className={s.photo}>
              <Image src={`${p.src}?fm=jpg&q=70&w=1200&auto=format&fit=crop`} alt={p.alt} fill sizes="(max-width: 700px) 100vw, 300px" />
              <a className={s.credit} href={`${p.href}?utm_source=tg_car_vibes&utm_medium=referral`} target="_blank" rel="noopener noreferrer">
                Photo by {p.credit} on Unsplash
              </a>
            </figure>
          ))}
        </div>
      </section>

      <section id="how" className={s.how}>
        <div className="kicker">How it works</div>
        <h2 className={s.h2}>Three steps to the keys</h2>
        <div className={s.steps}>
          {[
            ['01', 'Choose a car and dates', 'Pick a model above and send a booking request.'],
            ['02', 'Send your licence', 'We confirm the booking and you pay the bond.'],
            ['03', 'Pick up and drive', 'Pay weekly by PayID. Track due dates in your account.'],
          ].map(([n, title, text]) => (
            <div key={n} className={s.step}>
              <div className={s.stepNum}>{n}</div>
              <b>{title}</b>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="need" className={s.need}>
        <div className={s.needInner}>
          <div>
            <div className="kicker">Requirements</div>
            <h2 className={s.h2}>What you need</h2>
          </div>
          <div className={s.needList}>
            {[
              ['Full driver licence', 'Australian, or overseas with translation'],
              ['Age', '21 or over'],
              ['Bond', '2 weeks’ rent, refunded on return'],
              ['Minimum hire', '8 weeks, no short-term rentals'],
              ['Use', 'Private use only — not for Uber or rideshare'],
            ].map(([k, v]) => (
              <div key={k} className={s.needRow}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.ctaWrap}>
        <div className={s.cta}>
          <div className={s.ctaLeft}>
            <div className={s.ctaIcon}>
              <Car size={46} strokeWidth={2} aria-hidden />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
              <h2 className={`${s.ctaTitle} sway`}>Book your car today</h2>
              <div className={s.ctaSub}>
                <MapPin size={20} aria-hidden />
                Call or message. Pick-up at {BUSINESS.location}.
              </div>
            </div>
          </div>
          <div className={s.ctaButtons}>
            <a className="btn btn-primary btn-pill" href={telHref}>
              <Phone size={20} aria-hidden />
              Call {BUSINESS.ownerPhone}
            </a>
            <a className="btn btn-secondary btn-pill" href={waHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={20} aria-hidden />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerTop}>
            <div className={s.footerLogo}>
              <BrandLogo height={36} onDark />
            </div>
            <nav className={s.footerNav} aria-label="Footer">
              {NAV.map(([href, label]) => (
                <a key={href} href={href}>
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div className={s.footerRule} />
          <div className={s.footerBottom}>
            <span>{BUSINESS.location}</span>
            <a href={telHref}>{BUSINESS.ownerPhone}</a>
            <span>© 2026 {BUSINESS.name}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
