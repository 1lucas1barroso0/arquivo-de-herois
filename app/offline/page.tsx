import { ArrowLeft, WifiOff } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "../../components/brand-mark";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <BrandMark />
      <WifiOff className="offline-hero-icon" />
      <p className="eyebrow">Sem conexão</p>
      <h1>O Arquivo de Heróis está offline</h1>
      <p>Se você já abriu a biblioteca neste dispositivo, volte e continue trabalhando. As alterações pendentes serão sincronizadas assim que a conexão retornar.</p>
      <Link className="button button-primary" href="/"><ArrowLeft /> Voltar à biblioteca</Link>
    </main>
  );
}
