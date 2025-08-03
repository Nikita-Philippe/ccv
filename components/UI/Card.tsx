import { cn } from "@utils/cn.ts";

type Props = {
  children: React.ReactNode;
  title?: string;
  sx?: {
    container?: string;
    content?: string;
    title?: string;
  };
};

export default function Card({ children, title, sx }: Props) {
  return (
    <div className={cn("flex flex-col", sx?.container)}>
      {title && <h3 className={cn("font-semibold", sx?.title)}>{title}</h3>}
      <div
        className={cn("flex flex-wrap gap-2 p-2 border border-gray-200 rounded", sx?.content)}
      >
        {children}
      </div>
    </div>
  );
}
