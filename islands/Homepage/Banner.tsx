import { IconAlertTriangle, IconX } from "@icons";
import { useState, useRef, useEffect } from "preact/hooks";

export default function Banner() {
  const [dismissed, setDismissed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner || !globalThis.document.body) return;

    const setBannerHeight = () => {
      if (!banner) return;
      globalThis.document.body.style.setProperty('--banner-height', banner.offsetHeight + 'px');
    }

    setBannerHeight();
    globalThis.addEventListener("resize", setBannerHeight);

    return () => {
      globalThis.removeEventListener("resize", setBannerHeight);
      globalThis.document.body.style.removeProperty('--banner-height');
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true);
    globalThis.document.body.style.setProperty('--banner-height', '0px');
  }

  return !dismissed
    ? (
      <div
        ref={bannerRef}
        role="alert"
        class="w-screen max-w-screen flex items-center justify-center p-3.5 pr-6 fixed top-0 left-0 z-50"
        // Same bg color as 'alert-warning alert-soft' from daisyui
        style="background: color-mix( in oklab, var(--color-warning, var(--color-base-content)) 20%, var(--color-base-100) )"
      >
        <div class="flex gap-4 justify-center w-11/12">
          {/* @ts-ignore */}
          <IconAlertTriangle class="h-6 w-6 shrink-0 stroke-current" />
          <span>
            CCV is still in alpha, so features are unstables and subject to change. Please make regular backups, and
            lookout for new content release !
          </span>
        </div>
        {/* @ts-ignore */}
        <IconX class="absolute top-2 right-2 cursor-pointer" onClick={handleDismiss} />
      </div>
    )
    : null;
}
