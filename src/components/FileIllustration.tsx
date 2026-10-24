interface FileIllustrationProps {
  type: string;
}

export function FileIllustration({ type }: FileIllustrationProps) {
  const ext = (type || '').toLowerCase();

  // 1. PDF FILES (Official Document Deck with Red Ribbon & Stamp)
  if (ext === 'pdf') {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Document Sheet with folded corner */}
        <path
          d="M10 6 L26 6 L34 14 L34 38 C34 39.5 33 40.5 31.5 40.5 L10 40.5 C8.5 40.5 7.5 39.5 7.5 38 L7.5 8.5 C7.5 7 8.5 6 10 6 Z"
          fill="#FFF5F5"
          stroke="#141414"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Folded Corner Flap with lift effect */}
        <path
          d="M26 6 L26 14 L34 14"
          stroke="#141414"
          strokeWidth="1.8"
          fill="#FFE4E6"
          className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />

        {/* Red PDF Tag Pill */}
        <rect x="11" y="24" width="16" height="7" rx="2" fill="#E53935" />
        <text
          x="19"
          y="29.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="5.5"
          fontWeight="bold"
          fontFamily='"JetBrains Mono", monospace'
        >
          PDF
        </text>

        {/* Text lines */}
        <line x1="11" y1="18" x2="21" y2="18" stroke="#141414" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        <line x1="11" y1="34" x2="26" y2="34" stroke="#141414" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

        {/* Slate Character Standing beside - Pops up and peeks on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-2.5 group-hover:rotate-6 origin-bottom">
          <rect x="25" y="19" width="13" height="15" rx="5" fill="#141414" />
          <circle cx="28.5" cy="24" r="1.3" fill="#FFFFFF" />
          <circle cx="33.5" cy="24" r="1.3" fill="#FFFFFF" />
          {/* Stick legs */}
          <line x1="28" y1="34" x2="26" y2="40" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="33" y1="34" x2="35" y2="40" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          {/* Friendly waving stick arm */}
          <line
            x1="25"
            y1="25"
            x2="22"
            y2="20"
            stroke="#141414"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="transition-transform duration-200 group-hover:-rotate-20 origin-right"
          />
        </g>
      </svg>
    );
  }

  // 2. WORD DOCUMENTS (.docx, .doc)
  if (ext === 'docx' || ext === 'doc') {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Document Sheet */}
        <rect x="8" y="7" width="25" height="32" rx="3" fill="#F0F7FF" stroke="#141414" strokeWidth="1.8" />

        {/* Word Blue Strip */}
        <rect x="6" y="11" width="13" height="8" rx="2" fill="#1E88E5" stroke="#141414" strokeWidth="1.4" />
        <text
          x="12.5"
          y="17"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="6.5"
          fontWeight="bold"
          fontFamily='"Space Grotesk", sans-serif'
        >
          W
        </text>

        {/* Document Lined Paragraphs */}
        <line x1="13" y1="23" x2="28" y2="23" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
        <line x1="13" y1="27" x2="25" y2="27" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
        <line x1="13" y1="31" x2="27" y2="31" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />

        {/* Slate holding a writing pencil - Scribble animation on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-1.5 group-hover:-rotate-3 origin-bottom">
          <rect x="23" y="18" width="13" height="15" rx="5" fill="#141414" />
          <circle cx="27" cy="23" r="1.3" fill="#FFFFFF" />
          <circle cx="32" cy="23" r="1.3" fill="#FFFFFF" />
          <line x1="26" y1="33" x2="24" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="31" y1="33" x2="33" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          {/* Animated Pencil */}
          <g className="transition-all duration-150 ease-in-out group-hover:rotate-20 group-hover:-translate-x-1.5 origin-bottom">
            <line x1="23" y1="26" x2="17" y2="31" stroke="#FF6D00" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="16.5" cy="31.5" r="0.9" fill="#141414" />
          </g>
        </g>
      </svg>
    );
  }

  // 3. POWERPOINT PRESENTATIONS (.pptx, .ppsx, .ppt)
  if (ext === 'pptx' || ext === 'ppsx' || ext === 'ppt') {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Presentation Slide Card */}
        <rect x="8" y="9" width="28" height="20" rx="3" fill="#FFF8F2" stroke="#141414" strokeWidth="1.8" />
        {/* Slide Screen Header */}
        <rect x="11" y="12" width="22" height="4" rx="1" fill="#FF6D00" />
        {/* Analytics / Presentation Trend Line */}
        <polyline
          points="12,23 17,19 22,22 28,17"
          fill="none"
          stroke="#FF6D00"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-200 group-hover:stroke-[#E53935]"
        />

        {/* Slide Stand Peg */}
        <line x1="22" y1="29" x2="22" y2="38" stroke="#141414" strokeWidth="1.8" />
        <line x1="16" y1="38" x2="28" y2="38" stroke="#141414" strokeWidth="1.8" strokeLinecap="round" />

        {/* Slate Character Holding Presentation Pointer - Waving wand on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-2 origin-bottom">
          <rect x="25" y="18" width="12" height="15" rx="5" fill="#141414" />
          <circle cx="28.5" cy="23" r="1.3" fill="#FFFFFF" />
          <circle cx="33.5" cy="23" r="1.3" fill="#FFFFFF" />
          <line x1="28" y1="33" x2="27" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="33" y1="33" x2="35" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          {/* Animated pointer wand */}
          <g className="transition-all duration-200 ease-out group-hover:-rotate-25 group-hover:scale-110 origin-bottom-right">
            <line x1="25" y1="25" x2="16" y2="18" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15.5" cy="17.5" r="1.5" fill="#E53935" />
          </g>
        </g>
      </svg>
    );
  }

  // 4. IMAGES & WHITEBOARD PHOTOS (.jpeg, .jpg, .png, .webp, .svg)
  if (['jpeg', 'jpg', 'png', 'webp', 'svg', 'gif'].includes(ext)) {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Polaroid Photo Frame */}
        <rect x="7" y="7" width="26" height="30" rx="2" fill="#FFFFFF" stroke="#141414" strokeWidth="1.8" />
        {/* Picture Area with Mountain / Sun Sketch */}
        <rect x="10" y="10" width="20" height="18" fill="#FAF5FF" stroke="#141414" strokeWidth="1.2" />
        <circle cx="15" cy="15" r="2.2" fill="#FF6D00" />
        <polyline points="11,26 17,19 21,23 25,18 29,26" fill="none" stroke="#7C3AED" strokeWidth="1.4" strokeLinejoin="round" />

        {/* Camera Shutter Sparkle - Pops and spins on hover */}
        <path
          d="M34 11 L35.5 7 L37 11 L41 12.5 L37 14 L35.5 18 L34 14 L30 12.5 Z"
          fill="#FFE600"
          stroke="#141414"
          strokeWidth="0.8"
          className="transition-all duration-300 ease-out group-hover:scale-150 group-hover:rotate-90 origin-center"
        />

        {/* Slate Peeking from Behind the Frame - Pops up high on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-3 group-hover:rotate-8 origin-bottom">
          <rect x="23" y="16" width="14" height="16" rx="5" fill="#141414" />
          <circle cx="27" cy="21" r="1.4" fill="#FFFFFF" />
          <circle cx="32" cy="21" r="1.4" fill="#FFFFFF" />
          {/* Stick legs */}
          <line x1="27" y1="32" x2="26" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="33" y1="32" x2="35" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 5. MARKDOWN & CLASSROOM NOTES (.md, .txt)
  if (ext === 'md' || ext === 'txt') {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Notepad Sheet with top binding spirals */}
        <rect x="8" y="9" width="25" height="30" rx="3" fill="#ECFDF5" stroke="#141414" strokeWidth="1.8" />
        {/* Top Wire Spirals */}
        <circle cx="12" cy="9" r="1.5" fill="#FFFFFF" stroke="#141414" strokeWidth="1.2" />
        <circle cx="18" cy="9" r="1.5" fill="#FFFFFF" stroke="#141414" strokeWidth="1.2" />
        <circle cx="24" cy="9" r="1.5" fill="#FFFFFF" stroke="#141414" strokeWidth="1.2" />

        {/* Markdown Checklist Items */}
        <rect x="12" y="16" width="3" height="3" rx="0.5" fill="#059669" />
        <line x1="18" y1="17.5" x2="27" y2="17.5" stroke="#141414" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="12" y="22" width="3" height="3" rx="0.5" fill="#059669" />
        <line x1="18" y1="23.5" x2="25" y2="23.5" stroke="#141414" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="12" y="28" width="3" height="3" rx="0.5" fill="#059669" />
        <line x1="18" y1="29.5" x2="24" y2="29.5" stroke="#141414" strokeWidth="1.3" strokeLinecap="round" />

        {/* Slate holding magnifying checklist glass - Bobs up on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-2.5 group-hover:-rotate-8 origin-bottom">
          <rect x="23" y="17" width="13" height="16" rx="5" fill="#141414" />
          <circle cx="27" cy="22" r="1.3" fill="#FFFFFF" />
          <circle cx="32" cy="22" r="1.3" fill="#FFFFFF" />
          <line x1="26" y1="33" x2="24" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="31" y1="33" x2="33" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          {/* Magnifier swinging across */}
          <g className="transition-all duration-200 ease-out group-hover:-translate-x-1 group-hover:scale-110 origin-center">
            <circle cx="20" cy="22" r="2.5" stroke="#141414" strokeWidth="1.2" fill="#FFFFFF" />
            <line x1="21.8" y1="23.8" x2="24" y2="26" stroke="#141414" strokeWidth="1.3" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    );
  }

  // 6. SPREADSHEETS (.xlsx, .xls, .csv)
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Spreadsheet Sheet */}
        <rect x="8" y="7" width="27" height="32" rx="3" fill="#F0FDF4" stroke="#141414" strokeWidth="1.8" />
        {/* Spreadsheet Grid Lines */}
        <rect x="11" y="11" width="21" height="6" fill="#16A34A" />
        <line x1="11" y1="22" x2="32" y2="22" stroke="#141414" strokeWidth="1" />
        <line x1="11" y1="27" x2="32" y2="27" stroke="#141414" strokeWidth="1" />
        <line x1="11" y1="32" x2="32" y2="32" stroke="#141414" strokeWidth="1" />
        <line x1="18" y1="11" x2="18" y2="35" stroke="#141414" strokeWidth="1" />
        <line x1="25" y1="11" x2="25" y2="35" stroke="#141414" strokeWidth="1" />

        {/* Slate holding inspection ruler - Tilted measuring on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-2 group-hover:rotate-6 origin-bottom">
          <rect x="24" y="18" width="13" height="15" rx="5" fill="#141414" />
          <circle cx="28" cy="23" r="1.3" fill="#FFFFFF" />
          <circle cx="33" cy="23" r="1.3" fill="#FFFFFF" />
          <line x1="27" y1="33" x2="26" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="33" y1="33" x2="35" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          {/* Measuring ruler */}
          <line
            x1="22"
            y1="25"
            x2="15"
            y2="31"
            stroke="#16A34A"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="transition-transform duration-200 group-hover:rotate-15 origin-right"
          />
        </g>
      </svg>
    );
  }

  // 7. AUDIO FILES (.mp3, .wav, .m4a)
  if (ext === 'mp3' || ext === 'wav' || ext === 'm4a') {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Audio Cassette Tape / Disc */}
        <rect x="7" y="10" width="28" height="24" rx="3" fill="#FDF4FF" stroke="#141414" strokeWidth="1.8" />
        <circle cx="15" cy="22" r="3.5" stroke="#141414" strokeWidth="1.4" fill="#FFFFFF" />
        <circle cx="27" cy="22" r="3.5" stroke="#141414" strokeWidth="1.4" fill="#FFFFFF" />
        <line x1="15" y1="22" x2="27" y2="22" stroke="#C026D3" strokeWidth="1.6" />

        {/* Slate Wearing DJ Headphones - Bouncing on hover */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-2.5 group-hover:scale-105 origin-bottom">
          <rect x="23" y="15" width="13" height="16" rx="5" fill="#141414" />
          <circle cx="27" cy="20" r="1.3" fill="#FFFFFF" />
          <circle cx="32" cy="20" r="1.3" fill="#FFFFFF" />
          {/* Headphones Band */}
          <path d="M21 19 C21 12 37 12 37 19" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" />
          <rect x="20" y="18" width="3" height="5" rx="1.5" fill="#C026D3" />
          <rect x="35" y="18" width="3" height="5" rx="1.5" fill="#C026D3" />
          {/* Stick legs */}
          <line x1="27" y1="31" x2="25" y2="38" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="31" x2="34" y2="38" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 8. CODE & SCRIPTS (.py, .js, .ts, .json, .sh, .c, .cpp)
  if (['py', 'js', 'ts', 'jsx', 'tsx', 'json', 'sh', 'c', 'cpp'].includes(ext)) {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Terminal Window Sheet */}
        <rect x="7" y="8" width="27" height="30" rx="3" fill="#1E293B" stroke="#141414" strokeWidth="1.8" />
        {/* Window controls */}
        <circle cx="11" cy="12" r="1.2" fill="#EF4444" />
        <circle cx="14.5" cy="12" r="1.2" fill="#F59E0B" />
        <circle cx="18" cy="12" r="1.2" fill="#10B981" />
        {/* Code prompt symbol > */}
        <polyline
          points="11,18 14,20.5 11,23"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="16" y1="20.5" x2="22" y2="20.5" stroke="#F1F5F9" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="11" y1="26" x2="25" y2="26" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="11" y1="30" x2="20" y2="30" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

        {/* Slate Coder - Pops up on hover with developer glasses */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-2.5 group-hover:rotate-6 origin-bottom">
          <rect x="23" y="16" width="13" height="16" rx="5" fill="#141414" />
          <circle cx="27" cy="21" r="1.3" fill="#FFFFFF" />
          <circle cx="32" cy="21" r="1.3" fill="#FFFFFF" />
          <line x1="25" y1="21" x2="34" y2="21" stroke="#38BDF8" strokeWidth="1" strokeLinecap="round" />
          <line x1="26" y1="32" x2="24" y2="38" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="31" y1="32" x2="33" y2="38" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 9. VIDEO & YOUTUBE FILES (.mp4, .webm, .mkv, 'video', 'yt', 'youtube')
  if (['mp4', 'mkv', 'webm', 'mov', 'video', 'yt', 'youtube'].includes(ext)) {
    return (
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Retro Monitor / Screen */}
        <rect x="7" y="9" width="28" height="26" rx="3" fill="#FFF5F5" stroke="#141414" strokeWidth="1.8" />
        <rect x="9.5" y="11.5" width="23" height="15" rx="1.5" fill="#141414" />
        <polygon points="19,15.5 25,19 19,22.5" fill="#FF0000" />
        {/* Scrub bar */}
        <line x1="10" y1="30" x2="32" y2="30" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="30" x2="22" y2="30" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" />

        {/* Slate Character Watching */}
        <g className="transition-all duration-200 ease-out group-hover:-translate-y-2.5 group-hover:rotate-6 origin-bottom">
          <rect x="25" y="16" width="13" height="16" rx="5" fill="#141414" />
          <circle cx="28.5" cy="21" r="1.3" fill="#FFFFFF" />
          <circle cx="33.5" cy="21" r="1.3" fill="#FFFFFF" />
          <line x1="28" y1="32" x2="26" y2="38" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="33" y1="32" x2="35" y2="38" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="23" cy="24" r="2.5" fill="#FFE600" stroke="#141414" strokeWidth="1" />
        </g>
      </svg>
    );
  }

  // 10. DEFAULT FILE ICON
  return (
    <svg
      viewBox="0 0 44 44"
      className="w-10 h-10 shrink-0 select-none overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="7" width="26" height="32" rx="3" fill="#FFFFFF" stroke="#141414" strokeWidth="1.8" />
      <line x1="13" y1="15" x2="27" y2="15" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="13" y1="21" x2="24" y2="21" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="13" y1="27" x2="26" y2="27" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />

      {/* Slate Sitting at Bottom - Pops up on hover */}
      <g className="transition-all duration-200 ease-out group-hover:-translate-y-2.5 group-hover:rotate-3 origin-bottom">
        <rect x="23" y="18" width="13" height="15" rx="5" fill="#141414" />
        <circle cx="27" cy="23" r="1.3" fill="#FFFFFF" />
        <circle cx="32" cy="23" r="1.3" fill="#FFFFFF" />
        <line x1="26" y1="33" x2="24" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="31" y1="33" x2="33" y2="39" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
