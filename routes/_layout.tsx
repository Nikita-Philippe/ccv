import { PageProps } from "$fresh/server.ts";

export default function Layout({ Component, state }: PageProps) {
  // do something with state here
  return (
    <div class="px-4 py-8 mx-auto bg-blue-200">
      <nav>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/config">config</a>
          </li>
          <li>
            <a href="/settings">settings</a>
          </li>
        </ul>
      </nav>
      <Component />
    </div>
  );
}
