import { ReactNode } from 'react';

type SlideFrameProps = {
  eyebrow: string;
  logo?: ReactNode;
  title: string;
  accent?: string;
  description: string;
  children: ReactNode;
  maxWidth?: string;
};

export function SlideFrame({
  eyebrow,
  logo,
  title,
  accent,
  description,
  children,
  maxWidth = 'max-w-2xl',
}: SlideFrameProps) {
  return (
    <div className="min-h-full grid grid-cols-1 md:grid-cols-2 items-center text-white relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 md:gap-3">
        {logo}
        <div className="font-mono text-[10px] md:text-xs tracking-widest text-white/35 uppercase">
          {eyebrow}
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 pt-20 pb-6 md:px-16 md:py-28 lg:px-20">
        <div className="max-w-md">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] tracking-normal">
            {title}
            {accent && (
              <>
                <br />
                <span className="font-medium text-[#A855F7]">{accent}</span>
              </>
            )}
          </h1>
          <p className="mt-6 md:mt-8 max-w-xs text-sm md:text-base leading-relaxed text-white/62">
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 pb-6 md:p-8 md:pr-16">
        <div
          className={`w-full ${maxWidth} border border-white/10 shadow-2xl shadow-black/30`}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.035)',
            borderRadius: '32px',
            padding: '24px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
