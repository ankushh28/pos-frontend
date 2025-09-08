import { InvoiceData } from '../types';

export class InvoiceGenerator {
  private static formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  static async generatePDF(invoiceData: InvoiceData): Promise<void> {
    const { shop, invoice, items, totals, gstBreakup } = invoiceData;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.');
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${invoice.id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #d32b26;
            padding-bottom: 20px;
        }
        
        .shop-name {
            font-size: 28px;
            font-weight: bold;
            color: #d32b26;
            margin-bottom: 5px;
        }
        
        .invoice-title {
            font-size: 18px;
            color: #666;
            margin-top: 10px;
        }
        
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .invoice-details, .customer-details {
            flex: 1;
            min-width: 250px;
        }
        
        .invoice-details h3, .customer-details h3 {
            color: #d32b26;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .detail-row {
            margin-bottom: 5px;
        }
        
        .detail-label {
            font-weight: 600;
            display: inline-block;
            width: 120px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .items-table th {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            color: #495057;
        }
        
        .items-table td {
            border: 1px solid #dee2e6;
            padding: 10px 8px;
            text-align: left;
        }
        
        .items-table .text-right {
            text-align: right;
        }
        
        .items-table .text-center {
            text-align: center;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #eee;
        }
        
        .totals-table .label {
            font-weight: 600;
            text-align: left;
        }
        
        .totals-table .amount {
            text-align: right;
            font-weight: 600;
        }
        
        .grand-total {
            background-color: #d32b26;
            color: white;
            font-size: 16px;
        }
        
        .gst-breakup {
            margin-bottom: 30px;
        }
        
        .gst-breakup h3 {
            color: #d32b26;
            margin-bottom: 15px;
            font-size: 14px;
        }
        
        .gst-table {
            width: 300px;
            border-collapse: collapse;
        }
        
        .gst-table th, .gst-table td {
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            text-align: right;
        }
        
        .gst-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 11px;
        }
        
        .notes {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #fed21c;
        }
        
        .notes h3 {
            color: #d32b26;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        @media print {
            body {
                font-size: 11px;
            }
            
            .invoice-container {
                padding: 10px;
            }
            
            .header {
                margin-bottom: 20px;
                padding-bottom: 15px;
            }
            
            .shop-name {
                font-size: 24px;
            }
            
            .invoice-title {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="shop-name">${shop.name}</div>
            <div class="invoice-title">TAX INVOICE</div>
        </div>
        
        <!-- Invoice Info -->
        <div class="invoice-info">
            <div class="invoice-details">
                <h3>Invoice Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Invoice No:</span>
                    <span>${invoice.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span>${this.formatDate(invoice.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment:</span>
                    <span>${invoice.paymentMethod || 'N/A'}</span>
                </div>
            </div>
            
            <div class="customer-details">
                <h3>Customer Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span>${invoice.customerPhone || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="text-center">HSN/SAC</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Rate (₹)</th>
                    <th class="text-center">GST%</th>
                    <th class="text-right">GST Amt (₹)</th>
                    <th class="text-right">Total (₹)</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td class="text-center">${item.hsnSac || '-'}</td>
                        <td class="text-center">${item.qty}</td>
                        <td class="text-right">${this.formatCurrency(item.unitPriceExcl)}</td>
                        <td class="text-center">${item.gstRate}%</td>
                        <td class="text-right">${this.formatCurrency(item.lineGstAmount)}</td>
                        <td class="text-right">${this.formatCurrency(item.lineTotal)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Totals -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="amount">${this.formatCurrency(totals.baseAmount)}</td>
                </tr>
                <tr>
                    <td class="label">GST:</td>
                    <td class="amount">${this.formatCurrency(totals.gstAmount)}</td>
                </tr>
                ${totals.discount > 0 ? `
                <tr>
                    <td class="label">Discount:</td>
                    <td class="amount">-${this.formatCurrency(totals.discount)}</td>
                </tr>
                ` : ''}
                <tr class="grand-total">
                    <td class="label">Grand Total:</td>
                    <td class="amount">${this.formatCurrency(totals.grandTotal)}</td>
                </tr>
            </table>
        </div>
        
        <!-- GST Breakup -->
        ${gstBreakup.length > 0 ? `
        <div class="gst-breakup">
            <h3>GST Breakup</h3>
            <table class="gst-table">
                <thead>
                    <tr>
                        <th>GST Rate</th>
                        <th>GST Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${gstBreakup.map(gst => `
                        <tr>
                            <td>${gst.rate}%</td>
                            <td>${this.formatCurrency(gst.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
        
        <!-- Notes -->
        ${invoice.notes ? `
        <div class="notes">
            <h3>Notes</h3>
            <p>${invoice.notes}</p>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() {
                window.close();
            };
        };
    </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  static async downloadInvoice(orderId: string, invoiceData: InvoiceData): Promise<void> {
    try {
      await this.generatePDF(invoiceData);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }
}