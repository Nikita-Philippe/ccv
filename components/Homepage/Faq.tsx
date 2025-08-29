import Card from "../UI/Card.tsx";

const FAQs: Array<{ title: string; content: string }> = [
  {
    title: "Do I need to create an account?",
    content:
      "No! You can use CCV as a guest, however all of your datas will be wiped after 7 days. Creating a Google account unlocks all CCV features (like export, notifications) and permanent data storage. Connecting to a Google account as a guest will migrate all of your datas.",
  },
  {
    title: "All that for free, without ads or tracking ? What's the catch ?",
    content:
      "Well, I can code things pretty good but I absolutely don't know how to sell anything, so it's fully free !\nWill it be free forever ? I don't know, but I will never lock current users behind a paywall, so enjoy the app !",
  },
  {
    title: "Is this project open-source ? Can I contribute to it ?",
    content:
      "CCV is currently closed source while I finalize the core architecture and establish a stable codebase.\nI plan to open-source the project once the foundation is solid - this ensures contributors get clean, well-documented code to work with.\nI'll provide comprehensive guides for self-hosting, contributing when CCV goes open-source.",
  },
  {
    title: "CCV ?",
    content:
      "CCV is the initials of the historical python script name that was used as the habit tracker: “Comment ça va ?” in french, meaning “How's it's going ?”.",
  },
  {
    title: "Is there a mobile app version for CCV ?",
    content:
      "CCV is a progressive web app (PWA). In other words, it's an app that runs on your browser, like a website. Your browser should provide a way to add CCV to your phone home screen and use it just like any app.",
  },
  // {
  //   title: "Is there an offline mode ?",
  //   content:
  //     "Not at the moment. However there are plans to research and implement an offline version based on the technical limitation of PWAs (Progressive Web Apps).",
  // },
  {
    title: "How secure is my data?",
    content:
      "Your habits, entries and user settings are end-to-end encrypted and stored securely using AES-256. We use a zero-knowledge architecture, meaning that you are the only one, with your Google account, that have acces to all of your datas.",
  },
  // {
  //   title: "Can I export my data?",
  //   content:
  //     "Yes! You can export all your data in standard formats (CSV, JSON) at any time. The export is available on your settings page, on the 'Export entries' section.",
  // },
  {
    title: "What happens if I lose access to my account?",
    content:
      "You can recover your account using the recovery feature in settings, using your recovery key and your account email. If you cannot retrieve your recovery key, we will not be able to recover your datas.",
  },
];

export default function FAQ() {
  return (
    <div class="flex flex-col gap-9 items-center max-w-full w-full">
      <h2 id="faq" class="text-3xl font-semibold">
        <a class="link link-hover" href="#faq">FAQ</a>
      </h2>
      <div class="flex flex-col gap-6">
        {FAQs.map(({ title, content }, i) => (
          <Card
            key={`faq-${i}`}
            sx={{
              container: `w-full overflow-hidden`,
              content: "",
            }}
          >
            <div className="collapse collapse-arrow">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-semibold">{title}</div>
              <div className="collapse-content text-xl font-normal">
                {content.split("\n").map((l, i) => <p key={i}>{l}</p>)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
