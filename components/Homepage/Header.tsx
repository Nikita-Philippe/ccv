export default function Header() {
  return (
    <header class="w-screen opacity-100 pointer-events-auto flex justify-between items-center gap-4 p-4 2xl:px-[20vw] bg-white shadow-xs z-50">
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
  );
}
