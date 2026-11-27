import React, { useEffect } from "react";
import { Check, Plus, X } from "lucide-react";
import { LanguageCode, Product } from "../types";
import { getCategoryLabel, UI_COPY } from "../data/i18n";
import { ProductImage } from "./ProductImage";

interface ProductModalProps {
  product: Product | null;
  isSelected: boolean;
  language: LanguageCode;
  onClose: () => void;
  onToggleSelect: (id: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isSelected,
  language,
  onClose,
  onToggleSelect,
}) => {
  const copy = UI_COPY[language];

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-black/15 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.modalClose}
          className="absolute top-4 end-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#111111] transition-colors hover:border-[#ff003b] hover:text-[#c8002e] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-12">
          <div className="flex items-center justify-center bg-[#f5f4f1] p-6 sm:col-span-5">
            <ProductImage
              src={product.image}
              alt={`${product.brand} ${product.name}`}
              brand={product.brand}
              className="h-48 w-full object-contain sm:h-56"
            />
          </div>

          <div className="flex flex-col justify-between p-6 sm:col-span-7">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#5c5955]">
                <span>{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{getCategoryLabel(product.category, language)}</span>
              </div>
              <h2
                id="product-modal-title"
                className="mt-2 font-display text-2xl font-semibold leading-tight text-[#111111]"
              >
                {product.name}
              </h2>
              <div className="my-3 h-[2px] w-10 bg-[#e3a535]" />
              <p className="text-sm leading-relaxed text-[#3a3835]">
                {product.description}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onToggleSelect(product.id)}
                className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff003b] ${
                  isSelected
                    ? "border border-[#ff003b] bg-[#fff5f7] text-[#c8002e] hover:bg-[#ffe8ed]"
                    : "bg-[#c8002e] text-white hover:bg-[#ff003b]"
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>{copy.removeFromRoutine}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>{copy.addToRoutine}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-md border border-black/15 px-4 py-2.5 text-sm font-medium text-[#111111] transition-colors hover:bg-[#f3f1ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff003b]"
              >
                {copy.modalClose}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
