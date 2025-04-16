import { PageProps } from "$fresh/server.ts";
import PdfViewerWithButtons from "../../components/PdfViewerWithButtons.tsx";

export default function PdfPreviewPage(props: PageProps) {
  // Extract PDF URL from query parameters
  const url = new URL(props.url);
  const pdfUrl = url.searchParams.get("url");

  return (
    <div class="p-4 mx-auto max-w-screen-lg">
      <h1 class="text-2xl font-bold mb-4">PDF Preview</h1>
      {pdfUrl ? (
        <PdfViewerWithButtons pdfUrl={pdfUrl} />
      ) : (
        <p class="text-red-600">
          Error: Please provide a PDF URL using the 'url' query parameter.
          <br />
          Example: /pdf/preview?url=https://example.com/document.pdf
        </p>
      )}
    </div>
  );
}
