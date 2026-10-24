import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sidebar as SidebarIcon,
  Loader2,
  Download
} from 'lucide-react';

interface DocumentReaderProps {
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  onDownload?: () => void;
  onClose?: () => void;
}

interface DocManifest {
  pageCount: number;
  width: number;
  height: number;
  aspectRatio: number;
  docHash?: string;
  title?: string;
}

const VAULT_API_BASE = 'https://api.tryaudrio.app/academic-files';

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  fileUrl,
  fileName,
  fileSize,
  onDownload,
  onClose
}) => {
  const [manifest, setManifest] = useState<DocManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPageText, setJumpPageText] = useState('1');
  const [zoom, setZoom] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const thumbnailRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Clean relative path from fileUrl
  const cleanDocPath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;

  // 1. Fetch Document Manifest
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setJumpPageText('1');

    const manifestUrl = `${VAULT_API_BASE}/preview-manifest?doc=${encodeURIComponent(cleanDocPath)}`;

    fetch(manifestUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}: Failed to load document metadata`);
        }
        return res.json();
      })
      .then((data: DocManifest) => {
        if (isMounted) {
          setManifest(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load document manifest:', err);
          setError(err.message || 'Unable to connect to document engine.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cleanDocPath]);

  // 2. IntersectionObserver to track visible page on scroll
  useEffect(() => {
    if (!manifest || manifest.pageCount === 0 || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            const pageNum = Number(entry.target.getAttribute('data-page-num'));
            if (pageNum && !isNaN(pageNum)) {
              setCurrentPage(pageNum);
              setJumpPageText(String(pageNum));
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0.1, 0.4, 0.7]
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [manifest, loading]);

  // Keep thumbnail sidebar centered on current page
  useEffect(() => {
    if (sidebarOpen && thumbnailRefs.current.has(currentPage)) {
      const btn = thumbnailRefs.current.get(currentPage);
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage, sidebarOpen]);

  // 3. Scroll to specific page
  const scrollToPage = useCallback(
    (pageNum: number, behavior: ScrollBehavior = 'smooth') => {
      if (!manifest) return;
      const target = Math.max(1, Math.min(manifest.pageCount, pageNum));
      const el = pageRefs.current.get(target);
      if (el) {
        el.scrollIntoView({ behavior, block: 'start' });
        setCurrentPage(target);
        setJumpPageText(String(target));
      }
    },
    [manifest]
  );

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpPageText, 10);
    if (!isNaN(parsed)) {
      scrollToPage(parsed);
    } else {
      setJumpPageText(String(currentPage));
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) scrollToPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (manifest && currentPage < manifest.pageCount) scrollToPage(currentPage + 1);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 250));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in jump input
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToPage(1);
      } else if (e.key === 'End' && manifest) {
        e.preventDefault();
        scrollToPage(manifest.pageCount);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setSidebarOpen((s) => !s);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, manifest, scrollToPage]);

  // Page URL generator
  const getPageUrl = (pageNumber: number) => {
    return `${VAULT_API_BASE}/preview-page?doc=${encodeURIComponent(cleanDocPath)}&page=${pageNumber}&dpi=144`;
  };

  const getThumbnailUrl = (pageNumber: number) => {
    return `${VAULT_API_BASE}/preview-page?doc=${encodeURIComponent(cleanDocPath)}&page=${pageNumber}&dpi=72`;
  };

  const isSlideDeck = manifest ? manifest.aspectRatio > 1.2 : false;

  return (
    <div className="flex flex-col w-full h-full bg-[#121214] text-zinc-100 select-none overflow-hidden relative font-sans">
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-[#18181B] border-b-2 border-[#141414] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-30 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        {/* Left: Sidebar Toggle & Doc Details */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg border-2 border-[#141414] transition-all flex items-center gap-1.5 text-xs font-bold ${
              sidebarOpen
                ? 'bg-[#FF6D00] text-white shadow-[1.5px_1.5px_0px_#141414]'
                : 'bg-[#222226] text-zinc-300 hover:text-white hover:bg-[#2C2C30] shadow-[1.5px_1.5px_0px_#141414]'
            }`}
            title="Toggle Thumbnails Sidebar (T)"
          >
            <SidebarIcon size={15} />
            <span className="hidden md:inline font-mono text-[11px]">Pages</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-[#FF6D00]/20 text-[#FF6D00] border border-[#FF6D00]/40 font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow-[1px_1px_0px_#141414] shrink-0">
              {isSlideDeck ? 'SLIDES' : 'DOC'}
            </span>
            <span className="font-bold text-xs sm:text-sm text-zinc-200 truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
              {fileName}
            </span>
            {fileSize && (
              <span className="hidden lg:inline text-[11px] font-mono text-zinc-500 font-bold shrink-0">
                ({fileSize})
              </span>
            )}
          </div>
        </div>

        {/* Center: Page Navigation & Quick Jump */}
        {manifest && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-[#141414] bg-[#222226] hover:bg-[#2C2C30] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-200 shadow-[1.5px_1.5px_0px_#141414] active:scale-95 transition-all"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>

            <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 bg-[#121214] border-2 border-[#27272A] rounded-lg px-2 py-0.5 shadow-[1px_1px_0px_#141414] focus-within:border-[#FF6D00]">
              <input
                type="text"
                value={jumpPageText}
                onChange={(e) => setJumpPageText(e.target.value)}
                onBlur={() => setJumpPageText(String(currentPage))}
                className="w-8 sm:w-11 bg-transparent text-center font-mono font-bold text-xs text-[#FFA040] focus:outline-none"
                title="Type page and press Enter"
              />
              <span className="text-[11px] font-mono text-zinc-500 font-bold">/</span>
              <span className="text-[11px] font-mono text-zinc-400 font-bold pr-0.5">
                {manifest.pageCount}
              </span>
            </form>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= manifest.pageCount}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-[#141414] bg-[#222226] hover:bg-[#2C2C30] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-200 shadow-[1.5px_1.5px_0px_#141414] active:scale-95 transition-all"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Right: Zoom, Fullscreen & Download */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 bg-[#121214] border border-[#27272A] rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-1 hover:bg-[#222226] rounded text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-all"
              title="Zoom Out (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-300 hover:text-white"
              title="Reset Zoom (0)"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 250}
              className="p-1 hover:bg-[#222226] rounded text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-all"
              title="Zoom In (+)"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex w-8 h-8 rounded-lg border-2 border-[#141414] bg-[#222226] hover:bg-[#2C2C30] text-zinc-300 hover:text-white items-center justify-center shadow-[1.5px_1.5px_0px_#141414] active:scale-95 transition-all"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {onDownload && (
            <button
              onClick={onDownload}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FF6D00] text-white hover:bg-[#E66200] transition-all border-2 border-[#141414] shadow-[2px_2px_0px_#141414] active:scale-95 flex items-center gap-1.5"
              title="Download Original PDF"
            >
              <Download size={13} className="shrink-0" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border-2 border-[#141414] bg-[#222226] hover:bg-[#2C2C30] text-zinc-300 hover:text-white font-bold text-sm flex items-center justify-center shadow-[1.5px_1.5px_0px_#141414] active:scale-95 transition-all ml-1"
              title="Close Preview (Esc)"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. BODY: THUMBNAILS SIDEBAR + MAIN VIRTUALIZED VIEWPORT */}
      <div className="flex-1 w-full min-h-0 flex overflow-hidden relative">
        {/* SIDEBAR: Page Thumbnails */}
        {sidebarOpen && manifest && (
          <aside className="w-48 sm:w-56 shrink-0 bg-[#161618] border-r-2 border-[#141414] flex flex-col h-full z-20 shadow-[2px_0_10px_rgba(0,0,0,0.4)] animate-in slide-in-from-left duration-150">
            <div className="p-3 border-b border-[#27272A] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Thumbnails
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {manifest.pageCount} total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {Array.from({ length: manifest.pageCount }, (_, i) => i + 1).map((pageNum) => {
                const isSelected = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    ref={(el) => {
                      if (el) thumbnailRefs.current.set(pageNum, el);
                      else thumbnailRefs.current.delete(pageNum);
                    }}
                    onClick={() => scrollToPage(pageNum)}
                    className={`w-full group text-left p-1.5 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-[#FF6D00] bg-[#FF6D00]/10 shadow-[2px_2px_0px_#FF6D00]'
                        : 'border-[#27272A] bg-[#1F1F23] hover:border-zinc-400 shadow-[1.5px_1.5px_0px_#141414]'
                    }`}
                  >
                    <div
                      className="w-full bg-[#121214] rounded overflow-hidden relative flex items-center justify-center border border-black/30"
                      style={{
                        aspectRatio: manifest.aspectRatio || 0.75
                      }}
                    >
                      <img
                        src={getThumbnailUrl(pageNum)}
                        alt={`Page ${pageNum}`}
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        isSelected ? 'text-[#FF6D00]' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    >
                      {pageNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* MAIN VIEWPORT: Virtualized Infinite Page Stream */}
        <main
          ref={containerRef}
          className="flex-1 w-full h-full overflow-y-auto overflow-x-auto bg-[#0E0E10] flex flex-col items-center p-3 sm:p-6 space-y-6 custom-scrollbar relative"
        >
          {loading && (
            <div className="m-auto flex flex-col items-center justify-center gap-3 p-8">
              <Loader2 className="w-8 h-8 text-[#FF6D00] animate-spin" />
              <p className="text-xs font-mono font-bold text-zinc-400">
                Opening document stream...
              </p>
            </div>
          )}

          {error && (
            <div className="m-auto p-6 max-w-md bg-[#18181B] border-2 border-red-500/80 rounded-2xl shadow-[4px_4px_0px_#EF4444] text-center space-y-3">
              <h3 className="font-bold text-sm text-red-400">Preview Error</h3>
              <p className="text-xs font-mono text-zinc-400">{error}</p>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 rounded-xl bg-[#FF6D00] text-white text-xs font-bold hover:bg-[#E66200] shadow-[2px_2px_0px_#141414] transition-all"
                >
                  Download Original File Directly
                </button>
              )}
            </div>
          )}

          {!loading && !error && manifest && (
            <div
              className="flex flex-col items-center space-y-6 transition-all duration-150"
              style={{
                width: isSlideDeck
                  ? `${Math.max(600, Math.min(1400, (zoom / 100) * 1050))}px`
                  : `${Math.max(500, Math.min(1200, (zoom / 100) * 820))}px`,
                maxWidth: '100%'
              }}
            >
              {Array.from({ length: manifest.pageCount }, (_, i) => i + 1).map((pageNum) => {
                return (
                  <div
                    key={pageNum}
                    data-page-num={pageNum}
                    ref={(el) => {
                      if (el) pageRefs.current.set(pageNum, el);
                      else pageRefs.current.delete(pageNum);
                    }}
                    className="w-full bg-[#18181B] border-2 border-[#1E1E22] hover:border-[#3F3F46] rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)] relative group transition-all"
                    style={{
                      aspectRatio: manifest.aspectRatio || 0.75
                    }}
                  >
                    {/* Lazy-loaded high-res WebP page */}
                    <img
                      src={getPageUrl(pageNum)}
                      alt={`Page ${pageNum}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain block select-none pointer-events-auto"
                      onError={(e) => {
                        // Fallback retry
                        const img = e.currentTarget;
                        setTimeout(() => {
                          img.src = `${getPageUrl(pageNum)}&retry=${Date.now()}`;
                        }, 1000);
                      }}
                    />

                    {/* Floating Page Number Pill badge */}
                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#141414]/90 backdrop-blur-xs text-white border border-white/20 font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow">
                      {pageNum} / {manifest.pageCount}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
