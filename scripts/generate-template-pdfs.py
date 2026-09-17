"""Generate portable PDF copies of every Markdown template without external tools."""

from pathlib import Path
from textwrap import wrap

TEMPLATES = Path(__file__).resolve().parent.parent / "templates"
PAGE_WIDTH, PAGE_HEIGHT = 595, 842
MARGIN, LEADING = 54, 15


def pdf_text(value: str) -> str:
    return value.encode("latin-1", "replace").decode("latin-1").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def make_pdf(markdown: str) -> bytes:
    pages, page, y = [], [], PAGE_HEIGHT - 62
    for source in markdown.splitlines():
        heading = source.startswith("#")
        line = source.lstrip("#").strip().replace("*", "").replace("_", "").replace("`", "")
        lines = wrap(line, width=92, replace_whitespace=False) or [""]
        for piece in lines:
            if y < MARGIN:
                pages.append(page)
                page, y = [], PAGE_HEIGHT - 62
            font, size = ("F2", 15) if heading else ("F1", 10)
            page.append(f"BT /{font} {size} Tf {MARGIN} {y} Td ({pdf_text(piece)}) Tj ET")
            y -= LEADING + (5 if heading else 0)
    pages.append(page)

    objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>"]
    page_refs = []
    for page in pages:
        stream = "\n".join(page).encode("latin-1")
        content_id = len(objects) + 1
        objects.append(f"<< /Length {len(stream)} >>\nstream\n{stream.decode('latin-1')}\nendstream")
        page_id = len(objects) + 1
        objects.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {content_id} 0 R >>")
        page_refs.append(f"{page_id} 0 R")
    objects[1] = f"<< /Type /Pages /Kids [{' '.join(page_refs)}] /Count {len(page_refs)} >>"

    result = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(result))
        result.extend(f"{index} 0 obj\n{obj}\nendobj\n".encode("latin-1"))
    xref = len(result)
    result.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    result.extend("".join(f"{offset:010d} 00000 n \n" for offset in offsets[1:]).encode())
    result.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    return bytes(result)


for markdown_file in TEMPLATES.glob("*.md"):
    markdown_file.with_suffix(".pdf").write_bytes(make_pdf(markdown_file.read_text(encoding="utf-8")))

print(f"Generated {len(list(TEMPLATES.glob('*.md')))} PDF templates.")
