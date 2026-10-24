import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sidebar as SidebarIcon,
  Download,
  AlertTriangle
} from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';

// In-memory binary cache to make re-opening files in the same session instantaneous (0ms)
const pdfMemoryCache = new Map<string, ArrayBuffer>();

interface SlatePdfReaderProps {
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  onDownload?: () => void;
  onClose?: () => void;
}

const VAULT_STREAM_HOST = 'https://api.tryaudrio.app';

export const SlatePdfReader: React.FC<SlatePdfReaderProps> = ({
  fileUrl,
  fileName,
  fileSize,
  onDownload,
  onClose
}) => {
  // Download progress state
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadLoadedMB, setDownloadLoadedMB] = useState<string>('0');
  const [downloadTotalMB, setDownloadTotalMB] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(true);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // PDF Document state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageText, setJumpPageText] = useState<string>('1');
  const [aspectRatio, setAspectRatio] = useState<number>(1.414); // default A4
  const [zoom, setZoom] = useState<number>(100);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Visible pages tracking
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));

  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const thumbnailRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Determine full file download URL
  const getFullDownloadUrl = useCallback(() => {
    let clean = fileUrl;
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    if (!clean.startsWith('/')) clean = `/${clean}`;
    if (!clean.startsWith('/academic-files')) {
      clean = `/academic-files${clean}`;
    }
    return `${VAULT_STREAM_HOST}${clean}`;
  }, [fileUrl]);

  // 1. Download Full PDF with Streaming Progress
  useEffect(() => {
    let isMounted = true;
    const targetUrl = getFullDownloadUrl();

    // Check in-memory session cache first
    if (pdfMemoryCache.has(targetUrl)) {
      const cachedBuffer = pdfMemoryCache.get(targetUrl)!;
      setIsDownloading(false);
      setDownloadProgress(100);

      pdfjsLib
        .getDocument({ data: cachedBuffer.slice(0) })
        .promise.then(async (doc) => {
          if (!isMounted) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          try {
            const firstPage = await doc.getPage(1);
            const vp = firstPage.getViewport({ scale: 1.0 });
            setAspectRatio(vp.width / vp.height);
          } catch (e) {}
        })
        .catch((err) => {
          if (isMounted) setDownloadError(err.message || 'Failed to parse cached document');
        });

      return;
    }

    // Start fresh fetch stream
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadLoadedMB('0');
    setDownloadTotalMB('');
    setDownloadError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startTime = Date.now();

    fetch(targetUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        if (totalBytes > 0) {
          setDownloadTotalMB((totalBytes / (1024 * 1024)).toFixed(1));
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ReadableStream not supported by browser.');
        }

        let receivedBytes = 0;
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedBytes += value.length;

          if (isMounted) {
            setDownloadLoadedMB((receivedBytes / (1024 * 1024)).toFixed(1));
            if (totalBytes > 0) {
              const pct = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
              setDownloadProgress(pct);
            } else {
              // Indeterminate: advance progress gently
              setDownloadProgress((prev) => Math.min(95, prev + 2));
            }
          }
        }

        // Concatenate all chunks into a single ArrayBuffer
        const fullBuffer = new Uint8Array(receivedBytes);
        let offset = 0;
        for (const chunk of chunks) {
          fullBuffer.set(chunk, offset);
          offset += chunk.length;
        }

        const arrayBuffer = fullBuffer.buffer;

        // Store in session cache
        pdfMemoryCache.set(targetUrl, arrayBuffer);

        if (!isMounted) return;
        setIsDownloading(false);
        setDownloadProgress(100);

        // Load document into PDF.js
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);

        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1.0 });
          setAspectRatio(vp.width / vp.height);
        } catch (e) {}

        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`Document ${fileName} downloaded in ${durationSec}s`);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          console.error('Download error:', err);
          setDownloadError(err.message || 'Failed to download document');
          setIsDownloading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [getFullDownloadUrl, fileName]);

  // 2. Track Visible Pages with IntersectionObserver (Windowing / Virtualization)
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute('data-page-num'));
          if (!pageNum) return;

          if (entry.isIntersecting) {
            setVisiblePages((prev) => {
              const next = new Set(prev);
              next.add(pageNum);
              // Pre-buffer 1 page ahead and behind
              if (pageNum > 1) next.add(pageNum - 1);
              if (pageNum < numPages) next.add(pageNum + 1);
              return next;
            });

            if (entry.intersectionRatio >= 0.4) {
              setCurrentPage(pageNum);
              setJumpPageText(String(pageNum));
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0.05, 0.4]
      }
    );

    pageContainerRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pdfDoc, numPages]);

  // Scroll to page
  const scrollToPage = useCallback(
    (pageNum: number, behavior: ScrollBehavior = 'smooth') => {
      if (!pdfDoc) return;
      const target = Math.max(1, Math.min(numPages, pageNum));
      const el = pageContainerRefs.current.get(target);
      if (el) {
        el.scrollIntoView({ behavior, block: 'start' });
        setCurrentPage(target);
        setJumpPageText(String(target));
      }
    },
    [pdfDoc, numPages]
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
    if (currentPage < numPages) scrollToPage(currentPage + 1);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 250));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleResetZoom = () => setZoom(100);

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
      } else if (e.key === 'End' && numPages > 0) {
        e.preventDefault();
        scrollToPage(numPages);
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
  }, [currentPage, numPages, scrollToPage]);

  // Keep thumbnail sidebar centered
  useEffect(() => {
    if (sidebarOpen && thumbnailRefs.current.has(currentPage)) {
      const btn = thumbnailRefs.current.get(currentPage);
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage, sidebarOpen]);

  const isSlideDeck = aspectRatio > 1.2;

  return (
    <div className="flex flex-col w-full h-full bg-[#121214] text-zinc-100 select-none overflow-hidden relative font-sans">
      {/* 1. TOP HEADER CONTROLS BAR */}
      <header className="bg-[#18181B] border-b-2 border-[#141414] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-30 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
        {/* Left: Sidebar Toggle & Doc Details */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            disabled={isDownloading || !pdfDoc}
            className={`p-1.5 rounded-lg border-2 border-[#141414] transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
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
              {isSlideDeck ? 'SLIDES' : 'PDF'}
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
        {!isDownloading && numPages > 0 && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-[#141414] bg-[#222226] hover:bg-[#2C2C30] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-200 shadow-[1.5px_1.5px_0px_#141414] active:scale-95 transition-all"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>

            <form
              onSubmit={handleJumpSubmit}
              className="flex items-center gap-1 bg-[#121214] border-2 border-[#27272A] rounded-lg px-2 py-0.5 shadow-[1px_1px_0px_#141414] focus-within:border-[#FF6D00]"
            >
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
                {numPages}
              </span>
            </form>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-[#141414] bg-[#222226] hover:bg-[#2C2C30] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-200 shadow-[1.5px_1.5px_0px_#141414] active:scale-95 transition-all"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Right: Zoom, Fullscreen & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!isDownloading && (
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
          )}

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
              title="Download File"
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
      </header>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 w-full min-h-0 flex overflow-hidden relative">
        {/* DOWNLOAD IN PROGRESS SCREEN */}
        {isDownloading && (
          <div className="m-auto max-w-md w-full px-6 py-10 flex flex-col items-center text-center animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-2xl bg-[#18181B] border-2 border-[#141414] shadow-[3px_3px_0px_#FF6D00] flex items-center justify-center mb-5">
              <span className="font-mono font-bold text-[#FF6D00] text-xl">PDF</span>
            </div>

            <h3 className="text-base font-bold text-zinc-100 mb-1 tracking-tight">
              Downloading Document
            </h3>
            <p className="text-xs font-mono text-zinc-400 truncate max-w-sm mb-6">
              {fileName}
            </p>

            {/* Neo-Brutalist Progress Bar */}
            <div className="w-full bg-[#161618] border-2 border-[#141414] rounded-xl h-5 p-0.5 shadow-[2px_2px_0px_#141414] overflow-hidden mb-3">
              <div
                className="bg-[#FF6D00] h-full rounded-lg transition-all duration-150 ease-out flex items-center justify-end pr-1"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>

            <div className="w-full flex items-center justify-between text-xs font-mono font-bold text-zinc-400">
              <span className="text-[#FFA040]">{downloadProgress}%</span>
              <span>
                {downloadLoadedMB} MB {downloadTotalMB ? `/ ${downloadTotalMB} MB` : ''}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono mt-4">
              Downloaded once and cached in browser memory for instant offline reading.
            </p>
          </div>
        )}

        {/* DOWNLOAD ERROR SCREEN */}
        {downloadError && (
          <div className="m-auto p-6 max-w-md bg-[#18181B] border-2 border-red-500 rounded-2xl shadow-[4px_4px_0px_#EF4444] text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/40">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-bold text-sm text-red-400">Download Unavailable</h3>
            <p className="text-xs font-mono text-zinc-400">{downloadError}</p>
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-4 py-2 rounded-xl bg-[#FF6D00] text-white text-xs font-bold hover:bg-[#E66200] shadow-[2px_2px_0px_#141414] transition-all"
              >
                Download File Directly
              </button>
            )}
          </div>
        )}

        {/* DOCUMENT VIEWER (ONCE 100% DOWNLOADED) */}
        {!isDownloading && !downloadError && pdfDoc && (
          <>
            {/* THUMBNAILS SIDEBAR */}
            {sidebarOpen && (
              <aside className="w-48 sm:w-56 shrink-0 bg-[#161618] border-r-2 border-[#141414] flex flex-col h-full z-20 shadow-[2px_0_10px_rgba(0,0,0,0.4)] animate-in slide-in-from-left duration-150">
                <div className="p-3 border-b border-[#27272A] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Thumbnails
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 font-bold">
                    {numPages} total
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
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
                          style={{ aspectRatio: aspectRatio || 1.414 }}
                        >
                          <span className="text-xs font-mono font-bold text-zinc-500">
                            p. {pageNum}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            isSelected
                              ? 'text-[#FF6D00]'
                              : 'text-zinc-400 group-hover:text-zinc-200'
                          }`}
                        >
                          Page {pageNum}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            {/* MAIN CONTINUOUS SCROLL VIEWPORT */}
            <main
              ref={containerRef}
              className="flex-1 w-full h-full overflow-y-auto overflow-x-auto bg-[#0E0E10] flex flex-col items-center p-3 sm:p-6 space-y-6 custom-scrollbar relative"
            >
              <div
                className="flex flex-col items-center space-y-6 transition-all duration-150"
                style={{
                  width: isSlideDeck
                    ? `${Math.max(600, Math.min(1400, (zoom / 100) * 1050))}px`
                    : `${Math.max(500, Math.min(1200, (zoom / 100) * 820))}px`,
                  maxWidth: '100%'
                }}
              >
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                  const isVisible = visiblePages.has(pageNum);
                  return (
                    <div
                      key={pageNum}
                      data-page-num={pageNum}
                      ref={(el) => {
                        if (el) pageContainerRefs.current.set(pageNum, el);
                        else pageContainerRefs.current.delete(pageNum);
                      }}
                      className="w-full bg-[#18181B] border-2 border-[#1E1E22] hover:border-[#3F3F46] rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)] relative group transition-all"
                      style={{ aspectRatio: aspectRatio || 1.414 }}
                    >
                      {/* Render PDF Canvas when in view */}
                      {isVisible ? (
                        <PdfPageCanvas
                          doc={pdfDoc}
                          pageNum={pageNum}
                          zoom={zoom}
                          aspectRatio={aspectRatio}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#151518] text-zinc-600 font-mono text-xs">
                          <span>Page {pageNum}</span>
                        </div>
                      )}

                      {/* Floating Page Pill badge on Hover */}
                      <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#141414]/90 backdrop-blur-xs text-white border border-white/20 font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow">
                        {pageNum} / {numPages}
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
};

// Sub-component: High-DPI Razor-Sharp Canvas Renderer for a Single Page
interface PdfPageCanvasProps {
  doc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  zoom: number;
  aspectRatio: number;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({ doc, pageNum, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    let isCancelled = false;

    doc
      .getPage(pageNum)
      .then((page) => {
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Cancel previous ongoing render if zoom changed rapidly
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {}
        }

        // Calculate high-resolution scale (1.5x minimum, up to 2x devicePixelRatio)
        const dpr = Math.min(window.devicePixelRatio || 1.5, 2.0);
        const baseScale = (zoom / 100) * 1.5;
        const viewport = page.getViewport({ scale: baseScale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        return renderTask.promise;
      })
      .then(() => {
        if (!isCancelled) setRendered(true);
      })
      .catch((err) => {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render error:`, err);
        }
      });

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [doc, pageNum, zoom]);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain block transition-opacity duration-150 ${
          rendered ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#151518]">
          <span className="text-xs font-mono text-zinc-500 font-bold">
            Rendering Page {pageNum}...
          </span>
        </div>
      )}
    </div>
  );
};
