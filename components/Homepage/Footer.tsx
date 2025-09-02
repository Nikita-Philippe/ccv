export default function Footer() {
  return (
    <div class="w-full max-w-screen flex items-center justify-center p-6 px-20 2xl:px-[20vw] relative mt-36 shadow-2xl">
      <a
        class="link link-hover absolute left-6 2xl:left-[20vw] top-1/2 -translate-y-1/2"
        href="/releases"
        target="_blank"
        rel="noopener noreferrer"
      >
        Releases
      </a>
      <div className="flex flex-col gap-0.5 items-center">
        <a class="flex justify-center w-full" href="/">
          <img id="header_logo_end" class="max-w-full max-h-[1.8em]" src="/logo/logo.svg" alt="CCV" />
        </a>
        <a class="link link-hover text-xs opacity-50" href="/privacy-policy" target="_blank" rel="noopener noreferrer">
          All rights reserved
        </a>
      </div>
      <div class="absolute right-6 2xl:right-[20vw] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 items-end">
        <a
          class="w-fit"
          href="https://github.com/Nikita-Philippe"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://avatars.githubusercontent.com/u/54618484?v=4"
            alt="Nikita Philippe"
            className="rounded-full w-8 h-8"
          />
        </a>
        <div class="text-xs opacity-70 flex gap-0.5">
          <p class="hidden sm:block">
            Logo by
          </p>
          <a
            class="link"
            href="https://www.instagram.com/troispetitsbruns"
            target="_blank"
            rel="noopener noreferrer"
          >
            troispetitsbruns
          </a>
        </div>
      </div>
    </div>
  );
}
