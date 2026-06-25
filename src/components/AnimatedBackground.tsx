import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, TrendingUp, Sparkles, Activity } from "lucide-react";

interface FloatingItem {
  id: number;
  type: "bar" | "arrow" | "metric" | "double-bar" | "trend-line";
  left: number; // percentage
  size: number; // width/height scale
  height?: number; // for bars
  duration: number;
  delay: number;
  opacity: number;
  text?: string;
}

export default function AnimatedBackground() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    // Generate static parameters for floating graphic elements to avoid server hydration issues
    const generated: FloatingItem[] = Array.from({ length: 32 }).map((_, idx) => {
      const typeRand = Math.random();
      let type: "bar" | "arrow" | "metric" | "double-bar" | "trend-line" = "bar";
      let text = "";
      
      if (typeRand < 0.35) {
        type = "bar";
      } else if (typeRand < 0.55) {
        type = "arrow";
      } else if (typeRand < 0.70) {
        type = "double-bar";
      } else if (typeRand < 0.85) {
        type = "trend-line";
      } else {
        type = "metric";
        const percentages = ["+12.4%", "+25.8%", "+32.1%", "+8.9%", "+17.5%", "+44.2%", "CAC -20%", "LTV 4.2x", "ROI 320%"];
        text = percentages[Math.floor(Math.random() * percentages.length)];
      }

      return {
        id: idx,
        type,
        left: Math.random() * 100, // 0 to 100% of screen width
        size: Math.random() * 0.70 + 0.45, // size multiplier
        height: (type === "bar" || type === "double-bar") ? Math.floor(Math.random() * 75 + 25) : undefined, // bar height in px
        duration: Math.random() * 15 + 13, // slightly more movement
        delay: Math.random() * -25, // offset delay to start immediately mid-animation
        opacity: Math.random() * 0.08 + 0.04, // slightly more evident watermark but still premium and clean
        text
      };
    });
    setItems(generated);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Premium off-white solid base background */}
      <div className="absolute inset-0 bg-[#FAFAFA]" />

      {/* Gentle, slow-shifting organic radial gradient blobs to blend the theme colors */}
      <div className="absolute inset-0 opacity-[0.55] mix-blend-multiply blur-[120px] md:blur-[160px]">
        {/* Blob 1: Warm Orange (Theme Color 1) */}
        <motion.div
          animate={{
            x: ["-20%", "30%", "-10%"],
            y: ["10%", "-20%", "40%"],
            scale: [1, 1.25, 0.9],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-orange-500/30 via-orange-400/18 to-transparent"
        />

        {/* Blob 2: Dark Slate/Black (Sleek Theme Color 2) */}
        <motion.div
          animate={{
            x: ["20%", "-30%", "10%"],
            y: ["-10%", "30%", "-20%"],
            scale: [1.15, 0.95, 1.2],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 w-[38rem] h-[38rem] rounded-full bg-gradient-to-br from-black/25 via-slate-900/15 to-transparent"
        />

        {/* Blob 3: White/Soft Orange */}
        <motion.div
          animate={{
            x: ["-10%", "10%", "-30%"],
            y: ["30%", "10%", "-10%"],
            scale: [0.9, 1.15, 0.95],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-1/2 left-1/3 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-orange-400/20 via-slate-800/10 to-transparent"
        />
      </div>

      {/* Subtle graphic grid overlay combining micro-dots and thin lines for a modern quantitative vibe */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(0,0,0,0.18) 1px, transparent 1px),
            radial-gradient(circle, rgba(249,115,22,0.12) 1.5px, transparent 1.5px)
          `,
          backgroundSize: "24px 24px, 48px 48px",
        }}
      />
      <div 
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Gentle Rising Bar Charts, Arrows and Metrics */}
      <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden w-full h-full">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: "105vh", opacity: 0 }}
            animate={{
              y: "-12vh",
              opacity: [0, item.opacity, item.opacity * 1.5, item.opacity, 0],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: "linear",
            }}
            className="absolute flex flex-col items-center justify-end"
            style={{
              left: `${item.left}%`,
              bottom: 0,
            }}
          >
            {/* Render Vertical Transparent Indicator Bar */}
            {item.type === "bar" && item.height && (
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="rounded-t bg-gradient-to-t from-orange-400/20 via-black/10 to-transparent border-t border-x border-orange-400/20"
                  style={{
                    width: `${Math.round(7 * item.size)}px`,
                    height: `${item.height}px`,
                  }}
                />
                <div className="w-1 h-1 rounded-full bg-orange-400/30" />
              </div>
            )}

            {/* Render Double Vertical Bars (Parallel Comparison) */}
            {item.type === "double-bar" && item.height && (
              <div className="flex items-end gap-[3px]">
                <div
                  className="rounded-t bg-gradient-to-t from-black/20 to-transparent border-t border-x border-black/15"
                  style={{
                    width: `${Math.round(5 * item.size)}px`,
                    height: `${item.height * 0.75}px`,
                  }}
                />
                <div
                  className="rounded-t bg-gradient-to-t from-orange-500/25 to-transparent border-t border-x border-orange-500/20"
                  style={{
                    width: `${Math.round(5 * item.size)}px`,
                    height: `${item.height}px`,
                  }}
                />
              </div>
            )}

            {/* Render Floating Trend-Line Graphic */}
            {item.type === "trend-line" && (
              <div 
                className="flex flex-col items-center"
                style={{ transform: `scale(${item.size})` }}
              >
                <div className="flex gap-[2px] items-end">
                  <div className="w-[3px] h-2 bg-black/20 rounded-t" />
                  <div className="w-[3px] h-[14px] bg-orange-400/35 rounded-t animate-pulse" />
                  <div className="w-[3px] h-5 bg-orange-400/40 rounded-t" />
                  <ArrowUp className="w-3.5 h-3.5 text-orange-500 stroke-[2.5] -translate-y-1" />
                </div>
              </div>
            )}

            {/* Render Floating Trend Icon */}
            {item.type === "arrow" && (
              <div 
                className="flex flex-col items-center gap-1.5"
                style={{ transform: `scale(${item.size})` }}
              >
                {/* Visual stylized trail line under arrow */}
                <div className="h-6 w-[1.5px] bg-gradient-to-t from-transparent via-orange-400/30 to-orange-400/60" />
                <ArrowUp className="w-4 h-4 text-orange-500 fill-orange-500/10 stroke-[2.5]" />
              </div>
            )}

            {/* Render Floating Metrics Percentage Pill */}
            {item.type === "metric" && item.text && (
              <div 
                className="flex items-center gap-1 bg-gradient-to-r from-orange-500/10 via-black/5 to-orange-500/10 border border-orange-500/15 rounded-full px-2 py-0.5 backdrop-blur-[1px] shadow-sm"
                style={{ transform: `scale(${item.size * 0.95})` }}
              >
                <TrendingUp className="w-2.5 h-2.5 text-orange-500" />
                <span className="font-mono text-[8.5px] font-extrabold text-[#141414]/75 tracking-tight shrink-0">
                  {item.text}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Dynamic upward-moving tiny light particles for premium sparkle (Dual theme color particles: orange and black/grey) */}
      <div className="absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => {
          const isDark = i % 2 === 0;
          const size = Math.random() * 3.5 + 1;
          const left = Math.random() * 100;
          const duration = Math.random() * 8 + 10;
          const delay = Math.random() * -15;
          return (
            <motion.div
              key={`particle-${i}`}
              initial={{ y: "105vh", opacity: 0 }}
              animate={{
                y: "-5vh",
                opacity: [0, 0.35, 0.35, 0],
              }}
              transition={{
                duration,
                repeat: Infinity,
                delay,
                ease: "linear",
              }}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                width: size,
                height: size,
                backgroundColor: isDark ? "#141414" : "#F97316",
                boxShadow: isDark 
                  ? "0 0 8px rgba(20, 20, 20, 0.2)" 
                  : "0 0 8px rgba(249, 115, 22, 0.45)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
