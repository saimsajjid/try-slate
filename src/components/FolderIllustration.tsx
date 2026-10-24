interface FolderIllustrationProps {
  name: string;
}

export function FolderIllustration({ name }: FolderIllustrationProps) {
  const lower = name.toLowerCase();

  // 1. WEEK FOLDERS (e.g. "Week 01", "Week 02", "Week 09")
  if (lower.includes('week')) {
    // Extract week number if available
    const match = name.match(/\d+/);
    const weekNum = match ? match[0] : '';

    return (
      <svg
        viewBox="0 0 52 52"
        className="w-11 h-11 shrink-0 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Peeking Slate Mascot behind folder edge */}
        <g className="transition-transform duration-200 group-hover:-translate-y-1.5 origin-bottom">
          {/* Slate Body */}
          <rect x="18" y="10" width="16" height="18" rx="7" fill="#141414" />
          {/* White Dot Eyes */}
          <circle cx="23" cy="17" r="1.5" fill="#FFFFFF" />
          <circle cx="29" cy="17" r="1.5" fill="#FFFFFF" />
          {/* Tiny stick hands gripping the folder rim */}
          <circle cx="17.5" cy="24" r="1.4" fill="#141414" />
          <circle cx="34.5" cy="24" r="1.4" fill="#141414" />
        </g>

        {/* Back Folder Flap with Tab */}
        <path
          d="M7 23 L7 17 C7 15.5 8 14.5 9.5 14.5 L20 14.5 L23 18 L42.5 18 C44 18 45 19 45 20.5 L45 23"
          stroke="#141414"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#FFF8F2"
        />

        {/* Front Folder Body with hard shadow border */}
        <path
          d="M6 23 L46 23 C47 23 48 24 47.8 25.2 L45.2 42.2 C45 43.2 44.2 44 43.2 44 L8.8 44 C7.8 44 7 43.2 6.8 42.2 L4.2 25.2 C4 24 5 23 6 23 Z"
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Diagonal folder shading hatch lines */}
        <line x1="10" y1="38" x2="16" y2="38" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="10" y1="34" x2="22" y2="34" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />

        {/* Week Stamp Pill on Folder Front */}
        {weekNum && (
          <g>
            <rect x="27" y="29" width="15" height="10" rx="3" fill="#FFF7ED" stroke="#FF6D00" strokeWidth="1.2" />
            <text
              x="34.5"
              y="36.5"
              textAnchor="middle"
              fill="#FF6D00"
              fontSize="8"
              fontWeight="bold"
              fontFamily='"JetBrains Mono", monospace'
            >
              W{weekNum}
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 2. TEXTBOOKS & READING FOLDERS (e.g. "Primary Book", "Reference Books")
  if (
    lower.includes('book') ||
    lower.includes('reading') ||
    lower.includes('textbook') ||
    lower.includes('primary') ||
    lower.includes('reference')
  ) {
    return (
      <svg
        viewBox="0 0 52 52"
        className="w-11 h-11 shrink-0 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bottom Hardcover Book */}
        <rect x="9" y="34" width="34" height="9" rx="2" fill="#FAF5FF" stroke="#141414" strokeWidth="1.8" />
        <line x1="14" y1="34" x2="14" y2="43" stroke="#7C3AED" strokeWidth="1.6" />
        <line x1="17" y1="38.5" x2="38" y2="38.5" stroke="#141414" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

        {/* Middle Hardcover Book */}
        <rect x="12" y="24" width="31" height="9" rx="2" fill="#FFFFFF" stroke="#141414" strokeWidth="1.8" />
        <line x1="17" y1="24" x2="17" y2="33" stroke="#FF6D00" strokeWidth="1.6" />
        <line x1="20" y1="28.5" x2="38" y2="28.5" stroke="#141414" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

        {/* Bookmark Ribbon Hanging Down */}
        <path d="M36 24 L36 37 L39 34 L42 37 L42 24" fill="#E53935" stroke="#141414" strokeWidth="1.2" />

        {/* Slate Sitting on Top of the Books */}
        <g className="transition-transform duration-200 group-hover:-translate-y-1 origin-bottom">
          {/* Slate Body */}
          <rect x="18" y="10" width="14" height="14" rx="5" fill="#141414" />
          {/* Eyes */}
          <circle cx="22" cy="15" r="1.4" fill="#FFFFFF" />
          <circle cx="27" cy="15" r="1.4" fill="#FFFFFF" />
          {/* Stick Legs dangling over top book */}
          <line x1="21" y1="24" x2="21" y2="28" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="24" x2="27" y2="28" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          {/* Tiny Magnifying Glass */}
          <circle cx="13" cy="15" r="3" stroke="#141414" strokeWidth="1.4" fill="#FFFFFF" />
          <line x1="15" y1="17" x2="18" y2="20" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 3. GENERAL RESOURCES & ARCHIVE CRATES (e.g. "General Resources")
  if (lower.includes('resource') || lower.includes('general') || lower.includes('archive')) {
    return (
      <svg
        viewBox="0 0 52 52"
        className="w-11 h-11 shrink-0 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Document Dividers Sticking out of crate */}
        <rect x="14" y="8" width="12" height="12" rx="2" fill="#FFF7ED" stroke="#141414" strokeWidth="1.5" />
        <rect x="24" y="11" width="14" height="10" rx="2" fill="#F0F7FF" stroke="#141414" strokeWidth="1.5" />

        {/* Slate Pushing the Box / Standing on the Left */}
        <g className="transition-transform duration-200 group-hover:-translate-x-1 origin-right">
          {/* Slate Body */}
          <rect x="5" y="20" width="13" height="18" rx="6" fill="#141414" />
          {/* Eyes looking intently toward the crate */}
          <circle cx="12" cy="26" r="1.4" fill="#FFFFFF" />
          <circle cx="16" cy="26" r="1.4" fill="#FFFFFF" />
          {/* Stick Legs */}
          <line x1="8" y1="38" x2="6" y2="45" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="38" x2="15" y2="45" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
          {/* Pushing Hand */}
          <path d="M17 28 L21 28" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Heavy-Duty Archive Crate */}
        <rect x="18" y="19" width="28" height="24" rx="3" fill="#FFFFFF" stroke="#141414" strokeWidth="1.8" />
        {/* Crate Cut-Out Handle */}
        <rect x="27" y="24" width="10" height="4" rx="2" fill="#FFF8F2" stroke="#141414" strokeWidth="1.4" />
        {/* Wood / Cardboard Crate Joint Lines */}
        <line x1="18" y1="35" x2="46" y2="35" stroke="#141414" strokeWidth="1.4" strokeDasharray="2 2" />
        <circle cx="22" cy="40" r="1" fill="#141414" />
        <circle cx="42" cy="40" r="1" fill="#141414" />
      </svg>
    );
  }

  // 4. LAB & EXPERIMENT FOLDERS (e.g. "Lab Manuals", "Experiments")
  if (lower.includes('lab') || lower.includes('experiment') || lower.includes('protocol')) {
    return (
      <svg
        viewBox="0 0 52 52"
        className="w-11 h-11 shrink-0 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Laboratory Clipboard Backing */}
        <rect x="8" y="14" width="28" height="32" rx="3" fill="#FFFFFF" stroke="#141414" strokeWidth="1.8" />
        {/* Metallic Top Clip */}
        <rect x="16" y="10" width="12" height="6" rx="1.5" fill="#141414" />

        {/* Clipboard checklist lines */}
        <line x1="13" y1="23" x2="24" y2="23" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="13" y1="28" x2="21" y2="28" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="13" y1="33" x2="26" y2="33" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />

        {/* Chemistry Flask beside Clipboard */}
        <path
          d="M34 26 L38 26 L38 31 L45 41 C46 42.5 45 44 43 44 L33 44 C31 44 30 42.5 31 41 L34 31 Z"
          fill="#ECFDF5"
          stroke="#141414"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Flask Green Fluid */}
        <path d="M32 40 L44 40 L43 42 C42.5 43 42 43 41 43 L34 43 C33 43 32.5 43 32 42 Z" fill="#00E676" />
        {/* Floating Bubble */}
        <circle cx="38" cy="35" r="1.5" fill="#141414" />

        {/* Slate Holding Inspection Pen */}
        <g className="transition-transform duration-200 group-hover:-translate-y-1 origin-bottom">
          <circle cx="36" cy="15" r="5" fill="#141414" />
          <circle cx="34" cy="15" r="1.2" fill="#FFFFFF" />
          <circle cx="38" cy="15" r="1.2" fill="#FFFFFF" />
          {/* Probe Pen */}
          <line x1="41" y1="16" x2="45" y2="22" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 5. SLIDES, LECTURES, ASSIGNMENTS (e.g. "Lecture Slide Decks", "Assignments")
  if (lower.includes('slide') || lower.includes('lecture') || lower.includes('deck') || lower.includes('assignment')) {
    return (
      <svg
        viewBox="0 0 52 52"
        className="w-11 h-11 shrink-0 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Presentation Slide Canvas */}
        <rect x="10" y="12" width="34" height="24" rx="3" fill="#FFFFFF" stroke="#141414" strokeWidth="1.8" />
        {/* Presentation Stand Tripod Legs */}
        <line x1="27" y1="36" x2="27" y2="45" stroke="#141414" strokeWidth="1.8" />
        <line x1="27" y1="42" x2="18" y2="46" stroke="#141414" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="27" y1="42" x2="36" y2="46" stroke="#141414" strokeWidth="1.8" strokeLinecap="round" />

        {/* Slide Screen Header & Chart Line */}
        <rect x="13" y="15" width="28" height="4" rx="1" fill="#FFF7ED" />
        <polyline points="15,28 22,23 28,26 37,19" fill="none" stroke="#FF6D00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Slate Delivering Presentation with Pointer Stick */}
        <g className="transition-transform duration-200 group-hover:-translate-x-1 origin-bottom">
          <rect x="4" y="24" width="10" height="14" rx="4" fill="#141414" />
          <circle cx="8" cy="28" r="1.2" fill="#FFFFFF" />
          <circle cx="11" cy="28" r="1.2" fill="#FFFFFF" />
          {/* Pointer Stick extending toward chart */}
          <line x1="12" y1="30" x2="20" y2="25" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 6. RECOMMENDATIONS & CURATED PICKS (e.g. "Recommendations")
  if (lower.includes('recommend') || lower.includes('curated') || lower.includes('pick') || lower.includes('fav')) {
    return (
      <svg
        viewBox="0 0 52 52"
        className="w-11 h-11 shrink-0 select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back folder flap */}
        <path
          d="M7 23 L7 17 C7 15.5 8 14.5 9.5 14.5 L20 14.5 L23 18 L42.5 18 C44 18 45 19 45 20.5 L45 23"
          stroke="#141414"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#FFF8F2"
        />

        {/* Slate Mascot Peeking up holding a star badge */}
        <g className="transition-transform duration-200 group-hover:-translate-y-2 origin-bottom">
          {/* Slate Body */}
          <rect x="18" y="9" width="16" height="17" rx="6" fill="#141414" />
          {/* Eyes */}
          <circle cx="23" cy="15" r="1.4" fill="#FFFFFF" />
          <circle cx="29" cy="15" r="1.4" fill="#FFFFFF" />
          {/* Slate Hands holding gold badge */}
          <circle cx="17.5" cy="22" r="1.3" fill="#141414" />
          <circle cx="34.5" cy="22" r="1.3" fill="#141414" />
          {/* Little star badge held up */}
          <path
            d="M26 3 L27.2 6.5 L30.8 6.8 L28 9.2 L28.9 12.8 L26 10.8 L23.1 12.8 L24 9.2 L21.2 6.8 L24.8 6.5 Z"
            fill="#FFE600"
            stroke="#141414"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </g>

        {/* Front Folder Body */}
        <path
          d="M6 23 L46 23 C47 23 48 24 47.8 25.2 L45.2 42.2 C45 43.2 44.2 44 43.2 44 L8.8 44 C7.8 44 7 43.2 6.8 42.2 L4.2 25.2 C4 24 5 23 6 23 Z"
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Play / Badge Plate on front of folder */}
        <rect x="23" y="28" width="18" height="11" rx="3" fill="#FFF7ED" stroke="#FF6D00" strokeWidth="1.2" />
        <polygon points="30,31 36,33.5 30,36" fill="#FF6D00" />
      </svg>
    );
  }

  // 7. DEFAULT / GENERIC FOLDER (with Slate sitting inside)
  return (
    <svg
      viewBox="0 0 52 52"
      className="w-11 h-11 shrink-0 select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back flap */}
      <path
        d="M8 22 L8 16 C8 14.5 9 13.5 10.5 13.5 L20 13.5 L23 17 L42 17 C43.5 17 44.5 18 44.5 19.5 L44.5 22"
        stroke="#141414"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#FFF8F2"
      />

      {/* Slate Peeking Body inside */}
      <g className="transition-transform duration-200 group-hover:-translate-y-1.5 origin-bottom">
        <rect x="20" y="11" width="14" height="15" rx="6" fill="#141414" />
        <circle cx="24" cy="16" r="1.4" fill="#FFFFFF" />
        <circle cx="29" cy="16" r="1.4" fill="#FFFFFF" />
      </g>

      {/* Front folder face */}
      <path
        d="M6 22 L46 22 C47 22 48 23 47.8 24.2 L45.2 41.2 C45 42.2 44.2 43 43.2 43 L8.8 43 C7.8 43 7 42.2 6.8 41.2 L4.2 24.2 C4 23 5 22 6 22 Z"
        fill="#FFFFFF"
        stroke="#141414"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Cute stick legs kicking out under the folder */}
      <line x1="22" y1="43" x2="20" y2="47" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="28" y1="43" x2="30" y2="47" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
