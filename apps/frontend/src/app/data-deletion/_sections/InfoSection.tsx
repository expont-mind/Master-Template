import Link from "next/link";

export function InfoSection() {
  return (
    <>
      {/* Info section */}
      <div className="flex flex-col gap-4 pt-6 border-t border-border max-w-2xl">
        <h2 className="text-text-primary font-semibold text-lg font-manrope">Юу устгагдах вэ?</h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary font-normal text-sm md:text-base font-manrope pl-2">
          <li>Таны бүртгэлийн мэдээлэл (нэр, имэйл, утас)</li>
          <li>Захиалгын түүх</li>
          <li>Хадгалсан бүтээгдэхүүн (wishlist)</li>
          <li>Хүргэлтийн хаягууд</li>
          <li>Facebook, Google холболт</li>
        </ul>
      </div>

      {/* Footer links */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="text-text-primary font-medium text-sm md:text-base font-manrope underline hover:text-text-secondary transition-colors duration-200"
        >
          ← Нүүр хуудас руу буцах
        </Link>
        <Link
          href="/privacy-policy"
          className="text-text-secondary font-medium text-sm md:text-base font-manrope underline hover:text-text-primary transition-colors duration-200"
        >
          Нууцлалын бодлого
        </Link>
      </div>
    </>
  );
}
