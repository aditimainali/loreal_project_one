import React, { useState } from "react";
import { ArrowDown } from "lucide-react";
import { LanguageCode } from "../types";
import { UI_COPY } from "../data/i18n";

interface HeroProps {
  language: LanguageCode;
}

export const Hero: React.FC<HeroProps> = ({ language }) => {
  const copy = UI_COPY[language];
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section
      id="top"
      className="border-b border-black/10 bg-[#faf9f7]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-stretch gap-8 px-6 py-10 lg:grid-cols-12 lg:py-12">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="mb-3 text-xs font-medium tracking-[0.14em] text-[#5c5955] uppercase">
            {copy.heroKicker}
          </p>
          <div className="mb-5 h-[2px] w-14 bg-gradient-to-r from-[#ff003b] to-[#e3a535]" />
          <h1
            className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-[#111111] sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            {copy.heroTitle}
          </h1>
          <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-[#5c5955]">
            {copy.heroSubtitle}
          </p>
          <div className="mt-7 flex items-center gap-4">
            <a
              href="#catalog-section"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-[#c8002e] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#ff003b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff003b]"
            >
              <span>{copy.heroButton}</span>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative h-full min-h-[240px] overflow-hidden rounded-lg border border-black/10 bg-[#efece6]">
            {!imgFailed ? (
              <img
                src="/src/assets/images/hero_loreal_atelier_1795753337183.jpg"
                alt={copy.heroImageAlt}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover lg:aspect-[16/9]"
              />
            ) : (
              <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center bg-gradient-to-br from-[#f3efe8] via-[#eae3d7] to-[#dfd5c5] p-8 text-center">
                <span className="font-display text-3xl font-semibold tracking-[0.2em] text-[#111111]">
                  L&rsquo;ORÉAL
                </span>
                <span className="mt-2 text-xs tracking-[0.14em] text-[#5c5955] uppercase">
                  Smart Routine Atelier
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
