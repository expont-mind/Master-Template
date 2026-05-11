import { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Нууцлалын бодлого",
  description:
    "Monpang-н нууцлалын бодлого. Таны хувийн мэдээллийг хэрхэн цуглуулж, хадгалж, ашигладаг талаар.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "Нууцлалын бодлого | Monpang",
    description:
      "Monpang-н нууцлалын бодлого. Таны хувийн мэдээллийг хэрхэн цуглуулж, хадгалж, ашигладаг талаар.",
    url: "https://monpang.com/privacy-policy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Нууцлалын бодлого | Monpang",
    description:
      "Monpang-н нууцлалын бодлого. Таны хувийн мэдээллийг хэрхэн цуглуулж, хадгалж, ашигладаг талаар.",
  },
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[#020617] font-semibold text-lg md:text-xl font-manrope">
        {title}
      </h2>
      <div className="text-[#64748B] font-normal text-sm md:text-base font-manrope leading-6 md:leading-7">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Нууцлалын бодлого", url: "/privacy-policy" },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="w-full bg-white flex justify-center">
        <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
          <div className="flex flex-col gap-8 md:gap-12">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-[#020617] font-bold text-2xl md:text-[28px] lg:text-[32px] leading-8 md:leading-10 font-manrope">
                Нууцлалын бодлого
              </h1>
              <p className="text-[#64748B] font-normal text-sm md:text-base font-manrope">
                Сүүлд шинэчлэгдсэн: 2025 оны 1-р сарын 12
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-8 md:gap-10">
              <Section title="1. Танилцуулга">
                <p>
                  Monpang (цаашид &quot;бид&quot;, &quot;манай&quot; гэх) нь таны хувийн
                  мэдээллийн нууцлалыг хамгаалахад онцгой анхаардаг. Энэхүү
                  нууцлалын бодлого нь манай вэбсайт болон үйлчилгээг ашиглах
                  үед таны мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг
                  талаар тайлбарладаг.
                </p>
              </Section>

              <Section title="2. Цуглуулдаг мэдээлэл">
                <div className="flex flex-col gap-4">
                  <p>Бид дараах төрлийн мэдээллийг цуглуулдаг:</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>
                      <span className="font-medium text-[#020617]">
                        Хувийн мэдээлэл:
                      </span>{" "}
                      Нэр, утасны дугаар, имэйл хаяг, хүргэлтийн хаяг
                    </li>
                    <li>
                      <span className="font-medium text-[#020617]">
                        Бүртгэлийн мэдээлэл:
                      </span>{" "}
                      Facebook, Google, Apple эсвэл утасны дугаараар нэвтрэх үед
                      авах мэдээлэл
                    </li>
                    <li>
                      <span className="font-medium text-[#020617]">
                        Захиалгын мэдээлэл:
                      </span>{" "}
                      Захиалсан бүтээгдэхүүн, төлбөрийн түүх, хүргэлтийн хаяг
                    </li>
                    <li>
                      <span className="font-medium text-[#020617]">
                        Техникийн мэдээлэл:
                      </span>{" "}
                      IP хаяг, хөтчийн төрөл, төхөөрөмжийн мэдээлэл, cookies
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="3. Мэдээлэл ашиглах зорилго">
                <div className="flex flex-col gap-4">
                  <p>Таны мэдээллийг дараах зорилгоор ашигладаг:</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Захиалга боловсруулж, хүргэлт хийх</li>
                    <li>Хэрэглэгчийн бүртгэл үүсгэх, удирдах</li>
                    <li>Төлбөр тооцоо хийх</li>
                    <li>Хэрэглэгчийн дэмжлэг үзүүлэх</li>
                    <li>Урамшуулал, мэдээллийн мессеж илгээх (таны зөвшөөрлөөр)</li>
                    <li>Вэбсайтын ажиллагааг сайжруулах</li>
                  </ul>
                </div>
              </Section>

              <Section title="4. Мэдээлэл хуваалцах">
                <div className="flex flex-col gap-4">
                  <p>
                    Бид таны хувийн мэдээллийг гуравдагч этгээдэд зарахгүй.
                    Гэхдээ дараах тохиолдолд мэдээллийг хуваалцаж болно:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>
                      <span className="font-medium text-[#020617]">
                        Хүргэлтийн түнш:
                      </span>{" "}
                      Захиалгыг хүргэхийн тулд хүргэлтийн компаниудтай хаяг,
                      холбоо барих мэдээлэл хуваалцдаг
                    </li>
                    <li>
                      <span className="font-medium text-[#020617]">
                        Төлбөрийн систем:
                      </span>{" "}
                      QPay, LendMN зэрэг төлбөрийн системүүдтэй аюулгүй
                      холболт хийдэг
                    </li>
                    <li>
                      <span className="font-medium text-[#020617]">
                        Хуулийн шаардлага:
                      </span>{" "}
                      Хуулиар шаардсан тохиолдолд холбогдох байгууллагад
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="5. Мэдээллийн аюулгүй байдал">
                <p>
                  Бид таны мэдээллийг хамгаалахын тулд SSL шифрлэлт, аюулгүй
                  серверүүд, хандалтын хяналт зэрэг техникийн болон
                  зохион байгуулалтын арга хэмжээг авч хэрэгжүүлдэг. Таны
                  нууц үг нь хэшлэгдсэн хэлбэрээр хадгалагддаг бөгөөд манай
                  ажилтнууд ч түүнийг харах боломжгүй.
                </p>
              </Section>

              <Section title="6. Cookies (Күүки)">
                <p>
                  Манай вэбсайт cookies ашигладаг. Cookies нь таны төхөөрөмжид
                  хадгалагдах жижиг текст файл бөгөөд вэбсайтын ажиллагааг
                  сайжруулах, таныг дахин орж ирэхэд таних зорилгоор
                  ашиглагддаг. Та хөтчийнхөө тохиргооноос cookies-г
                  идэвхгүй болгох боломжтой.
                </p>
              </Section>

              <Section title="7. Таны эрх">
                <div className="flex flex-col gap-4">
                  <p>Та дараах эрхтэй:</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Өөрийн хувийн мэдээллийг үзэх, засварлах</li>
                    <li>Бүртгэлээ устгуулах хүсэлт гаргах</li>
                    <li>Маркетингийн мессежээс татгалзах</li>
                    <li>Өөрийн мэдээллийн хуулбар авах</li>
                  </ul>
                  <p>
                    Эдгээр эрхээ хэрэгжүүлэхийн тулд бидэнтэй холбоо барина уу.
                  </p>
                </div>
              </Section>

              <Section title="8. Гуравдагч этгээдийн үйлчилгээ">
                <p>
                  Манай вэбсайт Facebook, Google, Apple зэрэг гуравдагч
                  этгээдийн нэвтрэх үйлчилгээг ашигладаг. Эдгээр үйлчилгээг
                  ашиглахад тухайн компаниудын нууцлалын бодлого хамаарна.
                  Бид таныг эдгээр үйлчилгээний нууцлалын бодлоготой танилцахыг
                  зөвлөж байна.
                </p>
              </Section>

              <Section title="9. Хүүхдийн нууцлал">
                <p>
                  Манай үйлчилгээ 16 нас хүрээгүй хүүхдэд зориулагдаагүй.
                  Бид 16 наснаас доош хүүхдээс мэдсээр байж хувийн мэдээлэл
                  цуглуулдаггүй. Хэрэв эцэг эх, асран хамгаалагч нь хүүхдийнхээ
                  мэдээллийг устгуулахыг хүсвэл бидэнтэй холбогдоно уу.
                </p>
              </Section>

              <Section title="10. Бодлогын өөрчлөлт">
                <p>
                  Бид энэхүү нууцлалын бодлогыг шинэчлэх эрхтэй. Томоохон
                  өөрчлөлт хийсэн тохиолдолд вэбсайтаар дамжуулан мэдэгдэнэ.
                  Үйлчилгээг үргэлжлүүлэн ашиглах нь шинэ бодлогыг зөвшөөрсөн
                  гэж үзнэ.
                </p>
              </Section>

              <Section title="11. Холбоо барих">
                <div className="flex flex-col gap-4">
                  <p>
                    Нууцлалын бодлоготой холбоотой асуулт байвал бидэнтэй
                    холбогдоно уу:
                  </p>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 md:p-6 flex flex-col gap-2">
                    <p className="text-[#020617] font-medium">Monpang</p>
                    <p>Имэйл: info@monpang.com</p>
                    <p>Утас: +976 7700-0000</p>
                    <p>Хаяг: Улаанбаатар хот</p>
                  </div>
                </div>
              </Section>
            </div>

            {/* Footer link */}
            <div className="pt-6 border-t border-[#E2E8F0]">
              <Link
                href="/"
                className="text-[#020617] font-medium text-sm md:text-base font-manrope underline hover:text-[#64748B] transition-colors duration-200"
              >
                ← Нүүр хуудас руу буцах
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
