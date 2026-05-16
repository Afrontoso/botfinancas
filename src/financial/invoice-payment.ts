import { PrismaClient, Transaction, Invoice, InvoicePayment } from '@prisma/client';

export type PayInvoiceOptions = {
  sourceAccountId?: string;
  description?: string;
  paymentDate?: Date;
  paymentMethod?: string;
};

export type PayInvoiceResult = {
  transaction: Transaction;
  invoicePayment: InvoicePayment;
  invoice: Invoice;
};

export async function payInvoice(
  prisma: PrismaClient,
  userId: string,
  invoiceId: string,
  amount: number,
  options: PayInvoiceOptions = {},
): Promise<PayInvoiceResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { account: true },
  });
  if (!invoice) {
    throw new Error(`payInvoice: invoice not found: ${invoiceId}`);
  }
  if (invoice.account.userId !== userId) {
    throw new Error(`payInvoice: permission denied — invoice does not belong to user`);
  }

  const newPaidAmount = Number(invoice.paidAmount) + amount;
  const totalAmount = Number(invoice.totalAmount);
  const nextStatus: Invoice['status'] = newPaidAmount >= totalAmount ? 'paid' : 'partial';
  const paymentDate = options.paymentDate ?? new Date();

  const [createdTx, createdIp, updatedInvoice] = await prisma.$transaction(async (tx) => {
    const createdTx = await tx.transaction.create({
      data: {
        userId,
        accountId: options.sourceAccountId,
        type: 'transfer',
        direction: 'out',
        amount,
        currency: 'BRL',
        description: options.description ?? `Pagamento da fatura ${invoice.account.name}`,
        transactionDate: paymentDate,
        paymentMethod: options.paymentMethod,
        source: 'telegram_text',
      },
    });

    const createdIp = await tx.invoicePayment.create({
      data: {
        invoiceId,
        transactionId: createdTx.id,
        amount,
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: { increment: amount },
        status: nextStatus,
      },
    });

    return [createdTx, createdIp, updatedInvoice] as const;
  });

  return { transaction: createdTx, invoicePayment: createdIp, invoice: updatedInvoice };
}
