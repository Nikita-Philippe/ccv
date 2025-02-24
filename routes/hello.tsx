import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  // FIXME: for now set layout to have a navifation while page is created
  // skipInheritedLayouts: true, // Skip already inherited layouts
};

export default function Hello() {
  return (
    <div class="max-w-2xl p-6 mx-auto relative">
      <p>TODO: hello page</p>
    </div>
  );
}
