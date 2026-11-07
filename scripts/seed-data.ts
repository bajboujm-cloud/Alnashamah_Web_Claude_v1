/**
 * Starting catalogue for Al Nashamah. Safe to run many times: it only ADDS what is missing and
 * never overwrites changes made later in the admin panel.
 *
 * Placeholders (to be filled by the owner): age, weight and price of every option, breed photos,
 * final cutting list, delivery fees. Breed descriptions are short drafts to be edited.
 */

export const categorySeed = [
  {
    slug: "sheep",
    nameEn: "Sheep",
    nameAr: "غنم",
    descriptionEn: "Fresh, healthy sheep from trusted local and regional breeds.",
    descriptionAr: "أغنام طازجة وصحية من سلالات محلية وإقليمية موثوقة.",
    illustrationUrl: "/illustrations/sheep.svg",
    status: "active" as const,
    sortOrder: 1,
  },
  {
    slug: "goats",
    nameEn: "Goats",
    nameAr: "ماعز",
    descriptionEn: "Tender goat meat, carefully selected and prepared your way.",
    descriptionAr: "لحم ماعز طري، مختار بعناية ومجهز حسب طلبك.",
    illustrationUrl: "/illustrations/goats.svg",
    status: "active" as const,
    sortOrder: 2,
  },
  {
    slug: "cattle",
    nameEn: "Cattle",
    nameAr: "أبقار",
    descriptionEn: "Coming soon to Al Nashamah.",
    descriptionAr: "قريباً في النشامى.",
    illustrationUrl: "/illustrations/cattle.svg",
    status: "coming_soon" as const,
    sortOrder: 3,
  },
  {
    slug: "camels",
    nameEn: "Camels",
    nameAr: "إبل",
    descriptionEn: "Coming soon to Al Nashamah.",
    descriptionAr: "قريباً في النشامى.",
    illustrationUrl: "/illustrations/camels.svg",
    status: "coming_soon" as const,
    sortOrder: 4,
  },
];

type BreedSeed = {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
};

export const breedSeed: Record<string, BreedSeed[]> = {
  sheep: [
    {
      slug: "naeemi",
      nameEn: "Naeemi",
      nameAr: "نعيمي",
      descriptionEn: "The Gulf's favourite breed, loved for its rich flavour and tender meat.",
      descriptionAr: "السلالة المفضلة في الخليج، محبوبة بطعمها الغني ولحمها الطري.",
    },
    {
      slug: "najdi",
      nameEn: "Najdi",
      nameAr: "نجدي",
      descriptionEn: "A prized Arabian breed with a large frame and generous, lean meat.",
      descriptionAr: "سلالة عربية أصيلة بحجم كبير ولحم وفير قليل الدهن.",
    },
    {
      slug: "herri",
      nameEn: "Herri",
      nameAr: "حري",
      descriptionEn: "A traditional Arabian breed valued for its tender, flavourful meat.",
      descriptionAr: "سلالة عربية تقليدية تتميز بلحم طري وطعم مميز.",
    },
    {
      slug: "somali",
      nameEn: "Somali",
      nameAr: "صومالي",
      descriptionEn: "A popular, great-value choice with light, lean meat.",
      descriptionAr: "خيار شائع وبقيمة ممتازة، لحمه خفيف وقليل الدهن.",
    },
    {
      slug: "local",
      nameEn: "Local",
      nameAr: "محلي",
      descriptionEn: "Raised here in the UAE — fresh, familiar taste for every occasion.",
      descriptionAr: "تربية محلية في الإمارات — طعم أصيل وطازج لكل مناسبة.",
    },
  ],
  goats: [
    {
      slug: "local",
      nameEn: "Local",
      nameAr: "محلي",
      descriptionEn: "Local goat raised in the UAE, known for its distinctive taste.",
      descriptionAr: "ماعز محلي من تربية الإمارات، معروف بطعمه المميز.",
    },
    {
      slug: "somali",
      nameEn: "Somali",
      nameAr: "صومالي",
      descriptionEn: "Lean, tender goat meat at great value.",
      descriptionAr: "لحم ماعز طري وقليل الدهن بقيمة ممتازة.",
    },
    {
      slug: "kashmiri",
      nameEn: "Kashmiri",
      nameAr: "كشميري",
      descriptionEn: "A well-loved breed with soft, flavourful meat.",
      descriptionAr: "سلالة محبوبة بلحم طري وطعم غني.",
    },
  ],
};

/** Every breed starts with at least 3 options (age, weight, price — edited later in the admin). */
export const OPTIONS_PER_BREED = 3;

/** Row names by position: 1 = Small … 5 = Extra large+. */
export const optionLabels = [
  ["Small", "صغير"],
  ["Medium", "وسط"],
  ["Large", "كبير"],
  ["Extra large", "كبير جداً"],
  ["Jumbo", "جامبو"],
] as const;

export type SampleOption = {
  ageMinMonths: number;
  ageMaxMonths: number;
  weightMinKg: number;
  weightMaxKg: number;
  priceFils: number;
};

const row = (ages: [number, number], kg: [number, number], aed: number): SampleOption => ({
  ageMinMonths: ages[0],
  ageMaxMonths: ages[1],
  weightMinKg: kg[0],
  weightMaxKg: kg[1],
  priceFils: aed * 100,
});

/**
 * TEMPORARY sample sizes and prices, copied from zabehaty.com on 2026-11-05 so the catalogue looks real
 * while the owner prepares Al Nashamah's own list. Replace them in the admin (Phase 2).
 * Herri and Local sheep are not sold there, so they keep empty rows ("Price coming soon").
 * Weights are as listed by the competitor (kg).
 */
export const samplePricing: Record<string, SampleOption[]> = {
  "sheep/naeemi": [row([2, 4], [8, 10], 1143), row([4, 6], [11, 13], 1191), row([6, 8], [14, 16], 1240)],
  "sheep/najdi": [row([2, 4], [8, 10], 1143), row([4, 6], [11, 13], 1191), row([6, 8], [14, 16], 1240)],
  "sheep/somali": [row([12, 15], [10, 13], 735)],
  "goats/local": [row([2, 4], [5, 7], 780), row([4, 6], [8, 10], 820), row([6, 8], [10, 12], 774)],
  "goats/somali": [row([12, 15], [10, 13], 735)],
  "goats/kashmiri": [row([3, 6], [9, 11], 770)],
};

/** Placeholder names based on common UAE cuts — the owner will provide the final list. */
export const cuttingSeed = [
  ["arabic-8", "Arabic cut – 8 pieces", "تقطيع عربي 8 قطع"],
  ["arabic-4", "Arabic cut – 4 pieces", "تقطيع عربي 4 قطع"],
  ["half-lengthwise", "Halves (lengthwise)", "نصفين بالطول"],
  ["fridge-medium", "Fridge cut (medium pieces)", "تقطيع ثلاجة (قطع متوسطة)"],
  ["whole-ghouzi", "Whole (Ghouzi)", "كامل (غوزي)"],
  ["saloona-small", "Saloona cut (small pieces)", "تقطيع صالونة (قطع صغيرة)"],
  ["biryani-large", "Biryani cut (large pieces)", "تقطيع برياني (قطع كبيرة)"],
  ["hadrami-joints", "Hadrami cut (joints)", "تقطيع حضرمي (مفاصل)"],
  ["mufattah", "Mufattah", "مفطّح"],
].map(([slug, nameEn, nameAr], i) => ({ slug, nameEn, nameAr, sortOrder: i + 1 }));

/** Shown to customers when these are switched off (during Eid, government slaughterhouses keep them). */
const eidNote = {
  unavailableNoteEn: "Not available during Eid Al-Adha due to government slaughterhouse regulations.",
  unavailableNoteAr: "غير متاح خلال عيد الأضحى حسب أنظمة وتعليمات المسالخ الحكومية.",
};

export const extrasSeed = [
  { slug: "head", nameEn: "Head", nameAr: "الرأس", sortOrder: 1, ...eidNote },
  { slug: "intestines", nameEn: "Intestines", nameAr: "المصران", sortOrder: 2, ...eidNote },
  { slug: "tripe", nameEn: "Tripe", nameAr: "الكرش", sortOrder: 3, ...eidNote },
];

export const packagingSeed = [
  {
    slug: "slaughterhouse-bag",
    nameEn: "Slaughterhouse bag",
    nameAr: "كيس المسلخ",
    descriptionEn: "Standard hygienic bag from the slaughterhouse.",
    descriptionAr: "كيس صحي قياسي من المسلخ.",
    priceFils: 0,
    sortOrder: 1,
  },
  {
    slug: "carton-box",
    nameEn: "Carton box",
    nameAr: "كرتون",
    descriptionEn: "Sturdy carton box, easy to carry and store.",
    descriptionAr: "صندوق كرتون متين، سهل الحمل والتخزين.",
    priceFils: 1000,
    sortOrder: 2,
  },
  {
    slug: "foam-box-ice",
    nameEn: "Foam box with ice",
    nameAr: "صندوق فلين مع ثلج",
    descriptionEn: "Insulated foam box packed with ice to keep the meat cold and fresh.",
    descriptionAr: "صندوق فلين معزول مع ثلج للحفاظ على برودة اللحم وطزاجته.",
    priceFils: 2500,
    sortOrder: 3,
  },
];

export const seasonalSeed = [
  {
    slug: "eid-al-adha",
    nameEn: "Eid Al-Adha Sacrifice / Qurban",
    nameAr: "أضحية عيد الأضحى / القربان",
    descriptionEn:
      "Book your Udhiyah with confidence — selected, healthy animals slaughtered according to Islamic rites and delivered to your door.",
    descriptionAr: "احجز أضحيتك بثقة — مواشٍ مختارة وسليمة، تُذبح وفق الشريعة الإسلامية وتصلك إلى باب بيتك.",
    illustrationUrl: "/illustrations/eid-al-adha.svg",
    isActive: true,
    sortOrder: 1,
    categories: ["sheep", "goats"],
  },
];

export const deliveryZoneSeed = [
  ["abu-dhabi", "Abu Dhabi", "أبوظبي"],
  ["dubai", "Dubai", "دبي"],
  ["sharjah", "Sharjah", "الشارقة"],
  ["ajman", "Ajman", "عجمان"],
  ["umm-al-quwain", "Umm Al Quwain", "أم القيوين"],
  ["ras-al-khaimah", "Ras Al Khaimah", "رأس الخيمة"],
  ["fujairah", "Fujairah", "الفجيرة"],
].map(([slug, nameEn, nameAr], i) => ({
  slug,
  nameEn,
  nameAr,
  feeFils: null as number | null,
  sortOrder: i + 1,
}));

export const settingsSeed: Record<string, unknown> = {
  "company.legal_name_en": "Al Nashamah Livestock Trading",
  "company.legal_name_ar": "النشامى لتجارة المواشي",
  "company.trn": "",
  "company.trade_license_no": "",
  "company.address_en": "",
  "company.address_ar": "",
  "company.phone": "",
  "company.whatsapp": "",
  "company.email": "",
  "tax.vat_rate_percent": 5,
  "tax.prices_include_vat": true,
};
