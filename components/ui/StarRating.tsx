import { clsx } from "clsx";

export function StarRating({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span
      className={clsx("inline-flex items-center gap-0.5", className)}
      aria-label={`${value.toFixed(1)} de 5`}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
            <defs>
              <linearGradient id={`s${i}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="#d4af37" />
                <stop offset={`${fill * 100}%`} stopColor="#d9d7cc" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15l-5.3 2.8 1-5.8L1.5 7.7l5.9-.9L10 1.5z"
              fill={`url(#s${i}-${fill})`}
            />
          </svg>
        );
      })}
    </span>
  );
}
