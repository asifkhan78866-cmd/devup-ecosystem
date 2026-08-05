/**
 * A startup's logo, rendered so it stays legible wherever it lands.
 *
 * Two things go wrong when logos are dropped in as a plain `object-cover` img.
 * Partner marks are often wide wordmarks (StartupsIndia is 640×200), and
 * cropping one to a square tile leaves you looking at the middle four letters.
 * They are also frequently dark ink on transparency, which disappears against
 * the dark UI. So: contain rather than cover, on a white tile.
 *
 * Falls back to the first initial when there is no logo.
 */
export default function StartupLogo({
  src,
  name,
  className = "",
  rounded = "rounded-lg",
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
  rounded?: string;
}) {
  const initial = (name ?? "?").charAt(0).toUpperCase();

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-white/[0.06] text-[#8b8b8b] font-semibold ${rounded} ${className}`}
        aria-label={name ?? undefined}
      >
        {initial}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-white overflow-hidden ${rounded} ${className}`}>
      <img
        src={src}
        alt={name ?? ""}
        className="h-full w-full object-contain p-[8%]"
        loading="lazy"
      />
    </div>
  );
}
