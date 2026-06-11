"""PDF -> plain text, using PyMuPDF. Shared by the upload route and the seed script."""
import fitz  # PyMuPDF


class PDFParseError(ValueError):
    """Raised when a PDF cannot be opened or contains no extractable text."""


def extract_text_from_pdf(data: bytes) -> str:
    """Extract concatenated text from an in-memory PDF byte string.

    Note: this reads the embedded text layer. Scanned/image-only PDFs (no text
    layer) will yield little or nothing - that is expected, not a bug.
    """
    if not data:
        raise PDFParseError("Empty file.")
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:  # noqa: BLE001 - surface a clean message to the API
        raise PDFParseError(f"Could not open PDF: {exc}") from exc

    try:
        text = "\n\n".join(page.get_text("text") for page in doc).strip()
    finally:
        doc.close()

    if not text:
        raise PDFParseError(
            "No selectable text found in this PDF (it may be a scan/image)."
        )
    return text
