const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

const templatesDir = path.resolve(__dirname, "..", "templates");
const files = fs.readdirSync(templatesDir).filter((file) => file.endsWith(".md"));

for (const file of files) {
  const markdown = fs.readFileSync(path.join(templatesDir, file), "utf8");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const margin = 54;
  const lineHeight = 15;
  let y = 62;

  pdf.setProperties({ title: file.replace(/\.md$/, ""), subject: "Legal agreement template" });
  pdf.setFont("times", "normal");
  pdf.setFontSize(10);

  for (const sourceLine of markdown.split(/\r?\n/)) {
    const line = sourceLine.replace(/^#{1,6}\s*/, "").replace(/[*_`]/g, "").trimEnd();
    const isHeading = /^#/.test(sourceLine);
    pdf.setFont("times", isHeading ? "bold" : "normal");
    pdf.setFontSize(isHeading ? 15 : 10);
    const wrapped = pdf.splitTextToSize(line || " ", width - margin * 2);
    if (y + wrapped.length * lineHeight > 785) {
      pdf.addPage();
      y = 62;
    }
    pdf.text(wrapped, margin, y);
    y += wrapped.length * lineHeight + (isHeading ? 7 : 3);
  }

  pdf.save(path.join(templatesDir, file.replace(/\.md$/, ".pdf")));
}

console.log(`Generated ${files.length} PDF templates.`);
