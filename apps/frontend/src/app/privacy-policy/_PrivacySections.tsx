import { SITE } from "@repo/config-site";

import { BRAND } from "@/lib/utils/brand-config";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function PrivacySection({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-text-primary font-semibold text-lg md:text-xl font-manrope">{title}</h2>
      <div className="text-text-secondary font-normal text-sm md:text-base font-manrope leading-6 md:leading-7">
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-text-primary">{children}</span>;
}

export function IntroSection() {
  return (
    <PrivacySection title="1. Танилцуулга">
      <p>
        {BRAND.name} (цаашид &quot;бид&quot;, &quot;манай&quot; гэх) нь таны хувийн мэдээллийн
        нууцлалыг хамгаалахад онцгой анхаардаг. Энэхүү нууцлалын бодлого нь манай вэбсайт болон
        үйлчилгээг ашиглах үед таны мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг талаар
        тайлбарладаг.
      </p>
    </PrivacySection>
  );
}

export function CollectedDataSection() {
  return (
    <PrivacySection title="2. Цуглуулдаг мэдээлэл">
      <div className="flex flex-col gap-4">
        <p>Бид дараах төрлийн мэдээллийг цуглуулдаг:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <Label>Хувийн мэдээлэл:</Label> Нэр, утасны дугаар, имэйл хаяг, хүргэлтийн хаяг
          </li>
          <li>
            <Label>Бүртгэлийн мэдээлэл:</Label> Facebook, Google, Apple эсвэл утасны дугаараар
            нэвтрэх үед авах мэдээлэл
          </li>
          <li>
            <Label>Захиалгын мэдээлэл:</Label> Захиалсан бүтээгдэхүүн, төлбөрийн түүх, хүргэлтийн
            хаяг
          </li>
          <li>
            <Label>Техникийн мэдээлэл:</Label> IP хаяг, хөтчийн төрөл, төхөөрөмжийн мэдээлэл,
            cookies
          </li>
        </ul>
      </div>
    </PrivacySection>
  );
}

export function DataUsageSection() {
  return (
    <PrivacySection title="3. Мэдээлэл ашиглах зорилго">
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
    </PrivacySection>
  );
}

export function DataSharingSection() {
  return (
    <PrivacySection title="4. Мэдээлэл хуваалцах">
      <div className="flex flex-col gap-4">
        <p>
          Бид таны хувийн мэдээллийг гуравдагч этгээдэд зарахгүй. Гэхдээ дараах тохиолдолд
          мэдээллийг хуваалцаж болно:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <Label>Хүргэлтийн түнш:</Label> Захиалгыг хүргэхийн тулд хүргэлтийн компаниудтай хаяг,
            холбоо барих мэдээлэл хуваалцдаг
          </li>
          <li>
            <Label>Төлбөрийн систем:</Label> QPay, LendMN зэрэг төлбөрийн системүүдтэй аюулгүй
            холболт хийдэг
          </li>
          <li>
            <Label>Хуулийн шаардлага:</Label> Хуулиар шаардсан тохиолдолд холбогдох байгууллагад
          </li>
        </ul>
      </div>
    </PrivacySection>
  );
}

export function SecuritySection() {
  return (
    <PrivacySection title="5. Мэдээллийн аюулгүй байдал">
      <p>
        Бид таны мэдээллийг хамгаалахын тулд SSL шифрлэлт, аюулгүй серверүүд, хандалтын хяналт зэрэг
        техникийн болон зохион байгуулалтын арга хэмжээг авч хэрэгжүүлдэг. Таны нууц үг нь
        хэшлэгдсэн хэлбэрээр хадгалагддаг бөгөөд манай ажилтнууд ч түүнийг харах боломжгүй.
      </p>
    </PrivacySection>
  );
}

export function CookiesSection() {
  return (
    <PrivacySection title="6. Cookies (Күүки)">
      <p>
        Манай вэбсайт cookies ашигладаг. Cookies нь таны төхөөрөмжид хадгалагдах жижиг текст файл
        бөгөөд вэбсайтын ажиллагааг сайжруулах, таныг дахин орж ирэхэд таних зорилгоор ашиглагддаг.
        Та хөтчийнхөө тохиргооноос cookies-г идэвхгүй болгох боломжтой.
      </p>
    </PrivacySection>
  );
}

export function UserRightsSection() {
  return (
    <PrivacySection title="7. Таны эрх">
      <div className="flex flex-col gap-4">
        <p>Та дараах эрхтэй:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>Өөрийн хувийн мэдээллийг үзэх, засварлах</li>
          <li>Бүртгэлээ устгуулах хүсэлт гаргах</li>
          <li>Маркетингийн мессежээс татгалзах</li>
          <li>Өөрийн мэдээллийн хуулбар авах</li>
        </ul>
        <p>Эдгээр эрхээ хэрэгжүүлэхийн тулд бидэнтэй холбоо барина уу.</p>
      </div>
    </PrivacySection>
  );
}

export function ThirdPartySection() {
  return (
    <PrivacySection title="8. Гуравдагч этгээдийн үйлчилгээ">
      <p>
        Манай вэбсайт Facebook, Google, Apple зэрэг гуравдагч этгээдийн нэвтрэх үйлчилгээг
        ашигладаг. Эдгээр үйлчилгээг ашиглахад тухайн компаниудын нууцлалын бодлого хамаарна. Бид
        таныг эдгээр үйлчилгээний нууцлалын бодлоготой танилцахыг зөвлөж байна.
      </p>
    </PrivacySection>
  );
}

export function ChildrenPrivacySection() {
  return (
    <PrivacySection title="9. Хүүхдийн нууцлал">
      <p>
        Манай үйлчилгээ 16 нас хүрээгүй хүүхдэд зориулагдаагүй. Бид 16 наснаас доош хүүхдээс мэдсээр
        байж хувийн мэдээлэл цуглуулдаггүй. Хэрэв эцэг эх, асран хамгаалагч нь хүүхдийнхээ
        мэдээллийг устгуулахыг хүсвэл бидэнтэй холбогдоно уу.
      </p>
    </PrivacySection>
  );
}

export function PolicyChangesSection() {
  return (
    <PrivacySection title="10. Бодлогын өөрчлөлт">
      <p>
        Бид энэхүү нууцлалын бодлогыг шинэчлэх эрхтэй. Томоохон өөрчлөлт хийсэн тохиолдолд
        вэбсайтаар дамжуулан мэдэгдэнэ. Үйлчилгээг үргэлжлүүлэн ашиглах нь шинэ бодлогыг зөвшөөрсөн
        гэж үзнэ.
      </p>
    </PrivacySection>
  );
}

export function ContactSection() {
  return (
    <PrivacySection title="11. Холбоо барих">
      <div className="flex flex-col gap-4">
        <p>Нууцлалын бодлоготой холбоотой асуулт байвал бидэнтэй холбогдоно уу:</p>
        <div className="bg-surface border border-border rounded-lg p-4 md:p-6 flex flex-col gap-2">
          <p className="text-text-primary font-medium">{BRAND.name}</p>
          <p>Имэйл: {SITE.legal.privacyEmail}</p>
          <p>Утас: {SITE.contact.phone}</p>
          <p>Хаяг: {SITE.contact.address}</p>
        </div>
      </div>
    </PrivacySection>
  );
}
