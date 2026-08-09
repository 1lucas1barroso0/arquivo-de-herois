import { ArrowLeft, Link2Off } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "../../../components/print-button";
import { getSharedCharacter } from "../../../db/characters";
import { BrandMark } from "../../../components/brand-mark";
import { SharedSheetViewer } from "../../../components/shared-sheet-viewer";

export const dynamic = "force-dynamic";

export default async function SharedSheetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sheet = await getSharedCharacter(token);

  if (!sheet) {
    return (
      <main className="shared-page shared-missing-page">
        <header className="shared-topbar">
          <Link aria-label="Arquivo de Heróis" className="brand" href="/">
            <BrandMark />
            <span><strong>Arquivo de Heróis</strong></span>
          </Link>
        </header>
        <section className="shared-missing">
          <span className="shared-missing-icon"><Link2Off /></span>
          <p className="eyebrow">Endereço não reconhecido</p>
          <h1>Esta ficha não foi encontrada</h1>
          <p>Confira se o endereço foi copiado por inteiro. Links publicados pelo Arquivo de Heróis são permanentes e não expiram.</p>
          <Link className="button button-primary" href="/"><ArrowLeft /> Ir para o Arquivo de Heróis</Link>
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
        <div>
          <Link className="button button-secondary compact" href="/"><ArrowLeft /> Abrir arquivo</Link>
          <PrintButton />
        </div>
      </header>
      <SharedSheetViewer sheet={sheet} />
    </main>
  );
}
