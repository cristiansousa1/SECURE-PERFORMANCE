import React, { useState, useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  type?: "balance" | "expense" | "neutral";
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  formatter = (v) => v.toFixed(2),
  type = "balance"
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (value !== prev) {
      const isUp = value > prev;
      if (type === "expense") {
        // For expenses, going up is "down" (red / bad), going down is "up" (green / good)
        setFlash(isUp ? "down" : "up");
      } else if (type === "balance") {
        // For balances or revenue, going up is "up" (green / good), going down is "down" (red / bad)
        setFlash(isUp ? "up" : "down");
      } else if (type !== "neutral") {
        setFlash(isUp ? "up" : "down");
      }
    }
  }, [value, type]);

  useEffect(() => {
    if (flash) {
      const timer = setTimeout(() => {
        setFlash(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = prevValueRef.current;
    const endValue = value;
    const duration = 300; // smooth 300ms duration

    if (startValue === endValue) return;

    let animFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing out quad
      const easeProgress = progress * (2 - progress);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      } else {
        prevValueRef.current = endValue;
      }
    };

    animFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [value]);

  const flashClass = flash === "up"
    ? "text-emerald-500 bg-emerald-500/15 scale-[1.03] px-1 py-0.5 rounded transition-all duration-300"
    : flash === "down"
      ? "text-rose-500 bg-rose-500/15 scale-[1.03] px-1 py-0.5 rounded transition-all duration-300"
      : "transition-all duration-700";

  return (
    <span className={`inline-flex items-center gap-0.5 ${flashClass}`}>
      {formatter(displayValue)}
      {flash === "up" && <span className="text-[0.75em] text-emerald-500 animate-pulse font-bold">↑</span>}
      {flash === "down" && <span className="text-[0.75em] text-rose-500 animate-pulse font-bold">↓</span>}
    </span>
  );
};

export default AnimatedNumber;
