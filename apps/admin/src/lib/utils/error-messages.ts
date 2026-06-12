/**
 * Server-ийн англи алдааны мессежүүдийг монгол хэл рүү хөрвүүлэх utility.
 *
 * Supabase / PostgreSQL-ийн error message-ууд англиар ирдэг тул
 * хэрэглэгчид ойлгомжтой монгол мессеж харуулахад ашиглана.
 */

const ERROR_PATTERNS: [test: (msg: string) => boolean, translation: string][] = [
  // Давхардсан утга (unique constraint)
  [
    (m) => m.includes("unique") && m.includes("slug"),
    "Энэ нэртэй бичлэг аль хэдийн бүртгэлтэй байна. Өөр нэр оруулна уу.",
  ],
  [
    (m) => m.includes("unique") && m.includes("code"),
    "Энэ кодтой бичлэг аль хэдийн бүртгэлтэй байна. Өөр код оруулна уу.",
  ],
  [
    (m) => m.includes("unique") || m.includes("duplicate key"),
    "Давхардсан утга байна. Мэдээллээ шалгаад дахин оролдоно уу.",
  ],

  // Хоосон заавал талбар (not-null)
  [
    (m) => m.includes("not-null") || m.includes("null value"),
    "Заавал бөглөх талбар хоосон байна. Бүх шаардлагатай талбарыг бөглөнө үү.",
  ],

  // Тоон утга буруу (numeric parsing)
  [
    (m) => m.includes("invalid input syntax") && m.includes("numeric"),
    "Үнэ эсвэл тоо хэмжээний утга буруу байна. Зөвхөн тоо оруулна уу.",
  ],
  [
    (m) => m.includes("invalid input syntax") && m.includes("uuid"),
    "Холбоотой мэдээлэл олдсонгүй. Хуудсыг шинэчлээд дахин оролдоно уу.",
  ],
  [
    (m) => m.includes("invalid input syntax"),
    "Оруулсан утга буруу форматтай байна. Шалгаад дахин оролдоно уу.",
  ],

  // Холбоос алдаа (foreign key)
  [
    (m) => m.includes("foreign key") && m.includes("brand"),
    "Сонгосон бренд устгагдсан эсвэл олдсонгүй.",
  ],
  [
    (m) => m.includes("foreign key") && m.includes("categor"),
    "Сонгосон ангилал устгагдсан эсвэл олдсонгүй.",
  ],
  [
    (m) => m.includes("foreign key") && m.includes("product"),
    "Холбогдох бүтээгдэхүүн устгагдсан эсвэл олдсонгүй.",
  ],
  [(m) => m.includes("foreign key") && m.includes("user"), "Холбогдох хэрэглэгч олдсонгүй."],
  [(m) => m.includes("foreign key") && m.includes("order"), "Холбогдох захиалга олдсонгүй."],
  [
    (m) => m.includes("foreign key"),
    "Холбоотой мэдээлэл устгагдсан эсвэл олдсонгүй. Хуудсыг шинэчлээд дахин оролдоно уу.",
  ],

  // Check constraint
  [
    (m) => m.includes("check") && m.includes("stock"),
    "Нөөцийн тоо хэмжээ 0-ээс бага байж болохгүй.",
  ],
  [(m) => m.includes("check constraint"), "Оруулсан утга зөвшөөрөгдсөн хязгаараас гарсан байна."],

  // Текст хэт урт
  [
    (m) => m.includes("value too long"),
    "Оруулсан текст хэт урт байна. Богиносгоод дахин оролдоно уу.",
  ],

  // Сүлжээ / сервер
  [
    (m) => m.includes("timeout") || m.includes("timed out"),
    "Серверийн хариу удааширлаа. Дахин оролдоно уу.",
  ],
  [
    (m) => m.includes("network") || m.includes("fetch failed") || m.includes("failed to fetch"),
    "Сүлжээний алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.",
  ],
  [(m) => m.includes("internal server error"), "Серверийн дотоод алдаа гарлаа. Дахин оролдоно уу."],

  // Эрх / зөвшөөрөл
  [
    (m) => m.includes("permission denied") || m.includes("insufficient_privilege"),
    "Энэ үйлдлийг хийх эрх байхгүй байна.",
  ],
  [
    (m) => m.includes("jwt") || m.includes("token") || m.includes("unauthorized"),
    "Нэвтрэлт дууссан байна. Дахин нэвтэрнэ үү.",
  ],

  // Устгах боломжгүй (referenced rows)
  [
    (m) => m.includes("still referenced") || (m.includes("foreign key") && m.includes("delete")),
    "Энэ бичлэгтэй холбоотой өгөгдөл байгаа тул устгах боломжгүй.",
  ],
];

/**
 * Server error мессежийг хэрэглэгчид ойлгомжтой монгол мессеж рүү хөрвүүлнэ.
 *
 * @param msg - Серверээс ирсэн алдааны мессеж (ихэвчлэн англиар)
 * @param fallback - Тохирох орчуулга олдохгүй бол харуулах мессеж
 */
export function translateServerError(
  msg: string,
  fallback = "Алдаа гарлаа. Дахин оролдоно уу.",
): string {
  if (!msg) return fallback;
  const lower = msg.toLowerCase();

  for (const [test, translation] of ERROR_PATTERNS) {
    if (test(lower)) return translation;
  }

  // Хэрэв тохирох pattern олдохгүй бол анхны мессежийг хавсаргана
  return `${fallback.replace(/\.$/, "")}: ${msg}`;
}
