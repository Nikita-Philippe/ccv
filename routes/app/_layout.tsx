import { RouteContext } from "$fresh/server.ts";
import { getUserBySession } from "@utils/auth.ts";
import { IDefaultPageHandler } from "@models/App.ts";
import Toast from "@islands/UI/Toast.tsx";
import { isSuperAdmin } from "@utils/user.ts";

export default async function Layout(req: Request, ctx: RouteContext<IDefaultPageHandler>) {
  const user = await getUserBySession(req, true);
  const isSA = await isSuperAdmin(user);

  const navItems = [
    {
      name: "home",
      label: "Home",
      href: "/app",
      "f-partial": "/app",
    },
    {
      name: "stats",
      label: "Stats",
      href: "/app/stats",
      "f-partial": "/app/stats",
    },
    {
      name: "config",
      label: "Config",
      href: "/app/config",
      "f-partial": "/app/config",
    },
    {
      name: "settings",
      label: "Settings",
      href: "/app/settings",
      "f-partial": "/app/settings",
    },
    ...(isSA
      ? [{
        name: "admin",
        label: "SAdmin",
        href: "/app/admin",
        "f-partial": "/app/admin",
      }]
      : []),
    !user?.isAuthenticated
      ? ({
        name: "signin",
        label: "Sign In",
        href: "/signin",
        "f-partial": "/signin",
      })
      : ({
        name: "signout",
        label: "Sign Out",
        href: "/signout",
        "f-partial": "/signout",
      }),
  ].map((item) => ({ item, active: item.href === ctx.route }));

  return (
    <>
      <div class="max-w-2xl p-6 mx-auto relative">
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
        <div>
          <ctx.Component />
        </div>
      </div>
      {/* {ctx.data?.message && <ToasterWrapper content={{ id: "1", description: ctx.data.message }} />} */}
      {ctx.data?.message && <Toast toast={ctx.data.message} />}
    </>
  );
}
