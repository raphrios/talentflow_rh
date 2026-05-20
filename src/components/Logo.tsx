import { Sparkles } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <div className="flex items-center gap-2">
      <div className="relative grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#00d4aa] to-[#60a5fa] shadow-lg shadow-[#00d4aa]/30">
        <Sparkles size={px} className="text-[#022c22]" strokeWidth={2.5} />
      </div>
      <span className={`font-display font-bold ${text} tracking-tight`}>
        Talent<span className="gradient-text">Flow</span>
      </span>
    </div>
  );
}
