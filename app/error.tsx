"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { BrandMark } from "../components/brand-mark";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="offline-page">
      <BrandMark />
      <TriangleAlert className="offline-hero-icon" />
      <p className="eyebrow">Algo interrompeu o carregamento</p>
      <h1>Seu arquivo continua protegido</h1>
      <p>Os dados persistidos não foram apagados. Tente carregar a interface novamente; se houver uma alteração offline, ela continuará aguardando sincronização neste dispositivo.</p>
      <button className="button button-primary" type="button" onClick={reset}><RefreshCw /> Tentar novamente</button>
    </main>
  );
}
