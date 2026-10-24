import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Vite native worker URL resolution
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfViewerProps {
  url: string;
  fileName: string;
}

export function PdfViewer({ url, fileName }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInputValue, setPageInputValue] = useState<string>('1');
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageRendering, setPageRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Initialize PDF Document with strict HTTP 206 Byte-Range streaming (disableAutoFetch & disableStream)
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setPageInputValue('1');
    pdfDocRef.current = null;

    const loadingTask = pdfjsLib.getDocument({
      url,
      rangeChunkSize: 65536,
      disableAutoFetch: true, // CRITICAL: NEVER fetch the entire document
      disableStream: true,    // CRITICAL: ONLY request byte ranges on demand
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
    });

    loadingTask.promise
      .then((doc) => {
        if (!active) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error('PDF.js loading error:', err);
        setError(err.message || 'Failed to load PDF stream');
        setLoading(false);
      });

    return () => {
      active = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }
      loadingTask.destroy();
    };
  }, [url]);

  // 2. Render Single Page onto Canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      const doc = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas) return;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }

      setPageRendering(true);

      try {
        const page = await doc.getPage(pageNumber);
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * pixelRatio });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
        canvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        setPageRendering(false);
        setPageInputValue(String(pageNumber));

        // Scroll to top of page container on page turn
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
        setPageRendering(false);
      }
    },
    [scale]
  );

  useEffect(() => {
    if (pdfDocRef.current && currentPage >= 1) {
      renderPage(currentPage);
    }
  }, [currentPage, renderPage]);

  // Page Navigation Handlers
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages > 0 && currentPage < numPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInputValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  // Keyboard navigation for PDF
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(numPages);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale((s) => Math.min(3, s + 0.2));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setScale((s) => Math.max(0.6, s - 0.2));
      } else if (e.key === '0') {
        e.preventDefault();
        setScale(1.2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, currentPage]);

  return (
    <div className="w-full h-full flex flex-col bg-neutral-900 select-none overflow-hidden">
      {/* Top Floating Control Bar */}
      <div className="bg-neutral-850/95 backdrop-blur border-b border-neutral-700/80 px-4 py-2 flex items-center justify-between gap-3 shrink-0 text-white z-20">
        {/* Left: Page Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1 || loading}
            className="px-2 py-1 text-xs font-mono font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed rounded border border-neutral-600 active:scale-95 transition-all"
            title="First Page (Home)"
          >
            |‹
          </button>
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1 || loading}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed rounded border border-neutral-600 active:scale-95 transition-all flex items-center gap-1"
            title="Previous Page (Left Arrow)"
          >
            ‹ Prev
          </button>

          {/* Direct Page Input Jump */}
          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-neutral-400">Page</span>
            <input
              type="text"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onBlur={() => setPageInputValue(String(currentPage))}
              disabled={loading || numPages === 0}
              className="w-12 text-center text-xs font-mono font-bold bg-neutral-900 border border-neutral-600 rounded px-1.5 py-0.5 text-amber-400 focus:outline-none focus:border-amber-400"
            />
            <span className="text-xs font-mono text-neutral-400">of {numPages || '...'}</span>
          </form>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages || loading}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed rounded border border-neutral-600 active:scale-95 transition-all flex items-center gap-1"
            title="Next Page (Right Arrow)"
          >
            Next ›
          </button>
          <button
            onClick={() => setCurrentPage(numPages)}
            disabled={currentPage >= numPages || loading}
            className="px-2 py-1 text-xs font-mono font-bold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed rounded border border-neutral-600 active:scale-95 transition-all"
            title="Last Page (End)"
          >
            ›|
          </button>

          {pageRendering && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 font-mono ml-2">
              <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Streaming page...</span>
            </div>
          )}
        </div>

        {/* Right: Zoom Controls & Stream Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-800 rounded border border-neutral-700 p-0.5">
            <button
              onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
              className="px-2 py-0.5 text-xs font-mono font-bold hover:bg-neutral-700 rounded text-neutral-200"
              title="Zoom Out (-)"
            >
              -
            </button>
            <span className="text-xs font-mono font-bold px-1.5 text-amber-300">
              {Math.round((scale / 1.2) * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.2))}
              className="px-2 py-0.5 text-xs font-mono font-bold hover:bg-neutral-700 rounded text-neutral-200"
              title="Zoom In (+)"
            >
              +
            </button>
            <button
              onClick={() => setScale(1.2)}
              className="px-2 py-0.5 text-[10px] font-mono font-bold hover:bg-neutral-700 rounded text-neutral-400 border-l border-neutral-700 ml-0.5"
              title="Reset Zoom (0)"
            >
              Reset
            </button>
          </div>

          <span className="hidden md:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            Byte-Range Streamed
          </span>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-4 relative"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-neutral-300 font-bold">
              Connecting to byte-range stream for {fileName}...
            </p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center max-w-md bg-white border-2 border-red-500 rounded-2xl shadow-[4px_4px_0px_#EF4444] space-y-3">
            <h3 className="font-bold text-red-600 text-sm">Streaming Error</h3>
            <p className="text-xs text-neutral-600 font-mono">{error}</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`shadow-2xl rounded-sm max-w-full bg-white transition-opacity duration-150 ${
            loading || error ? 'hidden' : 'block'
          } ${pageRendering ? 'opacity-80' : 'opacity-100'}`}
        />
      </div>
    </div>
  );
}
