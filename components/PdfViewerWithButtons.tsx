import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import * as pdfjsLib from "npm:pdfjs-dist/build/pdf.js";

// --- PDF.js Worker Setup ---
// Set the worker source to the CDN version
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

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

  // PDF 로드 함수
  const loadPdf = useCallback(async () => {
    if (!pdfUrl) {
        setError("No PDF URL provided.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null); // Reset error on new load
    if (pdfDoc) {
        // pdfDoc.destroy(); // Consider if needed for memory management
    }
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
      setPdfDoc(null);
      setNumPages(0);
    } finally {
      // Loading finishes after first page render attempt (in renderPage)
    }
  }, [pdfUrl]); // pdfDoc removed from deps

  // 페이지 렌더링 함수
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTask) {
      renderTask.cancel();
    }
    setLoading(true); // Indicate page rendering start
    setError(null); // Clear previous page render errors

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
          throw new Error("Could not get canvas context");
      }

      const desiredWidth = containerRef.current ? containerRef.current.offsetWidth : 800;
      const viewport = page.getViewport({ scale: 1 });
      const scale = desiredWidth / viewport.width;
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

    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
         console.error('Error rendering page:', err);
         setError(`Failed to render page ${pageNum}: ${err.message || 'Unknown error'}`);
      }
      setRenderTask(null);
    } finally {
       setLoading(false); // Rendering complete/failed
    }
  }, [pdfDoc, renderTask]); // renderTask added

  // Initial PDF load
  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Render page when document or page number changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
    // Cleanup render task on unmount or before re-render
    return () => {
       if (renderTask) {
           renderTask.cancel();
       }
    };
  }, [pdfDoc, currentPage, renderPage]); // renderPage added


  const changePage = (offset: number) => {
    const newPage = currentPage + offset;
    if (pdfDoc && newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  return (
    <div ref={containerRef}>
      {/* Error Display */}
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</div>}

      {/* Loading Indicator */}
      {loading && <div style={{ margin: '20px 0', textAlign: 'center' }}>Loading...</div>}

      {/* Canvas Container */}
      <div style={{ position: 'relative', minHeight: '200px', background: '#eee', display: error ? 'none' : 'block' }}>
        <canvas
          ref={canvasRef}
          style={{
             display: !loading && pdfDoc && !error ? 'block' : 'none',
             width: '100%',
             height: 'auto',
             // opacity: loading ? 0.5 : 1, // Use separate loading indicator instead
             // transition: 'opacity 0.2s',
          }}
        />
         {/* Loading overlay specifically during page render */}
         {loading && pdfDoc && (
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '5px' }}>
                Rendering page {currentPage}...
             </div>
         )}
      </div>

      {/* Controls */}
      {!loading && pdfDoc && !error && numPages > 0 && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <button type="button" disabled={currentPage <= 1} onClick={previousPage}>
            &larr; Previous
          </button>
          <span style={{ margin: '0 10px' }}>
            Page {currentPage} of {numPages}
          </span>
          <button type="button" disabled={currentPage >= numPages} onClick={nextPage}>
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
