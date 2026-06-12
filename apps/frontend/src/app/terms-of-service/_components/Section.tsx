interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-text-primary font-semibold text-lg md:text-xl font-manrope">{title}</h2>
      <div className="text-text-secondary font-normal text-sm md:text-base font-manrope leading-6 md:leading-7">
        {children}
      </div>
    </div>
  );
}
