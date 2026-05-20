import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Crown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  X, 
  Zap, 
  Flame, 
  Compass, 
  User, 
  Award, 
  Target, 
  Star, 
  Hourglass, 
  MousePointerClick,
  Sparkles,
  Info
} from "lucide-react";
import { audio } from "../utils/audioEngine";
import { Participant } from "../types";

interface LeaderboardViewProps {
  userName: string;
  userStats: {
    totalQuizzesCompleted: number;
    averageAccuracy: number;
    totalStudyMinutes: number;
    dailyStreak: number;
    totalXp: number;
    level: number;
    accuracyTrend: number[];
    weakTopics: string[];
  };
  showToast: (msg: string) => void;
  realLeaderboard?: Participant[];
}

interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatar: string; // Emoji
  initials: string;
  points: number;
  xp: number;
  progressPercent: number;
  isOnline: boolean;
  streak: number;
  rankTrend: "up" | "down" | "same";
}

// Synthesizer triggered on Rank Up / XP Changes / Interactive beats
function playSynthSound(type: "rankup" | "xp" | "open" | "hover" | "click") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "open") {
      // Cosmic swell
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.exponentialRampToValueAtTime(540, now + 0.6);

      osc2.frequency.setValueAtTime(185, now);
      osc2.frequency.exponentialRampToValueAtTime(545, now + 0.6);

      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } 
    else if (type === "rankup") {
      // Retro chime progression (fast sweep up)
      const notes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // E4 -> G4 -> C5 -> E5 -> G5 -> C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const pGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        pGain.gain.setValueAtTime(0, now);
        pGain.gain.linearRampToValueAtTime(0.06, now + i * 0.05 + 0.01);
        pGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);

        osc.connect(pGain);
        pGain.connect(ctx.destination);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.4);
      });
    } 
    else if (type === "xp") {
      // Short golden coin ping
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gainNode.gain.setValueAtTime(0.07, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // Avoid blocking if web audio fails
  }
}

// Vector Ribbon Medal Component to perfectly simulate active game ranking icons
function RenderGameMedal({ rank }: { rank: 1 | 2 | 3 }) {
  const ribbonColor = rank === 1 ? "#EF4444" : rank === 2 ? "#3B82F6" : "#10B981";
  const ringColor = rank === 1 ? "#F59E0B" : rank === 2 ? "#D1D5DB" : "#D97706";
  const gemColor = rank === 1 ? "#FFF" : rank === 2 ? "#FFF" : "#F3F4F6";
  
  return (
    <div className="relative flex flex-col items-center">
      <svg className="w-7 h-9 drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]" viewBox="0 0 32 40" fill="none">
        {/* Ribbons */}
        <path d="M10 12L7 28L13 25L16 28L13 12" fill={ribbonColor} opacity="0.85" />
        <path d="M22 12L25 28L19 25L16 28L19 12" fill={ribbonColor} opacity="1" />
        {/* Rounded Metallic Ring */}
        <circle cx="16" cy="12" r="9" fill={ringColor} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <circle cx="16" cy="12" r="6" fill={rank === 1 ? "#D97706" : rank === 2 ? "#9CA3AF" : "#B45309"} />
        <text x="16" y="15" fill={gemColor} fontSize="8.5" fontWeight="950" textAnchor="middle" fontFamily="sans-serif">
          {rank}
        </text>
      </svg>
      {/* Dynamic shimmering gloss effect over the metal ring */}
      <div className="absolute top-[2.5px] left-[6px] w-[16px] h-[16px] rounded-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [-28, 28] }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.8, 
            ease: "easeInOut",
            repeatDelay: 1.2 + rank * 0.4
          }}
          className="w-3.5 h-8 bg-gradient-to-r from-transparent via-white/80 to-transparent -rotate-25 absolute -top-1"
        />
      </div>
    </div>
  );
}

export default function LeaderboardView({ userName, userStats, showToast, realLeaderboard }: LeaderboardViewProps) {
  const [activeCategory, setActiveCategory] = useState<"global" | "weekly" | "monthly" | "friends" | "battle" | "class">("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  
  // 3D Tilt states
  const [rotate, setRotate] = useState({ x: 8, y: -4 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const tiltX = -(y / rect.height) * 15; // smooth capped tilt range
    const tiltY = (x / rect.width) * 15;
    
    setRotate({ x: tiltX + 8, y: tiltY - 4 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 8, y: -4 });
  };

  // Realtime update stats (dynamic from actual connected players in database)
  const [onlineCount, setOnlineCount] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);

  // Generate dynamic seed data reflecting category changes
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);

  // Sound effects & haptic trigger simulation
  const handleTabChange = (cat: "global" | "weekly" | "monthly" | "friends" | "battle" | "class") => {
    if (cat === activeCategory) return;
    audio.playClick();
    playSynthSound("click");
    setActiveCategory(cat);
    
    // Slight haptic visual indicator
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const triggerRankUpNotification = (name: string, isMe = false) => {
    playSynthSound("rankup");
    setNotification(isMe ? `🎉 Selamat! Kamu baru saja naik peringkat!` : `🚀 ${name} menyalip peringkat baru!`);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Unified effect to bind actual real-time server database leaderboard without fake bots
  useEffect(() => {
    const effectiveName = userName || "Kamu";
    const myXp = userStats.totalXp;
    const myPoints = Math.round(userStats.totalXp * 0.98);

    // Filter and reconstruct list with zero mock bots
    let rawList = (realLeaderboard || []).map((realUser) => {
      // Is online if active within last 45 seconds
      const isOnlineNow = realUser.lastActive ? (Date.now() - realUser.lastActive < 45000) : true;
      return {
        id: `u-real-${realUser.name}`,
        rank: 99, // calculated after sorting
        name: realUser.name,
        avatar: realUser.avatar || "🎓",
        initials: realUser.name.slice(0, 2).toUpperCase(),
        points: realUser.score,
        xp: realUser.score,
        streak: 1,
        rankTrend: "same" as const,
        progressPercent: Math.min(100, Math.max(10, Math.round((realUser.score / 4000) * 100))),
        isOnline: isOnlineNow
      };
    });

    // Ensure the current user is always listed even if server update is still in transit
    const hasCurrentUser = rawList.some(
      u => u.name.toLowerCase() === effectiveName.toLowerCase()
    );

    if (!hasCurrentUser) {
      rawList.push({
        id: "u-current",
        rank: 99,
        name: effectiveName,
        avatar: userStats.totalXp > 1000 ? "👑" : "🎓",
        initials: effectiveName.slice(0, 2).toUpperCase(),
        points: myPoints,
        xp: myXp,
        streak: userStats.dailyStreak || 1,
        rankTrend: "same" as const,
        progressPercent: Math.min(100, Math.max(10, Math.round((myXp / 4000) * 100))),
        isOnline: true
      });
    }

    // Sort descending by score/XP
    rawList.sort((a, b) => b.xp - a.xp);

    // Map ranks with previous rank comparisons for the RankUp sound notification
    setLeaderboardData(prev => {
      const mappedList = rawList.map((u, i) => ({
        ...u,
        rank: i + 1
      }));

      if (prev && prev.length > 0) {
        const prevMe = prev.find(u => u.name.toLowerCase() === effectiveName.toLowerCase());
        const nextMe = mappedList.find(u => u.name.toLowerCase() === effectiveName.toLowerCase());
        if (prevMe && nextMe && nextMe.rank < prevMe.rank) {
          triggerRankUpNotification(effectiveName, true);
        }
      }
      return mappedList;
    });

    // Update real online count dynamically based on the active player size
    setOnlineCount(Math.max(1, rawList.filter(u => u.isOnline).length));
  }, [realLeaderboard, userName, userStats]);

  // Split Top 3 and list of others
  const top3 = leaderboardData.slice(0, 3);
  // Re-order top3 to display: [Rank 2, Rank 1, Rank 3] for podium
  const podiumList = [];
  if (top3[1]) podiumList.push(top3[1]); // Rank 2 on Left
  if (top3[0]) podiumList.push(top3[0]); // Rank 1 in Middle
  if (top3[2]) podiumList.push(top3[2]); // Rank 3 on Right

  const listRemaining = leaderboardData.slice(3);

  // Filter with search criteria
  const filteredRemaining = listRemaining.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto pb-16 relative">
      
      {/* TOP NOTIFICATION CHIP */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 border border-emerald-500/30 text-emerald-300 font-bold px-5 py-3 rounded-2xl shadow-xl shadow-emerald-950/40 backdrop-blur-md text-xs flex items-center gap-3.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION WITH GLOW BOTTOM */}
      <div className="relative pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block">ARENA RANKING</span>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
            Leaderboard
          </h2>
          <p className="text-xs text-gray-400 mt-1">Papan skor global latihan kuis pintar. Saling bersaing meningkatkan XP & menguji level kognitif.</p>
        </div>
        
        {/* Statistics quick cards */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-2 sm:p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-2 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <div className="text-left">
              <span className="text-[9px] text-gray-500 font-mono uppercase blockLeading">ONLINE NOW</span>
              <span className="text-[12px] font-bold text-slate-200 mt-[-2px] block">{onlineCount} Siswa</span>
            </div>
          </div>

          <div className="p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 backdrop-blur-sm shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase block leading-tight">LIVE DB SYNC</span>
              <span className="text-[12px] font-bold text-emerald-200 block">CONNECTED</span>
            </div>
          </div>

          <div className="p-2 sm:p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-2 backdrop-blur-sm">
            <Award className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[9px] text-gray-500 font-mono uppercase block leading-tight">AVG ACCURACY</span>
              <span className="text-[12px] font-bold text-slate-200 block">{userStats.averageAccuracy}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CATEGORY SECTOR - SLIDE SMOOTH INTERACTIVE */}
      <div className="flex overflow-x-auto pb-1 scrollbar-none gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5">
        {[
          { id: "global", label: "Global" },
          { id: "weekly", label: "Weekly" },
          { id: "monthly", label: "Monthly" },
          { id: "friends", label: "Friends" },
          { id: "battle", label: "Battle" },
          { id: "class", label: "Class" }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => handleTabChange(cat.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeCategory === cat.id 
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 font-extrabold" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* PRIMARY LEADERBOARD CONTAINER / OUTER MODULE SHELL */}
      <div className="p-5 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-2xl relative overflow-hidden space-y-8">
        
        {/* PODIUM TOP 3 SEGMENT IN THE MIDDLE */}
        {podiumList.length > 0 && (
          <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative pt-20 pb-14 max-w-xl mx-auto flex items-end justify-center select-none overflow-visible"
            style={{ perspective: "1200px" }}
          >
            <motion.div 
              className="w-full flex items-end justify-center gap-3 md:gap-6 relative [transform-style:preserve-3d]"
              animate={{ 
                rotateX: isHovered ? rotate.x / 1.5 : 8,
                rotateY: isHovered ? rotate.y / 1.5 : -2,
                translateZ: isHovered ? 15 : 0
              }}
              transition={{ type: "spring", stiffness: 100, damping: 22 }}
            >
              
              {/* Rank #2 Podium Left (KONTOLO...) */}
              {podiumList[0] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="flex-1 flex flex-col items-center relative [transform-style:preserve-3d]"
                  style={{ transform: "translateZ(10px)" }}
                >
                  {/* Subtle Float/Bounce loop wrapper for structural item */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4.8, 
                      ease: "easeInOut",
                      delay: 0.2
                    }}
                    className="w-full flex flex-col items-center [transform-style:preserve-3d]"
                  >
                    {/* Custom Vector Ribbon Medal */}
                    <div className="absolute top-[-44px] z-20" style={{ transform: "translateZ(30px)" }}>
                      <RenderGameMedal rank={2} />
                    </div>
                    
                    {/* Avatar card: Premium Rounded Square */}
                    <div 
                      onClick={() => {
                        audio.playClick();
                        setSelectedUser(podiumList[0]);
                      }}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-[18px] bg-slate-800/90 border-2 border-slate-600/70 flex items-center justify-center font-black text-2xl text-slate-100 shadow-xl shadow-black/60 relative cursor-pointer group hover:scale-105 hover:border-blue-400 transition-all"
                      style={{ transform: "translateZ(25px)" }}
                    >
                      <span className="relative z-10 text-xl font-mono text-slate-200 tracking-tight">{podiumList[0].initials}</span>
                      <div className="absolute inset-0 bg-blue-500/5 rounded-[18px] group-hover:bg-blue-500/10 transition-colors" />
                      {podiumList[0].isOnline && (
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-800 animate-pulse" />
                      )}
                    </div>

                    <span className="text-[11px] font-bold text-slate-300 mt-2.5 truncate w-20 md:w-24 text-center block" style={{ transform: "translateZ(15px)" }}>
                      {podiumList[0].name}
                    </span>
                    <span className="text-[11px] font-mono font-black text-blue-400 mt-0.5 tracking-tight" style={{ transform: "translateZ(10px)" }}>
                      {podiumList[0].points.toLocaleString("id-ID")}
                    </span>

                    {/* 3D Pillar column - Silver Slate */}
                    <div className="w-24 md:w-28 mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-700/30 via-slate-800/10 to-slate-950 border border-slate-500/30 shadow-[0_15px_30px_rgba(0,0,0,0.7),inset_0_2px_0_rgba(255,255,255,0.15)]" style={{ transform: "translateZ(0px)" }}>
                      {/* Top Accent Lip with high gloss reflecting silver */}
                      <div className="h-2 bg-gradient-to-r from-slate-500 via-slate-300 to-slate-400 border-b border-white/10" />
                      {/* Card face */}
                      <div className="py-7 flex flex-col justify-center text-center min-h-[85px]">
                        <span className="font-mono text-3xl font-black text-slate-400 select-none tracking-tight">2</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Rank #1 Podium Center (Yio) */}
              {podiumList[1] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.65 }}
                  className="flex-1 flex flex-col items-center relative z-10 mx-[-6px] md:mx-[-10px] [transform-style:preserve-3d]"
                  style={{ transform: "translateZ(25px)" }}
                >
                  {/* Subtle Float/Bounce loop wrapper for #1 rank */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4.2, 
                      ease: "easeInOut"
                    }}
                    className="w-full flex flex-col items-center [transform-style:preserve-3d]"
                  >
                    {/* Bouncing Crown + Ribbon Medal with springy squish on the Crown */}
                    <div
                      className="absolute top-[-80px] z-20 flex flex-col items-center"
                      style={{ transform: "translateZ(40px)" }}
                    >
                      <motion.div
                        animate={{ 
                          y: [0, -5, 0, -2.5, 0],
                          scaleY: [1, 1.1, 0.94, 1.05, 1],
                          scaleX: [1, 0.94, 1.06, 0.97, 1]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2.2, 
                          ease: "easeInOut",
                          repeatDelay: 0.4
                        }}
                        className="origin-bottom filter drop-shadow-[0_0_10px_rgba(234,179,8,0.7)]"
                      >
                        <Crown className="w-7 h-7 text-yellow-400 fill-yellow-400 mb-0.5" />
                      </motion.div>
                      <RenderGameMedal rank={1} />
                    </div>

                    {/* Golden Avatar wrapper square with absolute glorious highlights */}
                    <div 
                      onClick={() => {
                        audio.playClick();
                        setSelectedUser(podiumList[1]);
                      }}
                      className="w-16 h-16 md:w-18 md:h-18 rounded-[22px] bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 border-2 border-yellow-300 flex items-center justify-center font-black text-3xl text-white shadow-2xl shadow-yellow-500/20 relative cursor-pointer group hover:scale-105 active:scale-95 transition-all"
                      style={{ transform: "translateZ(30px)" }}
                    >
                      <span className="relative z-10 font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{podiumList[1].initials}</span>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 rounded-t-[22px] opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none" />
                      {podiumList[1].isOnline && (
                        <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
                      )}
                    </div>

                    <span className="text-xs font-black text-amber-300 mt-2.5 truncate w-24 md:w-28 text-center block" style={{ transform: "translateZ(20px)" }}>
                      {podiumList[1].name}
                    </span>
                    <span className="text-xs font-mono font-black text-yellow-400 mt-0.5 tracking-tight" style={{ transform: "translateZ(15px)" }}>
                      {podiumList[1].points.toLocaleString("id-ID")}
                    </span>

                    {/* 3D gold taller pillar block */}
                    <div className="w-26 md:w-30 mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-600/30 via-slate-900/40 to-slate-950 border border-amber-500/30 shadow-[0_20px_40px_rgba(234,179,8,0.15),inset_0_2px_0_rgba(251,191,36,0.3)]" style={{ transform: "translateZ(0px)" }}>
                      {/* Top Accent Lip reflecting Gold */}
                      <div className="h-2 bg-gradient-to-r from-yellow-500 via-yellow-300 to-amber-600 border-b border-white/10" />
                      {/* Deep gold obsidian block face */}
                      <div className="py-10 flex flex-col justify-center text-center min-h-[125px]">
                        <span className="font-mono text-4xl font-extrabold text-amber-400 leading-none select-none tracking-tight">1</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Rank #3 Podium Right (dde) */}
              {podiumList[2] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex-1 flex flex-col items-center relative [transform-style:preserve-3d]"
                  style={{ transform: "translateZ(10px)" }}
                >
                  {/* Subtle Float/Bounce loop wrapper for third slot */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 5.4, 
                      ease: "easeInOut",
                      delay: 0.4
                    }}
                    className="w-full flex flex-col items-center [transform-style:preserve-3d]"
                  >
                    {/* Vector medal 3 */}
                    <div className="absolute top-[-44px] z-20" style={{ transform: "translateZ(30px)" }}>
                      <RenderGameMedal rank={3} />
                    </div>
                    
                    {/* Avatar wrapper */}
                    <div 
                      onClick={() => {
                        audio.playClick();
                        setSelectedUser(podiumList[2]);
                      }}
                      className="w-13 h-13 md:w-15 md:h-15 rounded-[16px] bg-slate-800/90 border-2 border-slate-600/70 flex items-center justify-center font-black text-xl text-slate-200 shadow-xl shadow-black/60 relative cursor-pointer group hover:scale-105 hover:border-emerald-400 transition-all"
                      style={{ transform: "translateZ(25px)" }}
                    >
                      <span className="relative z-10 font-mono text-lg text-slate-300">{podiumList[2].initials}</span>
                      <div className="absolute inset-0 bg-emerald-500/5 rounded-[16px] group-hover:bg-emerald-500/10 transition-colors" />
                      {podiumList[2].isOnline && (
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-800 animate-pulse" />
                      )}
                    </div>

                    <span className="text-[11px] font-bold text-slate-300 mt-2.5 truncate w-20 md:w-24 text-center block" style={{ transform: "translateZ(15px)" }}>
                      {podiumList[2].name}
                    </span>
                    <span className="text-[11px] font-mono font-black text-emerald-400 mt-0.5 tracking-tight" style={{ transform: "translateZ(10px)" }}>
                      {podiumList[2].points.toLocaleString("id-ID")}
                    </span>

                    {/* 3D Bronze short pillar block */}
                    <div className="w-24 md:w-28 mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-850/60 via-slate-900/40 to-slate-950 border border-emerald-800/20 shadow-[0_12px_24px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(52,211,153,0.15)]" style={{ transform: "translateZ(0px)" }}>
                      {/* Top Slant bronze/emerald lid */}
                      <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-800 border-b border-emerald-500/20" />
                      {/* Front copper slate block panel */}
                      <div className="py-5 flex flex-col justify-center text-center min-h-[60px]">
                        <span className="font-mono text-2xl font-black text-slate-400 leading-none select-none tracking-tight">3</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

            </motion.div>
          </div>
        )}

        {/* SEARCH BAR WITHIN MODULE */}
        <div className="relative max-w-md mx-auto pt-4 border-t border-white/5">
          <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-7" />
          <input
            type="text"
            placeholder="Cari nama ranking siswa di server ini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          />
        </div>

        {/* REMAINING RANKING LIST SECTOR WITH HORIZONTALS CARDS */}
        <div className="space-y-3 pt-2">
          {filteredRemaining.length > 0 ? (
            filteredRemaining.map((user, uidx) => {
              const serialRank = user.rank;
              return (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.01, border: "1px solid rgba(139,92,246,0.3)" }}
                  onClick={() => {
                    audio.playClick();
                    setSelectedUser(user);
                  }}
                  className="p-3.5 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all relative overflow-hidden active:scale-95 text-[11px] sm:text-xs"
                >
                  {/* Left: Position & Avatar details info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-6 text-center font-mono font-black text-gray-400">
                      {serialRank}
                    </div>

                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-lg select-none">
                        {user.avatar}
                      </div>
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-slate-900 rounded-full" />
                      )}
                    </div>

                    <div className="text-left min-w-0">
                      <span className="font-bold text-gray-200 block truncate">{user.name}</span>
                      
                      {/* Interactive Progress Bar */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 sm:w-28 bg-white/10 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-violet-500 h-full transition-all duration-700" 
                            style={{ width: `${user.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono font-semibold shrink-0">{user.progressPercent}% progress</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Scores / points display */}
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="flex flex-col">
                      <span className="font-mono font-extrabold text-cyan-400 text-sm">{user.points.toLocaleString("id-ID")} pts</span>
                      <span className="text-[9px] text-gray-500 font-mono">⚡ {user.xp.toLocaleString("id-ID")} XP</span>
                    </div>

                    {/* Trend indicators */}
                    <div className="w-4 flex items-center justify-center">
                      {user.rankTrend === "up" && <ArrowUp className="w-4 h-4 text-emerald-400" />}
                      {user.rankTrend === "down" && <ArrowDown className="w-4 h-4 text-red-400" />}
                      {user.rankTrend === "same" && <span className="font-semibold text-gray-600">-</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              Tidak ada data rating siswa yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>

      </div>

      {/* DYNAMIC LEADERBOARD USER PROFILE DETAIL MODAL WINDOW */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-950 border border-white/10 rounded-3xl p-6 w-full max-w-sm relative text-left overflow-hidden shadow-2xl"
            >
              {/* Closing Trigger button */}
              <button
                onClick={() => {
                  audio.playClick();
                  setSelectedUser(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Background gradient effect */}
              <div className="absolute top-[-30px] right-[-30px] w-48 h-48 rounded-full bg-violet-600/10 blur-[50px] pointer-events-none" />

              {/* Profile Head */}
              <div className="flex items-center gap-4 mt-2">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center text-3xl shadow-md font-black">
                  {selectedUser.avatar}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-lg font-bold text-white leading-tight">{selectedUser.name}</h4>
                    {selectedUser.isOnline && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" title="Online Sekarang" />
                    )}
                  </div>
                  <span className="text-xs text-violet-400 font-medium">Rank #{selectedUser.rank} League Server</span>
                  <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">🔥 Streak: {selectedUser.streak} Hari Aktif</span>
                </div>
              </div>

              {/* Quick Achievements Medal badgel */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-white/5 border border-white/5 px-3.5 py-3 rounded-2xl">
                  <span className="text-[9px] text-gray-500 font-semibold font-mono block">TOTAL KEMENANGAN</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-[13px] font-bold text-white font-mono">{selectedUser.points > 2000 ? "48 Kali" : "12 Kali"}</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 px-3.5 py-3 rounded-2xl">
                  <span className="text-[9px] text-gray-500 font-semibold font-mono block">LEVEL AKUN</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-4 h-4 text-violet-400" />
                    <span className="text-[13px] font-bold text-white font-mono">Lv.{selectedUser.points > 2000 ? 5 : 2}</span>
                  </div>
                </div>
              </div>

              {/* Cognitive Competency Radial Radar Simulation Graph Inline */}
              <div className="mt-5 bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[9px] text-cyan-400 font-bold font-mono tracking-wider block">KOGNITIF RADAR CHART</span>
                
                <div className="flex justify-center py-2">
                  <svg viewBox="0 0 100 100" className="w-28 h-28 self-center">
                    {/* Grids */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    <circle cx="50" cy="50" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    
                    {/* Axes lines */}
                    <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                    {/* Skill radar polygon polygon area */}
                    <polygon 
                      points={selectedUser.points > 2000 ? "50,18 84,40 70,74 30,70 16,40" : "50,28 72,42 60,62 40,58 26,42"} 
                      fill="rgba(139,92,246,0.18)" 
                      stroke="rgba(139,92,246,0.5)" 
                      strokeWidth="1.5" 
                    />

                    {/* Anchors */}
                    <circle cx="54" cy="28" r="1.5" fill="#a78bfa" />
                    <circle cx="72" cy="42" r="1.5" fill="#a78bfa" />
                  </svg>
                </div>
                <div className="flex justify-between text-[8px] text-gray-500 font-mono px-3">
                  <span>Akurasi</span>
                  <span>Fokus</span>
                  <span>Durasi</span>
                  <span>Kreatif</span>
                </div>
              </div>

              {/* Achievements Badge elements List */}
              <div className="mt-5 space-y-1.5">
                <span className="text-[9px] text-gray-500 font-bold font-mono tracking-wider block">REACHED ACHIEVEMENT BADGES</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-yellow-500/10 border border-yellow-500/25 text-yellow-500 text-[9px] font-bold px-2 py-0.5 rounded-lg">⭐ Sang Juara</span>
                  <span className="bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded-lg">🚀 Log Geni</span>
                  <span className="bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[9px] font-bold px-2 py-0.5 rounded-lg">🔥 Streak Master</span>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
