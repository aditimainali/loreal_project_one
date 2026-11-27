import React, { useEffect, useRef, useState } from "react";
import {
  Cloud,
  ExternalLink,
  Globe,
  History,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ChatMessage, ChatSession, LanguageCode, Product } from "../types";
import { UI_COPY } from "../data/i18n";
import { FormattedMessage } from "./FormattedMessage";
import { ProductImage } from "./ProductImage";

interface AdvisorWorkspaceProps {
  language: LanguageCode;
  selectedProducts: Product[];
  messages: ChatMessage[];
  sessions: ChatSession[];
  activeSessionId: string;
  isLoading: boolean;
  errorMessage: string | null;
  webSearchEnabled: boolean;
  workerUrl: string;
  onUpdateWorkerUrl: (url: string) => void;
  onToggleWebSearch: () => void;
  onRemoveProduct: (id: number) => void;
  onClearProducts: () => void;
  onGenerateRoutine: () => void;
  onSendMessage: (text: string) => void;
  onResetChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearHistory: () => void;
  onRetry?: () => void;
}

export const AdvisorWorkspace: React.FC<AdvisorWorkspaceProps> = ({
  language,
  selectedProducts,
  messages,
  sessions,
  activeSessionId,
  isLoading,
  errorMessage,
  webSearchEnabled,
  workerUrl,
  onUpdateWorkerUrl,
  onToggleWebSearch,
  onRemoveProduct,
  onClearProducts,
  onGenerateRoutine,
  onSendMessage,
  onResetChat,
  onSelectSession,
  onDeleteSession,
  onClearHistory,
  onRetry,
}) => {
  const copy = UI_COPY[language];
  const [inputText, setInputText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showWorkerBar, setShowWorkerBar] = useState(false);
  const [workerDraft, setWorkerDraft] = useState(workerUrl);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWorkerDraft(workerUrl);
  }, [workerUrl]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    setInputText("");
    setShowHistory(false);
    onSendMessage(trimmed);
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = workerDraft.trim();
    if (!trimmed) {
      setWorkerError(null);
      onUpdateWorkerUrl("");
      setShowWorkerBar(false);
      return;
    }
    try {
      const parsed = new URL(trimmed);
      if (
        parsed.protocol !== "https:" &&
        !(parsed.protocol === "http:" && parsed.hostname === "localhost")
      ) {
        setWorkerError(copy.workerInvalidUrl);
        return;
      }
      setWorkerError(null);
      onUpdateWorkerUrl(parsed.toString());
      setShowWorkerBar(false);
    } catch {
      setWorkerError(copy.workerInvalidUrl);
    }
  };

  const formatSessionDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return "";
    }
  };

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-20">
      {/* Selected Products Panel */}
      <section
        id="selected-kit"
        className="rounded-lg border border-black/12 bg-white p-5"
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/8 pb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-2xl font-semibold text-[#111111]">
              {copy.selectedProductsTitle}
            </h2>
            <span className="tabular-nums text-xs font-semibold text-[#c8002e]">
              ({selectedProducts.length})
            </span>
          </div>

          {selectedProducts.length > 0 ? (
            <button
              type="button"
              onClick={onClearProducts}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 text-xs font-medium text-[#5c5955] transition-colors hover:text-[#c8002e] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{copy.clearAll}</span>
            </button>
          ) : null}
        </div>

        {selectedProducts.length === 0 ? (
          <p className="py-5 text-sm leading-relaxed text-[#5c5955]">
            {copy.emptySelectionText}
          </p>
        ) : (
          <ul className="mt-4 max-h-60 space-y-2.5 overflow-y-auto pe-1">
            {selectedProducts.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border border-black/8 bg-[#faf9f7] px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-white p-1">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      brand={item.brand}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#111111]">
                      {item.name}
                    </p>
                    <p className="truncate text-[11px] text-[#5c5955]">
                      {item.brand}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveProduct(item.id)}
                  aria-label={`${copy.removeFromRoutine} ${item.name}`}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-[#5c5955] transition-colors hover:bg-white hover:text-[#c8002e] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onGenerateRoutine}
          disabled={isLoading}
          className="mt-4 flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-md border-b-2 border-[#e3a535] bg-[#c8002e] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#ff003b] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff003b]"
        >
          <Sparkles className="h-4 w-4 text-[#e3a535]" aria-hidden="true" />
          <span>
            {isLoading ? copy.generatingRoutine : copy.generateRoutine}
          </span>
        </button>
      </section>

      {/* AI Beauty Advisor Chatbox */}
      <section
        id="advisor-section"
        className="flex flex-col overflow-hidden rounded-lg border border-black/12 bg-white"
      >
        {/* Chat Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/8 px-5 py-3.5">
          <h2 className="font-display text-2xl font-semibold text-[#111111]">
            {copy.advisorTitle}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              aria-pressed={showHistory}
              className={`inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-[#ff003b] ${
                showHistory
                  ? "border-[#ff003b] bg-[#fff5f7] text-[#c8002e]"
                  : "border-black/12 bg-white text-[#5c5955] hover:border-black/25 hover:text-[#111111]"
              }`}
            >
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{copy.historyLabel}</span>
              {sessions.length > 0 ? (
                <span className="tabular-nums text-[11px]">
                  ({sessions.length})
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setShowWorkerBar((prev) => !prev)}
              aria-pressed={showWorkerBar || Boolean(workerUrl)}
              className={`inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-[#ff003b] ${
                workerUrl
                  ? "border-[#e3a535] bg-[#fdf8ed] text-[#785108]"
                  : showWorkerBar
                    ? "border-[#ff003b] bg-[#fff5f7] text-[#c8002e]"
                    : "border-black/12 bg-white text-[#5c5955] hover:border-black/25 hover:text-[#111111]"
              }`}
            >
              <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{copy.workerLabel}</span>
            </button>

            <button
              type="button"
              onClick={onToggleWebSearch}
              aria-pressed={webSearchEnabled}
              className={`inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-[#ff003b] ${
                webSearchEnabled
                  ? "border-[#e3a535] bg-[#fdf8ed] text-[#785108]"
                  : "border-black/12 bg-white text-[#5c5955] hover:text-[#111111]"
              }`}
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{copy.webSearchLabel}</span>
            </button>

            {messages.length > 0 || showHistory ? (
              <button
                type="button"
                onClick={() => {
                  setShowHistory(false);
                  onResetChat();
                }}
                className="inline-flex min-h-[34px] cursor-pointer items-center gap-1 rounded-md border border-black/12 px-2.5 py-1 text-xs font-medium text-[#5c5955] whitespace-nowrap transition-colors hover:border-black/25 hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copy.resetChat}</span>
              </button>
            ) : null}
          </div>
        </div>

        {showWorkerBar ? (
          <form
            onSubmit={handleSaveWorker}
            className="border-b border-black/8 bg-[#faf9f7] px-5 py-3"
          >
            <p className="mb-2 text-[11px] font-medium text-[#5c5955]">
              {workerUrl ? copy.workerActiveHint : copy.workerDefaultHint}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="url"
                dir="ltr"
                value={workerDraft}
                onChange={(e) => {
                  setWorkerDraft(e.target.value);
                  setWorkerError(null);
                }}
                placeholder={copy.workerUrlPlaceholder}
                aria-label={copy.workerUrlPlaceholder}
                className="min-h-[36px] min-w-[200px] flex-1 rounded-md border border-black/15 bg-white px-3 text-xs text-[#111111] placeholder:text-[#78746f] focus:border-[#ff003b] focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[36px] cursor-pointer rounded-md bg-[#111111] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#c8002e]"
              >
                {copy.workerSave}
              </button>
              {workerUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setWorkerDraft("");
                    setWorkerError(null);
                    onUpdateWorkerUrl("");
                    setShowWorkerBar(false);
                  }}
                  className="min-h-[36px] cursor-pointer rounded-md border border-black/15 bg-white px-3 py-1.5 text-xs font-medium text-[#5c5955] transition-colors hover:text-[#111111]"
                >
                  {copy.workerClear}
                </button>
              ) : null}
            </div>
            {workerError ? (
              <p className="mt-1.5 text-[11px] font-medium text-[#c8002e]">
                {workerError}
              </p>
            ) : null}
          </form>
        ) : null}

        {/* Chat Messages or Previous Chats View */}
        <div
          ref={chatScrollRef}
          className="h-[380px] space-y-4 overflow-y-auto bg-[#faf9f7] p-5"
          aria-live="polite"
        >
          {showHistory ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-black/8 pb-2.5">
                <h3 className="font-display text-lg font-semibold text-[#111111]">
                  {copy.historyTitle}
                </h3>
                {sessions.length > 0 ? (
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#5c5955] transition-colors hover:text-[#c8002e] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{copy.clearHistory}</span>
                  </button>
                ) : null}
              </div>

              {sessions.length === 0 ? (
                <p className="rounded-lg border border-black/8 bg-white p-4 text-sm leading-relaxed text-[#5c5955]">
                  {copy.historyEmpty}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {sessions.map((session) => {
                    const isCurrent = session.id === activeSessionId;
                    return (
                      <li key={session.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            onSelectSession(session.id);
                            setShowHistory(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelectSession(session.id);
                              setShowHistory(false);
                            }
                          }}
                          className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#ff003b] ${
                            isCurrent
                              ? "border-[#ff003b] bg-[#fff9fa]"
                              : "border-black/10 bg-white hover:border-[#e3a535]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#111111]">
                              {session.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 tabular-nums text-[11px] text-[#5c5955]">
                              {isCurrent ? (
                                <>
                                  <span className="font-semibold text-[#c8002e]">
                                    {copy.activeChatLabel}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                </>
                              ) : null}
                              <span>
                                {copy.messagesCount(session.messages.length)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{formatSessionDate(session.updatedAt)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            aria-label={`${copy.deleteChat}: ${session.title}`}
                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-[#5c5955] transition-colors hover:bg-[#faf9f7] hover:text-[#c8002e] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col justify-between">
              <div className="rounded-lg border border-black/8 bg-white p-4">
                <h3 className="font-display text-lg font-semibold text-[#111111]">
                  {copy.advisorWelcomeTitle}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5c5955]">
                  {copy.advisorWelcomeBody}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {copy.quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onSendMessage(prompt)}
                    disabled={isLoading}
                    className="block w-full cursor-pointer rounded-md border border-black/10 bg-white px-3.5 py-2.5 text-start text-xs font-medium text-[#111111] transition-colors hover:border-[#e3a535] hover:bg-[#fdfaf2] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[92%] rounded-lg px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#111111] text-sm leading-relaxed text-white"
                      : "border border-black/10 bg-white text-[#111111]"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <FormattedMessage content={msg.content} />
                  )}

                  {msg.sources && msg.sources.length > 0 ? (
                    <div className="mt-3 border-t border-black/8 pt-2.5">
                      <p className="mb-1.5 text-[11px] font-semibold text-[#5c5955]">
                        {copy.sourcesLabel}
                      </p>
                      <ul className="space-y-1">
                        {msg.sources.slice(0, 5).map((source) => (
                          <li key={source.uri}>
                            <a
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex max-w-full items-center gap-1.5 text-xs text-[#c8002e] underline decoration-[#e3a535] underline-offset-2 hover:text-[#ff003b]"
                            >
                              <ExternalLink
                                className="h-3 w-3 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="truncate">{source.title}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {msg.searchFallback ? (
                    <p className="mt-2.5 border-t border-black/8 pt-2 text-[11px] text-[#5c5955]">
                      {copy.searchFallbackNote}
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}

          {isLoading ? (
            <div className="flex items-start">
              <div className="rounded-lg border border-black/10 bg-white px-4 py-3 text-xs font-medium text-[#5c5955]">
                {copy.thinkingLabel}
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#ff003b]/40 bg-[#fff5f7] px-3.5 py-2.5 text-xs font-medium text-[#9e0024]"
            >
              <span className="flex-1 leading-relaxed">{errorMessage}</span>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isLoading}
                  className="shrink-0 cursor-pointer rounded border border-[#ff003b]/40 bg-white px-2.5 py-1 text-xs font-semibold text-[#c8002e] transition-colors hover:bg-[#ffe8ed] focus-visible:outline-2 focus-visible:outline-[#ff003b]"
                >
                  {copy.retryLabel}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2.5 border-t border-black/8 bg-white p-3.5"
        >
          <label htmlFor="advisor-input" className="sr-only">
            {copy.askPlaceholder}
          </label>
          <input
            id="advisor-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={copy.askPlaceholder}
            disabled={isLoading}
            className="min-h-[42px] flex-1 rounded-md border border-black/15 bg-[#faf9f7] px-3.5 text-sm text-[#111111] placeholder:text-[#78746f] focus:border-[#ff003b] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || inputText.trim().length === 0}
            aria-label={copy.sendLabel}
            className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-md bg-[#111111] text-white transition-colors duration-150 hover:bg-[#c8002e] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff003b]"
          >
            <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </form>
      </section>
    </aside>
  );
};
