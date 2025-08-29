import Card from "../UI/Card.tsx";

export default function About() {
  return (
    <div class="flex flex-col gap-5 items-center max-w-full">
      <h2 id="about" class="text-3xl font-semibold">
        <a class="link link-hover" href="#about">The project</a>
      </h2>
      <Card
        sx={{
          container: `w-full overflow-hidden`,
          title: "text-xl",
          content: "p-5 text-xl font-normal gap-6",
        }}
      >
        <p>Hi, I'm Nikita, a full-stack web developer based in France.</p>

        <p>
          Initally, CCV started as a python script in 2021, then got upgraded with an UI.{" "}
          <br />After years of iteration and failed apps, I decided to start from the ground up, to build something
          others could benefit from too.
        </p>

        <p>
          I'm passionate about meaningful data tracking, but found existing solutions either too bloated or missing key
          features.
        </p>

        <p>
          The goal of CCV is simple: focus on datas.<br />Create an habits schema, fill in your entries, get reminders
          and analyze your progress.<br />That's it. No superficial features, no AI, no tracking.
        </p>

        <p>
          CCV is a side project I develop in my free time, which means I can focus purely on what users need. Don't
          hesitate to <a class="link" href="#contact">reach out</a> with questions!
        </p>

        <p>
          Ready to{" "}
          <button type="button" class="btn font-bold rounded-full px-3 py-2 w-fit h-fit">
            <a href="/app">try it out</a>
          </button>{" "}
          ?
        </p>
      </Card>
    </div>
  );
}
