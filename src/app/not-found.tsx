import Image from "next/image";
import Link from "next/link";

// Unknown URLs outside any locale land here, so the copy is bilingual and static.
export default function RootNotFound() {
  return (
    <main id="main-content" className="site-shell">
      <section className="status-band full-bleed" aria-labelledby="root-not-found-title">
        <div className="status-inner">
          <Image
            className="status-mascot"
            src="/mascot_logo.webp"
            alt=""
            width={112}
            height={112}
            priority
          />
          <h1 id="root-not-found-title">We couldn’t find that page</h1>
          <p>Não encontrámos essa página.</p>
          <div className="status-actions">
            <Link className="btn btn-primary" href="/en">
              Back to home
            </Link>
            <Link className="btn btn-secondary" href="/pt">
              Voltar ao início
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
