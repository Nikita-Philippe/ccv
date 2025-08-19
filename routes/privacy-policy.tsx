import Header from "@components/Homepage/Header.tsx";
import Footer from "@components/Homepage/Footer.tsx";

export default async function PrivacyPolicy(req: Request) {

  const privacyPolicyExists = await Deno.stat("./static/privacy-policy.html")

  if (!privacyPolicyExists?.isFile) return Response.redirect(req.url.replace("/privacy-policy", ""), 301);

  return (
    <div class="h-screen flex flex-col gap-10">
      <Header />
      <iframe
        src="/privacy-policy.html"
        class="w-full max-w-[90vw] md:max-w-4xl px-0 md:px-4 mx-auto -mb-36 grow"
        title="Privacy Policy"
        sandbox="allow-same-origin"
        loading="lazy"
      />
      <Footer />
    </div>
  );
}
