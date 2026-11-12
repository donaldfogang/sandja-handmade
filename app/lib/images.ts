// Outils partagés pour les photos envoyées depuis l'admin.

// Réduit la photo avant l'envoi : chargement plus rapide et aperçu WhatsApp plus fiable.
export async function compressImage(file: File, maxSize = 1400, quality = 0.82): Promise<File> {
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

// Nom « de base » d'une photo : sans extension, en minuscules, avec la même
// transformation des caractères spéciaux qu'à l'envoi. (autre.jpeg = Autre.JPG = autre.png)
export const baseName = (name: string) =>
  name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();

// Nom d'origine d'une photo déjà en ligne, retrouvé dans son adresse
// (le préfixe de date ajouté à l'envoi est retiré).
export const nameFromUrl = (url: string) => {
  try {
    const file = decodeURIComponent(url.split('?')[0].split('/').pop() || '');
    return baseName(file.replace(/^\d{10,}-(?:\d{1,2}-)?/, ''));
  } catch {
    return '';
  }
};

// Chemin d'un fichier dans le stockage Supabase à partir de son adresse publique
export const storagePath = (url: string) => {
  const marker = '/products-images/';
  const idx = url.indexOf(marker);
  return idx >= 0 ? decodeURIComponent(url.slice(idx + marker.length).split('?')[0]) : null;
};