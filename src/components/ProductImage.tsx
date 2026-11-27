import React, { useState } from "react";
import { Sparkles } from "lucide-react";

interface ProductImageProps {
  src: string;
  alt: string;
  brand: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  brand,
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#f6f4f0] to-[#eae5dc] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="mb-2 h-6 w-6 text-[#e3a535]" aria-hidden="true" />
        <span className="font-display text-base font-semibold tracking-wider text-[#111111]">
          {brand}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
