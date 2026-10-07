import { CONTACT_INFO } from '@/data/products';

export const getWhatsAppLink = (productTitle: string, price: number, imageUrl?: string) => {
  const formattedPrice = price.toLocaleString('fr-FR');
  
  // URL complète de l'image (nécessaire pour l'aperçu WhatsApp)
  const domain = typeof window !== 'undefined' ? window.location.origin : '';
  const fullImageUrl = imageUrl ? `${domain}${imageUrl}` : '';

  let message = `Bonjour Sandja Handmade, je suis intéressé(e) par votre création : "${productTitle}" (${formattedPrice} FCFA). Est-elle disponible ?`;
  
  if (fullImageUrl) {
    message += `\n\nVoir l'image de la création : ${fullImageUrl}`;
  }

  return `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
};