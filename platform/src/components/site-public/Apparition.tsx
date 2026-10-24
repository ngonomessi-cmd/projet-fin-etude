"use client";

import { useEffect, useRef, useState } from "react";

// Fait apparaître son contenu en fondu ascendant quand il entre à l'écran.
export function Apparition({
  children,
  delai = 0,
  className = "",
}: {
  children: React.ReactNode;
  delai?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true);
          observateur.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" }
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  return (
    <div ref={ref} data-visible={visible} className={`revele ${className}`} style={{ transitionDelay: `${delai}ms` }}>
      {children}
    </div>
  );
}
