import React from "react";
import { Check, Info } from "lucide-react";
import { LanguageCode, Product } from "../types";
import { getCategoryLabel, UI_COPY } from "../data/i18n";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  language: LanguageCode;
  onToggleSelect: (id: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  language,
  onToggleSelect,
  onOpenDetails,
}) => {
  const copy = UI_COPY[language];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleSelect(product.id);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onToggleSelect(product.id)}
      onKeyDown={handleKeyDown}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff003b] ${
        isSelected
          ? "border-2 border-[#ff003b] bg-[#fff9fa] shadow-sm"
          : "border border-black/10 bg-white hover:-translate-y-0.5 hover:border-black/25 hover:shadow-md"
      }`}
    >
      {/* Image Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f5f4f1] p-4">
        <ProductImage
          src={product.image}
          alt={`${product.brand} ${product.name}`}
          brand={product.brand}
          className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
        />

        {/* Selection status indicator (text + icon, never hue-only) */}
        <div
          className={`absolute top-3 end-3 inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-opacity duration-150 ${
            isSelected
              ? "bg-[#c8002e] text-white opacity-100"
              : "bg-white/90 text-[#5c5955] opacity-0 group-hover:opacity-100"
          }`}
        >
          {isSelected ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#e3a535]" aria-hidden="true" />
              <span>{copy.selectedLabel}</span>
            </>
          ) : (
            <span>{copy.selectHint}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#5c5955]">
            <span>{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{getCategoryLabel(product.category, language)}</span>
          </div>

          <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-[#111111]">
            {product.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#5c5955]">
            {product.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#111111] underline decoration-[#e3a535] decoration-2 underline-offset-4 transition-colors hover:text-[#c8002e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff003b]"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{copy.viewDetails}</span>
          </button>

          <span
            className={`text-xs font-semibold ${
              isSelected ? "text-[#c8002e]" : "text-[#5c5955]"
            }`}
          >
            {isSelected ? copy.removeFromRoutine : copy.addToRoutine}
          </span>
        </div>
      </div>
    </article>
  );
};
