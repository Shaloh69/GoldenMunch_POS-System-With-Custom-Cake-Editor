const escpos = require('escpos');
// Install escpos-usb adapter
escpos.USB = require('escpos-usb');

/**
 * Get printer status
 * @param {string} printerName - Name of the printer to check
 * @returns {Promise<{available: boolean, connected: boolean, config: any}>}
 */
async function getStatus(printerName = 'POS-58') {
  try {
    // Try to find USB printer devices
    const devices = escpos.USB.findPrinter();

    if (!devices || devices.length === 0) {
      return {
        available: false,
        connected: false,
        config: {
          printerName: printerName,
          error: 'No USB printers detected. Please check connection.',
        },
      };
    }

    // For POS-58, we typically look for the first available thermal printer
    const device = devices[0];

    return {
      available: true,
      connected: true,
      config: {
        printerName: printerName,
        name: printerName,
        vendorId: device.deviceDescriptor?.idVendor,
        productId: device.deviceDescriptor?.idProduct,
        deviceCount: devices.length,
      },
    };
  } catch (error) {
    console.error('Error checking printer status:', error);
    return {
      available: false,
      connected: false,
      config: {
        printerName: printerName,
        error: error.message || 'Failed to detect printer',
        suggestion: 'Please ensure printer is connected and drivers are installed',
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
    const devices = escpos.USB.findPrinter();
    if (!devices || devices.length === 0) {
      return [];
    }

    return devices.map((device, index) => {
      const vendorId = device.deviceDescriptor?.idVendor;
      const productId = device.deviceDescriptor?.idProduct;
      return `USB Printer ${index + 1} (VID: ${vendorId}, PID: ${productId})`;
    });
  } catch (error) {
    console.error('Error getting available printers:', error);
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
  let device = null;
  try {
    const devices = escpos.USB.findPrinter();
    if (!devices || devices.length === 0) {
      throw new Error('No printer found. Please check USB connection.');
    }

    // Create USB device - alpha version uses direct device object
    device = new escpos.USB();

    // Open device with promise-based approach for alpha version
    await new Promise((resolve, reject) => {
      device.open((err) => {
        if (err) {
          reject(new Error(`Failed to open printer: ${err.message}`));
        } else {
          resolve();
        }
      });
    });

    const printer = new escpos.Printer(device);

    // Print header
    printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(2, 2)
      .text('GOLDENMUNCH')
      .size(1, 1)
      .style('normal')
      .text('Order Receipt')
      .text('--------------------------------')
      .align('lt')
      .text('');

    // Order info
    printer
      .text(`Order #: ${receiptData.orderNumber}`)
      .text(`Date: ${receiptData.orderDate}`)
      .text('--------------------------------');

    // Customer info
    if (receiptData.customerName) {
      printer.text(`Customer: ${receiptData.customerName}`);
    }
    if (receiptData.verificationCode) {
      printer.text(`Code: ${receiptData.verificationCode}`);
    }
    printer.text('');

    // Items
    printer.text('ITEMS:').text('--------------------------------');

    receiptData.items.forEach((item) => {
      const itemName = item.name.substring(0, 20); // Limit length
      const qty = `x${item.quantity}`;
      const price = `₱${(item.price * item.quantity).toFixed(2)}`;

      // Item name and total
      printer.text(`${itemName}`);

      // Quantity and price on next line, right aligned
      const qtyPriceLine = `  ${qty}    ${price}`;
      printer.align('rt').text(qtyPriceLine).align('lt');

      if (item.specialInstructions) {
        printer.text(`  Note: ${item.specialInstructions}`);
      }
    });

    printer.text('--------------------------------');

    // Totals
    printer
      .align('rt')
      .text(`Subtotal: ₱${receiptData.subtotal.toFixed(2)}`)
      .text(`Tax: ₱${receiptData.tax.toFixed(2)}`);

    if (receiptData.discount > 0) {
      printer.text(`Discount: -₱${receiptData.discount.toFixed(2)}`);
    }

    printer
      .style('bu')
      .size(1, 2)
      .text(`TOTAL: ₱${receiptData.total.toFixed(2)}`)
      .size(1, 1)
      .style('normal');

    printer.text('--------------------------------').align('lt');

    // Payment method
    printer.text(`Payment: ${receiptData.paymentMethod}`).text('');

    // Special instructions
    if (receiptData.specialInstructions) {
      printer
        .text('SPECIAL INSTRUCTIONS:')
        .text(receiptData.specialInstructions)
        .text('');
    }

    // Footer
    printer
      .align('ct')
      .text('Thank you for your order!')
      .text('Please come again')
      .text('')
      .text('')
      .text('');

    // Cut paper and close
    printer.cut();

    // Close device properly
    await new Promise((resolve) => {
      printer.close(() => {
        resolve();
      });
    });

    return {
      success: true,
      message: 'Receipt printed successfully',
    };
  } catch (error) {
    console.error('Error printing receipt:', error);

    // Try to close device if it was opened
    if (device) {
      try {
        device.close();
      } catch (closeError) {
        console.error('Error closing device:', closeError);
      }
    }

    return {
      success: false,
      error: error.message || 'Failed to print receipt',
      suggestion: 'Please check printer connection and ensure POS-58 is properly connected via USB',
    };
  }
}

/**
 * Print test receipt
 * @param {string} printerName - Name of printer to use
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function printTest(printerName) {
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
    tax: 42.00,
    discount: 0,
    total: 391.97,
    paymentMethod: 'Cash',
    customerName: 'Test Customer',
    verificationCode: '1234',
  };

  return printReceipt(printerName, testData);
}

/**
 * Print daily sales report
 * @param {string} printerName - Name of printer to use
 * @param {Object} reportData - Report data
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function printDailyReport(printerName, reportData) {
  let device = null;
  try {
    const devices = escpos.USB.findPrinter();
    if (!devices || devices.length === 0) {
      throw new Error('No printer found. Please check USB connection.');
    }

    // Create USB device - alpha version uses direct device object
    device = new escpos.USB();

    // Open device with promise-based approach for alpha version
    await new Promise((resolve, reject) => {
      device.open((err) => {
        if (err) {
          reject(new Error(`Failed to open printer: ${err.message}`));
        } else {
          resolve();
        }
      });
    });

    const printer = new escpos.Printer(device);

    // Print header
    printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(2, 2)
      .text('GOLDENMUNCH')
      .size(1, 1)
      .style('normal')
      .text('Daily Sales Report')
      .text('--------------------------------')
      .align('lt')
      .text('');

    // Report date
    printer
      .text(`Date: ${reportData.date}`)
      .text('--------------------------------')
      .text('');

    // Summary
    printer
      .text('SUMMARY:')
      .text(`Total Orders: ${reportData.totalOrders}`)
      .align('rt')
      .style('bu')
      .size(1, 2)
      .text(`Total Sales: ₱${reportData.totalSales.toFixed(2)}`)
      .size(1, 1)
      .style('normal')
      .align('lt')
      .text('--------------------------------')
      .text('');

    // Payment breakdown
    printer.text('PAYMENT BREAKDOWN:');
    Object.entries(reportData.paymentBreakdown).forEach(([method, amount]) => {
      const methodText = method.padEnd(15);
      printer.text(`${methodText} ₱${amount.toFixed(2)}`);
    });
    printer.text('--------------------------------').text('');

    // Top items
    if (reportData.topItems && reportData.topItems.length > 0) {
      printer.text('TOP ITEMS:');
      reportData.topItems.forEach((item, index) => {
        printer.text(`${index + 1}. ${item.name} (${item.quantity}x)`);
      });
      printer.text('');
    }

    // Footer
    printer
      .align('ct')
      .text('End of Report')
      .text('')
      .text('')
      .text('');

    // Cut paper
    printer.cut();

    // Close device properly
    await new Promise((resolve) => {
      printer.close(() => {
        resolve();
      });
    });

    return {
      success: true,
      message: 'Report printed successfully',
    };
  } catch (error) {
    console.error('Error printing report:', error);

    // Try to close device if it was opened
    if (device) {
      try {
        device.close();
      } catch (closeError) {
        console.error('Error closing device:', closeError);
      }
    }

    return {
      success: false,
      error: error.message || 'Failed to print report',
      suggestion: 'Please check printer connection and ensure POS-58 is properly connected via USB',
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
