import { useEffect, useRef } from "preact/hooks";

const START = 0.2;
const END = 0.4;
const STEPS = 20;
const HEADER_THRESHOLD_ACTIVATION = 0.5;

const normalizeValue = (
  value: number,
  valMin: number,
  valMax: number,
  finalMin: number = 0,
  finalMax: number = 100,
) => {
  return ((value - valMin) / (valMax - valMin)) * (finalMax - finalMin) + finalMin;
};

export default function HeroSection() {
  const heroSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroSectionRef.current) return;

    const hero = heroSectionRef.current;

    const cfg = {
      root: null,
      threshold: Array.from({ length: STEPS }).map((_, i) => normalizeValue(i, 0, STEPS, START, END)),
    };

    const observer = new IntersectionObserver(([entry], _observer) => {
      if (!entry) return;
      const section = entry.target as HTMLDivElement;
      const header = section.querySelector("header");
      if (!header) return;

      const ratio = normalizeValue(entry.intersectionRatio, START, END, 100, 0);

      // Adds a tiny threshold to avoid header not appearing/disappearing totally
      if (ratio <= 20) {
        header.style.pointerEvents = "none";
        header.style.opacity = `0%`;
      } else if (ratio <= 120) {
        if (ratio >= (HEADER_THRESHOLD_ACTIVATION * 100)) header.style.pointerEvents = "auto";
        else header.style.pointerEvents = "none";
        header.style.opacity = `${ratio}%`;
      } else {
        header.style.pointerEvents = "auto";
        header.style.opacity = `100%`;
      }
    }, cfg);

    observer.observe(hero);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={heroSectionRef} class="flex flex-col gap-8 md:gap-12 items-center mt-6">
      <a href="/" class="flex w-full h-full max-w-36 md:max-w-52">
        <img id="header_logo_first" class="max-w-full max-h-full" src="/logo/logo.svg" alt="CCV" />
      </a>
      <h1 id="header_text_first" class="text-3xl font-semibold max-w-2xl text-center">
        A simple, data-focused, free and privacy-first habits tracker.
      </h1>
      <div class="flex flex-col items-center gap-1">
        <button
          id="header_app_first"
          type="button"
          class="btn text-xl md:text-2xl font-bold rounded-full px-5 py-4 w-fit h-fit"
        >
          <a href="/app">Create your first habits in 30s.</a>
        </button>
        <span class="text-sm">no account required</span>
      </div>
      <button type="button" class="btn text-lg md:text-xl font-semibold rounded-full px-3 py-1 w-fit h-fit">
        <a href="#features">Features</a>
      </button>
      <img
        class="max-h-[500px]"
        src="/assets/homepage/herosection.png"
        alt="Presentation app homepage CCV"
        style={{
          mask: "none, linear-gradient( #fff 90%, #0000 100%)",
          maskComposite: "intersect",
        }}
      />

      <header
        class="fixed top-[var(--banner-height,0)] left-0 w-screen opacity-100 pointer-events-auto flex justify-between items-center gap-4 p-4 2xl:px-[20vw] bg-white shadow-xs z-50">
        <a class="w-1/6 flex justify-start" href="/">
          <img id="header_logo_end" class="max-w-full max-h-[2em]" src="/logo/logo.svg" alt="CCV" />
        </a>
        <h1 id="header_text_end" class="text-xl grow font-semibold max-w-2xl hidden md:block text-center">
          A simple, data-focused, free and privacy-first habits tracker
        </h1>
        <div class="w-1/6 flex justify-end">
          <button
            id="header_app_end"
            type="button"
            class="btn text-lg font-bold rounded-full px-4 py-2 w-fit ml-auto h-fit whitespace-nowrap"
          >
            <a href="/app">Try for free</a>
          </button>
        </div>
      </header>
    </div>
  );
}
