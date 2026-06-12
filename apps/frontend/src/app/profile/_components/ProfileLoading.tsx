export const ProfileLoading = () => {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-12 px-4 md:px-6 lg:px-0">
        <p className="px-0.5 pb-2 pt-6 md:pt-10 lg:pt-[52px] text-text-primary font-bold text-xl md:text-2xl lg:text-[26px] leading-7 md:leading-8 lg:leading-9 font-manrope">
          Профайл
        </p>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
};
