import React from "react";
import { LanguageCode } from "../types";
import { UI_COPY } from "../data/i18n";

interface HeaderProps {
  language: LanguageCode;
  selectedCount: number;
  onJumpToAdvisor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  selectedCount,
  onJumpToAdvisor,
}) => {
  const copy = UI_COPY[language];

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#faf9f7]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-6 py-4">
        <a
          href="#top"
          className="font-display text-2xl font-bold tracking-[0.16em] text-[#111111] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff003b]"
        >
          L&rsquo;ORÉAL
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5c5955]"
        >
          <a
            href="#catalog-section"
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-[#ff003b] hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff003b]"
          >
            {copy.navCatalog}
          </a>
          <a
            href="#selected-kit"
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-[#ff003b] hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff003b]"
          >
            {copy.navRoutine}
          </a>
          <a
            href="#advisor-section"
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-[#ff003b] hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff003b]"
          >
            {copy.navAdvisor}
          </a>
          <a
            href="#brands-section"
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-[#ff003b] hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff003b]"
          >
            {copy.navBrands}
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onJumpToAdvisor}
            className="whitespace-nowrap shrink-0 cursor-pointer rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold tracking-wide text-white transition-colors duration-150 hover:bg-[#c8002e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff003b]"
          >
            {copy.headerCta}
            {selectedCount > 0 ? (
              <span className="ms-1.5 tabular-nums text-[#e3a535]">
                ({selectedCount})
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
};
