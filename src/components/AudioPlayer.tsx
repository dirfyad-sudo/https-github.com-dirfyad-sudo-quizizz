import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../utils/audioEngine";

interface AudioPlayerProps {
  id?: string;
}

const SPOTIFY_PRESETS = [
  { name: "Lofi Study", id: "37i9dQZF1DWWQRwui0EXPn" },
  { name: "Deep Focus", id: "37i9dQZF1DWZeKFB67db6g" },
  { name: "Peaceful Piano", id: "37i9dQZF1DX4sWSpwq3LiO" },
  { name: "Jazz Study", id: "37i9dQZF1DX8U76gnS7nqV" }
];

function getSpotifyEmbedUrl(urlOrId: string) {
  if (!urlOrId) return "https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0EXPn";
  
  const clean = urlOrId.trim();
  if (/^[a-zA-Z0-9]{22}$/.test(clean)) {
    return `https://open.spotify.com/embed/playlist/${clean}`;
  }

  const playlistMatch = clean.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (playlistMatch) return `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`;

  const trackMatch = clean.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (trackMatch) return `https://open.spotify.com/embed/track/${trackMatch[1]}`;

  const albumMatch = clean.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
  if (albumMatch) return `https://open.spotify.com/embed/album/${albumMatch[1]}`;

  const artistMatch = clean.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (artistMatch) return `https://open.spotify.com/embed/artist/${artistMatch[1]}`;

  return `https://open.spotify.com/embed/playlist/${clean}`;
}

export default function AudioPlayer({ id = "audio-player-dock" }: AudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSpotifyId, setSelectedSpotifyId] = useState(() => localStorage.getItem("spotify_saved_id") || "37i9dQZF1DWWQRwui0EXPn");
  const [spotifyInput, setSpotifyInput] = useState("");

  useEffect(() => {
    localStorage.setItem("spotify_saved_id", selectedSpotifyId);
  }, [selectedSpotifyId]);

  return (
    <div id={id} className="fixed bottom-24 left-4 md:bottom-6 md:left-6 z-40">
      <AnimatePresence>
        {!isExpanded ? (
          <motion.button
            layoutId="player-dock"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              audio.playClick();
              setIsExpanded(true);
            }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/5 shadow-lg shadow-black/40 backdrop-blur-md text-gray-300 hover:text-white cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <svg className="w-5 h-5 fill-current text-emerald-400" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.892-.982-.336.076-.67-.135-.747-.472-.076-.336.135-.67.472-.747 3.856-.88 7.15-.502 9.822 1.135.295.18.387.565.207.86zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.078-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.67-1.114 8.24-.575 11.35 1.34.368.226.488.706.262 1.073zm.107-2.82c-3.26-1.937-8.644-2.12-11.75-1.176-.5.152-1.025-.133-1.177-.633-.15-.5.133-1.025.633-1.177 3.585-1.088 9.53-.874 13.284 1.353.45.268.6.844.333 1.294-.268.45-.844.6-1.294.333z"/>
              </svg>
            </div>
            <div className="flex flex-col text-left text-xs pr-1">
              <span className="font-semibold text-gray-200">Spotify Music</span>
              <span className="text-gray-400 text-[10px]">Klik untuk Membuka</span>
            </div>
          </motion.button>
        ) : (
          <motion.div
            layoutId="player-dock"
            className="w-[310px] p-5 pt-12 rounded-3xl bg-slate-950/95 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-white relative"
          >
            {/* Absolute Close Button */}
            <button
              onClick={() => {
                audio.playClick();
                setIsExpanded(false);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-white text-[11px] bg-white/5 px-2.5 py-1 rounded-lg hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
            >
              Tutup
            </button>

            {/* Spotify Player Section */}
            <div className="flex flex-col gap-3 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <svg className="w-5 h-5 fill-current text-emerald-400" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.892-.982-.336.076-.67-.135-.747-.472-.076-.336.135-.67.472-.747 3.856-.88 7.15-.502 9.822 1.135.295.18.387.565.207.86zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.078-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.67-1.114 8.24-.575 11.35 1.34.368.226.488.706.262 1.073zm.107-2.82c-3.26-1.937-8.644-2.12-11.75-1.176-.5.152-1.025-.133-1.177-.633-.15-.5.133-1.025.633-1.177 3.585-1.088 9.53-.874 13.284 1.353.45.268.6.844.333 1.294-.268.45-.844.6-1.294.333z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-100">Spotify Player</h4>
                  <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest animate-pulse">STREAM CUSTOM PLAYLIST</p>
                </div>
              </div>

              {/* Preset Playlist Switcher */}
              <div className="flex flex-wrap gap-1">
                {SPOTIFY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      audio.playClick();
                      setSelectedSpotifyId(p.id);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      selectedSpotifyId === p.id 
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 pointer-events-none" 
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Search/Load Custom Link input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Paste URL/ID playlist atau lagu Spotify..."
                  value={spotifyInput}
                  onChange={(e) => setSpotifyInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-2.5 py-1 text-[10px] text-slate-100 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/40"
                />
                <button
                  onClick={() => {
                    audio.playClick();
                    if (spotifyInput.trim()) {
                      setSelectedSpotifyId(spotifyInput.trim());
                      setSpotifyInput("");
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                >
                  Load
                </button>
              </div>

              {/* Embed iFrame Widget */}
              <div className="relative mt-1 bg-black/40 rounded-xl overflow-hidden border border-white/5 min-h-[140px] flex items-center justify-center">
                <iframe
                  src={getSpotifyEmbedUrl(selectedSpotifyId)}
                  className="w-full h-[140px]"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
