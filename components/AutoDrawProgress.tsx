import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export const AutoDrawProgress = ({
  current,
  total,
  etaSeconds,
}: {
  current: number;
  total: number;
  etaSeconds: number;
}) => {
  const percentage = Math.round((current / total) * 100) || 0;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border animate-in fade-in slide-in-from-left-2">
      <Loader2 className="h-3 w-3 animate-spin" />
      <div className="w-16">
        <Progress value={percentage} className="h-2" />
      </div>
      <span className="font-mono">
        {current}/{total}
      </span>
      <span>{percentage}%</span>
      {etaSeconds > 0 && (
        <span className="border-l pl-2 ml-1">
          ~{Math.ceil(etaSeconds / 60)}m
        </span>
      )}
    </div>
  );
};
