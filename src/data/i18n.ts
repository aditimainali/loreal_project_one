import { CategoryId, LanguageCode } from "../types";

export const CATEGORY_OPTIONS: Array<{
  id: CategoryId;
  en: string;
  ar: string;
}> = [
  { id: "all", en: "All Categories", ar: "جميع الفئات" },
  { id: "cleanser", en: "Cleansers", ar: "الغسول والمنظفات" },
  { id: "moisturizer", en: "Moisturizers", ar: "المرطبات" },
  { id: "skincare", en: "Serums & Treatments", ar: "السيروم والعناية بالبشرة" },
  { id: "suncare", en: "Suncare", ar: "الوقاية من الشمس" },
  { id: "haircare", en: "Haircare", ar: "العناية بالشعر" },
  { id: "hair color", en: "Hair Color", ar: "صبغة الشعر" },
  { id: "hair styling", en: "Hair Styling", ar: "تصفيف الشعر" },
  { id: "makeup", en: "Makeup", ar: "المكياج" },
  { id: "men's grooming", en: "Men's Grooming", ar: "العناية للرجال" },
  { id: "fragrance", en: "Fragrance", ar: "العطور" },
];

export function getCategoryLabel(category: CategoryId, lang: LanguageCode): string {
  const match = CATEGORY_OPTIONS.find((c) => c.id === category);
  return match ? match[lang] : category;
}

export const UI_COPY: Record<
  LanguageCode,
  {
    navCatalog: string;
    navRoutine: string;
    navAdvisor: string;
    navBrands: string;
    headerCta: string;
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    heroButton: string;
    heroImageAlt: string;
    catalogTitle: string;
    searchPlaceholder: string;
    clearSearch: string;
    categoryLabel: string;
    productsCount: (n: number) => string;
    noResultsTitle: string;
    noResultsBody: string;
    resetFilters: string;
    selectedLabel: string;
    selectHint: string;
    viewDetails: string;
    removeFromRoutine: string;
    addToRoutine: string;
    selectedProductsTitle: string;
    clearAll: string;
    emptySelectionText: string;
    generateRoutine: string;
    generatingRoutine: string;
    advisorTitle: string;
    webSearchLabel: string;
    resetChat: string;
    advisorWelcomeTitle: string;
    advisorWelcomeBody: string;
    askPlaceholder: string;
    sendLabel: string;
    thinkingLabel: string;
    sourcesLabel: string;
    brandsTitle: string;
    brandsSubtitle: string;
    footerCopyright: string;
    privacy: string;
    terms: string;
    contact: string;
    modalClose: string;
    selectFirstPrompt: string;
    routinePrompt: (productSummary: string) => string;
    directionLabel: string;
    retryLabel: string;
    searchFallbackNote: string;
    historyLabel: string;
    historyTitle: string;
    historyEmpty: string;
    deleteChat: string;
    clearHistory: string;
    activeChatLabel: string;
    messagesCount: (n: number) => string;
    routineTitlePrefix: string;
    workerLabel: string;
    workerUrlPlaceholder: string;
    workerSave: string;
    workerClear: string;
    workerInvalidUrl: string;
    workerActiveHint: string;
    workerDefaultHint: string;
    quickPrompts: string[];
  }
> = {
  en: {
    navCatalog: "Catalog",
    navRoutine: "Selected Kit",
    navAdvisor: "Advisor",
    navBrands: "Houses",
    headerCta: "Build Routine",
    heroKicker: "L'Oréal Group · Smart Routine & Product Advisor",
    heroTitle: "Curate your daily ritual with precision.",
    heroSubtitle:
      "Select formulas across our dermatological, luxury, and haircare houses to build a tailored AM/PM regimen—backed by ingredient pairing and live beauty search.",
    heroButton: "Explore Catalog",
    heroImageAlt:
      "Luxury skincare serum dropper bottles and moisturizing cream arranged on a travertine plinth",
    catalogTitle: "Product Collection",
    searchPlaceholder: "Search by product, brand, or ingredient...",
    clearSearch: "Clear search",
    categoryLabel: "Filter by category",
    productsCount: (n: number) => `${n} ${n === 1 ? "product" : "products"}`,
    noResultsTitle: "No matching products found",
    noResultsBody:
      "Try clearing your search keyword or switching to All Categories.",
    resetFilters: "Reset Filters",
    selectedLabel: "Selected",
    selectHint: "Click card to select",
    viewDetails: "Details",
    removeFromRoutine: "Remove",
    addToRoutine: "Add to Routine",
    selectedProductsTitle: "Selected Products",
    clearAll: "Clear all",
    emptySelectionText:
      "Select products from the collection to build your personalized routine. Your kit is saved automatically.",
    generateRoutine: "Generate Routine",
    generatingRoutine: "Composing Routine...",
    advisorTitle: "Let's Build Your Routine",
    webSearchLabel: "Web Search",
    resetChat: "New Chat",
    advisorWelcomeTitle: "Your beauty advisor is ready.",
    advisorWelcomeBody:
      "Pick one or more products and click Generate Routine, or ask any question about skincare, haircare, makeup, or fragrance.",
    askPlaceholder: "Ask a follow-up about layering, ingredients, or skin type...",
    sendLabel: "Send",
    thinkingLabel: "Reviewing formulations...",
    sourcesLabel: "Sources",
    brandsTitle: "Curated Houses of L'Oréal",
    brandsSubtitle:
      "Dermatological science, clinical actives, and Parisian artistry unified in one routine builder.",
    footerCopyright: "© 2026 L'Oréal Smart Routine & Product Advisor.",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    modalClose: "Close",
    selectFirstPrompt:
      "Please select at least one product from the catalog before generating a routine.",
    routinePrompt: (summary: string) =>
      `Please build a personalized morning and evening beauty routine using ONLY the following selected products from my kit. Explain the exact application order, timing, and any key ingredient pairing notes:\n\n${summary}`,
    directionLabel: "العربية (RTL)",
    retryLabel: "Retry",
    searchFallbackNote: "Generated using product catalog data (live web search temporarily unavailable).",
    historyLabel: "History",
    historyTitle: "Previous Chats",
    historyEmpty:
      "No saved conversations yet. Generate a routine or ask a question to save it automatically.",
    deleteChat: "Delete chat",
    clearHistory: "Clear history",
    activeChatLabel: "Active",
    messagesCount: (n: number) => `${n} ${n === 1 ? "message" : "messages"}`,
    routineTitlePrefix: "Routine",
    workerLabel: "Worker",
    workerUrlPlaceholder: "https://your-worker.your-subdomain.workers.dev/",
    workerSave: "Save",
    workerClear: "Use Built-in",
    workerInvalidUrl: "Please enter a valid https:// Cloudflare Worker URL.",
    workerActiveHint: "Connected to your Cloudflare Worker (OpenAI gpt-4.1).",
    workerDefaultHint:
      "Optional: paste your deployed Cloudflare Worker (*.workers.dev) URL to route requests to OpenAI gpt-4.1.",
    quickPrompts: [
      "Can I use retinol and vitamin C together?",
      "Which order should I apply these at night?",
      "Is this routine suitable for sensitive skin?",
    ],
  },
  ar: {
    navCatalog: "المنتجات",
    navRoutine: "مجموعتي",
    navAdvisor: "المستشار الذكي",
    navBrands: "العلامات",
    headerCta: "أنشئ روتينك",
    heroKicker: "مجموعة لوريال · مستشار الروتين والمنتجات الذكي",
    heroTitle: "صمّم روتين جمالك اليومي بدقة وعناية.",
    heroSubtitle:
      "اختر مستحضراتك المفضلة من علامات العناية بالبشرة والشعر والمكياج لبناء روتين صباحي ومسائي مخصص مدعوم بالبحث الفوري.",
    heroButton: "استكشف المنتجات",
    heroImageAlt: "عبوات سيروم وكريم ترطيب فاخرة على منصة حجرية",
    catalogTitle: "مجموعة المنتجات",
    searchPlaceholder: "ابحث باسم المنتج أو العلامة أو المكوّن...",
    clearSearch: "مسح البحث",
    categoryLabel: "تصفية حسب الفئة",
    productsCount: (n: number) => `${n} منتج`,
    noResultsTitle: "لم يتم العثور على منتجات مطابقة",
    noResultsBody: "جرّب مسح كلمة البحث أو اختيار جميع الفئات.",
    resetFilters: "إعادة ضبط الفلاتر",
    selectedLabel: "تم الاختيار",
    selectHint: "انقر للاختيار",
    viewDetails: "التفاصيل",
    removeFromRoutine: "إزالة",
    addToRoutine: "أضف للروتين",
    selectedProductsTitle: "المنتجات المختارة",
    clearAll: "مسح الكل",
    emptySelectionText:
      "اختر منتجات من القائمة لبناء روتينك الشخصي. يتم حفظ اختياراتك تلقائياً.",
    generateRoutine: "إنشاء الروتين",
    generatingRoutine: "جارٍ إعداد الروتين...",
    advisorTitle: "دعنا نبني روتينك",
    webSearchLabel: "بحث الويب",
    resetChat: "محادثة جديدة",
    advisorWelcomeTitle: "مستشار الجمال جاهز لمساعدتك.",
    advisorWelcomeBody:
      "اختر منتجاً واحداً أو أكثر ثم اضغط على إنشاء الروتين، أو اطرح أي سؤال حول البشرة والشعر والمكياج والعطور.",
    askPlaceholder: "اسأل عن ترتيب الاستخدام أو المكونات أو نوع البشرة...",
    sendLabel: "إرسال",
    thinkingLabel: "جارٍ مراجعة التركيبات...",
    sourcesLabel: "المصادر",
    brandsTitle: "علامات لوريال المختارة",
    brandsSubtitle:
      "أبحاث العناية بالبشرة وخبرات الشعر والجمال في منصة واحدة.",
    footerCopyright: "© 2026 مستشار الروتين والمنتجات الذكي من لوريال.",
    privacy: "الخصوصية",
    terms: "الشروط",
    contact: "اتصل بنا",
    modalClose: "إغلاق",
    selectFirstPrompt:
      "يرجى اختيار منتج واحد على الأقل من القائمة قبل إنشاء الروتين.",
    routinePrompt: (summary: string) =>
      `يرجى إنشاء روتين جمالي مخصص للصباح والمساء باستخدام المنتجات المختارة التالية فقط، مع توضيح ترتيب الاستخدام الدقيق وملاحظات توافق المكونات:\n\n${summary}`,
    directionLabel: "English (LTR)",
    retryLabel: "إعادة المحاولة",
    searchFallbackNote: "تم الإنشاء اعتماداً على بيانات المنتجات (بحث الويب المباشر غير متاح مؤقتاً).",
    historyLabel: "السجل",
    historyTitle: "المحادثات السابقة",
    historyEmpty:
      "لا توجد محادثات محفوظة بعد. أنشئ روتيناً أو اطرح سؤالاً ليتم حفظه تلقائياً.",
    deleteChat: "حذف المحادثة",
    clearHistory: "مسح السجل",
    activeChatLabel: "الحالية",
    messagesCount: (n: number) => `${n} رسالة`,
    routineTitlePrefix: "روتين",
    workerLabel: "العامل",
    workerUrlPlaceholder: "https://your-worker.your-subdomain.workers.dev/",
    workerSave: "حفظ",
    workerClear: "الافتراضي",
    workerInvalidUrl: "يرجى إدخال رابط Cloudflare Worker صحيح يبدأ بـ https://.",
    workerActiveHint: "متصل بعامل Cloudflare Worker الخاص بك (OpenAI gpt-4.1).",
    workerDefaultHint:
      "اختياري: الصق رابط Cloudflare Worker المنشور لديك لتوجيه الطلبات إلى OpenAI gpt-4.1.",
    quickPrompts: [
      "هل يمكن استخدام الريتينول وفيتامين سي معاً؟",
      "ما هو الترتيب الصحيح للاستخدام ليلاً؟",
      "هل يناسب هذا الروتين البشرة الحساسة؟",
    ],
  },
};
