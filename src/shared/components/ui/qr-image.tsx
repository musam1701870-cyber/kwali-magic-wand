import { useEffect, useState } from "react";
import { qrDataUrl } from "@/shared/lib/qr";

/**
 * On-screen QR code. Renders nothing until the code is generated, so it never
 * flashes a placeholder that looks like a scannable code but isn't.
 */
export function QrImage({
  value,
  size = 176,
  className,
  alt = "QR code",
}: {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    qrDataUrl(value, size * 2)
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => {
        if (alive) setSrc(null);
      });
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`animate-pulse rounded-lg bg-secondary ${className ?? ""}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-lg ${className ?? ""}`}
    />
  );
}
