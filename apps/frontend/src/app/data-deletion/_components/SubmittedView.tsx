import Link from "next/link";

export function SubmittedView() {
  return (
    <div className="w-full bg-white flex justify-center min-h-[60vh]">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-text-primary font-bold text-2xl md:text-[28px] font-manrope">
              Хүсэлт илгээгдлээ
            </h1>
            <p className="text-text-secondary font-normal text-base font-manrope max-w-md">
              Таны өгөгдөл устгах хүсэлтийг хүлээн авлаа. Бид 30 хоногийн дотор таны хүсэлтийг
              шийдвэрлэж, имэйлээр мэдэгдэх болно.
            </p>
          </div>
          <Link
            href="/"
            className="mt-4 px-6 py-2.5 bg-text-primary text-white font-medium text-base font-manrope rounded-sm hover:bg-surface-dark transition-colors duration-200"
          >
            Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    </div>
  );
}
