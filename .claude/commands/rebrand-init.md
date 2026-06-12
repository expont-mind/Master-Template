---
description: Interactively fill rebrand.config.yaml by answering questions (Mongolian)
---

You are guiding the user through filling `rebrand.config.yaml` interactively.
Communicate in **Mongolian** throughout. Be concise — one short greeting then
straight to questions.

# Step 0 — Pre-check

1. Check if `rebrand.config.yaml` already exists.
2. If it exists, ask the user (in Mongolian): "rebrand.config.yaml файл бэлэн
   байна. Дахин бөглөх үү? (yes/no)". If `no`, STOP and remind them they can
   run `/rebrand` directly.
3. Read `rebrand.config.example.yaml` to understand the schema.

# Step 1 — Greeting

Say (Mongolian, 1-2 short sentences):
"Шинэ client-ийн rebrand config бөглөе. ~11 группын асуулт асууна, 5-8 минут
зарцуулна. Сүүлийн групп нь шинэ дизайн (font, layout, color) — хэрэв
Monpang-ын дизайныг хадгалмаар бол энэ хэсгийг skip хийж болно."

# Step 2 — Collect answers

Ask the user the following **groups of questions**, one group at a time using
the `AskUserQuestion` tool when possible. After each answer, validate and
re-ask if the value is malformed.

## Group 1: Brand identity

Use AskUserQuestion with multiple questions (max 4):

- "Брэндийн full нэр?" (e.g., "Хаан дэлгүүр")
- "Short нэр?" (e.g., "Хаан") — defaults to full name if empty
- "Үндсэн домэйн (https://...)?"
- "Admin субдомэйн?" — auto-suggest `https://admin.<root>` from the URL

## Group 2: Brand description

Ask in chat (free text):
"Брэндийн товч тайлбар (Mongolian, 1-2 өгүүлбэр, <meta description> -д орно):"

## Group 3: Primary brand color

Ask in chat:
"Үндсэн брэндийн өнгө (hex, e.g., #C9A961):"

Validate: 6-character `#RRGGBB`. Re-ask if invalid.

**Auto-derive** these from the primary:

- `primaryHover`: primary darkened by 10% (reduce each RGB channel by ~25 points)
- `primaryActive`: primary darkened by 20% (reduce each RGB channel by ~50 points)
- `primaryForeground`: pick `#FFFFFF` if primary is dark, `#000000` if light
  (use luminance: 0.299*R + 0.587*G + 0.114\*B < 128 → white, else black)

Show the derived values and ask: "Эдгээр derive хийсэн утгуудыг ашиглах уу?
эсвэл өөрөө өгөх үү?"

## Group 4: Secondary + accent colors

Ask in chat with sensible defaults shown:
"Хоёрдогч брэндийн өнгө (default: #1A1A1A)?"
"Accent өнгө (default: primary-тай адил)?"

Auto-derive foreground colors for each (white-on-dark, black-on-light).

## Group 5: Contact info

Use AskUserQuestion (max 4):

- "Утас (+976 \_**\_-\_\_**)?"
- "Үндсэн имэйл?"
- "Support имэйл?" — defaults to main email if empty
- "Privacy имэйл?" — defaults to main email if empty

Validate phone shape and email shape.

## Group 6: Address

Ask in chat (free text):
"Хаяг (Mongolian, бүтэн)?"

## Group 7: Social handles

Use AskUserQuestion (max 4):

- "Instagram handle (@-гүй)?" (skip if empty)
- "Facebook page slug?" (skip if empty)
- "TikTok handle?" (skip if empty)
- "YouTube channel?" (skip if empty)

For skipped values, use `~` (null) in YAML.

## Group 8: Payment providers

Use AskUserQuestion (multiSelect):
"Идэвхтэй болгох payment провайдер аль нь? (олон сонгож болно)"

- QPay
- LendMN
- StorePay
- Bank transfer (дансаар шилжүүлэх)

## Group 9: Feature flags

Use AskUserQuestion (multiSelect):
"Идэвхтэй болгох feature аль нь? (хэрэглэхгүй features-ийг unselect хий)"

- Reviews (бүтээгдэхүүний сэтгэгдэл)
- Wishlist (хүсэлтийн жагсаалт)
- Coupons (хямдрал)
- Articles (нийтлэл)
- Events (эвэнт)
- Point system (оноо)
- Notifications (мэдэгдэл)

## Group 9.5: Auth арга

Use AskUserQuestion:
"Хэрэглэгч хэрхэн нэвтрэх вэ?"

- phone — Утасны дугаар + SMS OTP (Supabase дээр SMS provider
  тохируулсан байх ШААРДЛАГАТАЙ — Twilio гэх мэт)
- email — Имэйл + Email OTP (Supabase-ийн default, нэмэлт provider
  шаардахгүй) ⭐ SMS provider-гүй бол заавал үүнийг сонго

## Group 10: Misc

Use AskUserQuestion (max 2):

- "Үнэгүй хүргэлтийн босго (MNT, default: 80000)?"
- "Хуулийн харъяа улс (default: Mongolia)?"

## Group 11: Design direction ⚠️ (хамгийн чухал)

First, ask the user (in chat) whether they want a full visual redesign or
only the text/config rebrand:

"Шинэ дизайн хийх үү, эсвэл одоогийн Monpang layout-ыг хадгалах уу?
a) Тийм — шинэ дизайн (rebrand нь font/color/layout-ийг шинээр зурна;
core 5 хуудас — home, listing, detail, cart, checkout — заавал
шинэ layout-аар дахин зурагдана) ⭐
b) Үгүй — зөвхөн брэнд нэр/өнгө соль (Monpang layout хэвээр)"

If `b`, set `design: ~` in the YAML and skip the rest of Group 11.

If `a`, collect the design direction:

### 11a: Reference websites (chat, free text)

"Inspiration авах 1-3 website (URL-аар, comma-аар тусгаарлах):
жишээ: https://apple.com, https://stripe.com, https://linear.app"

Validate URLs start with `https://`.

For each URL, also ask: "{url}-ээс юу авах вэ?
(spacing, typography, color, button shape, animation, ...)"

### 11b: Aesthetic + density + button shape

Use AskUserQuestion (max 3):

- "Aesthetic (минжуурлал)?"
  - minimalist (Apple-style, олон зай)
  - luxury (premium, serif typography)
  - playful (өнгө-баяр, rounded)
  - tech (clean, geometric)
  - gaming (dark, neon, sharp)
  - editorial (журналистын stil, олон typography)
  - brutalist (хатуу, raw, monospace)
  - retro (vintage, бичгийн машин)
  - sporty (dynamic, bold)

- "Visual density?"
  - compact (Amazon-style, олон зүйл нэг screen-д)
  - comfortable (default, дунд)
  - spacious (Apple-style, тэлгэр)

- "Button shape?"
  - sharp (хадгалт байхгүй)
  - rounded-sm (4px, дөрвөлжин шиг)
  - rounded-md (8px, default)
  - rounded-lg (12px, мөөгөнцөр)
  - pill (бүтэн дугуй)

### 11c: Typography (chat)

"Heading font (Google Fonts нэр, e.g., 'Playfair Display', 'Space Grotesk', 'Inter'):"
"Body font (Google Fonts нэр, e.g., 'Inter', 'Geist', 'Manrope'):"
"Code/mono font (хэрэгтэй бол, e.g., 'JetBrains Mono'; үгүй бол enter дар):"

### 11d: Color depth, mode, component vibe

Use AskUserQuestion (max 3):

- "Color depth (өнгөний гүн)?"
  - monochrome (1 өнгө + хар/цагаан)
  - duotone (2 өнгө)
  - multi (олон өнгө)

- "Default color mode?"
  - light (light-first)
  - dark (dark-first)
  - auto (хэрэглэгчийн OS дагана)

- "Component vibe (компонентын мэдрэмж)?"
  - flat (shadow байхгүй)
  - soft (нимгэн shadow)
  - heavy (хүчтэй shadow)
  - glass (glassmorphic, ил түмэн)

# Step 3 — Generate YAML

Build the complete `rebrand.config.yaml` content from collected answers.
Required output shape (match exactly):

```yaml
brand:
  name: "{name}"
  shortName: "{shortName}"
  url: "{url}"
  adminUrl: "{adminUrl}"
  description: "{description}"

theme:
  primary: "{primary}"
  primaryHover: "{primaryHover}"
  primaryActive: "{primaryActive}"
  primaryForeground: "{primaryForeground}"
  secondary: "{secondary}"
  secondaryForeground: "{secondaryForeground}"
  accent: "{accent}"
  accentForeground: "{accentForeground}"

contact:
  phone: "{phone}"
  email: "{email}"
  supportEmail: "{supportEmail}"
  privacyEmail: "{privacyEmail}"
  address: "{address}"

social:
  instagram: { instagramOrNull }
  facebook: { facebookOrNull }
  tiktok: { tiktokOrNull }
  youtube: { youtubeOrNull }

payments:
  qpay: { bool }
  lendmn: { bool }
  storepay: { bool }
  transfer: { bool }

features:
  reviews: { bool }
  wishlist: { bool }
  coupons: { bool }
  articles: { bool }
  events: { bool }
  pointSystem: { bool }
  notifications: { bool }

auth:
  method: "{phone|email}"

delivery:
  freeShippingThreshold: { number }

legal:
  jurisdiction: "{jurisdiction}"
  jurisdictionMn: "{jurisdictionMn}"
  companyRegistration: ~

# If user picked option (b) "keep Monpang layout", emit `design: ~` and
# stop. Otherwise emit the full design block:
design:
  references:
    - url: "{reference1Url}"
      take: "{reference1Take}"
    - url: "{reference2Url}"
      take: "{reference2Take}"
  aesthetic: "{aesthetic}"
  density: "{density}"
  buttonShape: "{buttonShape}"
  typography:
    heading: "{headingFont}"
    body: "{bodyFont}"
    mono: { monoFontOrNull }
  colorDepth: "{colorDepth}"
  defaultMode: "{defaultMode}"
  componentVibe: "{componentVibe}"
```

For social handles, `design.typography.mono`, and any optional field with no
value, output `~` (no quotes). For values, use double quotes around strings,
raw numbers/bools for numerics.

# Step 4 — Preview & confirm

Print the generated YAML to the user. Ask:
"Дээрх утгууд зөв үү? (yes / edit <field>)"

If `yes`, proceed to Step 5.
If `edit <field>`, re-ask just that field and regenerate. Loop until `yes`.

# Step 5 — Save

Write the YAML to `rebrand.config.yaml` in the repo root.

# Step 6 — Final report

Print (Mongolian):
"✓ rebrand.config.yaml хадгалагдлаа.

Дараагийн алхам:
/rebrand ← бүх rebrand-ыг автомат хийнэ (~4 минут)

эсвэл config-ийг editor-аар нягтлаад дараа нь /rebrand ажиллуулна."

# Important rules

- **Speak Mongolian** to the user throughout.
- **Validate** each value before accepting (hex format, URL format, phone shape).
- **Auto-derive** hover/active/foreground colors so the user only provides primary.
- **Don't push for empty values** — `~` (null) is fine for optional social handles.
- **Show the YAML preview** before saving so the user catches mistakes.
- **Do not run /rebrand** automatically — let the user decide when to trigger it.
