import { Head } from "$fresh/runtime.ts";
import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  skipInheritedLayouts: true, // Skip already inherited layouts
};

export default function Error404(req: Request) {
  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  const redirectTo = url.searchParams.get("redirectTo");

  return (
    <>
      <Head>
        <title>CCV - An error occured</title>
      </Head>
      <div class="max-w-2xl p-6 mx-auto relative h-screen flex flex-col justify-center  gap-4">
        <h1>Oooops... sorry!</h1>
        {error ? <p>{decodeURIComponent(error)}</p> : <p>It seems that the page you are looking for does not exist...</p>}
        {redirectTo
          ? (
            <p>
              <button class={"btn w-fit"}>
                <a href={redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`}>
                  Go back
                </a>
              </button>
            </p>
          )
          : (
            <p>
              <button class={"btn w-fit"}>
                <a href="/">Go to homepage</a>
              </button>
            </p>
          )}
      </div>
    </>
  );
}
