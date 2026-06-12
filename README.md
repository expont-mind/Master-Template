# Monpang — E-commerce Master Template

Next.js + Supabase дээр суурилсан, **клиент бүрд хувилж** ашигладаг онлайн дэлгүүрийн бэлэн загвар. Шинэ клиент болгонд кодыг гараар засахгүй — config бөглөөд `/rebrand` коммандыг ажиллуулахад л болно.

---

## 🚀 Шинэ клиент гаргах 8 алхам (~90 минут)

Шаардлага: **Claude Code**, `gh`, `pnpm`, Supabase болон Vercel бүртгэл.

| #   | Алхам                            | Хаана       | Комманд / үйлдэл                                                                                                     |
| --- | -------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Хувилж татах                     | terminal    | `gh repo create acme-shop --template <org>/master-project --private --clone` → `pnpm install`                        |
| 2   | Supabase холбох                  | Claude Code | `/supabase-setup` — migration push, edge function deploy (~5 мин)                                                    |
| 3   | Клиентийн мэдээлэл бөглөх        | Claude Code | `/rebrand-init` — брэнд нэр, өнгө, утас, нэвтрэх арга (phone/email), feature-үүд гэх мэт ~10 асуулт                  |
| 4   | Rebrand ажиллуулах               | Claude Code | `/rebrand` — config-ийг кодод буулгаж, дизайн сонгосон бол үндсэн 5 хуудасны layout-ийг шинээр зурж, бүгдийг шалгана |
| 4.5 | Бусад хуудсыг зурах (сонголтоор) | Claude Code | `/redesign` — үлдсэн 15 хуудасны layout-ийг шинээр зурна; тасалдвал дахин ажиллуулахад үргэлжилнэ                    |
| 5   | Лого, зураг солих                | terminal    | `apps/frontend/public/` ба `apps/admin/public/` дотор logo.svg, favicon.ico, og-image.png                            |
| 6   | Нууц түлхүүр бөглөх              | editor      | `apps/*/.env.local` — Supabase, QPay/LendMN, Redis                                                                   |
| 7   | Локал шалгах                     | terminal    | `pnpm dev` → localhost:3000 (дэлгүүр), :3001 (админ)                                                                 |
| 8   | Vercel deploy                    | dashboard   | 2 тусдаа project (`apps/frontend`, `apps/admin`), DNS заах                                                           |

---

## Бүтэц

```
apps/
├── frontend/   Худалдан авагчийн дэлгүүр (Next.js, порт 3000)
└── admin/      Админ панел (Next.js, порт 3001)
packages/
├── config-site/  Клиент бүрийн тохиргоо — ЭНД Л засна (нэр, утас, flags, auth)
├── theme/        Брэндийн өнгө/токен — brand.css нэг файлд (өнгө солиход бүх сайт өөрчлөгдөнө)
└── ...           ui-utils, supabase, logger, eslint-config гэх мэт 9 багц
```

**Гол дүрэм:** клиентэд зориулсан өөрчлөлт зөвхөн `packages/config-site` + `packages/theme/src/brand.css` + лого файлууд + `.env.local` дотор хийгдэнэ. Компонентод шууд өнгө (`text-[#020617]`) бичихийг ESLint хориглоно.

## Slash коммандууд

| Комманд            | Юу хийдэг                                                           |
| ------------------ | ------------------------------------------------------------------- |
| `/rebrand-init`    | Асуулт асууж `rebrand.config.yaml` бөглөнө (монголоор)              |
| `/rebrand`         | Config-ийг кодод буулгана + үндсэн 5 хуудсыг шинээр зурна + шалгалт |
| `/redesign`        | Бүх 20 хуудасны layout-ийг шинээр зурна (тасалдвал үргэлжлүүлдэг)   |
| `/rebrand-check`   | Зөвхөн шалгана (засвар хийхгүй)                                     |
| `/supabase-setup`  | Supabase холбож migration push хийнэ                                |
| `/supabase-squash` | 141 migration-ийг 1 файл болгож нэгтгэнэ                            |

## Түгээмэл коммандууд

```bash
pnpm dev          # 2 апп зэрэг ажиллуулах
pnpm build        # Бүгдийг build хийх
pnpm lint         # Код шалгах
pnpm type-check   # Type шалгах
pnpm test         # Unit тестүүд
pnpm preflight    # Дээрх бүгдийг дарааллаар
```

## Технологи

Next.js 16 · TypeScript (strict) · Tailwind CSS v4 · Zustand + TanStack Query · Supabase (Postgres, Auth, Storage) · Upstash Redis · QPay / LendMN / StorePay · UI хэл: Монгол

## Мэдэгдэж буй дутагдал

- Зарим хуучин компонент 700+ мөр (Phase 4-д хуваагдана)
- Тест зөвхөн shared багцуудад бий; апп түвшний тест хараахан алга
- Vercel deploy гараар хийгдэнэ (автоматжуулаагүй)
- `apps/admin/.env` хоосон бол админы build prerender дээр унана — Supabase түлхүүр шаардлагатай

## Дэлгэрэнгүй

- [docs/TEMPLATE_SETUP.md](docs/TEMPLATE_SETUP.md) — бүрэн заавар + асуудал шийдэх
- [docs/CUSTOMIZATION_CHECKLIST.md](docs/CUSTOMIZATION_CHECKLIST.md) — нээхийн өмнөх шалгах хуудас
- [CLAUDE.md](CLAUDE.md) — AI агентад зориулсан дүрмүүд

## Лиценз

Хувийн — зөвхөн дотоод хэрэглээнд.
