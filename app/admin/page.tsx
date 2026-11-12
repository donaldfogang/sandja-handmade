'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ImageCarousel from '../ImageCarousel';
import { WhatsAppIcon } from '../Icons';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Empêche la duplication d'instances GoTrueClient dans le navigateur
declare global {
  var cachedSupabase: SupabaseClient | undefined;
}

const supabase =
  global.cachedSupabase ||
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.cachedSupabase = supabase;
}

interface Product {
  id: number | string;
  title: string;
  category: 'table' | 'deco';
  price: number;
  image_url: string;
  images?: string[] | null;
  description: string;
  is_urgent?: boolean;
  is_available?: boolean;
}

const MAX_IMAGES = 8;

const CAT_LABEL: Record<string, string> = { table: 'Arts de la table', deco: 'Décoration' };

// Réduit la photo avant l'envoi : chargement plus rapide et aperçu WhatsApp plus fiable (< 300 Ko visé)
async function compressImage(file: File, maxSize = 1400, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

// Empreinte visuelle d'une image (64 bits). Deux fichiers identiques, ou la même photo
// recompressée / redimensionnée, donnent la même empreinte à quelques bits près.
async function imageHash(source: Blob): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(source);
    const mid = document.createElement('canvas');
    mid.width = 72;
    mid.height = 64;
    const mctx = mid.getContext('2d');
    const small = document.createElement('canvas');
    small.width = 9;
    small.height = 8;
    const sctx = small.getContext('2d', { willReadFrequently: true });
    if (!mctx || !sctx) return null;
    mctx.imageSmoothingQuality = 'high';
    mctx.drawImage(bmp, 0, 0, 72, 64);
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(mid, 0, 0, 9, 8);
    const d = sctx.getImageData(0, 0, 9, 8).data;
    const lum = (i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let bits = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        bits += lum((y * 9 + x) * 4) > lum((y * 9 + x + 1) * 4) ? '1' : '0';
      }
    }
    return bits;
  } catch {
    return null;
  }
}

const hamming = (a: string, b: string) => {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
};

const DUP_MAX = 8; // au plus 8 bits d’écart sur 64 = même photo (photos différentes : 12 et plus)

const formatSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(b / 1024)} Ko`);

// ---------- STATISTIQUES ----------
interface Stats {
  visits: number;
  visitors: number;
  fiche_views: number;
  whatsapp_product: number;
  whatsapp_general: number;
  social: number;
  top_products: { product_id: string; label: string; clicks: number; views: number }[];
  daily: { day: string; visits: number; contacts: number }[];
  devices: { label: string; c: number }[];
  sources: { label: string; c: number }[];
  categories: { label: string; c: number }[];
}

const PERIODS = [
  { key: '1', label: 'Aujourd’hui' },
  { key: '7', label: '7 jours' },
  { key: '30', label: '30 jours' },
  { key: 'all', label: 'Tout' },
] as const;

const CAT_NAMES: Record<string, string> = { all: 'Tous', table: 'Arts de la table', deco: 'Décoration', urgence: 'Packs d’urgence' };

function BarList({ title, rows, names }: { title: string; rows: { label: string; c: number }[]; names?: Record<string, string> }) {
  const max = Math.max(1, ...rows.map((r) => r.c));
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-800 mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-stone-400">Pas encore de données.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-600 capitalize">{names?.[r.label] || r.label}</span>
                <span className="font-semibold text-stone-800">{r.c}</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#C85A32] rounded-full" style={{ width: `${(r.c / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatsPanel() {
  const [period, setPeriod] = useState<'1' | '7' | '30' | 'all'>('7');
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const since = new Date('2000-01-01');
      if (period !== 'all') {
        since.setTime(Date.now());
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - (Number(period) - 1));
      }
      const { data, error } = await supabase.rpc('get_stats', { since: since.toISOString() });
      if (cancelled) return;
      if (error) setError(error.message);
      else setStats(data as Stats);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  // Série par jour (les jours sans activité apparaissent à zéro)
  let days: { day: string; visits: number; contacts: number }[] = stats?.daily || [];
  if (stats && period !== 'all') {
    const map = new Map(stats.daily.map((d) => [d.day, d]));
    days = Array.from({ length: Number(period) }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (Number(period) - 1 - i));
      const key = d.toLocaleDateString('en-CA');
      return map.get(key) || { day: key, visits: 0, contacts: 0 };
    });
  }
  const maxDay = Math.max(1, ...days.map((d) => Math.max(d.visits, d.contacts)));
  const step = days.length > 14 ? Math.ceil(days.length / 7) : 1;

  const contacts = (stats?.whatsapp_product || 0) + (stats?.whatsapp_general || 0);
  const rate = stats && stats.visitors > 0 ? Math.round((contacts / stats.visitors) * 100) : 0;

  const kpis = stats
    ? [
        { n: stats.visits, l: 'Visites', h: 'Sessions sur le site' },
        { n: stats.visitors, l: 'Visiteurs uniques', h: 'Personnes différentes' },
        { n: stats.whatsapp_product, l: 'Clics « Je suis intéressé(e) »', h: 'Sur un article précis' },
        { n: contacts, l: 'Contacts WhatsApp', h: `${rate} % des visiteurs` },
        { n: stats.fiche_views, l: 'Fiches articles ouvertes', h: 'Via les liens WhatsApp' },
        { n: stats.social, l: 'Clics réseaux sociaux', h: 'Facebook, TikTok, Messenger' },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Statistiques du site</h2>
        <div className="flex gap-2 overflow-x-auto">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition ${
                period === p.key ? 'bg-[#1C1917] text-white border-[#1C1917]' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-sm">
          <p className="font-semibold mb-1">Les statistiques ne sont pas encore activées.</p>
          <p className="text-xs">
            Exécutez le fichier <code>analytics.sql</code> dans Supabase (SQL Editor), puis rechargez cette page. Détail : {error}
          </p>
        </div>
      ) : loading || !stats ? (
        <p className="p-10 text-center text-sm text-stone-500">Chargement des statistiques…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {kpis.map((k) => (
              <div key={k.l} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5">
                <p className="font-serif text-3xl font-bold text-[#C85A32]">{k.n}</p>
                <p className="text-sm font-semibold text-stone-800 mt-1">{k.l}</p>
                <p className="text-xs text-stone-500 mt-0.5">{k.h}</p>
              </div>
            ))}
          </div>

          {period !== '1' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-stone-800">Activité par jour</h3>
                <div className="flex gap-4 text-xs text-stone-500">
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-stone-300 inline-block" />Visites</span>
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[#C85A32] inline-block" />Contacts WhatsApp</span>
                </div>
              </div>
              <div className="flex items-end gap-1 sm:gap-2 h-40">
                {days.map((d, i) => (
                  <div key={d.day} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center" title={`${d.day} : ${d.visits} visite(s), ${d.contacts} contact(s)`}>
                    <div className="w-full flex items-end justify-center gap-0.5 flex-1">
                      <div className="w-1/2 bg-stone-300 rounded-t" style={{ height: `${(d.visits / maxDay) * 100}%`, minHeight: d.visits ? 3 : 0 }} />
                      <div className="w-1/2 bg-[#C85A32] rounded-t" style={{ height: `${(d.contacts / maxDay) * 100}%`, minHeight: d.contacts ? 3 : 0 }} />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1.5 h-3">{i % step === 0 ? d.day.slice(8) + '/' + d.day.slice(5, 7) : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <h3 className="text-sm font-semibold text-stone-800 p-5 pb-3">Articles les plus demandés</h3>
            {stats.top_products.length === 0 ? (
              <p className="px-5 pb-5 text-xs text-stone-400">Pas encore de données.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2 text-[11px] font-semibold text-stone-500 uppercase tracking-wider bg-stone-50">
                  <span>Article</span>
                  <span className="w-20 text-right">Fiche vue</span>
                  <span className="w-20 text-right">WhatsApp</span>
                </div>
                {stats.top_products.map((t) => (
                  <div key={t.product_id} className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 text-sm items-center">
                    <span className="truncate font-medium text-stone-800">{t.label || t.product_id}</span>
                    <span className="w-20 text-right text-stone-600">{t.views}</span>
                    <span className="w-20 text-right font-semibold text-[#C85A32]">{t.clicks}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <BarList title="Appareils" rows={stats.devices} />
            <BarList title="D’où viennent les visiteurs" rows={stats.sources} />
            <BarList title="Catégories consultées" rows={stats.categories} names={CAT_NAMES} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'articles' | 'stats'>('articles');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Formulaire
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'table' | 'deco'>('table');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [images, setImages] = useState<{ id: string; file?: File; url: string; existing?: boolean; hash?: string | null }[]>([]);
  const [checking, setChecking] = useState(false);
  const hashCache = useRef(new Map<string, string | null>());
  const savingRef = useRef(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [progress, setProgress] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Libère les aperçus en quittant la page
  useEffect(() => {
    return () => imagesRef.current.forEach((i) => !i.existing && URL.revokeObjectURL(i.url));
  }, []);

  // Message de confirmation / d'erreur
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sandja2026') {
      setLoginError(false);
      try {
        localStorage.setItem('sandja_notrack', '1'); // mes propres visites ne sont pas comptées
      } catch {}
      setIsAuthenticated(true);
      fetchAdminProducts();
    } else {
      setLoginError(true);
    }
  };

  const fetchAdminProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
    if (error) console.error(error);
    if (data) setProducts(data);
    setLoading(false);
  };

  // Empreintes de toutes les photos déjà publiées (calculées une fois, puis gardées en mémoire)
  const getCatalogHashes = async () => {
    const jobs: { url: string; title: string; productId: Product['id'] }[] = [];
    for (const p of products) {
      const urls = p.images && p.images.length > 0 ? p.images : [p.image_url];
      urls.filter(Boolean).forEach((url) => jobs.push({ url, title: p.title, productId: p.id }));
    }
    for (let i = 0; i < jobs.length; i += 6) {
      await Promise.all(
        jobs.slice(i, i + 6).map(async (j) => {
          if (hashCache.current.has(j.url)) return;
          try {
            const res = await fetch(j.url);
            hashCache.current.set(j.url, res.ok ? await imageHash(await res.blob()) : null);
          } catch {
            hashCache.current.set(j.url, null);
          }
        })
      );
    }
    const entries: { hash: string; title: string; productId: Product['id'] }[] = [];
    jobs.forEach((j) => {
      const h = hashCache.current.get(j.url);
      if (h) entries.push({ hash: h, title: j.title, productId: j.productId });
    });
    return entries;
  };

  const addFiles = async (list: FileList | File[] | null) => {
    if (!list || checking) return;
    const all = Array.from(list);
    const incoming = all.filter((f) => f.type.startsWith('image/'));
    const room = MAX_IMAGES - images.length;
    if (fileRef.current) fileRef.current.value = '';

    const notes: string[] = [];
    if (incoming.length < all.length) notes.push('Les fichiers qui ne sont pas des images ont été ignorés.');
    if (incoming.length > room) notes.push(`Maximum ${MAX_IMAGES} photos par article.`);

    setChecking(true);
    try {
      const catalog = await getCatalogHashes();
      const selected = images
        .map((i) => (i.existing ? hashCache.current.get(i.url) : i.hash))
        .filter((h): h is string => !!h);
      const accepted: { id: string; file: File; url: string; hash: string | null }[] = [];

      for (const file of incoming.slice(0, Math.max(0, room))) {
        const h = await imageHash(file);
        if (h) {
          // déjà utilisée dans un AUTRE article ?
          const other = catalog.find((c) => c.productId !== editingId && hamming(c.hash, h) <= DUP_MAX);
          if (other) {
            notes.push(`Photo refusée : « ${file.name} » est déjà utilisée dans l’article « ${other.title} ».`);
            continue;
          }
          // déjà dans la sélection en cours ?
          if (selected.some((x) => hamming(x, h) <= DUP_MAX)) {
            notes.push(`Photo refusée : « ${file.name} » est déjà dans cet article.`);
            continue;
          }
          selected.push(h);
        }
        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          url: URL.createObjectURL(file),
          hash: h,
        });
      }
      if (accepted.length) setImages((prev) => [...prev, ...accepted]);
    } finally {
      setChecking(false);
    }
    if (notes.length) setToast({ type: 'err', text: notes.join(' ') });
  };

  const removeImage = (id: string) => {
    const target = images.find((i) => i.id === id);
    if (target && !target.existing) URL.revokeObjectURL(target.url);
    setImages(images.filter((i) => i.id !== id));
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[index], next[j]] = [next[j], next[index]];
    setImages(next);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('table');
    setPrice('');
    setDescription('');
    setIsUrgent(false);
    images.forEach((i) => !i.existing && URL.revokeObjectURL(i.url));
    setImages([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Charge un article dans le formulaire pour le modifier
  const startEdit = (p: Product) => {
    images.forEach((i) => !i.existing && URL.revokeObjectURL(i.url));
    const urls = p.images && p.images.length > 0 ? p.images : [p.image_url];
    setImages(urls.map((url, k) => ({ id: `old-${p.id}-${k}`, url, existing: true })));
    setEditingId(p.id);
    setTitle(p.title || '');
    setCategory(p.category === 'deco' ? 'deco' : 'table');
    setPrice(String(p.price ?? ''));
    setDescription(p.description || '');
    setIsUrgent(!!p.is_urgent);
    setTab('articles');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Nom du fichier dans le stockage Supabase à partir de son adresse publique
  const storageName = (url: string) => {
    const marker = '/products-images/';
    const idx = url.indexOf(marker);
    return idx >= 0 ? decodeURIComponent(url.slice(idx + marker.length).split('?')[0]) : null;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = editingId !== null;
    if (!title.trim() || !price || images.length === 0) {
      setToast({ type: 'err', text: 'Renseignez le titre, le prix et gardez au moins une photo.' });
      return;
    }

    if (savingRef.current) return; // évite deux publications d'un double clic
    savingRef.current = true;

    const uploaded: string[] = [];
    try {
      setSaving(true);
      const urls: string[] = [];
      const newCount = images.filter((i) => !i.existing).length;
      let sent = 0;

      for (let i = 0; i < images.length; i++) {
        const im = images[i];
        if (im.existing || !im.file) {
          urls.push(im.url); // photo déjà en ligne : on la garde telle quelle
          continue;
        }
        sent++;
        setProgress(`Envoi de la photo ${sent}/${newCount}…`);
        const optimized = await compressImage(im.file);
        const safeName = optimized.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${Date.now()}-${i}-${safeName}`;

        const { error: uploadError } = await supabase.storage.from('products-images').upload(fileName, optimized);
        if (uploadError) throw uploadError;
        uploaded.push(fileName);

        const { data: publicUrlData } = supabase.storage.from('products-images').getPublicUrl(fileName);
        urls.push(publicUrlData.publicUrl);
      }

      setProgress(isEdit ? 'Enregistrement…' : 'Publication…');
      const fields = {
        name: title.trim(), // requis par la contrainte de la base de données
        title: title.trim(),
        category,
        price: Number(price),
        description: description.trim(),
        image_url: urls[0], // photo principale (liste, partage WhatsApp)
        images: urls, // toutes les photos, dans l'ordre choisi
        is_urgent: isUrgent,
      };

      if (isEdit) {
        const { error: updateError } = await supabase.from('products').update(fields).eq('id', editingId);
        if (updateError) throw updateError;

        // photos retirées : on les supprime aussi du stockage
        const original = products.find((p) => p.id === editingId);
        const before = original ? (original.images && original.images.length > 0 ? original.images : [original.image_url]) : [];
        const removed = before.filter((u) => !urls.includes(u)).map(storageName).filter((n): n is string => !!n);
        if (removed.length) await supabase.storage.from('products-images').remove(removed);

        setToast({ type: 'ok', text: `« ${title.trim()} » a été modifié.` });
      } else {
        const { error: insertError } = await supabase.from('products').insert([{ ...fields, is_available: true }]);
        if (insertError) throw insertError;
        setToast({ type: 'ok', text: `« ${title.trim()} » a été publié avec ${urls.length} photo${urls.length > 1 ? 's' : ''}.` });
      }

      resetForm();
      fetchAdminProducts();
    } catch (err: any) {
      // on retire les photos déjà envoyées pour ne pas laisser de fichiers orphelins
      if (uploaded.length) await supabase.storage.from('products-images').remove(uploaded);
      const msg: string = err?.message || 'inconnue';
      const hint = /images/i.test(msg) && /column|schema/i.test(msg) ? ' — exécutez d’abord multi-images.sql dans Supabase.' : '';
      setToast({ type: 'err', text: (isEdit ? 'Erreur lors de la modification : ' : 'Erreur lors de l’ajout : ') + msg + hint });
    } finally {
      savingRef.current = false;
      setSaving(false);
      setProgress('');
    }
  };

  const toggleAvailability = async (p: Product) => {
    const { error } = await supabase.from('products').update({ is_available: !p.is_available }).eq('id', p.id);
    if (error) return setToast({ type: 'err', text: 'Modification impossible : ' + error.message });
    fetchAdminProducts();
  };

  const toggleUrgent = async (p: Product) => {
    const { error } = await supabase.from('products').update({ is_urgent: !p.is_urgent }).eq('id', p.id);
    if (error) return setToast({ type: 'err', text: 'Modification impossible : ' + error.message });
    fetchAdminProducts();
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`Supprimer définitivement « ${p.title} » ?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) return setToast({ type: 'err', text: 'Suppression impossible : ' + error.message });
    if (editingId === p.id) resetForm();
    setToast({ type: 'ok', text: 'Article supprimé.' });
    fetchAdminProducts();
  };

  const inputCls =
    'w-full px-4 py-3 border border-stone-300 rounded-xl text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 transition';
  const labelCls = 'block text-xs font-semibold text-stone-600 mb-1.5';

  // ---------- CONNEXION ----------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] via-[#F1E6DA] to-[#E8D8C8] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white/90 backdrop-blur p-8 sm:p-10 rounded-3xl shadow-xl border border-white max-w-md w-full">
          <img src="/logo.jpg" alt="Logo Sandja Handmade" width={96} height={96} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-lg ring-4 ring-white" />
          <p className="font-serif text-3xl font-bold text-[#1C1917] text-center">Sandja Handmade</p>
          <p className="text-center text-sm text-stone-500 mt-1 mb-8">Espace d’administration</p>

          <label className={labelCls} htmlFor="pwd">Mot de passe</label>
          <input
            id="pwd"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLoginError(false);
            }}
            autoFocus
            className={`${inputCls} ${loginError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}`}
            placeholder="Entrez le mot de passe"
          />
          {loginError && <p className="text-xs text-rose-600 mt-2">Mot de passe incorrect. Réessayez.</p>}

          <button type="submit" className="w-full mt-5 bg-[#1C1917] text-white py-3 rounded-xl font-semibold text-sm hover:bg-stone-800 transition">
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  const stats = {
    total: products.length,
    dispo: products.filter((p) => p.is_available).length,
    urgent: products.filter((p) => p.is_urgent).length,
  };
  const shown = products.filter((p) => p.title?.toLowerCase().includes(search.trim().toLowerCase()));
  const priceNum = Number(price || 0);

  // ---------- TABLEAU DE BORD ----------
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans text-stone-800">
      {toast && (
        <div
          role="status"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${
            toast.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'ok' ? '✓ ' : '⚠ '}
          {toast.text}
        </div>
      )}

      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo Sandja Handmade" width={40} height={40} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#C85A32]/30" />
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold text-[#1C1917]">Sandja Handmade</span>
              <span className="ml-3 text-xs text-stone-500 hidden sm:inline">Administration</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 transition">
              Voir le site
            </a>
            <button onClick={() => setIsAuthenticated(false)} className="text-xs font-semibold px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 transition">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Onglets */}
        <div className="flex gap-2 mb-8 border-b border-stone-200">
          {([
            ['articles', 'Articles'],
            ['stats', 'Statistiques'],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-5 py-3 text-sm font-semibold -mb-px border-b-2 transition ${
                tab === k ? 'border-[#C85A32] text-[#C85A32]' : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === 'stats' ? (
          <>
            <StatsPanel />
            <p className="text-xs text-stone-400 mt-8">Les visites faites depuis cet espace admin, sur cet appareil, ne sont pas comptées.</p>
          </>
        ) : (
        <>
        {/* Chiffres clés */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { n: stats.total, l: 'Articles' },
            { n: stats.dispo, l: 'Disponibles' },
            { n: stats.urgent, l: 'Packs d’urgence' },
          ].map((s) => (
            <div key={s.l} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5">
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#C85A32]">{s.n}</p>
              <p className="text-xs text-stone-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Formulaire + aperçu */}
        <div className="grid lg:grid-cols-5 gap-6 mb-12">
          <form onSubmit={handleAddProduct} className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200 space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1C1917]">{editingId !== null ? 'Modifier l’article' : 'Ajouter un article'}</h2>
              <p className="text-sm text-stone-500 mt-1">L’aperçu à droite montre l’article tel que vos clients le verront.</p>
            </div>

            {editingId !== null && (
              <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm">
                <span>
                  Vous modifiez <strong>« {title || 'cet article'} »</strong>. Rien n’est changé sur le site avant d’enregistrer.
                </span>
                <button type="button" onClick={resetForm} className="shrink-0 text-xs font-semibold underline">
                  Annuler
                </button>
              </div>
            )}

            {/* Photos de l'article */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label className={labelCls}>
                  Photos de l’article * <span className="font-normal text-stone-400">(vue d’ensemble, puis détails)</span>
                </label>
                <span className="text-xs text-stone-500 shrink-0">{checking ? 'Vérification des doublons…' : images.length > 0 ? `${images.length}/${MAX_IMAGES}` : ''}</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />

              {images.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    addFiles(e.dataTransfer.files);
                  }}
                  className={`w-full border-2 border-dashed rounded-2xl py-10 px-4 text-center transition ${
                    dragging ? 'border-[#C85A32] bg-[#C85A32]/5' : 'border-stone-300 hover:border-[#C85A32] hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-3xl mb-2">📷</span>
                  <span className="block text-sm font-semibold text-stone-700">Cliquez pour choisir une ou plusieurs photos</span>
                  <span className="block text-xs text-stone-500 mt-1">ou glissez-les ici (jusqu’à {MAX_IMAGES})</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((im, i) => (
                    <div
                      key={im.id}
                      className={`relative aspect-square rounded-xl overflow-hidden border ${
                        i === 0 ? 'border-[#C85A32] ring-2 ring-[#C85A32]/30' : 'border-stone-200'
                      }`}
                    >
                      <img src={im.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#C85A32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Principale</span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex items-center justify-between">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Déplacer vers la gauche" className="w-6 h-6 rounded-full bg-white/90 text-stone-800 text-xs disabled:opacity-30">
                            ◀
                          </button>
                          <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label="Déplacer vers la droite" className="w-6 h-6 rounded-full bg-white/90 text-stone-800 text-xs disabled:opacity-30">
                            ▶
                          </button>
                        </div>
                        <button type="button" onClick={() => removeImage(im.id)} aria-label="Retirer cette photo" className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-[#C85A32] hover:bg-stone-50 flex flex-col items-center justify-center text-stone-500 hover:text-[#C85A32] transition"
                    >
                      <span className="text-2xl leading-none">+</span>
                      <span className="text-[11px] font-semibold mt-1">Ajouter</span>
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-stone-500 mt-2">
                La première photo est celle affichée dans la liste et dans le partage WhatsApp. Utilisez ◀ ▶ pour changer l’ordre.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Titre de l’article *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ex : Set de table royal" />
              </div>
              <div>
                <label className={labelCls}>Catégorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as 'table' | 'deco')} className={inputCls}>
                  <option value="table">Arts de la table</option>
                  <option value="deco">Décoration</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Prix (FCFA) *</label>
                <input type="number" min="0" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} placeholder="Ex : 15000" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Matières, dimensions, détails..." />
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/60 cursor-pointer">
              <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-amber-600" />
              <span>
                <span className="block text-sm font-semibold text-stone-800">⚡ Pack d’urgence</span>
                <span className="block text-xs text-stone-600">Article en stock, disponible immédiatement (sans délai de 12 jours).</span>
              </span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              {editingId !== null && (
                <button type="button" onClick={resetForm} disabled={saving} className="sm:w-1/3 border border-stone-300 text-stone-700 py-3.5 rounded-xl font-semibold text-sm hover:bg-stone-100 transition disabled:opacity-60">
                  Annuler
                </button>
              )}
              <button type="submit" disabled={saving} className="flex-1 bg-[#C85A32] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#b04b25] disabled:opacity-60 disabled:cursor-not-allowed transition">
                {saving ? progress || 'Enregistrement en cours…' : editingId !== null ? 'Enregistrer les modifications' : 'Publier l’article'}
              </button>
            </div>
          </form>

          {/* Aperçu côté client */}
          <aside className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Aperçu sur le site</p>
              <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
                <ImageCarousel images={images.map((i) => i.url)} alt="Aperçu" empty={<span className="text-xs text-stone-400">Les photos apparaîtront ici</span>}>
                  <span className={`absolute top-3 left-3 text-[11px] font-bold px-3 py-1 rounded-full shadow ${isUrgent ? 'bg-amber-600 text-white' : 'bg-stone-900/80 text-white'}`}>
                    {isUrgent ? '⚡ Disponible immédiatement' : '⏳ Sur commande (12 jours)'}
                  </span>
                </ImageCarousel>
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-[#1C1917] leading-snug">{title || 'Titre de l’article'}</h3>
                    <span className="font-serif font-bold text-[#C85A32] whitespace-nowrap">{priceNum.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <p className="text-xs text-[#C85A32] font-semibold mb-2">{CAT_LABEL[category]}</p>
                  <p className="text-stone-500 text-xs leading-relaxed min-h-[2.5rem]">{description || 'La description apparaîtra ici.'}</p>
                  <div className="mt-4 bg-stone-900 text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"><WhatsAppIcon className="w-4 h-4" /> Je suis intéressé(e)</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Gestion des articles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Gestion des articles</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} sm:max-w-xs`} placeholder="🔍 Rechercher un article" />
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-stone-500">Chargement…</p>
          ) : shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-500">{products.length === 0 ? 'Aucun article pour le moment.' : 'Aucun article ne correspond à la recherche.'}</p>
          ) : (
            shown.map((p) => (
              <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-stone-50/60 transition">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img src={p.image_url} alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-200 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{p.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {CAT_LABEL[p.category] || p.category}
                      {(p.images?.length || 0) > 1 && ` · ${p.images!.length} photos`}
                    </p>
                    <p className="font-serif font-bold text-[#C85A32] mt-1">{Number(p.price || 0).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => toggleAvailability(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${p.is_available ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}
                  >
                    {p.is_available ? '● Disponible' : '● Épuisé'}
                  </button>
                  <button
                    onClick={() => toggleUrgent(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${p.is_urgent ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white text-stone-500 border-stone-300 hover:border-stone-400'}`}
                  >
                    ⚡ {p.is_urgent ? 'Urgent' : 'Normal'}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      editingId === p.id ? 'bg-[#C85A32] text-white border-[#C85A32]' : 'bg-white text-[#C85A32] border-[#C85A32]/40 hover:bg-[#C85A32]/5'
                    }`}
                  >
                    ✎ Modifier
                  </button>
                  <a href={`/produit/${p.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-[#C85A32] transition">
                    Voir la fiche
                  </a>
                  <button onClick={() => deleteProduct(p)} className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-full transition">
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}