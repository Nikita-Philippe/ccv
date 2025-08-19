import { ReactNode } from "preact/compat";
import Card from "../UI/Card.tsx";
import { IconEye, IconEyeClosed, IconInfoCircle } from "@icons";

export default function Features() {
  return (
    <div class="flex flex-col gap-5 items-center max-w-full w-full">
      <h2 id="features" class="text-3xl font-semibold">
        <a class="link link-hover" href="#features">Features</a>
      </h2>
      <div class="flex flex-col gap-8 w-full">
        <GridLine>
          <GridCard width={40}>
            <CardTitle>Smart Reminders</CardTitle>
            <div class="flex flex-col gap-10 pt-6">
              <CardText>Never miss a habit with up to two daily reminders that adapt to your schedule.</CardText>
              <CardText>Multiple notification channels: push notifications, email, and more.</CardText>
              <img
                loading="lazy"
                class=" w-full max-w-full"
                src="/assets/homepage/features_reminders.png"
                alt="Daily reminder notification popup"
              />
            </div>
          </GridCard>
          <GridCard>
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex flex-col gap-8">
                <CardTitle>Unlimited Habits</CardTitle>
                <CardText>Track anything that matters to you - no limits, no restrictions.</CardText>
                <CardText>Choose from multiple habits types to fit your needs.</CardText>
                <CardText>Organize with groups for effortless entries management.</CardText>
              </div>
              <div class="w-full md:max-w-1/2 h-96 md:h-auto relative">
                <img
                  loading="lazy"
                  class="w-full h-auto md:absolute md:top-0 md:left-0 md:h-[600px] md:min-w-[280px]"
                  src="/assets/homepage/features_habits.png"
                  alt="CCV Habits page, where you can configure unlimited habits"
                />
              </div>
            </div>
          </GridCard>
        </GridLine>

        <GridLine>
          <GridCard width={35}>
            <CardTitle>Privacy First</CardTitle>
            <div class="flex flex-col gap-10 pt-6">
              <CardText>Military-grade encryption keeps your data private.</CardText>
              <div class="flex items-center gap-1 group/main" tabIndex={1}>
                <span class="shrink blur-xl group-hover/main:blur-none group-focus/main:blur-none transition-all">
                  <CardText>Zero-knowledge architecture - even we can't see your datas.</CardText>
                </span>
                <div class="relative shrink-0 h-7 w-7">
                  {/* @ts-ignore */}
                  <IconEyeClosed class="absolute inset-0 max-w-full max-h-full opacity-100 group-hover/main:opacity-0 group-focus/main:opacity-0 transition-all" />
                  {/* @ts-ignore */}
                  <IconEye class="absolute inset-0 max-w-full max-h-full opacity-0 group-hover/main:opacity-100 group-focus/main:opacity-100 transition-all" />
                </div>
              </div>
              <CardText>
                Your email is used for sync and notifications. No ads, no trackers, no spams.
              </CardText>
            </div>
          </GridCard>
          <GridCard>
            <div class="flex flex-col gap-4">
              <div class="flex gap-2 items-end">
                <CardTitle>Data Sync</CardTitle>
                <div
                  className="tooltip tooltip-bottom"
                  data-tip="Public users get a limited set of features and 7 days of data retention."
                >
                  {/* @ts-ignore */}
                  <IconInfoCircle class="mb-0.5" />
                </div>
              </div>
              <CardText>
                Use your Google account to sync data across all your devices. Guest data migrates automatically when you
                sign in.
              </CardText>
              <div class="w-full min-h-[180px] md:min-h-[240px] relative">
                <img
                  loading="lazy"
                  class="absolute top-0 left-0 w-full h-auto ml-5"
                  src="/assets/homepage/features_sync.png"
                  alt="A phone and a desktop computer, sharing the same synchronized CCV account"
                />
              </div>
            </div>
          </GridCard>
        </GridLine>

        <GridLine>
          <GridCard width={60}>
            <div class="flex flex-col gap-6">
              <CardTitle>Analytics</CardTitle>
              <CardText>Transform your entries into meaningful insights and trends with your own dashboard.</CardText>
              <CardText>Choose from multiple chart types and metrics to visualize your progress.</CardText>
              <img
                loading="lazy"
                class="w-full max-w-md self-center"
                src="/assets/homepage/features_analytics.png"
                alt="The CCV analytics page, where a Heatmap of the hours slept and a line graph of the daily rating is visible"
              />
            </div>
          </GridCard>
          <GridCard>
            <div class="flex flex-col gap-6 justify-between">
              <CardTitle>Your Data</CardTitle>
              <CardText>Export your entries in standard formats to use in your favorite data-analysis tools.</CardText>
              <div class="flex gap-4">
                <button type="button" class="btn grow">
                  Import datas
                </button>
                <button type="button" class="btn grow">
                  Export
                </button>
              </div>
              <CardText>Import and export habit configurations for easy backup.</CardText>
              <CardText>
                Import a CSV dataset as CCV entries to pick up where you left.<span class="text-sm italic">
                  <br />Experimental - subject to changes
                </span>
              </CardText>
            </div>
          </GridCard>
        </GridLine>
      </div>
    </div>
  );
}

const GridLine = ({ children }: { children: ReactNode }) => (
  <div class="flex flex-col md:flex-row gap-8">
    {children}
  </div>
);

const GridCard = ({ width, children }: { width?: number; children: ReactNode }) => (
  <div
    // style={{
    //   "--width": width ? `${width}%` : "auto",
    //   flexBasis: "var(--width)",
    //   flexGrow: width ? "0" : "1",
    // } as React.CSSProperties}
    // class="max-w-full basis-auto md:flex flex-col"
    style={{
      "--width": width ? `${width}%` : "auto",
      flexGrow: width ? "0" : "1",
      flexShrink: width ? "0" : "1",
    } as React.CSSProperties}
    class="max-w-full w-full md:w-[var(--width)] flex grow shrink"
  >
    <Card
      sx={{
        container: `w-full h-full overflow-hidden`,
        title: "text-xl",
        content: "p-5 flex-1",
      }}
    >
      {children}
    </Card>
  </div>
);

const CardTitle = ({ children }: { children: ReactNode }) => <p class="text-2xl font-semibold">{children}</p>;
const CardText = ({ children }: { children: ReactNode }) => <p class="text-xl font-normal">{children}</p>;
