import type {
  AiPromoBlock,
  AuthorDraftTeaser,
  CatalogMetaResponse,
  CatalogStoryCard,
  TrendingFandom,
} from "@/entities/catalog/model/types";

export const catalogStories: CatalogStoryCard[] = [
  {
    id: "story-1",
    slug: "after-midnight-the-snow-does-not-melt",
    title: "После полуночи снег не тает",
    fandom: "Harry Potter",
    pairing: "Гермиона / Драко",
    excerpt:
      "Восьмой курс начинается как вынужденное перемирие, но найденный архив меняет правила игры и личные границы.",
    coverTone: "from-[#523120] via-[#8f5a3c] to-[#d9ba93]",
    status: "in-progress",
    rating: "R",
    size: "midi",
    chapters: 18,
    likes: 3482,
    comments: 412,
    bookmarks: 1096,
    updatedLabel: "обновлено 2 часа назад",
    authorAiHint: "AI автора: 2 замечания по канону",
    tags: ["hurt/comfort", "slow burn", "canon divergence", "политика"],
  },
  {
    id: "story-2",
    slug: "ashes-and-salt",
    title: "Пепел и соль",
    fandom: "Ведьмак",
    pairing: "Йеннифэр / Геральт",
    excerpt:
      "Новая охота начинается с пропавшей карты, а заканчивается там, где у героев давно не осталось честных ответов.",
    coverTone: "from-[#233d2c] via-[#60794a] to-[#c7d2aa]",
    status: "completed",
    rating: "PG-13",
    size: "maxi",
    chapters: 24,
    likes: 2814,
    comments: 208,
    bookmarks: 932,
    updatedLabel: "завершённая работа",
    tags: ["приключение", "post-canon", "семья", "монстры"],
  },
  {
    id: "story-3",
    slug: "seventh-rehearsal",
    title: "Седьмая репетиция",
    fandom: "BTS",
    pairing: "Чимин / Юнги",
    excerpt:
      "Тур держится на улыбках и договорённостях, пока одна сцена не начинает звучать слишком правдиво.",
    coverTone: "from-[#441b30] via-[#9e5877] to-[#f0d0dd]",
    status: "in-progress",
    rating: "NC-17",
    size: "midi",
    chapters: 13,
    likes: 5120,
    comments: 689,
    bookmarks: 1870,
    updatedLabel: "горячая работа",
    authorAiHint: "AI автора: стоит смягчить одну реплику",
    tags: ["show business", "angst", "slow burn", "романтика"],
  },
  {
    id: "story-4",
    slug: "yellow-corridor",
    title: "Жёлтый коридор",
    fandom: "Ориджиналы",
    pairing: "F/F",
    excerpt:
      "История о маленькой гостинице, старом письме и странном коридоре, где каждое решение будто уже было принято.",
    coverTone: "from-[#51412d] via-[#9a7b57] to-[#f1e0bf]",
    status: "completed",
    rating: "PG-13",
    size: "mini",
    chapters: 7,
    likes: 1944,
    comments: 144,
    bookmarks: 623,
    updatedLabel: "тихая рекомендация",
    tags: ["мистика", "романтика", "comfort read", "семейные тайны"],
  },
  {
    id: "story-5",
    slug: "shadow-knows-your-name",
    title: "Тень знает твоё имя",
    fandom: "Genshin Impact",
    pairing: "Сяо / Итэр",
    excerpt:
      "Странствие по Ли Юэ оборачивается разбором чужих воспоминаний и давно сломанной клятвы.",
    coverTone: "from-[#1f3c45] via-[#4a7d82] to-[#c6e2dc]",
    status: "frozen",
    rating: "R",
    size: "maxi",
    chapters: 21,
    likes: 2788,
    comments: 355,
    bookmarks: 1299,
    updatedLabel: "заморожен, но читают",
    tags: ["road story", "тайны прошлого", "slow reveal", "angst"],
  },
  {
    id: "story-6",
    slug: "sheet-of-silence",
    title: "Лист молчания",
    fandom: "Naruto",
    pairing: "Какаши / Сакура",
    excerpt:
      "Миссия заканчивается отчётом, которого никто не должен был видеть, и разговором, который слишком долго откладывали.",
    coverTone: "from-[#213249] via-[#59789d] to-[#d5e1f1]",
    status: "in-progress",
    rating: "PG-13",
    size: "midi",
    chapters: 11,
    likes: 2287,
    comments: 197,
    bookmarks: 731,
    updatedLabel: "обновлено вчера",
    tags: ["постканон", "командная динамика", "рефлексия", "миссия"],
  },
];

export const aiPromo: AiPromoBlock = {
  title: "Plotty AI",
  description:
    "Не пишет за автора. Работает как внимательный бета-ридер и показывает проблемы после того, как глава уже написана.",
  features: [
    "OOC-проверка персонажей",
    "Поиск противоречий в каноне",
    "Что может быть непонятно читателю",
    "Подсказки по диалогам, ритму и описаниям",
  ],
};

export const trendingFandoms: TrendingFandom[] = [
  { id: "f-1", name: "Harry Potter", stories: 2418 },
  { id: "f-2", name: "BTS", stories: 1642 },
  { id: "f-3", name: "Ориджиналы", stories: 3127 },
  { id: "f-4", name: "Naruto", stories: 1386 },
  { id: "f-5", name: "Ведьмак", stories: 982 },
];

export const authorDraftTeaser: AuthorDraftTeaser = {
  title: "Черновик: «После полуночи снег не тает», глава 19",
  status: "Автосохранение 12:41 • публикация не запланирована",
  summary:
    "Готова короткая сводка по арке и пометки, где читателю может быть неясна смена мотивации Драко.",
  actions: [
    { label: "Новая глава", href: "/write" },
    { label: "Продолжить черновик", href: "/write" },
  ],
  highlights: ["Канон: 2 спорные детали", "Диалог: 1 холодная реплика", "Ритм: вступление можно сократить"],
};

export const catalogMeta: CatalogMetaResponse = {
  stats: {
    storiesMatched: 2418,
    updatedToday: 146,
    liveReaders: 681,
  },
  aiPromo,
  filterOptions: {
    fandoms: ["Harry Potter", "Ведьмак", "BTS", "Ориджиналы", "Genshin Impact", "Naruto"],
    statuses: [
      { value: "in-progress", label: "В процессе" },
      { value: "completed", label: "Завершён" },
      { value: "frozen", label: "Заморожен" },
    ],
    ratings: ["G", "PG-13", "R", "NC-17"],
    sizes: [
      { value: "mini", label: "Мини" },
      { value: "midi", label: "Миди" },
      { value: "maxi", label: "Макси" },
    ],
    sortTabs: [
      { value: "new", label: "Новые" },
      { value: "updates", label: "Обновления" },
      { value: "popular", label: "Популярное" },
      { value: "discussed", label: "Обсуждаемые" },
      { value: "bookmarks", label: "С закладками" },
    ],
  },
};

