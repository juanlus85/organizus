import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  light?: boolean;
};

export function BrandWordmark({ className, light = false }: BrandWordmarkProps) {
  return (
    <span
      aria-label="OrganizUS"
      className={cn("inline-flex items-center font-black tracking-[-0.06em] leading-none select-none", className)}
    >
      <span className={light ? "text-white" : "bg-gradient-to-r from-amber-400 via-orange-500 to-lime-500 bg-clip-text text-transparent"}>
        organiz
      </span>
      <span className={light ? "text-orange-400" : "text-slate-900"}>US</span>
    </span>
  );
}
