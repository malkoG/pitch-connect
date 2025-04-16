// components/PdfViewerWithButtons.tsx
import { h } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";

// Use npm: specifier to import pdfjs-dist
import * as pdfjsLib from "npm:pdfjs-dist@3.11.174/build/pdf.js";

// --- PDF.js Worker Setup ---
// IMPORTANT: You MUST copy the worker file (`pdf.worker.min.js`) from the
// pdfjs-dist package (e.g., from node_modules/pdfjs-dist/build/ or Deno cache)
// into your project's `static/` directory for this path to work.
const pdfWorkerSrc = '/pdf.worker.entry.js'; // Path relative to the static root

interface PdfViewerProps {
  pdfUrl: string;
}

export default function PdfViewerWithButtons({ pdfUrl }: PdfViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true); // Unified loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [renderTask, setRenderTask] = useState<pdfjsLib.PDFRenderTask | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set Worker Source on Mount
  useEffect(() => {
    if (pdfjsLib.GlobalWorkerOptions) {
       pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    } else {
        console.warn("pdfjsLib.GlobalWorkerOptions is not available at mount time. Worker might not load correctly.");
        setError("PDF.js worker infrastructure not ready.");
    }
  }, []); // Runs once on mount

  // PDF Load Function
  const loadPdf = useCallback(async () => {
    if (!pdfUrl) {
      setError("No PDF URL provided.");
      setLoading(false);
      return;
    }
    if (!pdfjsLib.GlobalWorkerOptions?.workerSrc) {
      setError("PDF worker source not configured. Cannot load PDF.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);

    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      // Keep loading=true until the first page is rendered
    } catch (err: any) {
      console.error('Error loading PDF:', pdfUrl, err);
      setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [pdfUrl]);

  // Page Render Function - *** FIX APPLIED HERE ***
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) {
        return;
    }

    if (renderTask) {
      renderTask.cancel();
    }
    setLoading(true);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
          throw new Error("Could not get canvas context");
      }

      const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 800;
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth > 0 ? containerWidth / viewport.width : 1;
      const scaledViewport = page.getViewport({ scale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const task = page.render({
        canvasContext: context,
        viewport: scaledViewport,
      });
      setRenderTask(task);

      await task.promise;
      setRenderTask(null);
      setError(null);

    } catch (err: any) {
      setRenderTask(null);
      if (err.name !== 'RenderingCancelledException') {
         console.error(`Error rendering page ${pageNum}:`, err);
         setError(`Failed to render page ${pageNum}: ${err.message || 'Unknown error'}`);
      } else {
          console.log(`Rendering cancelled for page ${pageNum}`);
      }
    } finally {
       setLoading(false);
    }
  // --- Dependency Fix: Removed 'renderTask' from this array ---
  }, [pdfDoc]); // Now only depends on pdfDoc

  // Effect to Load PDF when URL changes
  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Effect to Render Page when document or page number changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
    // Cleanup function
    return () => {
       if (renderTask) {
           renderTask.cancel();
       }
    };
  // Dependencies for the render effect *include* renderPage
  }, [pdfDoc, currentPage, renderPage]);


  // Page Navigation Handlers
  const changePage = (offset: number) => {
    if (loading) return;
    const newPage = currentPage + offset;
    if (pdfDoc && newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  // Component Render
  return (
    <div ref={containerRef}>
      {/* Error Display Area */}
      {error && (
          <div style={{
              padding: '10px', margin: '10px 0', border: '1px solid red',
              color: 'red', backgroundColor: '#ffebee'
             }}>
             Error: {error}
          </div>
      )}

      {/* Loading Indicator */}
      {loading && (
          <div style={{ margin: '20px 0', textAlign: 'center', padding: '20px', background: '#f0f0f0' }}>
              Loading PDF... Please wait.
          </div>
      )}

      {/* Canvas Container */}
      <div style={{
          position: 'relative', minHeight: '200px', background: '#e0e0e0',
          display: !pdfDoc || error ? 'none' : 'block'
         }}>
        <canvas
          ref={canvasRef}
          style={{
             display: 'block', width: '100%', height: 'auto',
             visibility: loading ? 'hidden' : 'visible'
          }}
        />
      </div>

      {/* Controls */}
      {!loading && pdfDoc && !error && numPages > 0 && (
        <div style={{ marginTop: '15px', padding: '10px 0', textAlign: 'center', background: '#f8f8f8', borderTop: '1px solid #ccc' }}>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={previousPage}
            style={{ padding: '8px 15px', marginRight: '10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            &larr; Previous
          </button>
          <span style={{ margin: '0 15px', display: 'inline-block', verticalAlign: 'middle' }}>
            Page {currentPage} of {numPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= numPages}
            onClick={nextPage}
            style={{ padding: '8px 15px', marginLeft: '10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}
           >
            Next &rarr;
          </button>
        </div>
      )}

      {/* Fallback message if no PDF URL was provided */}
      {!pdfUrl && !error && !loading && ( // Only show if not loading and no other error
          <div style={{ padding: '10px', color: 'orange' }}>
              Please provide a PDF URL in the query string (e.g., ?url=...).
          </div>
      )}
    </div>
  );
}
