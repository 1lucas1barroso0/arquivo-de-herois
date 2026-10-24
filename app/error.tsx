"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { BrandMark } from "../components/brand-mark";
import { useLocale } from "../components/locale-provider";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useLocale();
  return (
    <main className="offline-page">
      <BrandMark />
      <TriangleAlert className="offline-hero-icon" />
      <p className="eyebrow">{t("Algo interrompeu o carregamento")}</p>
      <h1>{t("Seu arquivo continua protegido")}</h1>
      <p>{t("Os dados persistidos não foram apagados. Tente carregar a interface novamente; se houver uma alteração offline, ela continuará aguardando sincronização neste dispositivo.")}</p>
      <button className="button button-primary" type="button" onClick={reset}><RefreshCw /> {t("Tentar novamente")}</button>
    </main>
  );
}
