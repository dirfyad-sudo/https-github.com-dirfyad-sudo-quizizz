import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, User } from "lucide-react";

interface NameModalProps {
  id?: string;
  isOpen: boolean;
  onSubmit: (name: string) => void;
}

export default function NameModal({ id = "name-modal", isOpen, onSubmit }: NameModalProps) {
  const [typedName, setTypedName] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedName.trim()) {
      onSubmit(typedName.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id={id} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-gray-900/90 to-black/95 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient Background decoration */}
            <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full bg-cyan-600/20 blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-violet-500/10 border border-violet-500/30 text-violet-400 mb-5 shadow-lg shadow-violet-500/10">
                <User className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Siapa Namamu, Petualang?
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Personalisasikan dashboard belajarmu dan mulailah bersenang-senang!
              </p>

              <form onSubmit={handleApply} className="w-full space-y-4">
                <div className={`relative flex items-center rounded-2xl bg-white/5 border transition-all duration-300 ${isFocused ? 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'border-white/10'}`}>
                  <span className="pl-4 text-gray-500"><Sparkles className="w-5 h-5 text-violet-400" /></span>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="Contoh: Syamil Premium"
                    value={typedName}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full py-4 pl-3 pr-4 bg-transparent outline-none text-white text-base font-medium placeholder-gray-500"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  Masuk ke Universe Quiziz
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
