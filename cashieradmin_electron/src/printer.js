const { BrowserWindow } = require('electron');

console.log('🔌 Printer module loading...');
console.log('🪟 BrowserWindow available:', typeof BrowserWindow);

/**
 * Get printer status
 * @param {string} printerName - Name of the printer to check
 * @returns {Promise<{available: boolean, connected: boolean, config: any}>}
 */
async function getStatus(printerName = 'POS-58') {
  try {
    console.log(`🖨️  Checking printer status for: "${printerName}"`);

    // Get the main window to access printers
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      throw new Error('No window available');
    }

    // Get list of available printers from Electron's native API (asynchronous)
    const printers = await mainWindow.webContents.getPrintersAsync();

    console.log(`📋 Found ${printers?.length || 0} system printers:`,
      printers?.map(p => ({
        name: p.name,
        displayName: p.displayName,
        isDefault: p.isDefault,
        status: p.status
      }))
    );

    if (!printers || printers.length === 0) {
      console.warn('⚠️  No printers detected');
      return {
        available: false,
        connected: false,
        config: {
          printerName: printerName,
          error: 'No printers detected. Please check connection and ensure printer is installed in Windows.',
          suggestion: 'Install your thermal printer using Windows Settings > Devices > Printers & scanners',
        },
      };
    }

    // Check if the specified printer exists (try exact match first, then partial)
    let printer = printers.find((p) =>
      p.name === printerName ||
      p.displayName === printerName
    );

    // If not found, try case-insensitive partial match
    if (!printer) {
      printer = printers.find((p) =>
        p.name.toLowerCase().includes(printerName.toLowerCase()) ||
        p.displayName?.toLowerCase().includes(printerName.toLowerCase())
      );
    }

    // If still not found, use default printer if available
    if (!printer && printers.length > 0) {
      printer = printers.find((p) => p.isDefault) || printers[0];
      console.log(`ℹ️  Printer "${printerName}" not found, using: ${printer.name}`);
    }

    if (printer) {
      console.log(`✅ Printer connected: ${printer.name}`);
      return {
        available: true,
        connected: true,
        config: {
          printerName: printer.name,
          name: printer.name,
          displayName: printer.displayName,
          status: printer.status,
          isDefault: printer.isDefault,
          options: printer.options,
        },
      };
    }

    // Printer not found, but other printers are available
    console.warn(`⚠️  Printer "${printerName}" not found among available printers`);
    return {
      available: true,
      connected: false,
      config: {
        printerName: printerName,
        error: `Printer "${printerName}" not found`,
        suggestion: `Available printers: ${printers.map((p) => p.name).join(', ')}`,
        availablePrinters: printers.map((p) => p.name),
      },
    };
  } catch (error) {
    console.error('❌ Error checking printer status:', error);
    return {
      available: false,
      connected: false,
      config: {
        printerName: printerName,
        error: error.message || 'Failed to detect printer',
        suggestion:
          'Please ensure printer is connected and drivers are installed in Windows',
      },
    };
  }
}

/**
 * Get available printers
 * @returns {Promise<Array<string>>}
 */
async function getAvailablePrinters() {
  try {
    console.log('🔍 Starting printer detection...');

    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.warn('❌ No window available to get printers');
      return [];
    }

    console.log('✅ MainWindow found:', {
      id: mainWindow.id,
      isDestroyed: mainWindow.isDestroyed(),
      webContentsId: mainWindow.webContents.id
    });

    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log('📋 getPrinters() returned:', JSON.stringify(printers, null, 2));
    console.log('🖨️ Printer count:', printers.length);

    if (printers && printers.length > 0) {
      console.log('🖨️ Detected printers:', printers.map(p => p.name));
      return printers.map((printer) => printer.name);
    }

    console.warn('⚠️ No printers detected by Electron');
    return [];
  } catch (error) {
    console.error('❌ Error getting available printers:', error);
    return [];
  }
}

/**
 * Generate HTML for receipt printing (optimized for thermal printers)
 * @param {Object} receiptData - Receipt data
 * @returns {string} HTML string
 */
function generateReceiptHTML(receiptData) {
  let itemsHTML = '';
  receiptData.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    itemsHTML += `
      <tr>
        <td colspan="3" style="padding: 2px 0;">${item.name}</td>
      </tr>
      <tr>
        <td style="padding: 0 0 5px 10px;">x${item.quantity}</td>
        <td style="padding: 0 0 5px 0;"></td>
        <td style="padding: 0 0 5px 0; text-align: right;">₱${itemTotal.toFixed(2)}</td>
      </tr>`;
    if (item.specialInstructions) {
      itemsHTML += `
      <tr>
        <td colspan="3" style="padding: 0 0 5px 15px; font-size: 9px; font-style: italic;">
          Note: ${item.specialInstructions}
        </td>
      </tr>`;
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: 58mm auto;
      margin: 0mm;
    }
    @media print {
      html, body {
        width: 58mm;
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: 'Courier New', 'Courier', monospace;
      font-size: 12px;
      color: #000;
      background-color: #fff;
      width: 58mm;
      margin: 0;
      padding: 2mm 4mm;
      line-height: 1.3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    .center {
      text-align: center;
    }
    .right {
      text-align: right;
    }
    .bold {
      font-weight: bold;
    }
    .large {
      font-size: 18px;
      font-weight: bold;
    }
    .medium {
      font-size: 14px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 3px 0;
      height: 0;
    }
    .mt-10 {
      margin-top: 10px;
    }
    .mb-5 {
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="center large">GOLDENMUNCH</div>
  <div class="center medium mb-5">Order Receipt</div>
  <div class="divider"></div>

  <table>
    <tr>
      <td colspan="3" style="padding: 3px 0;">Order #: <span class="bold">${receiptData.orderNumber}</span></td>
    </tr>
    <tr>
      <td colspan="3" style="padding: 0 0 3px 0;">Date: ${receiptData.orderDate}</td>
    </tr>
  </table>

  <div class="divider"></div>

  ${receiptData.customerName ? `<div style="padding: 3px 0;">Customer: ${receiptData.customerName}</div>` : ''}

  ${receiptData.verificationCode ? `
    <div class="center mt-10">
      <div style="font-size: 10px;">Verification Code:</div>
      <div class="bold large">${receiptData.verificationCode}</div>
    </div>
    <div class="divider" style="margin-top: 5px;"></div>
  ` : ''}

  ${receiptData.estimatedPrepTime ? `
    <div class="center mt-10">
      <div style="font-size: 10px;">Estimated Prep Time:</div>
      <div class="bold medium">${receiptData.estimatedPrepTime} MINS</div>
    </div>
    <div class="divider" style="margin-top: 5px;"></div>
  ` : ''}

  <div class="bold mt-10 mb-5">ITEMS:</div>
  <div class="divider"></div>

  <table>
    ${itemsHTML}
  </table>

  <div class="divider"></div>

  <table>
    <tr>
      <td></td>
      <td class="bold" style="text-align: right; width: 30%;">Subtotal:</td>
      <td class="right" style="width: 35%;">₱${receiptData.subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td></td>
      <td class="bold" style="text-align: right;">Tax:</td>
      <td class="right">₱${receiptData.tax.toFixed(2)}</td>
    </tr>
    ${receiptData.discount > 0 ? `
    <tr>
      <td></td>
      <td class="bold" style="text-align: right;">Discount:</td>
      <td class="right">-₱${receiptData.discount.toFixed(2)}</td>
    </tr>` : ''}
  </table>

  <div class="divider"></div>

  <div class="right bold large" style="margin: 5px 0;">TOTAL: ₱${receiptData.total.toFixed(2)}</div>

  <div class="divider"></div>

  ${receiptData.paymentMethod === 'Cash' && receiptData.amountPaid > 0 && receiptData.changeAmount !== undefined ? `
    <table>
      <tr>
        <td></td>
        <td class="bold" style="text-align: right; width: 30%;">Amount Paid:</td>
        <td class="right" style="width: 35%;">₱${receiptData.amountPaid.toFixed(2)}</td>
      </tr>
      <tr>
        <td></td>
        <td class="bold" style="text-align: right;">Change:</td>
        <td class="right">₱${receiptData.changeAmount.toFixed(2)}</td>
      </tr>
    </table>
    <div class="divider"></div>` : ''}

  <div style="margin-top: 5px;">Payment: <span class="bold">${receiptData.paymentMethod}</span></div>
  ${receiptData.referenceNumber ? `<div>Reference #: ${receiptData.referenceNumber}</div>` : ''}

  ${receiptData.specialInstructions ? `
    <div class="mt-10">
      <div class="bold">SPECIAL INSTRUCTIONS:</div>
      <div style="font-size: 10px; margin-top: 3px;">${receiptData.specialInstructions}</div>
    </div>
  ` : ''}

  <div class="center bold mt-10">Thank you for your order!</div>
  <div class="center" style="margin-bottom: 10px;">Please come again</div>
</body>
</html>`;
}

/**
 * Print receipt using Electron's native printing API
 * @param {string} printerName - Name of printer to use
 * @param {Object} receiptData - Receipt data
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function printReceipt(printerName, receiptData) {
  console.log('\n🧾 ═══════════════════ PRINTING RECEIPT ═══════════════════');
  console.log('🖨️  Target Printer:', printerName);
  console.log('📦 Order Number:', receiptData.orderNumber);
  console.log('💰 Total Amount: ₱' + receiptData.total?.toFixed(2));

  return new Promise((resolve, reject) => {
    try {
      // Get the main window reference for printing
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        throw new Error('No window available for printing');
      }
      console.log('🪟 Using window ID:', mainWindow.id);

      // Create a hidden BrowserWindow for printing
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      console.log('📄 Creating print window...');
      const htmlContent = generateReceiptHTML(receiptData);

      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      printWindow.webContents.on('did-finish-load', async () => {
        console.log('✅ Print content loaded');

        // Verify printer exists before attempting to print
        const printers = await printWindow.webContents.getPrintersAsync();
        const targetPrinter = printers.find(p => p.name === printerName);

        if (!targetPrinter) {
          printWindow.close();
          console.error('❌ Printer not found:', printerName);
          console.log('📋 Available printers:', printers.map(p => p.name));
          resolve({
            success: false,
            error: `Printer "${printerName}" not found. Available: ${printers.map(p => p.name).join(', ')}`,
          });
          return;
        }

        console.log('✅ Target printer verified:', targetPrinter.name, '- Status:', targetPrinter.status);

        // Print options optimized for thermal receipt printer (POS-58)
        // Page: 58mm width, Content: 50mm effective width (4mm padding on each side)
        const options = {
          silent: true,                    // Don't show print dialog
          printBackground: true,            // Print background colors/styles
          color: false,                     // Thermal printers are monochrome
          deviceName: printerName,
          pageSize: {
            width: 58000,                   // 58mm page in microns (1mm = 1000 microns)
            height: 500000,                 // 500mm in microns (generous height for any receipt)
          },
          margins: {
            marginType: 'none',             // No print margins (using CSS margins for content)
          },
          scaleFactor: 100,                 // No scaling
          pagesPerSheet: 1,
          collate: false,
          copies: 1,
        };

        console.log('🔧 Print Options:', JSON.stringify(options, null, 2));
        console.log('🔄 Attempting to print with native Electron API...');

        try {
          printWindow.webContents.print(options, (success, errorType) => {
            printWindow.close();

            if (success) {
              console.log('🎉 Print completed successfully');
              console.log('═══════════════════════════════════════════════════════════════\n');
              resolve({
                success: true,
                message: 'Receipt printed successfully',
              });
            } else {
              console.error('❌ Print failed. Error type:', errorType);
              console.error('═══════════════════════════════════════════════════════════════\n');
              resolve({
                success: false,
                error: `Print failed: ${errorType}`,
              });
            }
          });
        } catch (printError) {
          printWindow.close();
          console.error('💥 Print error:', printError);
          console.error('═══════════════════════════════════════════════════════════════\n');
          resolve({
            success: false,
            error: printError.message || 'Failed to print receipt',
          });
        }
      });

      printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        printWindow.close();
        console.error('❌ Failed to load print content:', errorCode, errorDescription);
        console.error('═══════════════════════════════════════════════════════════════\n');
        resolve({
          success: false,
          error: `Failed to load print content: ${errorDescription}`,
        });
      });

    } catch (error) {
      console.error('❌ Error in printReceipt:', error.message);
      console.error('Full error:', error);
      console.error('═══════════════════════════════════════════════════════════════\n');
      resolve({
        success: false,
        error: error.message || 'Failed to print receipt',
        suggestion: 'Please check printer connection and ensure the printer is set up in Windows Settings > Printers & scanners',
      });
    }
  });
}

/**
 * Print test receipt
 * @param {string} printerName - Name of printer to use
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function printTest(printerName) {
  console.log('\n🧪 ═══════════════════ TEST PRINT ═══════════════════');
  console.log('🖨️  Target Printer:', printerName);
  const testData = {
    orderNumber: 'TEST-001',
    orderDate: new Date().toLocaleString(),
    items: [
      {
        name: 'Test Item 1',
        quantity: 2,
        price: 99.99,
      },
      {
        name: 'Test Item 2',
        quantity: 1,
        price: 149.99,
      },
    ],
    subtotal: 349.97,
    tax: 42.0,
    discount: 0,
    total: 391.97,
    paymentMethod: 'Cash',
    customerName: 'Test Customer',
    verificationCode: '1234',
  };

  console.log('📝 Test data prepared');
  const result = await printReceipt(printerName, testData);
  console.log('═══════════════════════════════════════════════════════════════\n');
  return result;
}

/**
 * Print daily sales report
 * @param {string} printerName - Name of printer to use
 * @param {Object} reportData - Report data
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function printDailyReport(printerName, reportData) {
  console.log('\n📊 ═══════════════════ DAILY REPORT ═══════════════════');
  console.log('🖨️  Target Printer:', printerName);
  console.log('📅 Report Date:', reportData.date);
  console.log('📈 Total Orders:', reportData.totalOrders);
  console.log('💰 Total Sales: ₱' + reportData.totalSales?.toFixed(2));
  try {
    // Get the main window reference for printing
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      throw new Error('No window available for printing');
    }
    console.log('🪟 Using window ID:', mainWindow.id);
    // Build report data structure
    const data = [
      // Header
      {
        type: 'text',
        value: 'GOLDENMUNCH',
        style: {
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          marginTop: '10px',
        },
      },
      {
        type: 'text',
        value: 'Daily Sales Report',
        style: {
          textAlign: 'center',
          fontSize: '14px',
          marginBottom: '10px',
        },
      },
      {
        type: 'text',
        value: '--------------------------------',
        style: { textAlign: 'center' },
      },
      // Report date
      {
        type: 'text',
        value: `Date: ${reportData.date}`,
        style: { marginTop: '5px', marginBottom: '5px' },
      },
      {
        type: 'text',
        value: '--------------------------------',
      },
      // Summary
      {
        type: 'text',
        value: '',
        style: { marginTop: '5px' },
      },
      {
        type: 'text',
        value: 'SUMMARY:',
        style: { fontWeight: 'bold' },
      },
      {
        type: 'text',
        value: `Total Orders: ${reportData.totalOrders}`,
      },
      {
        type: 'text',
        value: `Total Sales: ₱${reportData.totalSales.toFixed(2)}`,
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'right',
          marginTop: '5px',
        },
      },
      {
        type: 'text',
        value: '--------------------------------',
        style: { marginTop: '5px' },
      },
    ];

    // Payment breakdown
    data.push(
      {
        type: 'text',
        value: '',
        style: { marginTop: '5px' },
      },
      {
        type: 'text',
        value: 'PAYMENT BREAKDOWN:',
        style: { fontWeight: 'bold' },
      }
    );

    Object.entries(reportData.paymentBreakdown).forEach(([method, amount]) => {
      data.push({
        type: 'text',
        value: `${method.padEnd(15)} ₱${amount.toFixed(2)}`,
      });
    });

    data.push({
      type: 'text',
      value: '--------------------------------',
      style: { marginTop: '5px' },
    });

    // Top items
    if (reportData.topItems && reportData.topItems.length > 0) {
      data.push(
        {
          type: 'text',
          value: '',
          style: { marginTop: '5px' },
        },
        {
          type: 'text',
          value: 'TOP ITEMS:',
          style: { fontWeight: 'bold' },
        }
      );

      reportData.topItems.forEach((item, index) => {
        data.push({
          type: 'text',
          value: `${index + 1}. ${item.name} (${item.quantity}x)`,
        });
      });
    }

    // Footer
    data.push(
      {
        type: 'text',
        value: '',
        style: { marginTop: '10px' },
      },
      {
        type: 'text',
        value: 'End of Report',
        style: { textAlign: 'center', fontWeight: 'bold', marginBottom: '10px' },
      }
    );

    // Print options
    // NOTE: Removed 'silent' option as it may cause "Cannot convert undefined or null to object" error
    const options = {
      preview: false,
      width: '58mm',
      margin: '0 0 0 0',
      copies: 1,
      printerName: printerName,
      timeOutPerLine: 400,
      // silent: true,  // Commented out - may cause issues with electron-pos-printer
    };

    // Verify printer exists before attempting to print
    const printers = await mainWindow.webContents.getPrintersAsync();
    const targetPrinter = printers.find(p => p.name === printerName);

    if (!targetPrinter) {
      console.error('❌ Printer not found:', printerName);
      console.log('📋 Available printers:', printers.map(p => p.name));
      throw new Error(`Printer "${printerName}" not found. Available: ${printers.map(p => p.name).join(', ')}`);
    }

    console.log('✅ Target printer verified:', targetPrinter.name, '- Status:', targetPrinter.status);

    // Print the report
    console.log('📄 Sending', data.length, 'sections to printer...');

    try {
      console.log('🔄 Attempting to print report with electron-pos-printer...');
      await PosPrinter.print(data, options);
      console.log('🎉 Report print completed successfully');
    } catch (printError) {
      console.error('💥 PosPrinter.print() error:', printError);
      console.error('📚 Error stack:', printError.stack);
      throw printError;
    }

    console.log('✅ Report printed successfully!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    return {
      success: true,
      message: 'Report printed successfully',
    };
  } catch (error) {
    console.error('❌ Error printing report:', error.message);
    console.error('Full error:', error);
    console.error('═══════════════════════════════════════════════════════════════\n');

    return {
      success: false,
      error: error.message || 'Failed to print report',
      suggestion:
        'Please check printer connection and ensure the printer is set up in Windows Settings > Printers & scanners',
    };
  }
}

module.exports = {
  getStatus,
  getAvailablePrinters,
  printReceipt,
  printTest,
  printDailyReport,
};
