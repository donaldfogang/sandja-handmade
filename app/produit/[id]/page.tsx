import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { TrackedLink, ViewTracker } from '../../TrackedLink';
import ImageCarousel from '../../ImageCarousel';

// Toujours des données fraîches (prix, disponibilité)
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sandja-handmade.vercel.app';
const WHATSAPP = '237693447304';

type Props = { params: Promise<{ id: string }> };

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

async function getProduct(id: string): Promise<Product | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as Product;
}

const formatPrice = (n: number) => Number(n || 0).toLocaleString('fr-FR');

// Aperçu riche quand le lien est partagé (WhatsApp affiche photo + titre + prix)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: 'Article introuvable – Sandja Handmade' };

  const title = `${p.title} – ${formatPrice(p.price)} FCFA`;
  const description = p.description || 'Création artisanale Sandja Handmade, aux motifs africains.';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/produit/${p.id}`,
      siteName: 'Sandja Handmade',
      images: [{ url: p.image_url }],
      type: 'website',
      locale: 'fr_FR',
    },
    twitter: { card: 'summary_large_image', title, description, images: [p.image_url] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const p = await getProduct(id);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans antialiased flex flex-col">
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-bold text-[#1C1917]">
            Sandja Handmade
          </Link>
          <Link href="/#catalogue" className="text-sm font-medium text-stone-600 hover:text-[#C85A32] transition">
            Toutes les créations
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
      <footer className="py-6 text-center text-xs text-stone-500">© 2026 Sandja Handmade. Tous droits réservés.</footer>
    </div>
  );

  if (!p) {
    return shell(
      <div className="text-center bg-white rounded-3xl border border-stone-200 shadow-sm p-10 max-w-lg mx-auto">
        <h1 className="font-serif text-2xl font-bold text-[#1C1917] mb-2">Article introuvable</h1>
        <p className="text-stone-500 text-sm mb-6">Ce lien n’est plus valide ou l’article a été retiré.</p>
        <Link href="/" className="inline-block bg-[#C85A32] hover:bg-[#b04b25] text-white px-6 py-3 rounded-full text-sm font-semibold transition">
          ← Retour au site
        </Link>
      </div>
    );
  }

  const price = formatPrice(p.price);
  const link = `${SITE_URL}/produit/${p.id}`;
  const message = p.is_urgent
    ? `Bonjour Sandja Handmade, je confirme mon intérêt pour le pack d'urgence : "${p.title}" (${price} FCFA). Est-il toujours disponible pour un retrait rapide ?\n\n${link}`
    : `Bonjour Sandja Handmade, je souhaite commander : "${p.title}" (${price} FCFA), délai indicatif de 12 jours. Est-ce possible ?\n\n${link}`;
  const whatsappHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  const available = p.is_available !== false;
  const gallery = p.images && p.images.length > 0 ? p.images : [p.image_url];

  return shell(
    <>
    <ViewTracker productId={p.id} label={p.title} />
    <article className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden grid md:grid-cols-2">
      <ImageCarousel images={gallery} alt={p.title} className="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[480px]">
        <span
          className={`absolute top-4 left-4 text-[11px] font-bold px-3 py-1 rounded-full shadow ${
            p.is_urgent ? 'bg-amber-600 text-white' : 'bg-stone-900/80 text-white backdrop-blur-sm'
          }`}
        >
          {p.is_urgent ? '⚡ Disponible immédiatement' : '⏳ Sur commande (12 jours)'}
        </span>
      </ImageCarousel>

      <div className="p-6 sm:p-10 flex flex-col">
        <p className="text-xs font-semibold tracking-wider text-[#C85A32] uppercase mb-3">
          {p.category === 'table' ? 'Arts de la table' : 'Décoration'}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1917] leading-tight">{p.title}</h1>
        <p className="font-serif text-3xl font-bold text-[#C85A32] mt-4">{price} FCFA</p>

        {p.description && <p className="text-stone-600 text-sm sm:text-base leading-relaxed mt-5">{p.description}</p>}

        {!available && (
          <p className="mt-5 text-sm bg-rose-50 text-rose-800 border border-rose-200 rounded-xl px-4 py-3">
            Cet article n’est plus en stock pour le moment. Écrivez-nous pour savoir s’il peut être refait.
          </p>
        )}

        <div className="mt-8 md:mt-auto pt-2 flex flex-col gap-3">
          <TrackedLink
            href={whatsappHref}
            productId={p.id}
            label={p.title}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white py-3.5 px-6 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            💬 Continuer sur WhatsApp
          </TrackedLink>
          <Link
            href="/#catalogue"
            className="flex items-center justify-center gap-2 border border-stone-300 hover:border-stone-400 text-stone-700 py-3.5 px-6 rounded-xl text-sm font-semibold transition"
          >
            ← Retour au site
          </Link>
        </div>
      </div>
    </article>
    </>
  );
}