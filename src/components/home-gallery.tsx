import Image from "next/image";
import { getTranslations } from "next-intl/server";

const PHOTOS = [
  { src: "/gallery1.webp", altKey: "galleryAlt1", featured: true },
  { src: "/Gallery3.webp", altKey: "galleryAlt2", featured: false },
  { src: "/gallery4.webp", altKey: "galleryAlt3", featured: false },
  { src: "/gallery2.webp", altKey: "galleryAlt4", featured: false },
  { src: "/gallery5.webp", altKey: "galleryAlt5", featured: false },
] as const;

export default async function HomeGallery() {
  const t = await getTranslations("Home");

  return (
    <section className="home-gallery" aria-labelledby="home-gallery-title">
      <h2 id="home-gallery-title" className="visually-hidden">
        {t("galleryTitle")}
      </h2>
      <div className="home-gallery-grid">
        {PHOTOS.map((photo) => (
          <div
            key={photo.src}
            className={`home-gallery-tile${photo.featured ? " featured" : ""}`}
          >
            <Image
              src={photo.src}
              alt={t(photo.altKey)}
              fill
              quality={90}
              sizes={
                photo.featured
                  ? "(min-width: 861px) 560px, 100vw"
                  : "(min-width: 861px) 275px, 50vw"
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
