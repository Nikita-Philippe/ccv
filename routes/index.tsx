import Banner from "@islands/Homepage/Banner.tsx";
import HeroSection from "@islands/Homepage/Hero.tsx";
import Features from "@components/Homepage/Features.tsx";
import Roadmap from "@components/Homepage/Roadmap.tsx";
import About from "@components/Homepage/About.tsx";
import Contact from "@components/Homepage/Contact.tsx";
import { Handlers, RouteContext } from "$fresh/server.ts";
import { IDefaultPageHandler } from "@models/App.ts";
import Toast from "@islands/UI/Toast.tsx";
import { NotificationService } from "@utils/notifications.ts";
import FAQ from "@components/Homepage/Faq.tsx";
import Footer from "@components/Homepage/Footer.tsx";

export const handler: Handlers<IDefaultPageHandler & { redirect?: string }> = {
  async POST(req, ctx) {
    const form = await req.formData();

    const { action, ...restForm } = Object.fromEntries(form);

    // Send contact form
    if (action === "contact") {

      const name = restForm.name?.toString();
      const email = restForm.email?.toString();
      const subject = restForm.subject?.toString();
      const message = restForm.message?.toString();
      const cgu = restForm.cgu === "on";

      if (!name || !email || !subject || !message || !cgu) return await ctx.render({ message: { type: "error", message: "Please fill all fields and accept the CGU." } });
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return await ctx.render({ message: { type: "error", message: "Please provide a valid email address." } });

      const emailMessage = [
        `You have a new message from "${name}" (${email})`,
        `Subject: ${subject}`,
        `Message: ${message}`,
        `CGU accepted: ${cgu ? "Yes" : "No"}`,
      ].join("<br /><br />");

      const res = await NotificationService.sendAdminEmail({ event: "contact", email: { from: email, body: emailMessage }})

      if (!res?.id) return await ctx.render({ message: { type: "error", message: "An error occurred while sending your message. Please try again later." } });

      return await ctx.render({ message: { type: "success", message: "Thanks for reaching out ! We will answer you as soon as possible." } });
    }

    return await ctx.render();
  },
};

// deno-lint-ignore require-await
export default async function Home(_: Request, ctx: RouteContext<IDefaultPageHandler>) {
  return (
    <>
      <Banner />
      <div class="w-full max-w-[90vw] md:max-w-4xl px-0 md:px-4 mx-auto mt-[var(--banner-height,0)]">
        <div class="flex flex-col items-center gap-24 md:gap-36">
          <HeroSection />
          <Features />
          <Roadmap />
          <About />
          <Contact />
          <FAQ />
        </div>
      </div>
      <Footer />
      {ctx.data?.message && <Toast toast={ctx.data.message} />}
    </>
  );
}
