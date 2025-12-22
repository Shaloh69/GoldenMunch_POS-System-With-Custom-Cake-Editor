const { PosPrinter } = require('electron-pos-printer');
const { BrowserWindow } = require('electron');

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
 * Print receipt
 * @param {string} printerName - Name of printer to use
 * @param {Object} receiptData - Receipt data
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function printReceipt(printerName, receiptData) {
  console.log('\n🧾 ═══════════════════ PRINTING RECEIPT ═══════════════════');
  console.log('🖨️  Target Printer:', printerName);
  console.log('📦 Order Number:', receiptData.orderNumber);
  console.log('💰 Total Amount: ₱' + receiptData.total?.toFixed(2));
  try {
    // Get the main window reference for printing
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      throw new Error('No window available for printing');
    }
    console.log('🪟 Using window ID:', mainWindow.id);
    // Build receipt data structure for electron-pos-printer
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
        value: 'Order Receipt',
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
      // Order info
      {
        type: 'text',
        value: `Order #: ${receiptData.orderNumber}`,
        style: { marginTop: '5px' },
      },
      {
        type: 'text',
        value: `Date: ${receiptData.orderDate}`,
        style: { marginBottom: '5px' },
      },
      {
        type: 'text',
        value: '--------------------------------',
      },
    ];

    // Customer info
    if (receiptData.customerName) {
      data.push({
        type: 'text',
        value: `Customer: ${receiptData.customerName}`,
        style: { marginTop: '5px' },
      });
    }
    if (receiptData.verificationCode) {
      data.push(
        {
          type: 'text',
          value: 'Verification Code:',
          style: {
            textAlign: 'center',
            fontSize: '12px',
            marginTop: '10px',
          },
        },
        {
          type: 'text',
          value: receiptData.verificationCode,
          style: {
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '10px',
          },
        }
      );
    }

    // Items section
    data.push(
      {
        type: 'text',
        value: '',
        style: { marginTop: '5px' },
      },
      {
        type: 'text',
        value: 'ITEMS:',
        style: { fontWeight: 'bold' },
      },
      {
        type: 'text',
        value: '--------------------------------',
      }
    );

    // Add each item
    receiptData.items.forEach((item) => {
      const itemTotal = item.price * item.quantity;

      data.push(
        {
          type: 'text',
          value: item.name,
          style: { marginTop: '3px' },
        },
        {
          type: 'text',
          value: `  x${item.quantity}    ₱${itemTotal.toFixed(2)}`,
          style: { textAlign: 'right' },
        }
      );

      if (item.specialInstructions) {
        data.push({
          type: 'text',
          value: `  Note: ${item.specialInstructions}`,
          style: { fontSize: '11px', fontStyle: 'italic' },
        });
      }
    });

    // Totals
    data.push(
      {
        type: 'text',
        value: '--------------------------------',
        style: { marginTop: '5px' },
      },
      {
        type: 'text',
        value: `Subtotal: ₱${receiptData.subtotal.toFixed(2)}`,
        style: { textAlign: 'right' },
      },
      {
        type: 'text',
        value: `Tax: ₱${receiptData.tax.toFixed(2)}`,
        style: { textAlign: 'right' },
      }
    );

    if (receiptData.discount > 0) {
      data.push({
        type: 'text',
        value: `Discount: -₱${receiptData.discount.toFixed(2)}`,
        style: { textAlign: 'right' },
      });
    }

    data.push(
      {
        type: 'text',
        value: '--------------------------------',
      },
      {
        type: 'text',
        value: `TOTAL: ₱${receiptData.total.toFixed(2)}`,
        style: {
          textAlign: 'right',
          fontSize: '18px',
          fontWeight: 'bold',
          marginTop: '5px',
        },
      },
      {
        type: 'text',
        value: '--------------------------------',
      }
    );

    // Payment method
    data.push(
      {
        type: 'text',
        value: `Payment: ${receiptData.paymentMethod}`,
        style: { marginTop: '5px' },
      }
    );

    // Reference number for digital payments
    if (receiptData.referenceNumber) {
      data.push({
        type: 'text',
        value: `Reference #: ${receiptData.referenceNumber}`,
      });
    }

    // Special instructions
    if (receiptData.specialInstructions) {
      data.push(
        {
          type: 'text',
          value: '',
          style: { marginTop: '5px' },
        },
        {
          type: 'text',
          value: 'SPECIAL INSTRUCTIONS:',
          style: { fontWeight: 'bold' },
        },
        {
          type: 'text',
          value: receiptData.specialInstructions,
          style: { fontSize: '11px' },
        }
      );
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
        value: 'Thank you for your order!',
        style: { textAlign: 'center', fontWeight: 'bold' },
      },
      {
        type: 'text',
        value: 'Please come again',
        style: { textAlign: 'center', marginBottom: '10px' },
      }
    );

    // Print options
    const options = {
      preview: false,
      width: '58mm', // Supports: 80mm, 78mm, 76mm, 58mm, 57mm, 44mm
      margin: '0 0 0 0',
      copies: 1,
      printerName: printerName,
      timeOutPerLine: 400,
      silent: true,
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

    // Print the receipt
    console.log('📄 Sending', data.length, 'sections to printer...');
    console.log('🔧 Print Options:', JSON.stringify(options, null, 2));
    console.log('📝 First 3 data sections:', JSON.stringify(data.slice(0, 3), null, 2));

    // Use the mainWindow for printing
    try {
      console.log('🔄 Attempting to print with electron-pos-printer...');
      await PosPrinter.print(data, options);
      console.log('🎉 PosPrinter.print() completed successfully');
    } catch (printError) {
      console.error('💥 PosPrinter.print() error:', printError);
      console.error('📚 Error stack:', printError.stack);

      // Log the error type
      if (printError.message) {
        console.error('📝 Error message:', printError.message);
      }
      if (printError.name) {
        console.error('🏷️  Error name:', printError.name);
      }

      throw printError;
    }

    console.log('✅ Receipt printed successfully!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    return {
      success: true,
      message: 'Receipt printed successfully',
    };
  } catch (error) {
    console.error('❌ Error printing receipt:', error.message);
    console.error('Full error:', error);
    console.error('═══════════════════════════════════════════════════════════════\n');

    return {
      success: false,
      error: error.message || 'Failed to print receipt',
      suggestion:
        'Please check printer connection and ensure the printer is set up in Windows Settings > Printers & scanners',
    };
  }
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
    const options = {
      preview: false,
      width: '58mm',
      margin: '0 0 0 0',
      copies: 1,
      printerName: printerName,
      timeOutPerLine: 400,
      silent: true,
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
