import React from "react";
import { motion } from "framer-motion";
import { Award, Crown, Star } from "lucide-react";

interface BestTechnologySealProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showDetails?: boolean;
  layout?: "horizontal" | "vertical" | "iconOnly";
}

export default function BestTechnologySeal({
  size = "md",
  className = "",
  showDetails = true,
  layout = "vertical",
}: BestTechnologySealProps) {
  // Determine raw pixel dimensions classes for the circular medal icon
  const dimensionsClass = 
    size === "sm" 
      ? "w-16 h-16" 
      : size === "md" 
        ? "w-24 h-24" 
        : "w-32 h-32";

  const crownSize = size === "sm" ? 12 : size === "md" ? 18 : 24;
  const starSize = size === "sm" ? 7 : size === "md" ? 10 : 13;

  // Render just the golden spinning rotating medal itself
  const renderMedalIcon = () => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative flex items-center justify-center select-none shrink-0"
    >
      {/* Futuristic Outer Golden Pulsing Aura Glow */}
      <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
      
      {/* Soft Shimmer Laser Ray rotating in background */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-amber-600/30 via-yellow-400/20 to-amber-600/30 opacity-75 blur-[2.5px]"
      />

      {/* Outer Ribbon/Draping effect for realistic Badge feel */}
      <div className="absolute -bottom-3 flex gap-0.5 z-0">
        <motion.div 
          initial={{ rotate: -15 }}
          animate={{ rotate: -10 }}
          className="w-3 h-9 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 rounded-b-sm shadow-md border-r border-amber-500/20"
        />
        <motion.div 
          initial={{ rotate: 15 }}
          animate={{ rotate: 10 }}
          className="w-3 h-9 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 rounded-b-sm shadow-md border-l border-amber-500/20"
        />
      </div>

      {/* Physical Medal Frame with jagged/ruffled border representing premium seal stiffness */}
      <div className={`${dimensionsClass} rounded-full bg-gradient-to-b from-amber-500 via-yellow-400 to-amber-600 p-[2.5px] shadow-[0_10px_25px_rgba(245,158,11,0.25)] relative z-10 transition-all duration-300`}>
        
        {/* Innermost Inner Ring Border */}
        <div className="w-full h-full rounded-full bg-slate-950 p-[1.5px] flex items-center justify-center relative overflow-hidden">
          
          {/* Glossy Diagonal Shine Sheen Effect overlay */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
            className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/12 to-transparent skew-x-30 pointer-events-none"
          />

          {/* Inner Gold circular dashed border representing technical engineering specs */}
          <div className="absolute inset-1 rounded-full border border-dashed border-amber-500/45" />

          {/* Centered Seal Brand Elements */}
          <div className="flex flex-col items-center justify-center text-center space-y-0.5 relative z-10 px-1">
            
            <motion.div
              animate={{ y: [-1, 1, -1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-amber-400"
            >
              <Crown size={crownSize} className="drop-shadow-[0_1.5px_3px_rgba(217,119,6,0.5)] fill-amber-500/10" />
            </motion.div>

            {/* Central Premium text of Best (1º LUGAR / MELHOR) */}
            <div className="space-y-0 text-amber-300">
              <span className={`block font-black tracking-widest uppercase italic font-sans leading-none ${
                size === "sm" ? "text-[6px]" : size === "md" ? "text-[9px]" : "text-xs"
              }`}>
                MELHOR
              </span>
              <span className={`block font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-400 leading-none ${
                size === "sm" ? "text-sm" : size === "md" ? "text-lg" : "text-2xl"
              }`}>
                #1
              </span>
              <span className={`block font-mono font-black uppercase tracking-widest leading-none text-yellow-500 ${
                size === "sm" ? "text-[5px]" : size === "md" ? "text-[7px]" : "text-[9px]"
              }`}>
                NACIONAL
              </span>
            </div>

            {/* Mini Horizontal Stars for Excellence Certification */}
            <div className="flex items-center gap-[1px] text-yellow-400">
              <Star size={starSize} className="fill-current" />
              <Star size={starSize} className="fill-current" />
              <Star size={starSize} className="fill-current" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Layout 1: Horizontal Card (Default Premium layout requested for standardization, high legibility)
  if (layout === "horizontal") {
    return (
      <div className={`inline-flex items-center gap-4 p-3 px-5 bg-gradient-to-r from-amber-50 via-white to-amber-50/70 border-2 border-amber-500/35 rounded-[2.1rem] shadow-[0_15px_35px_rgba(245,158,11,0.2)] backdrop-blur-md select-none group/floating-seal text-left cursor-pointer hover:scale-[1.01] transition-transform ${className}`}>
        {renderMedalIcon()}
        <div className="text-left font-sans pr-2">
          <div className="flex items-center gap-1">
            <Award size={11} className="text-amber-600 shrink-0" />
            <span className="block text-[8.5px] font-extrabold uppercase tracking-widest text-amber-700 leading-none">
              Certificado de Excelência
            </span>
          </div>
          <span className="block text-[13px] font-black uppercase italic text-slate-950 mt-1.5 leading-none tracking-tight">
            MÁXIMA LIDERANÇA #1
          </span>
          <span className="block text-[10px] text-slate-800 font-extrabold tracking-tight mt-1 leading-snug">
            App nº 1 em Gestão Corporativa e DRE IA
          </span>
        </div>
      </div>
    );
  }

  // Layout 2: Icon Only
  if (layout === "iconOnly") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {renderMedalIcon()}
      </div>
    );
  }

  // Layout 3: Standard Vertical Box
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {renderMedalIcon()}
      
      {showDetails && (
        <div className="mt-4 space-y-1 relative z-20">
          <div className="flex items-center justify-center gap-1.5 text-amber-600">
            <Award size={12} className="shrink-0" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-widest font-mono">
              Selo de Excelência Corporativa
            </span>
          </div>
          <h4 className="text-gray-950 font-black uppercase italic tracking-tight text-xs font-sans">
            App nº 1 em Gestão Corporativa e DRE IA
          </h4>
          <p className="text-[9.5px] text-slate-800 font-bold max-w-[210px] leading-relaxed uppercase tracking-wide">
            Melhor tecnologia para negócios de alta rentabilidade a nível nacional.
          </p>
        </div>
      )}
    </div>
  );
}
