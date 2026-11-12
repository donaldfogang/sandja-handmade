'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { StarPicker, StarRating } from '../Stars';
import { LightboxPortal } from '../ImageCarousel';
import { compressImage, baseName, nameFromUrl, storagePath } from '../lib/images';

interface ReviewRow {
  id: string;
  created_at: string;
  image_url: string;
  rating: number;
  label: string | null;
  is_visible: boolean;
}

type Props = {
  supabase: SupabaseClient;
  notify: (t: { type: 'ok' | 'err'; text: string }) => void;
};

const MOODS = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

export default function ReviewsAdmin({ supabase, notify }: Props) {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [label, setLabel] = useState('');
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) setSetupError(error.message);
    else {
      setSetupError(null);
      setRows((data || []) as ReviewRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return notify({ type: 'err', text: 'Ce fichier n’est pas une image.' });
    const name = baseName(f.name);
    const same = rows.find((r) => nameFromUrl(r.image_url) === name);
    if (same) {
      return notify({ type: 'err', text: `« ${f.name} » porte le même nom qu’une capture déjà publiée. Si c’est un autre avis, renommez le fichier.` });
    }
    setFile(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  const reset = () => {
    setFile(null);
    setRating(0);
    setLabel('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || rating === 0) return notify({ type: 'err', text: 'Ajoutez la capture et choisissez le nombre d’étoiles.' });
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    let uploaded: string | null = null;
    try {
      // les captures contiennent du texte : on garde une résolution plus élevée que pour les articles
      const optimized = await compressImage(file, 1600, 0.88);
      const safeName = optimized.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `reviews/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage.from('products-images').upload(path, optimized);
      if (upErr) throw upErr;
      uploaded = path;

      const { data: pub } = supabase.storage.from('products-images').getPublicUrl(path);
      const { error: insErr } = await supabase.from('reviews').insert([{ image_url: pub.publicUrl, rating, label: label.trim() || null, is_visible: true }]);
      if (insErr) throw insErr;

      notify({ type: 'ok', text: `Avis publié avec ${rating} étoile${rating > 1 ? 's' : ''}.` });
      reset();
      load();
    } catch (err: any) {
      if (uploaded) await supabase.storage.from('products-images').remove([uploaded]);
      const msg: string = err?.message || 'inconnue';
      const hint = /reviews/i.test(msg) && /relation|table|schema|exist/i.test(msg) ? ' — exécutez d’abord reviews.sql dans Supabase.' : '';
      notify({ type: 'err', text: 'Erreur lors de la publication : ' + msg + hint });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const changeRating = async (r: ReviewRow, n: number) => {
    if (n === r.rating) return;
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, rating: n } : x)));
    const { error } = await supabase.from('reviews').update({ rating: n }).eq('id', r.id);
    if (error) {
      notify({ type: 'err', text: 'Modification impossible : ' + error.message });
      load();
    }
  };

  const toggleVisible = async (r: ReviewRow) => {
    const { error } = await supabase.from('reviews').update({ is_visible: !r.is_visible }).eq('id', r.id);
    if (error) return notify({ type: 'err', text: 'Modification impossible : ' + error.message });
    load();
  };

  const remove = async (r: ReviewRow) => {
    if (!confirm('Supprimer définitivement cet avis ?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', r.id);
    if (error) return notify({ type: 'err', text: 'Suppression impossible : ' + error.message });
    const path = storagePath(r.image_url);
    if (path) await supabase.storage.from('products-images').remove([path]);
    notify({ type: 'ok', text: 'Avis supprimé.' });
    load();
  };

  const inputCls =
    'w-full px-4 py-3 border border-stone-300 rounded-xl text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 transition';
  const labelCls = 'block text-xs font-semibold text-stone-600 mb-1.5';

  const visible = rows.filter((r) => r.is_visible);
  const average = visible.length ? visible.reduce((s, r) => s + r.rating, 0) / visible.length : 0;

  if (setupError) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-sm">
        <p className="font-semibold mb-1">Les avis ne sont pas encore activés.</p>
        <p className="text-xs">Exécutez le fichier <code>reviews.sql</code> dans Supabase (SQL Editor), puis rechargez cette page. Détail : {setupError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid lg:grid-cols-5 gap-6 mb-12">
        <form onSubmit={submit} className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200 space-y-5">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Ajouter un avis client</h2>
            <p className="text-sm text-stone-500 mt-1">Chargez la capture d’écran, puis donnez la note avant de publier.</p>
          </div>

          <div>
            <label className={labelCls}>Capture d’écran de l’avis *</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            {preview && file ? (
              <div className="flex items-start gap-4 p-3 border border-emerald-200 bg-emerald-50/60 rounded-2xl">
                <img src={preview} alt="Capture sélectionnée" className="w-28 max-h-44 object-contain rounded-xl border border-white bg-white shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-emerald-900">✓ Capture sélectionnée</p>
                  <p className="text-xs text-stone-600 truncate mt-0.5">{file.name}</p>
                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-[#C85A32] hover:underline">Changer</button>
                    <button type="button" onClick={() => setFile(null)} className="text-xs font-semibold text-rose-600 hover:underline">Retirer</button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
                className={`w-full border-2 border-dashed rounded-2xl py-10 px-4 text-center transition ${dragging ? 'border-[#C85A32] bg-[#C85A32]/5' : 'border-stone-300 hover:border-[#C85A32] hover:bg-stone-50'}`}
              >
                <span className="block text-3xl mb-2">💬</span>
                <span className="block text-sm font-semibold text-stone-700">Cliquez pour choisir la capture</span>
                <span className="block text-xs text-stone-500 mt-1">ou glissez-la ici</span>
              </button>
            )}
          </div>

          <div>
            <label className={labelCls}>Note donnée à cet avis *</label>
            <div className="flex items-center gap-4 flex-wrap">
              <StarPicker value={rating} onChange={setRating} className="w-9 h-9" />
              <span className={`text-sm font-semibold ${rating ? 'text-amber-600' : 'text-stone-400'}`}>{rating ? `${rating}/5 · ${MOODS[rating]}` : 'Touchez les étoiles'}</span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Prénom ou légende (facultatif)</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} className={inputCls} placeholder="Ex : Marie, cliente à Douala" />
          </div>

          <button type="submit" disabled={saving || !file || rating === 0} className="w-full bg-[#C85A32] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#b04b25] disabled:opacity-50 disabled:cursor-not-allowed transition">
            {saving ? 'Publication en cours…' : 'Publier l’avis'}
          </button>
        </form>

        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Aperçu sur le site</p>
            <figure className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden max-w-xs">
              <div className="bg-stone-100 min-h-[10rem] flex items-center justify-center">
                {preview ? <img src={preview} alt="" className="w-full h-auto block" /> : <span className="text-xs text-stone-400 py-10">La capture apparaîtra ici</span>}
              </div>
              <figcaption className="px-3 py-2.5 flex items-center justify-between gap-2">
                <StarRating value={rating} className="w-4 h-4" />
                {label && <span className="text-xs text-stone-500 truncate">{label}</span>}
              </figcaption>
            </figure>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Avis publiés</h2>
        {visible.length > 0 && (
          <span className="flex items-center gap-2 text-sm text-stone-600">
            <StarRating value={average} className="w-4 h-4" />
            <strong>{average.toFixed(1).replace('.', ',')}</strong> · {visible.length} avis visible{visible.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <p className="p-8 text-center text-sm text-stone-500">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-stone-500 bg-white rounded-3xl border border-stone-200">Aucun avis pour le moment. La section « Avis » n’apparaît sur le site qu’à partir du premier avis publié.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map((r, i) => (
            <div key={r.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col ${r.is_visible ? 'border-stone-200' : 'border-stone-200 opacity-60'}`}>
              <button type="button" onClick={() => setZoom(i)} className="block bg-stone-100 cursor-zoom-in" aria-label="Agrandir la capture">
                <img src={r.image_url} alt="" loading="lazy" className="w-full h-44 object-cover object-top" />
              </button>
              <div className="p-3 space-y-2 flex-1 flex flex-col">
                <StarPicker value={r.rating} onChange={(n) => changeRating(r, n)} className="w-5 h-5" />
                {r.label && <p className="text-xs text-stone-500 truncate">{r.label}</p>}
                <p className="text-[11px] text-stone-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <button onClick={() => toggleVisible(r)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${r.is_visible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                    {r.is_visible ? '● Visible' : '○ Masqué'}
                  </button>
                  <button onClick={() => remove(r)} className="text-[11px] font-semibold text-rose-600 hover:underline">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {zoom !== null && <LightboxPortal images={rows.map((r) => r.image_url)} start={zoom} alt="Avis clients" onClose={() => setZoom(null)} />}
    </div>
  );
}