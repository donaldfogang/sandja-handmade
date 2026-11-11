// Enregistre une interaction dans Supabase (table "events"), sans créer de second client Supabase.
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export type EventType =
  | 'visit'
  | 'product_view'
  | 'whatsapp_click'
  | 'whatsapp_general'
  | 'social_click'
  | 'category_click';

function visitorId(): string {
  try {
    let id = localStorage.getItem('sandja_vid');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('sandja_vid', id);
    }
    return id;
  } catch {
    return 'anonyme';
  }
}

function deviceType(): string {
  const w = window.innerWidth;
  return w < 768 ? 'mobile' : w < 1024 ? 'tablette' : 'ordinateur';
}

export function track(type: EventType, extra: { productId?: string | number; label?: string } = {}) {
  if (typeof window === 'undefined' || !SUPA_URL || !SUPA_KEY) return;
  try {
    // Les visites faites depuis l'espace admin (sur cet appareil) ne sont pas comptées
    if (localStorage.getItem('sandja_notrack') === '1') return;

    // Une seule "visite" par session de navigation
    if (type === 'visit') {
      if (sessionStorage.getItem('sandja_visit')) return;
      sessionStorage.setItem('sandja_visit', '1');
    }

    let referrer = 'Direct';
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname;
        if (host && host !== location.hostname) referrer = host.replace(/^www\./, '');
      }
    } catch {}

    fetch(`${SUPA_URL}/rest/v1/events`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        type,
        product_id: extra.productId != null ? String(extra.productId) : null,
        label: extra.label ?? null,
        visitor_id: visitorId(),
        device: deviceType(),
        referrer,
      }),
    }).catch(() => {});
  } catch {
    // le suivi ne doit jamais casser le site
  }
}