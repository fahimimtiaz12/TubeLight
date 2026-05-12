import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
    return await file.text()
  }
  if (name.endsWith('.pdf')) {
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const parts: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const line = content.items
        .map((it) => ('str' in it ? it.str : ''))
        .join(' ')
      parts.push(line)
    }
    return parts.join('\n\n')
  }
  throw new Error('Unsupported file type. Use .txt, .md, or .pdf.')
}
