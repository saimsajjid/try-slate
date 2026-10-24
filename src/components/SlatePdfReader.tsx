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
  AlertTriangle,
  X,
  FileText
} from 'lucide-react';
import { getPdfFromDisk, savePdfToDisk } from '../services/academicCache';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';

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
  const [isLoadedFromDisk, setIsLoadedFromDisk] = useState<boolean>(false);
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
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // Visible pages tracking
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));

  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const thumbnailRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to track current PDF Document for aggressive zero-RAM cleanup on unmount
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    pdfDocRef.current = pdfDoc;
  }, [pdfDoc]);

  // Clean unmount: destroys PDF.js WebWorker pages and flushes RAM immediately
  useEffect(() => {
    return () => {
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy();
        } catch (e) {}
        pdfDocRef.current = null;
      }
    };
  }, []);

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

  // Auto-hide controls timer on activity
  const triggerControlsActivity = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isScrubbing) {
        setIsControlsVisible(false);
      }
    }, 3500);
  }, [isScrubbing]);

  // 1. Load PDF from Pure On-Disk Cache or Stream from Vault
  useEffect(() => {
    let isMounted = true;
    const targetUrl = getFullDownloadUrl();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function loadDocument() {
      try {
        // Step 1: Check pure local disk cache (Cache API / IndexedDB) - ZERO RAM
        const diskBuffer = await getPdfFromDisk(targetUrl);
        if (!isMounted) return;

        if (diskBuffer) {
          setIsLoadedFromDisk(true);
          setIsDownloading(false);
          setDownloadProgress(100);

          const doc = await pdfjsLib.getDocument({ data: diskBuffer }).promise;
          if (!isMounted) {
            doc.destroy();
            return;
          }

          setPdfDoc(doc);
          setNumPages(doc.numPages);
          try {
            const firstPage = await doc.getPage(1);
            const vp = firstPage.getViewport({ scale: 1.0 });
            setAspectRatio(vp.width / vp.height);
          } catch (e) {}
          return;
        }

        // Step 2: If not yet cached on disk, start fresh fetch stream
        setIsLoadedFromDisk(false);
        setIsDownloading(true);
        setDownloadProgress(0);
        setDownloadLoadedMB('0');
        setDownloadTotalMB('');
        setDownloadError(null);

        const startTime = Date.now();
        const response = await fetch(targetUrl, { signal: controller.signal });
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

        // Persist directly to local device disk - ZERO global RAM retention
        await savePdfToDisk(targetUrl, arrayBuffer);

        if (!isMounted) return;
        setIsDownloading(false);
        setDownloadProgress(100);
        setIsLoadedFromDisk(true);

        // Load document into PDF.js
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (!isMounted) {
          doc.destroy();
          return;
        }

        setPdfDoc(doc);
        setNumPages(doc.numPages);

        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1.0 });
          setAspectRatio(vp.width / vp.height);
        } catch (e) {}

        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`Document ${fileName} streamed and saved to local disk in ${durationSec}s`);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          console.error('Document load error:', err);
          setDownloadError(err.message || 'Failed to load document');
          setIsDownloading(false);
        }
      }
    }

    loadDocument();

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
              if (pageNum > 1) next.add(pageNum - 1);
              if (pageNum < numPages) next.add(pageNum + 1);
              return next;
            });

            if (entry.intersectionRatio >= 0.35) {
              setCurrentPage(pageNum);
              setJumpPageText(String(pageNum));
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '400px 0px',
        threshold: [0.1, 0.35, 0.7]
      }
    );

    pageContainerRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pdfDoc, numPages]);

  // Scroll smoothly to a specific page
  const scrollToPage = useCallback((pageNum: number) => {
    const clamped = Math.max(1, Math.min(pageNum, numPages));
    setCurrentPage(clamped);
    setJumpPageText(String(clamped));

    const targetEl = pageContainerRefs.current.get(clamped);
    if (targetEl && containerRef.current) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [numPages]);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageText, 10);
    if (!isNaN(pageNum)) {
      scrollToPage(pageNum);
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

  const handleZoomIn = () => setZoom((z) => Math.min(z + 20, 220));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 20, 60));
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
        triggerControlsActivity();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        handlePrevPage();
        triggerControlsActivity();
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToPage(1);
      } else if (e.key === 'End' && numPages > 0) {
        e.preventDefault();
        scrollToPage(numPages);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
        triggerControlsActivity();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
        triggerControlsActivity();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
        triggerControlsActivity();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setSidebarOpen((s) => !s);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, scrollToPage, triggerControlsActivity]);

  // Keep thumbnail sidebar centered on current page
  useEffect(() => {
    if (sidebarOpen && thumbnailRefs.current.has(currentPage)) {
      const btn = thumbnailRefs.current.get(currentPage);
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage, sidebarOpen]);

  const isSlideDeck = aspectRatio > 1.2;

  return (
    <div
      className="flex flex-col w-full h-full bg-[#0A0A0C] text-zinc-100 select-none overflow-hidden relative font-sans"
      onMouseMove={triggerControlsActivity}
    >
      {/* 1. MINIMALIST TRANSLUCENT TOP HEADER */}
      <header className="absolute top-0 left-0 right-0 h-14 px-4 sm:px-6 flex items-center justify-between z-30 bg-[#0B0B0E]/75 backdrop-blur-md border-b border-white/[0.06] transition-opacity duration-200">
        {/* Left: Document Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 text-zinc-400">
            <FileText size={15} />
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="font-medium text-xs sm:text-sm text-zinc-200 truncate max-w-[180px] sm:max-w-md md:max-w-xl tracking-tight">
              {fileName}
            </h2>

            {fileSize && (
              <span className="hidden md:inline text-[11px] font-mono text-zinc-500 shrink-0">
                {fileSize}
              </span>
            )}

            {isLoadedFromDisk && (
              <span
                className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono shrink-0"
                title="Saved to device disk cache (100% offline available)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Offline Ready
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions (Download, Fullscreen, Close) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onDownload && (
            <button
              onClick={onDownload}
              className="h-8 px-3 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center gap-1.5 active:scale-95"
              title="Download file"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] border border-transparent hover:border-white/[0.06] flex items-center justify-center transition-all"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.1] border border-transparent hover:border-white/[0.08] flex items-center justify-center transition-all ml-1"
              title="Close Reader (Esc)"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 w-full min-h-0 flex overflow-hidden relative pt-14">
        {/* DOWNLOAD IN PROGRESS SCREEN */}
        {isDownloading && (
          <div className="m-auto max-w-sm w-full px-6 py-10 flex flex-col items-center text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#141418] border border-white/10 shadow-2xl flex items-center justify-center mb-5 text-[#FF6D00]">
              <FileText size={24} />
            </div>

            <h3 className="text-sm font-semibold text-zinc-100 mb-1 tracking-tight">
              Downloading Document
            </h3>
            <p className="text-xs font-mono text-zinc-400 truncate max-w-xs mb-6">
              {fileName}
            </p>

            {/* Smooth Modern Progress Bar */}
            <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-[#FF6D00] h-full rounded-full transition-all duration-200 ease-out"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>

            <div className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="text-[#FFA040] font-semibold">{downloadProgress}%</span>
              <span>
                {downloadLoadedMB} MB {downloadTotalMB ? `/ ${downloadTotalMB} MB` : ''}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono mt-4">
              Stored directly to device disk for instant offline access.
            </p>
          </div>
        )}

        {/* DOWNLOAD ERROR SCREEN */}
        {downloadError && (
          <div className="m-auto p-6 max-w-md bg-[#141418] border border-red-500/30 rounded-2xl shadow-2xl text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center border border-red-500/20">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-semibold text-sm text-red-400">Unable to load document</h3>
            <p className="text-xs font-mono text-zinc-400">{downloadError}</p>
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-medium border border-white/10 transition-all"
              >
                Download File Directly
              </button>
            )}
          </div>
        )}

        {/* DOCUMENT VIEWER (ONCE DOWNLOADED) */}
        {!isDownloading && !downloadError && pdfDoc && (
          <>
            {/* SLEEK THUMBNAIL DRAWER */}
            {sidebarOpen && (
              <aside className="w-52 sm:w-60 shrink-0 bg-[#0E0E12]/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col h-full z-20 shadow-2xl animate-in slide-in-from-left duration-200">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">
                    Pages
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
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
                        className={`w-full group text-left p-1.5 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-[#FF6D00] bg-[#FF6D00]/10 shadow-[0_0_15px_rgba(255,109,0,0.2)]'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-full bg-[#18181C] rounded overflow-hidden relative flex items-center justify-center border border-black/30"
                          style={{ aspectRatio: aspectRatio || 1.414 }}
                        >
                          <span className="text-xs font-mono text-zinc-500">
                            {pageNum}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-mono ${
                            isSelected
                              ? 'text-[#FF6D00] font-semibold'
                              : 'text-zinc-500 group-hover:text-zinc-300'
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

            {/* MAIN CONTINUOUS SCROLL VIEWPORT WITH AMBIENT CANVAS */}
            <main
              ref={containerRef}
              onScroll={triggerControlsActivity}
              className="flex-1 w-full h-full overflow-y-auto overflow-x-auto flex flex-col items-center py-8 sm:py-12 px-4 sm:px-8 space-y-8 custom-scrollbar relative"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.025) 0%, transparent 65%)'
              }}
            >
              <div
                className="flex flex-col items-center space-y-8 transition-all duration-150"
                style={{
                  width: isSlideDeck
                    ? `${Math.max(620, Math.min(1440, (zoom / 100) * 1050))}px`
                    : `${Math.max(500, Math.min(1240, (zoom / 100) * 820))}px`,
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
                      className="w-full bg-[#141416] rounded-sm overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7),0_2px_8px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.08] relative group transition-all"
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
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#141418] text-zinc-600 font-mono text-xs">
                          <span>Page {pageNum}</span>
                        </div>
                      )}

                      {/* Subtle Page Badge on Hover */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/80 backdrop-blur-md text-zinc-300 border border-white/10 font-mono text-[11px] px-2 py-0.5 rounded shadow">
                        {pageNum} / {numPages}
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>

            {/* 3. APPLE BOOKS / NOTION STYLE FLOATING PILL DOCK */}
            <div
              className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
                isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-25 translate-y-2 hover:opacity-100 hover:translate-y-0'
              }`}
              onMouseEnter={() => setIsControlsVisible(true)}
            >
              <div className="bg-[#18181C]/90 backdrop-blur-2xl border border-white/[0.12] rounded-full px-2.5 py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.8)] flex items-center gap-1 sm:gap-2 text-zinc-300">
                {/* Thumbnails Sidebar Toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    sidebarOpen
                      ? 'bg-white/20 text-white'
                      : 'hover:bg-white/[0.08] text-zinc-400 hover:text-white'
                  }`}
                  title="Toggle Pages Drawer (T)"
                >
                  <SidebarIcon size={15} />
                </button>

                <div className="h-4 w-px bg-white/10" />

                {/* Page Navigation */}
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent text-zinc-300 hover:text-white transition-all"
                  title="Previous Page (Left Arrow)"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Interactive Jump Box */}
                <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 px-1">
                  <input
                    type="text"
                    value={jumpPageText}
                    onChange={(e) => setJumpPageText(e.target.value)}
                    onBlur={() => setJumpPageText(String(currentPage))}
                    className="w-9 sm:w-12 text-center font-mono font-medium text-xs text-white bg-transparent focus:outline-none focus:bg-white/[0.06] rounded py-0.5"
                    title="Type page and press Enter"
                  />
                  <span className="text-[11px] font-mono text-zinc-500">/</span>
                  <span className="text-[11px] font-mono text-zinc-400 pl-0.5">
                    {numPages}
                  </span>
                </form>

                {/* Page Scrubber Slider for Fast Scrubbing in 1,000+ Page Textbooks */}
                {numPages > 10 && (
                  <div className="hidden md:flex items-center px-1">
                    <input
                      type="range"
                      min={1}
                      max={numPages}
                      value={currentPage}
                      onMouseDown={() => setIsScrubbing(true)}
                      onMouseUp={() => setIsScrubbing(false)}
                      onTouchStart={() => setIsScrubbing(true)}
                      onTouchEnd={() => setIsScrubbing(false)}
                      onChange={(e) => scrollToPage(Number(e.target.value))}
                      className="w-20 sm:w-28 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF6D00]"
                      title="Scrub pages"
                    />
                  </div>
                )}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= numPages}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent text-zinc-300 hover:text-white transition-all"
                  title="Next Page (Right Arrow)"
                >
                  <ChevronRight size={16} />
                </button>

                <div className="h-4 w-px bg-white/10" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 60}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.08] disabled:opacity-20 text-zinc-400 hover:text-white transition-all"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={14} />
                  </button>

                  <button
                    onClick={handleResetZoom}
                    className="px-1.5 py-0.5 font-mono text-[11px] text-zinc-400 hover:text-white font-medium"
                    title="Reset Zoom to 100% (0)"
                  >
                    {zoom}%
                  </button>

                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 220}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.08] disabled:opacity-20 text-zinc-400 hover:text-white transition-all"
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>
            </div>
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
    <div className="w-full h-full relative flex items-center justify-center bg-white">
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain block transition-opacity duration-150 ${
          rendered ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#141418]">
          <span className="text-xs font-mono text-zinc-500">
            Page {pageNum}
          </span>
        </div>
      )}
    </div>
  );
};
