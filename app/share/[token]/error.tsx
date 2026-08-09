"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "../../../components/brand-mark";

export default function SharedSheetError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="shared-page shared-missing-page">
      <header className="shared-topbar">
        <Link aria-label="Arquivo de Heróis" className="brand" href="/">
          <BrandMark />
          <span><strong>Arquivo de Heróis</strong></span>
        </Link>
      </header>
      <section className="shared-missing">
        <span className="shared-missing-icon"><TriangleAlert /></span>
        <p className="eyebrow">Falha temporária</p>
        <h1>O link continua válido</h1>
        <p>Não foi possível consultar a ficha agora, mas o endereço permanente não foi removido. Tente novamente quando a conexão estiver estável.</p>
        <button className="button button-primary" type="button" onClick={reset}><RefreshCw /> Tentar novamente</button>
      </section>
    </main>
  );
}
