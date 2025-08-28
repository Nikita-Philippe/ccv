import { DateTime } from "luxon";

export default function Footer() {
  return (
    <div class="w-full max-w-screen flex items-center justify-center p-6 px-20 2xl:px-[20vw] relative mt-36 shadow-2xl">
      <a class="link link-hover absolute left-6 2xl:left-[20vw] top-1/2 -translate-y-1/2" href="/releases" target="_blank" rel="noopener noreferrer">
        Releases
      </a>
      <a class="link link-hover" href="/privacy-policy" target="_blank" rel="noopener noreferrer">
        CCV @ {DateTime.now().year}
      </a>
      <a
        class="absolute right-6 2xl:right-[20vw] top-1/2 -translate-y-1/2"
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
    </div>
  );
}
