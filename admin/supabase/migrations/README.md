# Монпанг - Supabase Migration файлууд

## Ажиллуулах дараалал

Supabase SQL Editor дээр дараах дараалалаар ажиллуулна:

```
00001_setup.sql         - Өргөтгөлүүд, туслах функцууд, ENUM төрлүүд
00002_auth.sql          - Хэрэглэгчид, хаягууд, сешнүүд
00003_product.sql       - Ангилал, брэнд, бүтээгдэхүүн, нөөц
00004_wishlist.sql      - Хүслийн жагсаалт
00005_review.sql        - Сэтгэгдэл
00006_order.sql         - Захиалга
00007_payment.sql       - Төлбөр, буцаалт
00008_notification.sql  - Мэдэгдэл
00010_content.sql       - Нийтлэл, үйл явдал
00011_analytics.sql     - Аналитик
00012_indexes.sql       - Нэмэлт индексүүд
00013_rls_policies.sql  - Row Level Security
00014_functions.sql     - Туслах функцууд
```

## Модулийн тайлбар

| Файл | Хүснэгтүүд | Тайлбар |
|------|-----------|---------|
| 00001_setup | - | Өргөтгөлүүд (uuid-ossp, pg_trgm, unaccent), ENUM төрлүүд |
| 00002_auth | users, user_addresses, auth_sessions | Supabase Auth-тай холбогдсон |
| 00003_product | categories, brands, products, product_images, product_variants, inventory, product_categories | Бүтэн текст хайлт, эрэмбэлэлт |
| 00004_wishlist | wishlists, wishlist_items | Хүслийн жагсаалт |
| 00005_review | reviews | Үнэлгээ 1-5, нэг хэрэглэгч/бүтээгдэхүүнд нэг |
| 00006_order | orders, order_items | Автомат захиалгын дугаар |
| 00007_payment | idempotency_keys, payments, refunds | BONUM gateway-д зориулсан |
| 00008_notification | notifications | Push мэдэгдэл |
| 00010_content | articles, events | Блог, урамшуулал |
| 00011_analytics | search_keywords, product_events | Хайлтын аналитик |
| 00012_indexes | - | Гүйцэтгэлийн индексүүд |
| 00013_rls_policies | - | Аюулгүй байдлын бодлогууд |
| 00014_functions | - | Захиалга үүсгэх, хайх функцууд |

## Гол онцлогууд

### Нөөцийн аюулгүй байдал
```sql
CONSTRAINT stock_quantity_non_negative CHECK (stock_quantity >= 0)
```
Нөөц 0-ээс доош буухгүй, хэт борлуулалтаас сэргийлнэ.

### Транзакцийн аюулгүй байдал
`create_order_with_items()` функц нь `FOR UPDATE` ашиглан нөөцийн мөрүүдийг түгжиж, race condition-оос сэргийлнэ.

### Бүтэн текст хайлт
```sql
search_vector TSVECTOR  -- Автомат шинэчлэгддэг
```
GIN индекстэй, жинлэсэн хайлт (A: нэр, брэнд; B: ангилал; C: тайлбар).

### Төлбөрийн idempotency
`idempotency_keys` хүснэгт нь давхардсан төлбөрөөс сэргийлнэ.

## Дараагийн алхамууд

1. Supabase project үүсгэх
2. Migration файлуудыг дарааллаар ажиллуулах
3. Storage bucket үүсгэх (зурагт)
4. Edge Functions үүсгэх (webhook-д)
5. Анхны өгөгдөл оруулах (ангилал, брэнд)
