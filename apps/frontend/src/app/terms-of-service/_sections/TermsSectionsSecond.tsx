import { SITE } from "@repo/config-site";

import { Section } from "@/app/terms-of-service/_components/Section";
import { BRAND } from "@/lib/utils/brand-config";

export function TermsSectionsSecond() {
  return (
    <>
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
          Та хүссэн үедээ бүртгэлээ устгуулах хүсэлт гаргах эрхтэй. Үйлчилгээний нөхцөл зөрчсөн
          тохиолдолд бид таны бүртгэлийг урьдчилан мэдэгдэлгүй хаах эрхтэй. Бүртгэл хаагдсан
          тохиолдолд дуусаагүй захиалга, хөнгөлөлтийн эрх хүчингүй болно.
        </p>
      </Section>

      <Section title="10. Нөхцөлийн өөрчлөлт">
        <p>
          Бид эдгээр үйлчилгээний нөхцөлийг хүссэн үедээ өөрчлөх эрхтэй. Өөрчлөлт хийсэн тохиолдолд
          вэбсайтад нийтлэх бөгөөд үйлчилгээг үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг хүлээн
          зөвшөөрсөн гэж үзнэ.
        </p>
      </Section>

      <Section title="11. Хууль зүйн зохицуулалт">
        <p>
          Эдгээр үйлчилгээний нөхцөл нь Монгол Улсын хуулиар зохицуулагдана. Маргаан гарсан
          тохиолдолд талууд эхлээд хэлэлцээрээр шийдвэрлэхийг хичээнэ. Хэлэлцээрээр шийдвэрлэгдэхгүй
          бол Монгол Улсын шүүхээр шийдвэрлүүлнэ.
        </p>
      </Section>

      <Section title="12. Холбоо барих">
        <div className="flex flex-col gap-4">
          <p>Үйлчилгээний нөхцөлтэй холбоотой асуулт байвал бидэнтэй холбогдоно уу:</p>
          <div className="bg-surface border border-border rounded-lg p-4 md:p-6 flex flex-col gap-2">
            <p className="text-text-primary font-medium">{BRAND.name}</p>
            <p>Имэйл: {SITE.legal.privacyEmail}</p>
            <p>Утас: {SITE.contact.phone}</p>
            <p>Хаяг: {SITE.contact.address}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
