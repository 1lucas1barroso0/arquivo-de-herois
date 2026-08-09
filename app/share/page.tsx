"use client";

import { ArrowLeft, LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "../../components/brand-mark";
import { SharedSheetViewer } from "../../components/shared-sheet-viewer";
import { useLocale } from "../../components/locale-provider";
import type { CharacterSheet } from "../../lib/character";
import { parsePortableShare } from "../../lib/portable-share";

export default function PortableSharedSheetPage() {
  const { t } = useLocale();
  const [sheet, setSheet] = useState<CharacterSheet | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void parsePortableShare(window.location.href)
      .then((value) => {
        if (value) setSheet(value);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);

  if (!sheet) {
    return (
      <main className="shared-page shared-missing-page">
        <header className="shared-topbar">
          <Link aria-label="Arquivo de Heróis" className="brand" href="/">
            <BrandMark />
            <span><strong>Arquivo de Heróis</strong></span>
          </Link>
        </header>
        <section className="shared-missing" aria-live="polite">
          <span className="shared-missing-icon">
            {failed ? <TriangleAlert /> : <LoaderCircle className="spin" />}
          </span>
          <h1>{t(failed ? "Não foi possível abrir esta ficha" : "Abrindo a ficha…")}</h1>
          {failed && (
            <>
              <p>{t("Confira se o endereço foi copiado por inteiro.")}</p>
              <Link className="button button-primary" href="/"><ArrowLeft /> {t("Ir para o Arquivo de Heróis")}</Link>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="shared-page">
      <header className="shared-topbar">
        <Link aria-label="Arquivo de Heróis" className="brand" href="/">
          <BrandMark />
          <span><strong>Arquivo de Heróis</strong></span>
        </Link>
        <Link className="button button-secondary compact" href="/"><ArrowLeft /> {t("Abrir arquivo")}</Link>
      </header>
      <SharedSheetViewer sheet={sheet} />
    </main>
  );
}
