import PDFDocument from 'pdfkit';
import type { TransactionWithCategory } from './queries';

export async function transactionsToPdf(
  transactions: TransactionWithCategory[],
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  renderHeader(doc, transactions);
  renderTable(doc, transactions);
  renderTotals(doc, transactions);

  doc.end();
  return done;
}

function renderHeader(doc: PDFKit.PDFDocument, transactions: TransactionWithCategory[]): void {
  doc.fontSize(18).text('Botfinanças — Extrato', { align: 'left' });
  doc.moveDown(0.2);
  doc
    .fontSize(10)
    .fillColor('gray')
    .text(`Gerado em ${new Date().toISOString().slice(0, 10)} · ${transactions.length} transações`);
  doc.fillColor('black').moveDown(1);
}

const COLS: Array<{ label: string; width: number }> = [
  { label: 'Data', width: 70 },
  { label: 'Tipo', width: 55 },
  { label: 'Descrição', width: 200 },
  { label: 'Categoria', width: 110 },
  { label: 'Valor', width: 80 },
];

function renderTable(doc: PDFKit.PDFDocument, transactions: TransactionWithCategory[]): void {
  const startX = doc.x;
  let y = doc.y;

  doc.fontSize(10).font('Helvetica-Bold');
  let x = startX;
  for (const col of COLS) {
    doc.text(col.label, x, y, { width: col.width });
    x += col.width;
  }
  y += 16;
  doc
    .moveTo(startX, y - 4)
    .lineTo(startX + COLS.reduce((s, c) => s + c.width, 0), y - 4)
    .stroke();

  doc.font('Helvetica');
  for (const t of transactions) {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = doc.y;
    }
    x = startX;
    const cells = [
      t.transactionDate.toISOString().slice(0, 10),
      t.type,
      t.description,
      t.category?.name ?? 'Sem categoria',
      `${Number(t.amount).toFixed(2)} ${t.currency}`,
    ];
    let maxLines = 1;
    for (let i = 0; i < cells.length; i += 1) {
      const col = COLS[i];
      const text = cells[i];
      if (!col || text === undefined) continue;
      const h = doc.heightOfString(text, { width: col.width });
      maxLines = Math.max(maxLines, Math.ceil(h / 12));
      doc.text(text, x, y, { width: col.width });
      x += col.width;
    }
    y += Math.max(14, maxLines * 14);
  }

  doc.y = y;
}

function renderTotals(doc: PDFKit.PDFDocument, transactions: TransactionWithCategory[]): void {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(`Receitas: R$ ${income.toFixed(2)}`);
  doc.text(`Despesas: R$ ${expense.toFixed(2)}`);
  doc.text(`Líquido: R$ ${(income - expense).toFixed(2)}`);
}
