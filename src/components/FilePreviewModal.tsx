import { useEffect, useRef, useState } from 'react';
import * as docx from 'docx-preview';
import { marked } from 'marked';
import { ReactPptxViewer } from '@extend-ai/react-pptx';
import '@extend-ai/react-pptx/styles.css';
import { getPdfFromDisk, savePdfToDisk, purgePdfFromDisk, isBufferValidPdf, getTextFromDisk, saveTextToDisk } from '../services/academicCache';

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    link({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    },
  },
});

export interface PreviewFile {
  name: string;
  size: string;
  type: string;
  url: string;
}

interface FilePreviewModalProps {
  file: PreviewFile | null;
  folderFiles?: PreviewFile[];
  onNavigate?: (file: PreviewFile) => void;
  onNavigateFile?: (direction: 'next' | 'prev') => void;
  onNavigateFolder?: (direction: 'next' | 'prev') => void;
  onNavigateCourse?: (direction: 'next' | 'prev') => void;
  onClose: () => void;
  onDownload: (file: PreviewFile) => void;
}

const IMAGE_EXTENSIONS = ['jpeg', 'jpg', 'png', 'svg', 'webp', 'gif'];
const isImage = (type: string) => IMAGE_EXTENSIONS.includes(type.toLowerCase());
const VAULT_STREAM_HOST = import.meta.env.PROD ? 'https://api.tryaudrio.app' : '';

export function FilePreviewModal({
  file,
  folderFiles,
  onNavigate,
  onNavigateFile,
  onNavigateFolder,
  onNavigateCourse,
  onClose,
  onDownload,
}: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const handleForceReload = async () => {
    if (file) {
      const targetUrl = file.url.startsWith('http') ? file.url : `${VAULT_STREAM_HOST}${file.url}`;
      await purgePdfFromDisk(targetUrl);
    }
    setError(null);
    setLoading(true);
    setReloadCounter((c) => c + 1);
  };
  const [error, setError] = useState<string | null>(null);

  // Markdown / Text state
  const [markdownHtml, setMarkdownHtml] = useState<string>('');

  // PDF / Image Blob URL state (bypasses IDM download interceptor)
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfSourceUrl, setPdfSourceUrl] = useState<string>('');

  // PPTX binary buffer for Wasm presentation viewer
  const [pptxBuffer, setPptxBuffer] = useState<ArrayBuffer | null>(null);

  // Image zoom state
  const [imageZoom, setImageZoom] = useState(1);

  // PDF iframe ref
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  // DOCX container ref
  const docxContainerRef = useRef<HTMLDivElement>(null);

  // Fast in-memory Blob URL cache for smooth photo navigation
  const blobCacheRef = useRef<Map<string, string>>(new Map());

  // Lock body scroll when preview modal is open to completely eliminate background scrolling
  useEffect(() => {
    if (!file) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [file, reloadCounter]);

  // Revoke all cached blob URLs on modal unmount
  useEffect(() => {
    return () => {
      blobCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobCacheRef.current.clear();
      if (pdfSourceUrl && pdfSourceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfSourceUrl);
      }
    };
  }, [pdfSourceUrl]);

  const ext = file ? file.type.toLowerCase() : '';
  const isCurrentAnImage = isImage(ext);

  // Auto-focus PDF iframe so arrow keys immediately scroll pages without requiring a center click
  useEffect(() => {
    if (ext === 'pdf') {
      const timer = setTimeout(() => {
        try {
          pdfIframeRef.current?.contentWindow?.focus();
          pdfIframeRef.current?.focus();
        } catch (e) {}
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [ext, file, pdfSourceUrl]);

  // Gallery context for navigating images in the same folder
  const imageFiles = (folderFiles || []).filter((f) => isImage(f.type));
  const currentImageIndex = file
    ? imageFiles.findIndex((f) => f.url === file.url || f.name === file.name)
    : -1;
  const hasImageGallery = isCurrentAnImage && currentImageIndex !== -1 && imageFiles.length > 1;
  const hasPrev = currentImageIndex > 0;
  const hasNext = currentImageIndex < imageFiles.length - 1;

  const handlePrev = () => {
    if (hasPrev && onNavigate) {
      onNavigate(imageFiles[currentImageIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(imageFiles[currentImageIndex + 1]);
    }
  };

  // General folder navigation context for cycling between any files in the folder
  const currentFolderIndex = file
    ? (folderFiles || []).findIndex((f) => f.url === file.url || f.name === file.name)
    : -1;
  const hasPrevFolderFile = currentFolderIndex > 0;
  const hasNextFolderFile =
    currentFolderIndex !== -1 && Boolean(folderFiles && currentFolderIndex < folderFiles.length - 1);

  const handlePrevFolderFile = () => {
    if (hasPrevFolderFile && onNavigate && folderFiles) {
      onNavigate(folderFiles[currentFolderIndex - 1]);
    }
  };

  const handleNextFolderFile = () => {
    if (hasNextFolderFile && onNavigate && folderFiles) {
      onNavigate(folderFiles[currentFolderIndex + 1]);
    }
  };

  const handleFolderFileNav = (delta: number) => {
    if (!folderFiles || folderFiles.length <= 1 || currentFolderIndex === -1 || !onNavigate) return;
    const nextIndex = (currentFolderIndex + delta + folderFiles.length) % folderFiles.length;
    onNavigate(folderFiles[nextIndex]);
  };

  useEffect(() => {
    if (!file) return;

    setLoading(true);
    setDownloadProgress(0);
    setDownloadStatusText('');
    setError(null);
    setMarkdownHtml('');
    setBlobUrl(null);
    setPptxBuffer(null);
    setImageZoom(1);

    const ext = file.type.toLowerCase();
    const targetUrl = file.url.startsWith('http') ? file.url : `${VAULT_STREAM_HOST}${file.url}`;

    // 1. PDF: Handled by official Mozilla PDF.js Web Viewer with on-disk offline caching & single-stream progress
    if (ext === 'pdf') {
      let isMounted = true;
      const abortController = new AbortController();

      getPdfFromDisk(targetUrl)
        .then(async (buffer) => {
          if (!isMounted) return;
          if (buffer) {
            // Document already cached on local disk -> Instant offline open
            const blob = new Blob([buffer], { type: 'application/pdf' });
            const bUrl = URL.createObjectURL(blob);
            setPdfSourceUrl(bUrl);
            setLoading(false);
          } else {
            // First time opening: Single stream download with real-time percentage progress
            setDownloadProgress(0);
            setDownloadStatusText(file.size ? `Downloading ${file.size}...` : 'Downloading document...');

            try {
              // 1. Fetch file bypassing stale HTTP disk cache entries
              const res = await fetch(targetUrl, { signal: abortController.signal, cache: 'no-cache' });
              if (!res.ok) {
                throw new Error(`Failed to download file (${res.status} ${res.statusText})`);
              }

              const contentLengthHeader = res.headers.get('content-length');
              let totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

              // Fallback: Parse file.size (e.g. "43.9 MB") if server omitted Content-Length
              if (!totalBytes && file.size) {
                const sizeMatch = file.size.match(/^([\d.]+)\s*(MB|KB|GB|B)?$/i);
                if (sizeMatch) {
                  const val = parseFloat(sizeMatch[1]);
                  const unit = (sizeMatch[2] || 'MB').toUpperCase();
                  if (unit === 'GB') totalBytes = Math.round(val * 1024 * 1024 * 1024);
                  else if (unit === 'MB') totalBytes = Math.round(val * 1024 * 1024);
                  else if (unit === 'KB') totalBytes = Math.round(val * 1024);
                  else totalBytes = Math.round(val);
                }
              }

              let finalBuffer: ArrayBuffer;

              if (!res.body) {
                const arrayBuf = await res.arrayBuffer();
                if (!isMounted) return;
                finalBuffer = arrayBuf;
              } else {
                const reader = res.body.getReader();
                const chunks: Uint8Array[] = [];
                let receivedBytes = 0;

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (!isMounted) return;

                  if (value) {
                    chunks.push(value);
                    receivedBytes += value.length;

                    if (totalBytes > 0) {
                      const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
                      setDownloadProgress(pct);
                      if (pct < 80) {
                        setDownloadStatusText(file.size ? `Downloading ${file.size}...` : 'Downloading document...');
                      } else {
                        setDownloadStatusText('Saving to device disk...');
                      }
                    } else {
                      const mbReceived = (receivedBytes / (1024 * 1024)).toFixed(1);
                      setDownloadStatusText(`Downloaded ${mbReceived} MB...`);
                    }
                  }
                }

                if (!isMounted) return;

                setDownloadProgress(100);
                setDownloadStatusText('Opening document...');

                // Combine chunks into single ArrayBuffer without duplicate allocations
                const fullBuffer = new Uint8Array(receivedBytes);
                let offset = 0;
                for (const chunk of chunks) {
                  fullBuffer.set(chunk, offset);
                  offset += chunk.length;
                }
                finalBuffer = fullBuffer.buffer;
              }

              // Verify PDF structural integrity (Must have %PDF- header and %%EOF trailer)
              if (!isBufferValidPdf(finalBuffer)) {
                console.warn('[FilePreviewModal] Downloaded buffer failed integrity check. Performing forced cache-bust re-fetch...');
                await purgePdfFromDisk(targetUrl);

                // Fetch directly from server bypassing any HTTP cache using unique timestamp
                const bustUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
                const bustRes = await fetch(bustUrl, { signal: abortController.signal, cache: 'reload' });
                if (!bustRes.ok) {
                  throw new Error(`Failed to download fresh document (${bustRes.status} ${bustRes.statusText})`);
                }
                const freshBuf = await bustRes.arrayBuffer();
                if (!isBufferValidPdf(freshBuf)) {
                  throw new Error('Downloaded document is incomplete or corrupted on the server.');
                }
                finalBuffer = freshBuf;
              }

              // Persist directly to local disk cache (zero RAM retention)
              await savePdfToDisk(targetUrl, finalBuffer);

              if (!isMounted) return;

              const blob = new Blob([finalBuffer], { type: 'application/pdf' });
              const bUrl = URL.createObjectURL(blob);
              setPdfSourceUrl(bUrl);
              setLoading(false);
            } catch (err: any) {
              if (err.name === 'AbortError') return;
              console.error('Error during streaming PDF download:', err);
              if (isMounted) {
                setError(err.message || 'Failed to download document');
                setLoading(false);
              }
            }
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err?.message || 'Failed to load document');
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
        abortController.abort();
      };
    }

    // 2. Images: Lightbox preview with fast RAM blob cache & preloading
    if (['jpeg', 'jpg', 'png', 'svg', 'webp', 'gif'].includes(ext)) {
      const cached = blobCacheRef.current.get(file.url);
      if (cached) {
        setBlobUrl(cached);
        setLoading(false);
      } else {
        let active = true;
        fetch(targetUrl)
          .then((res) => res.blob())
          .then((blob) => {
            if (!active) return;
            const imgBlob = new Blob([blob], { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
            const createdBlobUrl = URL.createObjectURL(imgBlob);
            blobCacheRef.current.set(file.url, createdBlobUrl);
            setBlobUrl(createdBlobUrl);
            setLoading(false);
          })
          .catch(() => {
            if (!active) return;
            setBlobUrl(targetUrl);
            setLoading(false);
          });

        return () => {
          active = false;
        };
      }

      // Preload next and previous images in background for instant switching
      if (hasImageGallery) {
        if (hasNext) {
          const nextFile = imageFiles[currentImageIndex + 1];
          if (!blobCacheRef.current.has(nextFile.url)) {
            const nextTarget = nextFile.url.startsWith('http') ? nextFile.url : `${VAULT_STREAM_HOST}${nextFile.url}`;
            fetch(nextTarget)
              .then((res) => res.blob())
              .then((b) => {
                const nextExt = nextFile.type.toLowerCase();
                const bUrl = URL.createObjectURL(
                  new Blob([b], { type: `image/${nextExt === 'jpg' ? 'jpeg' : nextExt}` })
                );
                blobCacheRef.current.set(nextFile.url, bUrl);
              })
              .catch(() => {});
          }
        }
        if (hasPrev) {
          const prevFile = imageFiles[currentImageIndex - 1];
          if (!blobCacheRef.current.has(prevFile.url)) {
            const prevTarget = prevFile.url.startsWith('http') ? prevFile.url : `${VAULT_STREAM_HOST}${prevFile.url}`;
            fetch(prevTarget)
              .then((res) => res.blob())
              .then((b) => {
                const prevExt = prevFile.type.toLowerCase();
                const bUrl = URL.createObjectURL(
                  new Blob([b], { type: `image/${prevExt === 'jpg' ? 'jpeg' : prevExt}` })
                );
                blobCacheRef.current.set(prevFile.url, bUrl);
              })
              .catch(() => {});
          }
        }
      }

      return;
    }

    // 3. Markdown / Text / Code (.md, .txt, .py, .json) with persistent on-disk offline caching
    if (ext === 'md' || ext === 'txt' || ext === 'py' || ext === 'json') {
      let isMounted = true;

      const renderContent = (rawText: string) => {
        if (!isMounted) return;
        if (ext === 'md') {
          const parsed = marked.parse(rawText);
          if (typeof parsed === 'string') {
            setMarkdownHtml(parsed);
          } else {
            parsed.then((h) => {
              if (isMounted) setMarkdownHtml(h);
            });
          }
        } else {
          const escaped = rawText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          setMarkdownHtml(
            `<pre class="font-mono text-xs leading-relaxed p-4 bg-[#141414] text-neutral-100 rounded-xl overflow-x-auto border-2 border-[#141414]"><code>${escaped}</code></pre>`
          );
        }
        setLoading(false);
      };

      // Check persistent disk cache first (instant offline loading)
      getTextFromDisk(targetUrl)
        .then((cachedText) => {
          if (!isMounted) return;
          if (cachedText) {
            renderContent(cachedText);

            // Revalidate in background when online to catch upstream edits
            fetch(targetUrl)
              .then((res) => (res.ok ? res.text() : null))
              .then((freshText) => {
                if (!isMounted || !freshText) return;
                if (freshText !== cachedText) {
                  renderContent(freshText);
                  saveTextToDisk(targetUrl, freshText);
                }
              })
              .catch(() => {
                // Offline: cached note is already rendered
              });
          } else {
            // Not yet in on-disk cache: fetch from network and save to disk
            fetch(targetUrl)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
              })
              .then((text) => {
                if (!isMounted) return;
                renderContent(text);
                saveTextToDisk(targetUrl, text);
              })
              .catch((err) => {
                if (!isMounted) return;
                setError(`Unable to load note: ${err.message}`);
                setLoading(false);
              });
          }
        })
        .catch(() => {
          if (!isMounted) return;
          fetch(targetUrl)
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.text();
            })
            .then((text) => {
              if (!isMounted) return;
              renderContent(text);
              saveTextToDisk(targetUrl, text);
            })
            .catch((err) => {
              if (!isMounted) return;
              setError(`Unable to load note: ${err.message}`);
              setLoading(false);
            });
        });

      return () => {
        isMounted = false;
      };
    }

    // 4. Word Documents (.docx)
    if (ext === 'docx') {
      fetch(targetUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(async (buffer) => {
          setLoading(false);
          // Wait for DOM container to be attached
          setTimeout(async () => {
            if (docxContainerRef.current) {
              docxContainerRef.current.innerHTML = '';
              await docx.renderAsync(buffer, docxContainerRef.current, undefined, {
                className: 'docx-document',
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
              });
            }
          }, 50);
        })
        .catch((err) => {
          setError(`Unable to render Word document: ${err.message}`);
          setLoading(false);
        });
      return;
    }

    // 5. PowerPoint Presentations (.pptx, .ppsx) - Direct Wasm Presentation Viewer
    if (ext === 'pptx' || ext === 'ppsx') {
      fetch(targetUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then((buffer) => {
          setPptxBuffer(buffer);
          setLoading(false);
        })
        .catch((err) => {
          setError(`Unable to load presentation: ${err.message}`);
          setLoading(false);
        });
      return;
    }

    // Default fallback
    setLoading(false);
  }, [file, reloadCounter]);

  // Listen for messages from the PDF viewer iframe (Close, Download, Force Reload)
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.action === 'closePreview') {
        onClose();
      } else if (e.data.action === 'downloadFile' && file) {
        onDownload(file);
      } else if (e.data.action === 'forceReloadPdf') {
        handleForceReload();
      } else if (e.data.action === 'slateShortcutNav') {
        const { direction, level, ctrlKey, altKey, shiftKey } = e.data;
        const targetLevel = level || (ctrlKey ? 'file' : (altKey ? 'folder' : (shiftKey ? 'course' : null)));
        if (targetLevel === 'file') {
          if (onNavigateFile) {
            onNavigateFile(direction);
          } else {
            handleFolderFileNav(direction === 'next' ? 1 : -1);
          }
        } else if (targetLevel === 'folder') {
          onNavigateFolder?.(direction);
        } else if (targetLevel === 'course') {
          onNavigateCourse?.(direction);
        }
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [file, onClose, onDownload, onNavigateFile, onNavigateCourse, onNavigateFolder, folderFiles, currentFolderIndex, onNavigate]);

  // Keyboard controls for modal (Esc or Backspace to close, Arrow keys for gallery, +/- for zoom)
  useEffect(() => {
    if (!file) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        onClose();
        return;
      }

      // 1. Slate 3-tier hierarchy shortcuts: Ctrl (File), Alt (Week/Folder), Shift (Subject)
      // Supports ArrowLeft/ArrowRight, as well as , / < and . / >
      const isNextNav = e.key === 'ArrowRight' || e.key === '.' || e.key === '>';
      const isPrevNav = e.key === 'ArrowLeft' || e.key === ',' || e.key === '<';

      if (isNextNav || isPrevNav) {
        const direction = isNextNav ? 'next' : 'prev';

        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          if (onNavigateFile) {
            onNavigateFile(direction);
          } else {
            handleFolderFileNav(direction === 'next' ? 1 : -1);
          }
          return;
        }
        if (e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          onNavigateFolder?.(direction);
          return;
        }
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          onNavigateCourse?.(direction);
          return;
        }
      }

      // For multi-page documents (PDF, DOCX, PPTX), do NOT hijack plain Arrow keys to change files!
      if (ext === 'pdf' || ext === 'docx' || ext === 'pptx') {
        if (ext === 'pdf' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', ' '].includes(e.key)) {
          try {
            pdfIframeRef.current?.contentWindow?.focus();
            pdfIframeRef.current?.focus();
          } catch (err) {}
        }
        return;
      }

      // Arrow navigation for files and photo galleries
      if (e.key === 'ArrowLeft') {
        if (isCurrentAnImage && hasImageGallery && hasPrev) {
          e.preventDefault();
          handlePrev();
        } else if (hasPrevFolderFile) {
          e.preventDefault();
          handlePrevFolderFile();
        }
      } else if (e.key === 'ArrowRight') {
        if (isCurrentAnImage && hasImageGallery && hasNext) {
          e.preventDefault();
          handleNext();
        } else if (hasNextFolderFile) {
          e.preventDefault();
          handleNextFolderFile();
        }
      }

      // Quick zoom shortcuts for images
      if (isCurrentAnImage) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setImageZoom((z) => Math.min(3, z + 0.25));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setImageZoom((z) => Math.max(0.5, z - 0.25));
        } else if (e.key === '0') {
          e.preventDefault();
          setImageZoom(1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    file,
    isCurrentAnImage,
    hasImageGallery,
    hasPrev,
    hasNext,
    currentImageIndex,
    hasPrevFolderFile,
    hasNextFolderFile,
    currentFolderIndex,
    folderFiles,
    onNavigate,
    onClose,
    onNavigateFile,
    onNavigateCourse,
    onNavigateFolder,
  ]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#141414] flex flex-col w-screen h-screen select-none overflow-hidden animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-[#121214] flex flex-col w-full h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar for non-PDF files (DOCX, PPTX, Images) */}
        {ext !== 'pdf' && (
          <div className="bg-[#141417] border-b border-[#222226] px-3 sm:px-4 py-2 flex items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase shrink-0 ${
                  ext === 'docx' || ext === 'doc'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : ext === 'pptx' || ext === 'ppsx'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : isCurrentAnImage
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {ext}
              </span>
              <span className="font-medium text-xs sm:text-sm text-zinc-200 truncate tracking-tight min-w-0" title={file.name}>{file.name}</span>
              <span className="text-[11px] font-mono text-zinc-500 shrink-0 hidden xs:inline">({file.size})</span>

              {/* Photo Gallery Counter & Quick Arrows */}
              {hasImageGallery && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2 shrink-0">
                  <span className="text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                    {currentImageIndex + 1} / {imageFiles.length}
                  </span>
                  <button
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    className="w-6 h-6 rounded border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs"
                    title="Previous Photo (Left Arrow Key)"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    className="w-6 h-6 rounded border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs"
                    title="Next Photo (Right Arrow Key)"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Quick Hierarchy Shortcuts Indicator */}
              <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/5 select-none shrink-0">
                <span title="Ctrl + Left/Right Arrow to cycle files in this folder"><kbd className="bg-white/10 px-1 py-0.5 rounded text-zinc-200">Ctrl ↔</kbd> File</span>
                <span className="text-zinc-600">•</span>
                <span title="Alt + Left/Right Arrow to switch week/folder"><kbd className="bg-white/10 px-1 py-0.5 rounded text-zinc-200">Alt ↔</kbd> Week</span>
                <span className="text-zinc-600">•</span>
                <span title="Shift + Left/Right Arrow to switch course/subject"><kbd className="bg-white/10 px-1 py-0.5 rounded text-zinc-200">Shift ↔</kbd> Subject</span>
              </div>

              <button
                onClick={() => onDownload(file)}
                className="h-8 px-2.5 sm:px-3 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                Download
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.1] border border-transparent hover:border-white/10 flex items-center justify-center text-base transition-all cursor-pointer"
                title="Close Preview (Esc)"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Preview Viewer Body - Zero Horizontal or Vertical Shift */}
        <div className="flex-1 w-full min-h-0 min-w-0 bg-neutral-900 overflow-hidden relative flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center p-4 bg-[#0A0A0C]">
              <div className="bg-[#141417] border border-[#222226] rounded-2xl p-4 sm:p-8 max-w-md w-full flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Slate Mascot Badge */}
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                  <div className="absolute -inset-1.5 rounded-2xl bg-amber-500/20 animate-pulse" />
                  <svg className="w-full h-full drop-shadow-md animate-bounce duration-1000 relative z-10" viewBox="0 0 64 64" fill="none">
                    <rect x="2" y="2" width="60" height="60" rx="16" fill="#FFFFFF" stroke="#141414" strokeWidth="2.5" />
                    <rect x="14" y="13" width="36" height="32" rx="12" fill="#141414" />
                    <circle cx="25" cy="26" r="4.5" fill="#FFFFFF" />
                    <circle cx="39" cy="26" r="4.5" fill="#FFFFFF" />
                    <circle cx="26.5" cy="26" r="2" fill="#141414" />
                    <circle cx="40.5" cy="26" r="2" fill="#141414" />
                    <circle cx="24" cy="24.5" r="1.2" fill="#FFFFFF" />
                    <circle cx="38" cy="24.5" r="1.2" fill="#FFFFFF" />
                    <line x1="26" y1="45" x2="23" y2="52" stroke="#141414" strokeWidth="3" strokeLinecap="round" />
                    <line x1="38" y1="45" x2="41" y2="52" stroke="#141414" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white mb-2 truncate max-w-full">
                  Loading {file.name}
                </h3>

                <div className="text-xs text-zinc-400 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-4 leading-relaxed text-left w-full">
                  <span className="text-amber-400 font-semibold block mb-0.5">First time opening?</span>
                  It takes a moment to download and save to your device disk. Afterwards, it opens instantly offline.
                </div>

                <div className="w-full h-1.5 bg-[#222226] rounded-full overflow-hidden relative mb-2.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 rounded-full transition-all duration-150"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>

                <div className="w-full flex justify-between items-center text-[11px] font-mono text-zinc-500">
                  <span className="truncate mr-2">
                    {downloadStatusText || (file.size ? `Downloading ${file.size}...` : 'Downloading document...')}
                  </span>
                  <span className="text-amber-400 font-bold shrink-0">{downloadProgress}%</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="p-8 text-center max-w-md bg-white border-2 border-red-500 rounded-2xl shadow-[4px_4px_0px_#EF4444] space-y-3">
                <h3 className="font-bold text-red-600 text-sm">Preview Unavailable</h3>
                <p className="text-xs text-neutral-600 font-mono">{error}</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleForceReload}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-[2px_2px_0px_#141414]"
                  >
                    Clear Cache & Retry
                  </button>
                  <button
                    onClick={() => onDownload(file)}
                    className="px-4 py-2 rounded-xl bg-[#141414] text-white text-xs font-bold hover:bg-neutral-800 shadow-[2px_2px_0px_#141414]"
                  >
                    Download File
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 1. PDF VIEWER: Mozilla Official PDF.js Web Viewer with Unified Top Bar, Range Streaming & Thumbnails */}
              {ext === 'pdf' && (
                <div className="w-full h-full min-w-0 min-h-0 flex-1 overflow-hidden relative block">
                  <iframe
                    ref={pdfIframeRef}
                    onLoad={() => {
                      try {
                        pdfIframeRef.current?.contentWindow?.focus();
                        pdfIframeRef.current?.focus();
                      } catch (e) {}
                    }}
                    src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(pdfSourceUrl || `${VAULT_STREAM_HOST}${file.url}`)}&title=${encodeURIComponent(file.name)}&size=${encodeURIComponent(file.size || '')}#zoom=page-fit`}
                    className="w-full h-full border-none bg-[#0A0A0C] block"
                    title={file.name}
                  />
                </div>
              )}

              {/* 2. IMAGE VIEWER: Full-resolution lightbox with Arrow Key Navigation */}
              {isCurrentAnImage && blobUrl && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden relative select-none">
                  {/* Floating Left Arrow Navigation Button */}
                  {hasImageGallery && (
                    <button
                      onClick={handlePrev}
                      disabled={!hasPrev}
                      className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414] sm:shadow-[3px_3px_0px_#141414] hover:shadow-[4.5px_4.5px_0px_#141414] hover:-translate-y-[calc(50%+2px)] active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer text-[#141414] group"
                      title="Previous Photo (Left Arrow Key)"
                      aria-label="Previous Photo"
                    >
                      <span className="font-black text-2xl group-hover:-translate-x-0.5 transition-transform leading-none">
                        ‹
                      </span>
                    </button>
                  )}

                  {/* Floating Right Arrow Navigation Button */}
                  {hasImageGallery && (
                    <button
                      onClick={handleNext}
                      disabled={!hasNext}
                      className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414] sm:shadow-[3px_3px_0px_#141414] hover:shadow-[4.5px_4.5px_0px_#141414] hover:-translate-y-[calc(50%+2px)] active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer text-[#141414] group"
                      title="Next Photo (Right Arrow Key)"
                      aria-label="Next Photo"
                    >
                      <span className="font-black text-2xl group-hover:translate-x-0.5 transition-transform leading-none">
                        ›
                      </span>
                    </button>
                  )}

                  {/* Zoom Controls Bar */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex items-center gap-1 sm:gap-2 bg-white/95 backdrop-blur border-2 border-[#141414] rounded-xl px-1.5 sm:px-2 py-0.5 sm:py-1 shadow-[2px_2px_0px_#141414]">
                    <button
                      onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))}
                      className="px-2 py-0.5 text-xs font-bold font-mono hover:bg-neutral-100 rounded"
                      title="Zoom Out (-)"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold px-1">{Math.round(imageZoom * 100)}%</span>
                    <button
                      onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))}
                      className="px-2 py-0.5 text-xs font-bold font-mono hover:bg-neutral-100 rounded"
                      title="Zoom In (+)"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setImageZoom(1)}
                      className="px-2 py-0.5 text-[10px] font-bold font-mono hover:bg-neutral-100 rounded border-l border-neutral-300 ml-1"
                      title="Reset Zoom (0)"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Bottom Keyboard Navigation Hint (desktop) & Mobile Counter */}
                  {hasImageGallery && (
                    <>
                      <div className="hidden sm:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-20 items-center gap-2 bg-neutral-900/90 text-neutral-100 px-3.5 py-1.5 rounded-full text-xs font-mono border border-neutral-700 shadow-md">
                        <span className="font-bold text-amber-400">Navigate:</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-600 rounded text-[11px] font-bold">←</kbd>
                          <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-600 rounded text-[11px] font-bold">→</kbd>
                        </div>
                        <span className="text-neutral-500">|</span>
                        <span className="font-semibold">{currentImageIndex + 1} of {imageFiles.length}</span>
                      </div>
                      <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-neutral-900/90 text-neutral-200 px-3 py-1 rounded-full text-xs font-mono border border-neutral-700 shadow-md">
                        <span className="font-semibold text-amber-400">{currentImageIndex + 1}</span>
                        <span className="text-neutral-500">/</span>
                        <span>{imageFiles.length}</span>
                      </div>
                    </>
                  )}

                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    <img
                      src={blobUrl}
                      alt={file.name}
                      style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center' }}
                      className="max-w-full max-h-full object-contain rounded-lg border-2 border-[#141414] shadow-[4px_4px_0px_#141414] transition-transform duration-150"
                    />
                  </div>
                </div>
              )}

              {/* 3. MARKDOWN & CODE VIEWER */}
              {(ext === 'md' || ext === 'txt' || ext === 'py' || ext === 'json') && markdownHtml && (
                <div className="w-full h-full overflow-y-auto bg-neutral-200/90 p-2.5 sm:p-8">
                  <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl max-w-4xl w-full mx-auto p-4 sm:p-10 md:p-14 border-2 border-[#141414] my-2 sm:my-4">
                    <div
                      className="slate-markdown-body"
                      dangerouslySetInnerHTML={{ __html: markdownHtml }}
                    />
                  </div>
                </div>
              )}

              {/* 4. WORD DOCUMENT (.docx) VIEWER */}
              {ext === 'docx' && (
                <div className="w-full h-full overflow-y-auto bg-neutral-200/90 p-2.5 sm:p-8">
                  <div
                    ref={docxContainerRef}
                    className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl max-w-4xl w-full mx-auto p-3.5 sm:p-6 md:p-10 border-2 border-[#141414] my-2 sm:my-4"
                  />
                </div>
              )}

              {/* 5. POWERPOINT PRESENTATION (.pptx, .ppsx) VIEWER */}
              {(ext === 'pptx' || ext === 'ppsx') && pptxBuffer && (
                <div className="w-full h-full flex flex-col bg-neutral-950 select-none">
                  <ReactPptxViewer
                    source={pptxBuffer}
                    defaultZoom="fit-width"
                    showToolbar={true}
                    showThumbnails={true}
                    showNotes={false}
                    className="w-full h-full"
                    onError={(err) => {
                      setError(`Presentation rendering error: ${err.message}`);
                    }}
                  />
                </div>
              )}

              {/* FALLBACK FOR UNSUPPORTED FORMATS */}
              {!['pdf', 'docx', 'pptx', 'ppsx', 'md', 'txt', 'py', 'json', 'jpeg', 'jpg', 'png', 'svg', 'webp', 'gif'].includes(
                ext
              ) && (
                <div className="p-12 text-center max-w-md mx-auto my-auto space-y-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center mx-auto text-xl font-bold uppercase">
                    {ext}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#141414]">{file.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Direct preview is available for PDF, Word, PowerPoint, Images, Code, and Markdown.
                    </p>
                  </div>
                  <button
                    onClick={() => onDownload(file)}
                    className="px-4 py-2 rounded-xl bg-[#141414] text-white text-xs font-bold hover:bg-neutral-800 shadow-[2px_2px_0px_#FF6D00]"
                  >
                    Download File ({file.size})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
