from pathlib import Path

import pytest

from sources.pdf import PDFParseError, extract_text_from_pdf

SAMPLE_PDF = Path(__file__).resolve().parents[2] / "sample" / "data-structures-basics.pdf"


def test_extracts_text_from_sample_pdf():
    text = extract_text_from_pdf(SAMPLE_PDF.read_bytes())
    assert "LIFO" in text
    assert "hash" in text.lower()
    assert len(text) > 500


def test_empty_bytes_raise():
    with pytest.raises(PDFParseError):
        extract_text_from_pdf(b"")


def test_non_pdf_bytes_raise():
    with pytest.raises(PDFParseError):
        extract_text_from_pdf(b"this is definitely not a pdf")
