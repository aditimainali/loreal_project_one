import React, { useEffect, useMemo, useState } from "react";
import { Languages, Search, X } from "lucide-react";
import {
  CategoryId,
  ChatMessage,
  ChatSession,
  LanguageCode,
  Product,
} from "./types";
import { FEATURED_BRANDS, PRODUCTS } from "./data/products";
import { CATEGORY_OPTIONS, UI_COPY } from "./data/i18n";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { AdvisorWorkspace } from "./components/AdvisorWorkspace";
import { buildAdvisorSystemPrompt } from "./utils/advisorPrompt";

const STORAGE_KEY_SELECTED = "loreal_selected_product_ids";
const STORAGE_KEY_LANG = "loreal_ui_language";
const STORAGE_KEY_CHATS = "loreal_chat_sessions_v1";
const STORAGE_KEY_ACTIVE_CHAT = "loreal_active_chat_id_v1";
const STORAGE_KEY_WORKER_URL = "loreal_cloudflare_worker_url_v1";

function readInitialSelectedIds(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SELECTED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(PRODUCTS.map((p) => p.id));
    return parsed.filter(
      (id): id is number => typeof id === "number" && validIds.has(id)
    );
  } catch {
    return [];
  }
}

function readInitialLanguage(): LanguageCode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_LANG);
    return raw === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

function readInitialSessions(): ChatSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CHATS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is ChatSession =>
        Boolean(s) &&
        typeof s.id === "string" &&
        typeof s.title === "string" &&
        Array.isArray(s.messages)
    );
  } catch {
    return [];
  }
}

function readInitialActiveSessionId(sessions: ChatSession[]): string {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ACTIVE_CHAT);
    if (raw && sessions.some((s) => s.id === raw)) {
      return raw;
    }
  } catch {
    // Ignore storage errors
  }
  return `chat-${Date.now()}`;
}

function readInitialWorkerUrl(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY_WORKER_URL);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // Ignore storage errors
  }
  const envUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
  return typeof envUrl === "string" ? envUrl.trim() : "";
}

export default function App() {
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    readInitialSelectedIds()
  );
  const [language, setLanguage] = useState<LanguageCode>(() =>
    readInitialLanguage()
  );
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(
    null
  );

  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    readInitialSessions()
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(() =>
    readInitialActiveSessionId(readInitialSessions())
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialSessions = readInitialSessions();
    const activeId = readInitialActiveSessionId(initialSessions);
    return initialSessions.find((s) => s.id === activeId)?.messages || [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [workerUrl, setWorkerUrl] = useState<string>(() =>
    readInitialWorkerUrl()
  );

  const copy = UI_COPY[language];

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY_SELECTED,
        JSON.stringify(selectedIds)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [selectedIds]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch {
      // Ignore storage quota errors
    }
  }, [language]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(sessions));
      window.localStorage.setItem(STORAGE_KEY_ACTIVE_CHAT, activeSessionId);
    } catch {
      // Ignore storage quota errors
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    try {
      if (workerUrl) {
        window.localStorage.setItem(STORAGE_KEY_WORKER_URL, workerUrl);
      } else {
        window.localStorage.removeItem(STORAGE_KEY_WORKER_URL);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [workerUrl]);

  const deriveSessionTitle = (
    chatMessages: ChatMessage[],
    kitProducts: Product[]
  ) => {
    const firstUser = chatMessages.find((m) => m.role === "user")?.content || "";
    const isRoutineRequest =
      firstUser.includes("ONLY the following selected products") ||
      firstUser.includes("باستخدام المنتجات المختارة التالية فقط");

    if (isRoutineRequest && kitProducts.length > 0) {
      const lead = kitProducts[0].name;
      return kitProducts.length > 1
        ? `${copy.routineTitlePrefix}: ${lead} (+${kitProducts.length - 1})`
        : `${copy.routineTitlePrefix}: ${lead}`;
    }

    const clean = firstUser.replace(/\s+/g, " ").trim();
    if (!clean) return `${copy.routineTitlePrefix}`;
    return clean.length > 52 ? `${clean.slice(0, 49)}...` : clean;
  };

  useEffect(() => {
    if (messages.length === 0) return;

    setSessions((prev) => {
      const existing = prev.find((s) => s.id === activeSessionId);
      const updatedSession: ChatSession = {
        id: activeSessionId,
        title:
          existing?.title && existing.messages.length > 0
            ? existing.title
            : deriveSessionTitle(messages, selectedProducts),
        messages,
        productIds:
          existing?.productIds && existing.productIds.length > 0
            ? existing.productIds
            : selectedIds,
        updatedAt: new Date().toISOString(),
      };
      const others = prev.filter((s) => s.id !== activeSessionId);
      return [updatedSession, ...others].slice(0, 25);
    });
  }, [messages, activeSessionId]);

  const selectedProducts = useMemo(() => {
    const idSet = new Set(selectedIds);
    return PRODUCTS.filter((p) => idSet.has(p.id));
  }, [selectedIds]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRemoveProduct = (id: number) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleClearProducts = () => {
    setSelectedIds([]);
  };

  const handleJumpToAdvisor = () => {
    const target = document.getElementById("selected-kit");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sendAdvisorRequest = async (nextMessages: ChatMessage[]) => {
    setIsLoading(true);
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const targetUrl = workerUrl.trim() || "/api/advisor";
      const isWorkerDirect = Boolean(workerUrl.trim());

      const payload = isWorkerDirect
        ? {
            model: "gpt-4.1",
            webSearchEnabled,
            messages: [
              {
                role: "system",
                content: buildAdvisorSystemPrompt(selectedProducts, language),
              },
              ...nextMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            ],
          }
        : {
            messages: nextMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            selectedProducts: selectedProducts.map((p) => ({
              id: p.id,
              brand: p.brand,
              name: p.name,
              category: p.category,
              description: p.description,
            })),
            webSearchEnabled,
            language,
          };

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      let data: {
        choices?: Array<{ message?: { content?: string } }>;
        reply?: string;
        sources?: Array<{ title: string; uri: string }>;
        searchFallback?: boolean;
        error?: string | { message?: string };
      } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ||
              `Request failed (${response.status}). Please try again.`;
        throw new Error(errMsg);
      }

      const contentText =
        data.choices?.[0]?.message?.content?.trim() ||
        data.reply?.trim() ||
        "No response received. Please try again.";

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: contentText,
        sources: Array.isArray(data.sources) ? data.sources : [],
        searchFallback: Boolean(data.searchFallback),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setErrorMessage(
          "The request timed out while contacting the advisor. Please click Retry."
        );
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Something went wrong while contacting the beauty advisor."
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleGenerateRoutine = async () => {
    if (selectedProducts.length === 0) {
      setErrorMessage(copy.selectFirstPrompt);
      return;
    }

    const summary = selectedProducts
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.brand} — ${p.name} (${p.category}): ${p.description}`
      )
      .join("\n");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: copy.routinePrompt(summary),
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    await sendAdvisorRequest(nextMessages);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    await sendAdvisorRequest(nextMessages);
  };

  const handleResetChat = () => {
    const freshId = `chat-${Date.now()}`;
    setActiveSessionId(freshId);
    setMessages([]);
    setErrorMessage(null);
  };

  const handleSelectSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;
    setActiveSessionId(target.id);
    setMessages(target.messages);
    setErrorMessage(null);
    if (Array.isArray(target.productIds) && target.productIds.length > 0) {
      const validIds = new Set(PRODUCTS.map((p) => p.id));
      setSelectedIds(target.productIds.filter((id) => validIds.has(id)));
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (sessionId === activeSessionId) {
      setActiveSessionId(`chat-${Date.now()}`);
      setMessages([]);
      setErrorMessage(null);
    }
  };

  const handleClearHistory = () => {
    setSessions([]);
    setActiveSessionId(`chat-${Date.now()}`);
    setMessages([]);
    setErrorMessage(null);
  };

  const handleRetryLastRequest = async () => {
    if (messages.length === 0 || isLoading) return;
    await sendAdvisorRequest(messages);
  };

  const handleBrandFilter = (brand: string) => {
    setSelectedCategory("all");
    setSearchQuery(brand);
    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#111111]">
      <Header
        language={language}
        selectedCount={selectedProducts.length}
        onJumpToAdvisor={handleJumpToAdvisor}
      />

      <main>
        <Hero language={language} />

        {/* Catalog + Routine Workspace */}
        <section
          id="catalog-section"
          className="mx-auto max-w-[1280px] px-6 py-10"
        >
          {/* Toolbar */}
          <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-[#111111]">
                {copy.catalogTitle}
              </h2>
              <p className="mt-1 tabular-nums text-xs font-medium text-[#5c5955]">
                {copy.productsCount(filteredProducts.length)}
              </p>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-3 md:justify-end">
              {/* Product Search */}
              <div className="relative min-w-[220px] flex-1 md:max-w-xs">
                <Search
                  className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-[#5c5955]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  aria-label={copy.searchPlaceholder}
                  className="min-h-[42px] w-full rounded-md border border-black/15 bg-white ps-10 pe-9 text-sm text-[#111111] placeholder:text-[#78746f] focus:border-[#ff003b] focus:outline-none"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={copy.clearSearch}
                    className="absolute top-1/2 end-2.5 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[#5c5955] hover:text-[#111111]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {/* Category Filter */}
              <div className="min-w-[190px]">
                <label htmlFor="categoryFilter" className="sr-only">
                  {copy.categoryLabel}
                </label>
                <select
                  id="categoryFilter"
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as CategoryId)
                  }
                  className="min-h-[42px] w-full cursor-pointer rounded-md border border-black/15 bg-white px-3.5 text-sm font-medium text-[#111111] focus:border-[#ff003b] focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat[language]}
                    </option>
                  ))}
                </select>
              </div>

              {/* RTL / Language Toggle */}
              <button
                type="button"
                onClick={() =>
                  setLanguage((prev) => (prev === "en" ? "ar" : "en"))
                }
                className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-md border border-black/15 bg-white px-3.5 text-xs font-semibold text-[#111111] whitespace-nowrap transition-colors hover:border-[#e3a535] hover:bg-[#fdfaf2] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
              >
                <Languages
                  className="h-4 w-4 text-[#c8002e]"
                  aria-hidden="true"
                />
                <span>{copy.directionLabel}</span>
              </button>
            </div>
          </div>

          {/* Main 12-Col Grid */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Products Column */}
            <div className="lg:col-span-7">
              {filteredProducts.length === 0 ? (
                <div className="rounded-lg border border-black/10 bg-white p-10 text-center">
                  <h3 className="font-display text-2xl font-semibold text-[#111111]">
                    {copy.noResultsTitle}
                  </h3>
                  <p className="mt-2 text-sm text-[#5c5955]">
                    {copy.noResultsBody}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="mt-5 cursor-pointer rounded-md bg-[#111111] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#c8002e]"
                  >
                    {copy.resetFilters}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSelected={selectedIds.includes(product.id)}
                      language={language}
                      onToggleSelect={handleToggleSelect}
                      onOpenDetails={(p) => setActiveModalProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Selected Products & Advisor Column */}
            <div className="lg:col-span-5">
              <AdvisorWorkspace
                language={language}
                selectedProducts={selectedProducts}
                messages={messages}
                sessions={sessions}
                activeSessionId={activeSessionId}
                isLoading={isLoading}
                errorMessage={errorMessage}
                webSearchEnabled={webSearchEnabled}
                workerUrl={workerUrl}
                onUpdateWorkerUrl={setWorkerUrl}
                onToggleWebSearch={() => setWebSearchEnabled((prev) => !prev)}
                onRemoveProduct={handleRemoveProduct}
                onClearProducts={handleClearProducts}
                onGenerateRoutine={handleGenerateRoutine}
                onSendMessage={handleSendMessage}
                onResetChat={handleResetChat}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                onClearHistory={handleClearHistory}
                onRetry={
                  messages.length > 0 &&
                  messages[messages.length - 1]?.role === "user"
                    ? handleRetryLastRequest
                    : undefined
                }
              />
            </div>
          </div>
        </section>

        {/* Brands Section */}
        <section
          id="brands-section"
          className="border-t border-black/10 bg-white py-12"
        >
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-display text-3xl font-semibold text-[#111111]">
                  {copy.brandsTitle}
                </h2>
                <p className="mt-1 max-w-[60ch] text-sm text-[#5c5955]">
                  {copy.brandsSubtitle}
                </p>
              </div>
              <div className="h-[2px] w-16 bg-gradient-to-r from-[#ff003b] to-[#e3a535]" />
            </div>

            <div className="flex flex-wrap gap-2.5">
              {FEATURED_BRANDS.map((brand) => {
                const isActive =
                  searchQuery.trim().toLowerCase() === brand.toLowerCase();
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() =>
                      isActive ? setSearchQuery("") : handleBrandFilter(brand)
                    }
                    className={`cursor-pointer rounded-md border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-[#ff003b] ${
                      isActive
                        ? "border-[#ff003b] bg-[#c8002e] text-white"
                        : "border-black/12 bg-[#faf9f7] text-[#111111] hover:border-[#e3a535]"
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-[#faf9f7] py-8">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 text-xs text-[#5c5955] sm:flex-row">
          <p>{copy.footerCopyright}</p>
          <nav aria-label="Footer" className="flex items-center gap-6">
            <a
              href="#catalog-section"
              className="hover:text-[#111111] hover:underline"
            >
              {copy.navCatalog}
            </a>
            <a
              href="#selected-kit"
              className="hover:text-[#111111] hover:underline"
            >
              {copy.navRoutine}
            </a>
            <a
              href="#advisor-section"
              className="hover:text-[#111111] hover:underline"
            >
              {copy.navAdvisor}
            </a>
          </nav>
        </div>
      </footer>

      <ProductModal
        product={activeModalProduct}
        isSelected={
          activeModalProduct
            ? selectedIds.includes(activeModalProduct.id)
            : false
        }
        language={language}
        onClose={() => setActiveModalProduct(null)}
        onToggleSelect={handleToggleSelect}
      />
    </div>
  );
}
