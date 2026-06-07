interface SkeletonCardProps {
  variant?: "home" | "release";
}

export default function SkeletonCard({ variant = "home" }: SkeletonCardProps) {
  const shimmer =
    "bg-[linear-gradient(90deg,#161b22_25%,#1f2937_37%,#161b22_63%)] bg-[length:400%_100%] animate-[skeleton-loading_1.4s_ease_infinite] rounded-lg";

  if (variant === "release") {
    return (
      <div className="p-[14px] border border-hub-border rounded-[14px]">
        <div className={`${shimmer} h-[18px] w-[60%] mb-2`} />
        <div className={`${shimmer} h-3 w-[30%] mb-2.5`} />
        <div className={`${shimmer} h-3 w-full mb-1.5`} />
        <div className={`${shimmer} h-3 w-[70%]`} />
      </div>
    );
  }

  return (
    <div className="bg-hub-card border border-hub-border p-4 rounded-[10px]">
      <div className={`${shimmer} h-[140px] mb-3 rounded-[14px]`} />
      <div className={`${shimmer} h-5 w-[70%] mb-2`} />
      <div className={`${shimmer} h-3 w-full mb-2`} />
      <div className={`${shimmer} h-10 w-[50%] rounded-[14px]`} />
    </div>
  );
}
