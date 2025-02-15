import { PageProps } from "$fresh/server.ts";

export default function Layout({ Component, state, route }: PageProps) {
  const navItems = [
    {
      name: "home",
      label: "Home",
      href: "/",
      "f-partial": "/",
    },
    {
      name: "config",
      label: "config",
      href: "/config",
      "f-partial": "/config",
    },
    {
      name: "settings",
      label: "settings",
      href: "/settings",
      "f-partial": "/settings",
    },
  ].map((item) => ({ item, active: item.href === route }));

  return (
    <div class="max-w-2xl p-6 mx-auto">
      <div role="tablist" className="tabs pb-4">
        {navItems.map(({ item, active }) => (
          <a
            role="tab"
            className={`px-0 pr-8 tab ${active ? "tab-active" : ""}`}
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </div>
      <div class={""}>
        <Component />
      </div>
    </div>
  );
}
