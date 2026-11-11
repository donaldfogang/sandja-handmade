'use client';

import React, { useEffect } from 'react';
import { track, type EventType } from './lib/track';

// Enregistre l'ouverture d'une fiche article (et la visite si le client arrive directement par ce lien)
export function ViewTracker({ productId, label }: { productId: string | number; label: string }) {
  useEffect(() => {
    track('visit');
    track('product_view', { productId, label });
  }, [productId, label]);
  return null;
}

// Lien externe qui enregistre le clic
export function TrackedLink({
  href,
  children,
  className,
  type = 'whatsapp_click',
  productId,
  label,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  type?: EventType;
  productId?: string | number;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track(type, { productId, label })}
    >
      {children}
    </a>
  );
}