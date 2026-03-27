/**
 * Export utilities for CIRP documents.
 * Provides Markdown file download and PDF generation via html2pdf.js.
 */

/**
 * Download a string as a .md file.
 */
export function downloadMarkdown(markdown, filename) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'CIRP.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a PDF from the rendered preview element using html2pdf.js.
 * html2pdf must be loaded on the page before calling this.
 */
export function downloadPDF(previewElement, filename) {
  if (typeof html2pdf === 'undefined') {
    alert('PDF library is still loading. Please try again in a moment.');
    return;
  }

  // Remove scroll constraints so html2canvas captures the full document
  const savedMaxHeight = previewElement.style.maxHeight;
  const savedOverflow = previewElement.style.overflow;
  const savedBorder = previewElement.style.border;
  previewElement.style.maxHeight = 'none';
  previewElement.style.overflow = 'visible';
  previewElement.style.border = 'none';

  const opt = {
    margin:       [0.6, 0.7, 0.6, 0.7],
    filename:     filename || 'CIRP.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'li', 'h2', 'h3'] }
  };

  html2pdf().set(opt).from(previewElement).save().then(() => {
    previewElement.style.maxHeight = savedMaxHeight;
    previewElement.style.overflow = savedOverflow;
    previewElement.style.border = savedBorder;
  });
}
