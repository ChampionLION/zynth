"use client";

import { useEffect, useState } from "react";

export function Typewriter({
  text,
  speed = 15,
  className = "",
  onDone,
  startDelay = 0,
}: {
  text: string;
  speed?: number;
  className?: string;
  onDone?: () => void;
  startDelay?: number;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    let i = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setShown(i);
        if (i >= text.length && interval) {
          clearInterval(interval);
          onDone?.();
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <span className={className}>{text.slice(0, shown)}</span>;
}

export function CountUp({
  to,
  duration = 800,
  className = "",
  prefix = "",
  suffix = "",
}: {
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span className={className}>
      {prefix}
      {val}
      {suffix}
    </span>
  );
}

export function Particles({ count = 10, color = "#C87D2F" }: { count?: number; color?: string }) {
  const [seeds] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: (i * 37 + 13) % 100,
      delay: ((i * 53) % 40) / 10,
      dur: 4 + ((i * 29) % 30) / 10,
      size: 2 + (i % 3),
    }))
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {seeds.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: `${s.left}%`,
            top: `${(i * 41 + 7) % 100}%`,
            width: s.size,
            height: s.size,
            background: color,
            opacity: 0.5,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

export function DifficultyPips({ difficulty }: { difficulty: number }) {
  const filled = Math.min(5, Math.max(1, difficulty));
  return (
    <span className="tracking-widest text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? "text-amber" : "text-dim"}>
          {i < filled ? "◆" : "◇"}
        </span>
      ))}
    </span>
  );
}
