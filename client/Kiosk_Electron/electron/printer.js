const escpos = require('escpos');
const { SerialPort } = require('serialport');

/**
 * Thermal Printer Service for POS Receipt Printing
 * Supports USB and Network thermal printers (ESC/POS protocol)
 */
class ThermalPrinterService {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      type: config.type || 'usb', // 'usb', 'network', 'serial'

      // USB configuration
      vid: config.vid || 0x0416, // Common vendor ID (change for your printer)
      pid: config.pid || 0x5011, // Common product ID (change for your printer)

      // Network configuration
      address: config.address || '192.168.1.100',
      port: config.port || 9100,

      // Serial configuration
      serialPath: config.serialPath || '/dev/ttyUSB0',
      baudRate: config.baudRate || 9600,

      // Printer settings
      width: config.width || 48, // Characters per line (48 for 80mm, 32 for 58mm)
      encoding: config.encoding || 'GB18030', // Character encoding

      ...config
    };

    this.device = null;
    this.printer = null;
  }

  /**
   * Initialize printer connection
   */
  async connect() {
    try {
      if (this.config.type === 'usb') {
        // USB Printer
        try {
          const USB = require('escpos-usb');
          escpos.USB = USB;
          this.device = new escpos.USB(this.config.vid, this.config.pid);
        } catch (usbError) {
          throw new Error(`USB adapter not available: ${usbError.message}. Please install 'escpos-usb' package.`);
        }
      } else if (this.config.type === 'network') {
        // Network Printer
        try {
          const Network = require('escpos-network');
          escpos.Network = Network;
          this.device = new escpos.Network(this.config.address, this.config.port);
        } catch (netError) {
          throw new Error(`Network adapter not available: ${netError.message}. Please install 'escpos-network' package.`);
        }
      } else if (this.config.type === 'serial') {
        // Serial Port Printer
        try {
          const Serial = require('escpos-serialport');
          escpos.Serial = Serial;
          const serialAdapter = new SerialPort({
            path: this.config.serialPath,
            baudRate: this.config.baudRate,
            autoOpen: false
          });
          this.device = new escpos.Serial(serialAdapter);
        } catch (serialError) {
          throw new Error(`Serial adapter not available: ${serialError.message}. Please install 'escpos-serialport' package.`);
        }
      }

      if (!this.device) {
        throw new Error('No printer device configured. Please check printer configuration.');
      }

      this.printer = new escpos.Printer(this.device, {
        encoding: this.config.encoding,
        width: this.config.width
      });

      return new Promise((resolve, reject) => {
        try {
          this.device.open((error) => {
            if (error) {
              console.error('Failed to connect to printer:', error);
              reject(new Error(`Printer connection failed: ${error.message}. Check USB cable and printer power.`));
            } else {
              console.log('Printer connected successfully');
              resolve(true);
            }
          });
        } catch (openError) {
          reject(new Error(`Failed to open printer device: ${openError.message}`));
        }
      });
    } catch (error) {
      console.error('Error connecting to printer:', error);
      throw error;
    }
  }

  /**
   * Print a test receipt
   */
  async printTest() {
    if (!this.printer) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      try {
        this.printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text('=== TEST PRINT ===')
          .text('')
          .style('normal')
          .text('Printer is working correctly!')
          .text('')
          .text(new Date().toLocaleString())
          .text('')
          .cut()
          .close(() => {
            console.log('Test receipt printed');
            resolve(true);
          });
      } catch (error) {
        console.error('Error printing test receipt:', error);
        reject(error);
      }
    });
  }

  /**
   * Print order receipt
   * @param {Object} orderData - Order information
   */
  async printReceipt(orderData) {
    if (!this.printer) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      try {
        const {
          orderNumber,
          orderDate,
          items,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod,
          verificationCode,
          customerName,
          specialInstructions,
          referenceNumber
        } = orderData;

        // Header
        this.printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text('GOLDENMUNCH')
          .size(1, 1)
          .style('normal')
          .text('');

        // Order Info
        this.printer
          .align('lt')
          .text(this.padText('Order #:', orderNumber))
          .text(this.padText('Date:', orderDate))
          .text(this.padText('Time:', new Date().toLocaleTimeString()));

        if (customerName) {
          this.printer.text(this.padText('Customer:', customerName));
        }

        if (verificationCode) {
          this.printer
            .text('')
            .align('ct')
            .style('b')
            .size(1, 1)
            .text('Verification Code:')
            .size(2, 2)
            .text(verificationCode)
            .size(1, 1)
            .style('normal')
            .text('');
        }

        // Items
        this.printer
          .align('lt')
          .text(this.line())
          .text(this.padColumns(['Item', 'Qty', 'Price']))
          .text(this.line());

        items.forEach(item => {
          const itemName = this.truncate(item.name, 20);
          const quantity = `x${item.quantity}`;
          const price = this.formatPrice(item.price * item.quantity);

          this.printer.text(this.padColumns([itemName, quantity, price]));

          // Special instructions for item
          if (item.specialInstructions) {
            this.printer
              .font('b')
              .text(`  * ${this.truncate(item.specialInstructions, 40)}`)
              .font('a');
          }
        });

        // Totals
        this.printer
          .text(this.line())
          .text(this.padText('Subtotal:', this.formatPrice(subtotal)));

        if (discount > 0) {
          this.printer.text(this.padText('Discount:', `-${this.formatPrice(discount)}`));
        }

        this.printer
          .text(this.line())
          .style('b')
          .size(1, 1)
          .text(this.padText('TOTAL:', this.formatPrice(total)))
          .style('normal')
          .size(1, 1)
          .text(this.line());

        // Payment Info
        this.printer
          .text(this.padText('Payment:', paymentMethod.toUpperCase()));

        // Reference Number for GCash/PayPal/Maya
        if (referenceNumber && (paymentMethod.toLowerCase() === 'gcash' ||
                                 paymentMethod.toLowerCase() === 'maya' ||
                                 paymentMethod.toLowerCase() === 'paypal')) {
          this.printer
            .text(this.padText('Reference #:', referenceNumber));
        }

        this.printer.text('');

        // Special Instructions
        if (specialInstructions) {
          this.printer
            .text('Special Instructions:')
            .text(this.wrapText(specialInstructions, this.config.width))
            .text('');
        }

        // Footer - Simple cut
        this.printer
          .text('')
          .cut()
          .close(() => {
            console.log('Receipt printed successfully');
            resolve(true);
          });
      } catch (error) {
        console.error('Error printing receipt:', error);
        reject(error);
      }
    });
  }

  /**
   * Print daily sales report
   */
  async printDailyReport(reportData) {
    if (!this.printer) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      try {
        const { date, totalOrders, totalSales, paymentBreakdown, topItems } = reportData;

        this.printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text('DAILY SALES REPORT')
          .style('normal')
          .text('')
          .text(date)
          .text('')
          .align('lt')
          .text(this.line())
          .text(this.padText('Total Orders:', totalOrders))
          .text(this.padText('Total Sales:', this.formatPrice(totalSales)))
          .text(this.line())
          .text('Payment Breakdown:')
          .text('');

        Object.entries(paymentBreakdown).forEach(([method, amount]) => {
          this.printer.text(this.padText(`  ${method}:`, this.formatPrice(amount)));
        });

        this.printer
          .text('')
          .text(this.line())
          .text('Top 5 Items:')
          .text('');

        topItems.forEach((item, index) => {
          this.printer.text(`${index + 1}. ${item.name} (${item.quantity} sold)`);
        });

        this.printer
          .text('')
          .text(this.line())
          .align('ct')
          .text('End of Report')
          .text('')
          .cut()
          .close(() => {
            console.log('Daily report printed');
            resolve(true);
          });
      } catch (error) {
        console.error('Error printing report:', error);
        reject(error);
      }
    });
  }

  /**
   * Helper: Format price
   */
  formatPrice(amount) {
    return `₱${parseFloat(amount).toFixed(2)}`;
  }

  /**
   * Helper: Pad text to fit width
   */
  padText(label, value) {
    const totalWidth = this.config.width;
    const combined = label + value;
    if (combined.length >= totalWidth) {
      return combined.substring(0, totalWidth);
    }
    const padding = ' '.repeat(totalWidth - combined.length);
    return label + padding + value;
  }

  /**
   * Helper: Pad columns
   */
  padColumns(columns) {
    const widths = [20, 8, 15]; // Adjust based on your needs
    let line = '';
    columns.forEach((col, i) => {
      const width = widths[i] || 10;
      const text = String(col || '').substring(0, width);
      line += text.padEnd(width, ' ');
    });
    return line.substring(0, this.config.width);
  }

  /**
   * Helper: Create line separator
   */
  line() {
    return '-'.repeat(this.config.width);
  }

  /**
   * Helper: Truncate text
   */
  truncate(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  /**
   * Helper: Wrap text to width
   */
  wrapText(text, width) {
    if (!text) return '';
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length > width) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });

    if (currentLine) {
      lines.push(currentLine.trim());
    }

    return lines.join('\n');
  }

  /**
   * Disconnect printer
   */
  disconnect() {
    if (this.device) {
      this.device.close();
      this.device = null;
      this.printer = null;
      console.log('Printer disconnected');
    }
  }
}

module.exports = ThermalPrinterService;
