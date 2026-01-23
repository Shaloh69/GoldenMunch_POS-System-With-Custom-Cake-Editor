import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CustomerOrder } from '@/types/api';

interface TransactionSummary {
  totalSales: number;
  totalCash: number;
  totalCashless: number;
  cashTransactions: number;
  cashlessTransactions: number;
  totalTransactions: number;
  totalDiscount: number;
  totalTax: number;
  cashCollected: number;
  changeGiven: number;
}

export class TransactionsPDFExporter {
  private doc: jsPDF;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly margin: number = 20;
  private yPosition: number = 20;

  // Colors - Golden Munch Branding
  private readonly primaryColor: [number, number, number] = [212, 128, 38]; // Golden Orange
  private readonly secondaryColor: [number, number, number] = [139, 69, 19]; // Brown
  private readonly accentColor: [number, number, number] = [255, 140, 0]; // Dark Orange
  private readonly lightBg: [number, number, number] = [255, 248, 220]; // Cornsilk

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generate the complete PDF report
   */
  public generateReport(
    transactions: CustomerOrder[],
    dateFrom?: string,
    dateTo?: string
  ): void {
    // Page 1: Header, Summary, and Main Table
    this.addHeader();
    this.addReportInfo(dateFrom, dateTo);

    const summary = this.calculateSummary(transactions);
    this.addSummarySection(summary);
    this.addTransactionsTable(transactions);

    // Page 2: Payment Breakdown
    if (transactions.length > 0) {
      this.doc.addPage();
      this.yPosition = 20;
      this.addHeader();
      this.addPaymentBreakdown(transactions, summary);
    }
  }

  /**
   * Add Golden Munch header with logo and branding
   */
  private addHeader(): void {
    // Background bar
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');

    // Cake Icon (text-based logo)
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('GM', this.margin, 22);

    // Company Name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GoldenMunch', this.margin + 15, 20);

    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Bakery & Pastry Shop', this.margin + 15, 28);

    this.yPosition = 45;
  }

  /**
   * Add report information
   */
  private addReportInfo(dateFrom?: string, dateTo?: string): void {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TRANSACTIONS REPORT', this.pageWidth / 2, this.yPosition, {
      align: 'center',
    });

    this.yPosition += 10;

    // Date range
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);

    const dateRange = dateFrom && dateTo
      ? `Period: ${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`
      : `Generated: ${new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`;

    this.doc.text(dateRange, this.pageWidth / 2, this.yPosition, {
      align: 'center',
    });

    this.yPosition += 15;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(transactions: CustomerOrder[]): TransactionSummary {
    const cashTransactions = transactions.filter((t) => t.payment_method === 'cash');
    const cashlessTransactions = transactions.filter((t) => t.payment_method === 'cashless');

    return {
      totalSales: transactions.reduce((sum, t) => sum + Number(t.final_amount || 0), 0),
      totalCash: cashTransactions.reduce((sum, t) => sum + Number(t.final_amount || 0), 0),
      totalCashless: cashlessTransactions.reduce((sum, t) => sum + Number(t.final_amount || 0), 0),
      cashTransactions: cashTransactions.length,
      cashlessTransactions: cashlessTransactions.length,
      totalTransactions: transactions.length,
      totalDiscount: transactions.reduce((sum, t) => sum + Number(t.discount_amount || 0), 0),
      totalTax: transactions.reduce((sum, t) => sum + Number(t.tax_amount || 0), 0),
      cashCollected: cashTransactions.reduce((sum, t) => sum + Number((t as any).amount_paid || 0), 0),
      changeGiven: cashTransactions.reduce((sum, t) => sum + Number((t as any).change_amount || 0), 0),
    };
  }

  /**
   * Add summary section with key metrics
   */
  private addSummarySection(summary: TransactionSummary): void {
    const summaryData = [
      ['Total Transactions', summary.totalTransactions.toString()],
      ['Total Sales', `P ${summary.totalSales.toFixed(2)}`],
      ['Cash Payments', `${summary.cashTransactions} (P ${summary.totalCash.toFixed(2)})`],
      ['Cashless Payments', `${summary.cashlessTransactions} (P ${summary.totalCashless.toFixed(2)})`],
      ['Total Discounts', `P ${summary.totalDiscount.toFixed(2)}`],
      ['Total Tax', `P ${summary.totalTax.toFixed(2)}`],
    ];

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['SUMMARY', 'VALUE']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: this.lightBg,
      },
      margin: { left: this.margin, right: this.margin },
      tableWidth: 'auto',
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', halign: 'left' },
        1: { cellWidth: 80, halign: 'right', fontStyle: 'normal' },
      },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add main transactions table
   */
  private addTransactionsTable(transactions: CustomerOrder[]): void {
    // Add section header
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text('TRANSACTION DETAILS', this.margin, this.yPosition);
    this.yPosition += 5;

    const tableData = transactions.map((t: any) => [
      t.order_number || `#${t.order_id}`,
      new Date(t.order_datetime).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      t.name || 'Walk-in',
      t.payment_method?.toUpperCase() || 'N/A',
      t.cashier_name || 'N/A',
      `P ${Number(t.final_amount || 0).toFixed(2)}`,
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['Order #', 'Date & Time', 'Customer', 'Payment', 'Cashier', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: this.secondaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 35, halign: 'left' },
        2: { cellWidth: 30, halign: 'left' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30, halign: 'left' },
        5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: (data) => {
        // Add page numbers
        const pageCount = (this.doc as any).internal.getNumberOfPages();
        const currentPage = (this.doc as any).internal.getCurrentPageInfo().pageNumber;

        this.doc.setFontSize(8);
        this.doc.setTextColor(150, 150, 150);
        this.doc.text(
          `Page ${currentPage} of ${pageCount}`,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: 'center' }
        );
      },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add detailed payment breakdown
   */
  private addPaymentBreakdown(
    transactions: CustomerOrder[],
    summary: TransactionSummary
  ): void {
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text('PAYMENT METHOD BREAKDOWN', this.margin, this.yPosition);
    this.yPosition += 10;

    // Cash Payment Details
    if (summary.cashTransactions > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text('Cash Payments', this.margin, this.yPosition);
      this.yPosition += 5;

      const cashData = [
        ['Total Cash Sales', `P ${summary.totalCash.toFixed(2)}`],
        ['Cash Collected', `P ${summary.cashCollected.toFixed(2)}`],
        ['Change Given', `P ${summary.changeGiven.toFixed(2)}`],
        ['Number of Transactions', summary.cashTransactions.toString()],
        ['Net Cash in Drawer', `P ${(summary.cashCollected - summary.changeGiven).toFixed(2)}`],
      ];

      autoTable(this.doc, {
        startY: this.yPosition,
        body: cashData,
        theme: 'plain',
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold', halign: 'left' },
          1: { cellWidth: 70, halign: 'right', textColor: [0, 100, 0], fontStyle: 'bold' },
        },
        margin: { left: this.margin + 5 },
      });

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;
    }

    // Cashless Payment Details
    if (summary.cashlessTransactions > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.primaryColor);
      this.doc.text('Cashless Payments', this.margin, this.yPosition);
      this.yPosition += 5;

      const cashlessData = [
        ['Total Cashless Sales', `P ${summary.totalCashless.toFixed(2)}`],
        ['Number of Transactions', summary.cashlessTransactions.toString()],
        ['Average Transaction', `P ${(summary.totalCashless / summary.cashlessTransactions).toFixed(2)}`],
      ];

      autoTable(this.doc, {
        startY: this.yPosition,
        body: cashlessData,
        theme: 'plain',
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold', halign: 'left' },
          1: { cellWidth: 70, halign: 'right', textColor: [0, 0, 180], fontStyle: 'bold' },
        },
        margin: { left: this.margin + 5 },
      });

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 15;
    }

    // Overall Summary Box
    this.doc.setFillColor(...this.lightBg);
    this.doc.rect(this.margin, this.yPosition, this.pageWidth - 2 * this.margin, 30, 'F');

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.secondaryColor);
    this.doc.text('GRAND TOTAL', this.margin + 5, this.yPosition + 15);

    this.doc.setFontSize(20);
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text(
      `P ${summary.totalSales.toFixed(2)}`,
      this.pageWidth - this.margin - 5,
      this.yPosition + 18,
      { align: 'right' }
    );
  }

  /**
   * Save the PDF file
   */
  public save(filename: string): void {
    this.doc.save(filename);
  }
}

/**
 * Export transactions to PDF
 */
export function exportTransactionsToPDF(
  transactions: CustomerOrder[],
  dateFrom?: string,
  dateTo?: string
): void {
  const exporter = new TransactionsPDFExporter();
  exporter.generateReport(transactions, dateFrom, dateTo);

  const dateRange =
    dateFrom && dateTo
      ? `${dateFrom}_to_${dateTo}`
      : new Date().toISOString().split('T')[0];

  exporter.save(`GoldenMunch_Transactions_${dateRange}.pdf`);
}
