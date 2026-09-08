import io
import csv
from pypdf import PdfReader
import docx

def parse_document(file_bytes: bytes, filename: str) -> str:
    """
    Extracts raw text from multiple document formats:
    PDF, DOCX, CSV, TXT
    """
    lower = filename.lower()
    text = ""
    
    if lower.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        text = "\n".join(pages_text)

    elif lower.endswith(".docx"):
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        text = "\n".join(paragraphs)

    elif lower.endswith(".csv"):
        decoded = file_bytes.decode("utf-8", errors="ignore")
        reader = csv.reader(io.StringIO(decoded))
        lines = []
        for row in reader:
            lines.append(" ".join(row))
        text = "\n".join(lines)

    else:
        # Default plain text / log file
        text = file_bytes.decode("utf-8", errors="ignore")

    return text.strip()
