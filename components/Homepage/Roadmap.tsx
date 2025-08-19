import { IconCircle, IconInfoCircle } from "@icons";
import { ReactNode } from "preact/compat";
import Card from "../UI/Card.tsx";

type RoadmapItem = {
  title: string;
  description: string;
};

const roadmapItems: RoadmapItem[] = [
  {
    title: "Visual Habit Builder",
    description: "Habits configurator with a drag-and-drop interface, live-preview, smarter value autocomplete and much more.",
  },
  {
    title: "Notifications hub",
    description: "Finely tune your notifications schedule and more notification channel to best fit your needs.",
  },
  {
    title: "Create your own habits system",
    description: "Full control over your habits tracking, manage the time delta, backup shcedules, add your themes, and more.",
  },
  {
    title: "Achievement & streaks",
    description: "Set meaningful goals, track your habit streaks, and celebrate wins with badges and rewards.",
  },
  {
    title: "Internationalization & accessibility",
    description: "Full app translation in multiple languages and proper app-wide accessibility.",
  },
  {
    title: "More datas control",
    description: "Third party integration (Fitbit, Calendar), custom API access, habits template, and monthly insights dashboard.",
  },
];

export default function Roadmap() {
  return (
    <div class="flex flex-col gap-5 items-center max-w-full w-full">
      <div class="flex gap-2 items-end">
        <h2 id="roadmap" class="text-3xl font-semibold">
          <a class="link link-hover" href="#roadmap">Roadmap</a>
        </h2>
        <div className="tooltip tooltip-bottom" data-tip="Not in order. For reference only.">
          {/* @ts-ignore */}
          <IconInfoCircle class="mb-0.5" />
        </div>
      </div>
      <Timeline items={roadmapItems} />
    </div>
  );
}

const Timeline = ({ items }: { items: RoadmapItem[] }) => (
  <ul className="timeline timeline-vertical [hr]:bg-[var(--color-base-content)]">
    {items.map((item, index) => {
      const isFirst = index === 0;
      const isLast = index === items.length - 1;

      return (
        <li key={index} style={{ gridTemplateColumns: "0 50px auto !important" }}>
          {!isFirst && <hr class="bg-base-content" />}

          <div className="timeline-middle">
            {/* @ts-ignore */}
            <IconCircle />
          </div>

          <div className="timeline-end w-full">
            <TLCard>
              <TlTitle>{item.title}</TlTitle>
              <TlText>{item.description}</TlText>
            </TLCard>
          </div>

          {!isLast && <hr class="bg-base-content" />}
        </li>
      );
    })}
  </ul>
);

const TLCard = ({ children }: { children: ReactNode }) => (
  <Card
    sx={{
      container: `w-full overflow-hidden`,
      title: "text-xl",
      content: "p-5 flex-col",
    }}
  >
    {children}
  </Card>
);

const TlTitle = ({ children }: { children: ReactNode }) => <p class="text-2xl font-semibold">{children}</p>;
const TlText = ({ children }: { children: ReactNode }) => <p class="text-xl font-normal">{children}</p>;
