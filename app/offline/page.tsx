"use client";

import { ArrowLeft, WifiOff } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "../../components/brand-mark";
import { useLocale } from "../../components/locale-provider";

export default function OfflinePage() {
  const { t } = useLocale();
  return (
    <main className="offline-page">
      <BrandMark />
      <WifiOff className="offline-hero-icon" />
      <p className="eyebrow">{t("Sem conexão")}</p>
      <h1>{t("O Arquivo de Heróis está offline")}</h1>
      <p>{t("Se você já abriu a biblioteca neste dispositivo, volte e continue trabalhando. As alterações pendentes serão sincronizadas assim que a conexão retornar.")}</p>
      <Link className="button button-primary" href="/"><ArrowLeft /> {t("Voltar à biblioteca")}</Link>
    </main>
  );
}
