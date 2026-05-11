import { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл",
  description:
    "Monpang-н үйлчилгээний нөхцөл. Вэбсайт болон үйлчилгээг ашиглах дүрэм, журам.",
  alternates: {
    canonical: "/terms-of-service",
  },
  openGraph: {
    title: "Үйлчилгээний нөхцөл | Monpang",
    description:
      "Monpang-н үйлчилгээний нөхцөл. Вэбсайт болон үйлчилгээг ашиглах дүрэм, журам.",
    url: "https://monpang.com/terms-of-service",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Үйлчилгээний нөхцөл | Monpang",
    description:
      "Monpang-н үйлчилгээний нөхцөл. Вэбсайт болон үйлчилгээг ашиглах дүрэм, журам.",
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

export default function TermsOfServicePage() {
  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Үйлчилгээний нөхцөл", url: "/terms-of-service" },
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
                Үйлчилгээний нөхцөл
              </h1>
              <p className="text-[#64748B] font-normal text-sm md:text-base font-manrope">
                Сүүлд шинэчлэгдсэн: 2025 оны 1-р сарын 12
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-8 md:gap-10">
              <Section title="1. Ерөнхий зүйл">
                <p>
                  Эдгээр үйлчилгээний нөхцөл нь Monpang (цаашид &quot;бид&quot;,
                  &quot;манай&quot; гэх) вэбсайт болон үйлчилгээг ашиглахтай
                  холбоотой таны эрх, үүргийг тодорхойлно. Манай вэбсайтад
                  нэвтэрч, үйлчилгээг ашигласнаар та эдгээр нөхцөлийг хүлээн
                  зөвшөөрсөнд тооцогдоно.
                </p>
              </Section>

              <Section title="2. Бүртгэл">
                <div className="flex flex-col gap-4">
                  <p>
                    Манай үйлчилгээг бүрэн ашиглахын тулд бүртгүүлэх
                    шаардлагатай:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Үнэн зөв мэдээлэл өгөх үүрэгтэй</li>
                    <li>
                      Бүртгэлийн мэдээллээ (нууц үг гэх мэт) нууцлах үүрэгтэй
                    </li>
                    <li>
                      Таны бүртгэлээр хийгдсэн бүх үйлдэлд та хариуцлага хүлээнэ
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="3. Захиалга ба төлбөр">
                <div className="flex flex-col gap-4">
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Бүтээгдэхүүний үнэ, бэлэн байдал өөрчлөгдөж болно</li>
                    <li>
                      Захиалга баталгаажсан тохиолдолд бид имэйл эсвэл SMS-ээр
                      мэдэгдэнэ
                    </li>
                    <li>
                      Төлбөрийг QPay, LendMN, банкны шилжүүлэг зэрэг аргаар хийх
                      боломжтой
                    </li>
                    <li>
                      Захиалга цуцлах бол хүргэлт эхлэхээс өмнө мэдэгдэх
                      шаардлагатай
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="4. Хүргэлт">
                <div className="flex flex-col gap-4">
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>
                      Хүргэлтийн хугацаа бүс нутаг, захиалгын хэмжээнээс
                      хамаарна
                    </li>
                    <li>Хүргэлтийн хаягийг зөв оруулах нь таны үүрэг юм</li>
                    <li>
                      Буруу хаягийн улмаас учирсан саатал, нэмэлт зардлыг
                      хариуцахгүй
                    </li>
                    <li>
                      Хүргэлтийн үед байхгүй бол дахин хүргэлтийн төлбөр гарч
                      болно
                    </li>
                  </ul>
                </div>
              </Section>

              <Section title="5. Буцаалт ба солилт">
                <div className="flex flex-col gap-4">
                  <p>Дараах тохиолдолд буцаалт, солилт хийж болно:</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>
                      Бүтээгдэхүүн гэмтэлтэй, чанарын шаардлага хангаагүй бол
                    </li>
                    <li>Буруу бүтээгдэхүүн хүргэгдсэн бол</li>
                    <li>
                      Хүлээн авснаас хойш 7 хоногийн дотор хүсэлт гаргах ёстой
                    </li>
                    <li>
                      Бүтээгдэхүүн ашиглаагүй, анхны савлагаатай байх ёстой
                    </li>
                  </ul>
                  <p className="text-[#020617] font-medium">
                    Буцаалт хийхгүй бүтээгдэхүүн:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Хүнсний бүтээгдэхүүн</li>
                    <li>Хувийн эрүүл ахуйн бүтээгдэхүүн</li>
                    <li>Тусгай захиалгаар хийсэн бүтээгдэхүүн</li>
                  </ul>
                </div>
              </Section>

              <Section title="6. Оюуны өмч">
                <p>
                  Вэбсайт дээрх бүх контент (лого, зураг, текст, дизайн) нь
                  Monpang-н өмч юм. Зөвшөөрөлгүйгээр хуулбарлах, тараах, өөрчлөх
                  хориотой. Бүтээгдэхүүний зураг нь жинхэнэ бүтээгдэхүүнээс бага
                  зэрэг ялгаатай харагдаж болно.
                </p>
              </Section>

              <Section title="7. Хэрэглэгчийн үүрэг">
                <div className="flex flex-col gap-4">
                  <p>Та дараах зүйлийг хийхгүй байх үүрэгтэй:</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Хуурамч мэдээлэл оруулах</li>
                    <li>Бусдын бүртгэлийг ашиглах</li>
                    <li>Вэбсайтын аюулгүй байдалд халдах</li>
                    <li>Автомат програм ашиглан өгөгдөл цуглуулах</li>
                    <li>Хууль бус зорилгоор ашиглах</li>
                  </ul>
                </div>
              </Section>

              <Section title="8. Хязгаарлалт">
                <div className="flex flex-col gap-4">
                  <p>Бид дараах зүйлд хариуцлага хүлээхгүй:</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Интернэт холболт, серверийн алдаанаас үүдсэн саатал</li>
                    <li>Гуравдагч этгээдийн вэбсайт, үйлчилгээний алдаа</li>
                    <li>Давагдашгүй хүчин зүйлээс үүдсэн асуудал</li>
                    <li>Хэрэглэгчийн буруугаас үүдсэн алдагдал</li>
                  </ul>
                </div>
              </Section>

              <Section title="9. Бүртгэл цуцлах">
                <p>
                  Та хүссэн үедээ бүртгэлээ устгуулах хүсэлт гаргах эрхтэй.
                  Үйлчилгээний нөхцөл зөрчсөн тохиолдолд бид таны бүртгэлийг
                  урьдчилан мэдэгдэлгүй хаах эрхтэй. Бүртгэл хаагдсан тохиолдолд
                  дуусаагүй захиалга, хөнгөлөлтийн эрх хүчингүй болно.
                </p>
              </Section>

              <Section title="10. Нөхцөлийн өөрчлөлт">
                <p>
                  Бид эдгээр үйлчилгээний нөхцөлийг хүссэн үедээ өөрчлөх эрхтэй.
                  Өөрчлөлт хийсэн тохиолдолд вэбсайтад нийтлэх бөгөөд үйлчилгээг
                  үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг хүлээн зөвшөөрсөн гэж
                  үзнэ.
                </p>
              </Section>

              <Section title="11. Хууль зүйн зохицуулалт">
                <p>
                  Эдгээр үйлчилгээний нөхцөл нь Монгол Улсын хуулиар
                  зохицуулагдана. Маргаан гарсан тохиолдолд талууд эхлээд
                  хэлэлцээрээр шийдвэрлэхийг хичээнэ. Хэлэлцээрээр
                  шийдвэрлэгдэхгүй бол Монгол Улсын шүүхээр шийдвэрлүүлнэ.
                </p>
              </Section>

              <Section title="12. Холбоо барих">
                <div className="flex flex-col gap-4">
                  <p>
                    Үйлчилгээний нөхцөлтэй холбоотой асуулт байвал бидэнтэй
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

            {/* Footer links */}
            <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="text-[#020617] font-medium text-sm md:text-base font-manrope underline hover:text-[#64748B] transition-colors duration-200"
              >
                ← Нүүр хуудас руу буцах
              </Link>
              <Link
                href="/privacy-policy"
                className="text-[#64748B] font-medium text-sm md:text-base font-manrope underline hover:text-[#020617] transition-colors duration-200"
              >
                Нууцлалын бодлого
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
