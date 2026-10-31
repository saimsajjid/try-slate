import { useState, useEffect, useRef } from 'react';

interface RecommendationViewProps {
  courseCode?: string;
}

export function RecommendationView(_props: RecommendationViewProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText('https://www.youtube.com/watch?v=LAK-VFr9rFc');
        setCopied(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-7">
      {/* 1. CLEAN, SPACIOUS HEADER (NO HEAVY BOXES) */}
      <div className="flex flex-col items-center text-center space-y-3.5 px-2">
        {/* Animated Slate Mascot */}
        <div className="relative group cursor-pointer">
          <svg
            viewBox="0 0 120 120"
            className="w-24 h-24 sm:w-28 sm:h-28 select-none overflow-visible transition-transform duration-300 group-hover:scale-105"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Floating Gold Star */}
            <g className="anim-sparkle">
              <path
                d="M60 8 L63.5 18 L74 19 L66 26.5 L68.5 37 L60 31.5 L51.5 37 L54 26.5 L46 19 L56.5 18 Z"
                fill="#FF6D00"
                stroke="#141414"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </g>

            {/* Stand */}
            <rect x="25" y="96" width="70" height="8" rx="2" fill="#E2E8F0" stroke="#141414" strokeWidth="2" />
            <line x1="38" y1="104" x2="35" y2="114" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="82" y1="104" x2="85" y2="114" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />

            {/* Mascot Body */}
            <g className="transition-transform duration-200 group-hover:-translate-y-1">
              <rect x="36" y="38" width="48" height="52" rx="14" fill="#141414" stroke="#141414" strokeWidth="2" />
              <circle cx="50" cy="56" r="4.5" fill="#FFFFFF" />
              <circle cx="70" cy="56" r="4.5" fill="#FFFFFF" />
              <circle cx="51.5" cy="56" r="2" fill="#141414" />
              <circle cx="71.5" cy="56" r="2" fill="#141414" />
              <circle cx="44" cy="65" r="2.2" fill="#FF8A80" opacity="0.8" />
              <circle cx="76" cy="65" r="2.2" fill="#FF8A80" opacity="0.8" />
              <path d="M56 67 Q60 71 64 67" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Headphones */}
              <path d="M33 55 C33 34 87 34 87 55" stroke="#FF6D00" strokeWidth="3" strokeLinecap="round" fill="none" />
              <rect x="30" y="50" width="6" height="12" rx="3" fill="#FF6D00" stroke="#141414" strokeWidth="1.5" />
              <rect x="84" y="50" width="6" height="12" rx="3" fill="#FF6D00" stroke="#141414" strokeWidth="1.5" />

              {/* Stick Arm */}
              <g className="anim-slate-wave">
                <line x1="84" y1="68" x2="102" y2="52" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="102" cy="52" r="3.5" fill="#FF0000" stroke="#141414" strokeWidth="1.2" />
              </g>

              {/* Feet */}
              <line x1="48" y1="90" x2="48" y2="98" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="72" y1="90" x2="72" y2="98" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Title & Simple Tagline */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#FFF8F2] border-2 border-[#141414] shadow-[1.5px_1.5px_0px_#141414] text-[11px] font-mono font-bold uppercase tracking-wider text-[#141414]">
            <span>Recommended by Slate Developer</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[#141414] tracking-tight"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Complete C++ Course for Beginners
          </h1>

          <p
            className="text-base sm:text-lg text-neutral-800 leading-snug"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '20px' }}
          >
            "Hey guys, if you're struggling with slides or basics, this video starts from zero with actual code. It covers more than you need to know for our classes. You can play this video here without ads."
          </p>

          <div className="flex items-center justify-center text-xs font-mono text-neutral-500 pt-0.5">
            <span>By Not Your College</span>
          </div>
        </div>
      </div>

      {/* 2. CENTERPIECE VIDEO PLAYER */}
      <div className="bg-white border-2 border-[#141414] rounded-2xl shadow-[4px_4px_0px_#141414] overflow-hidden">
        {/* Retro Window Header */}
        <div className="bg-[#FFF8F2] border-b-2 border-[#141414] px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-[#141414]" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-[#141414]" />
            <span className="w-3 h-3 rounded-full bg-[#10B981] border border-[#141414]" />
            <span className="text-xs font-mono font-bold text-[#141414] ml-2 hidden sm:inline">
              not-your-college / c++-tutorial
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-600 bg-white border border-[#141414] px-2 py-0.5 rounded">
            Embedded Player
          </span>
        </div>

        {/* Video Embed */}
        <div className="p-2 sm:p-4 bg-neutral-900">
          <div className="relative w-full pb-[56.25%] h-0 rounded-xl overflow-hidden border border-black/40 bg-black">
            <iframe
              src="https://www.youtube-nocookie.com/embed/LAK-VFr9rFc?rel=0"
              title="Complete C++ Tutorial for Beginners | Not Your College"
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* 3. CLEAN, SPACIOUS ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <a
          href="https://www.youtube.com/watch?v=LAK-VFr9rFc"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#FF0000] text-white border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414] sm:hover:shadow-[3.5px_3.5px_0px_#141414] sm:hover:-translate-y-0.5 active:scale-95 touch-manipulation transition-all flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span>Watch on YouTube</span>
          <svg viewBox="0 0 12 12" className="w-3 h-3 fill-none stroke-current shrink-0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9L9 3" />
            <path d="M4.5 3H9V7.5" />
          </svg>
        </a>

        <a
          href="https://px.pixxo.io/test/NotesCppYT/CompleteCppNotes.html"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#F0FDF4] text-[#141414] border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414] hover:bg-[#DCFCE7] sm:hover:-translate-y-0.5 active:scale-95 touch-manipulation transition-all flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#141414] fill-none shrink-0" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Open Web Notes</span>
          <svg viewBox="0 0 12 12" className="w-3 h-3 fill-none stroke-current shrink-0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9L9 3" />
            <path d="M4.5 3H9V7.5" />
          </svg>
        </a>

        <a
          href="https://app.notion.com/p/Complete-C-YT-Course-Syllabus-300bfef683f38078b73bf0fb54410b82"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#141414] border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414] hover:bg-neutral-100 sm:hover:-translate-y-0.5 active:scale-95 touch-manipulation transition-all flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#141414] fill-none shrink-0" strokeWidth="2">
            <path d="M4 4h16v16H4z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h4" />
          </svg>
          <span>Notion Syllabus</span>
          <svg viewBox="0 0 12 12" className="w-3 h-3 fill-none stroke-current shrink-0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9L9 3" />
            <path d="M4.5 3H9V7.5" />
          </svg>
        </a>

        <button
          onClick={handleCopyLink}
          className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#141414] border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414] hover:bg-neutral-100 sm:hover:-translate-y-0.5 active:scale-95 touch-manipulation transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 20 20" className="w-4 h-4 fill-[#16A34A] shrink-0">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#141414] fill-none shrink-0" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      {/* FOOTNOTE */}
      <div className="text-center pt-2">
        <span
          className="text-[11px] text-neutral-400 font-mono italic"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          *Note: This document was generated by an LLM.*
        </span>
      </div>
    </div>
  );
}
