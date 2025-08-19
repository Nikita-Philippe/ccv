import Card from "../UI/Card.tsx";

export default function Contact() {
  return (
    <div class="flex flex-col gap-5 items-center max-w-full w-full">
      <h2 id="contact" class="text-3xl font-semibold">
        <a class="link link-hover" href="#contact">Contact</a>
      </h2>
      <Card
        sx={{
          container: `w-full overflow-hidden`,
          title: "text-xl",
          content: "p-5 text-xl font-normal gap-6",
        }}
      >
        <form action="/#contact" method="POST" class="flex flex-col gap-6 w-full">
          <p class="text-2xl font-semibold">Need help, an idea, or simply want to get in touch ?</p>

          <input type="hidden" name="action" value="contact" />

          <div class="flex grow gap-6 flex-wrap w-full">
            <fieldset class="fieldset grow min-w-36">
              <legend class="fieldset-legend text-xl">Hi, I'm</legend>
              <input
                name="name"
                type="text"
                class="input input-primary w-full text-base"
                placeholder="Your name"
                required
              />
            </fieldset>
            <fieldset class="fieldset grow min-w-36">
              <legend class="fieldset-legend text-xl">and you can reach me at</legend>
              <input
                name="email"
                type="email"
                class="input input-primary w-full text-base"
                placeholder="Your email"
                required
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              />
            </fieldset>
          </div>

          <div class="flex grow gap-6 flex-wrap w-full">
            <fieldset class="fieldset grow min-w-36">
              <legend class="fieldset-legend text-xl">I'm contacting you because</legend>
              <select name="subject" defaultValue="" class="select w-full text-base" required>
                <option>I have an idea to share</option>
                <option>I encountered a problem</option>
                <option>I have a question</option>
                <option>I want to give feedback</option>
              </select>
            </fieldset>
          </div>

          <div class="flex grow gap-6 flex-wrap w-full">
            <fieldset class="fieldset grow min-w-36">
              <legend class="fieldset-legend text-xl">Here's my message</legend>
              <textarea name="message" class="textarea min-h-40 w-full text-base" required />
            </fieldset>
          </div>

          <div class="flex grow gap-6 flex-wrap justify-between w-full">
            <label class="label">
              <input name="cgu" type="checkbox" class="checkbox" required />
              <p class="text-base whitespace-break-spaces">
                I accept that my data will be used according to the{" "}
                <a class="link" href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
              </p>
            </label>
            <button
              type="submit"
              class="btn btn-primary"
            >
              Submit
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
