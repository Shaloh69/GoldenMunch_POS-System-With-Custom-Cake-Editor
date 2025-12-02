import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CapacityCheck {
  date: string;
  available: boolean;
  currentOrders: number;
  maxOrders: number;
  remainingSlots: number;
}

interface DateAvailability {
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;
  reason?: string;
  currentOrders: number;
  maxOrders: number;
}

class CapacityService {
  /**
   * Check if a date is available for pickup
   */
  async checkDateAvailability(date: string): Promise<CapacityCheck> {
    // First, check if the date exists in capacity table
    const [capacityRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM custom_cake_daily_capacity WHERE capacity_date = ?`,
      [date]
    );

    let maxOrders = 10; // Default capacity
    let currentOrders = 0;
    let isFullyBooked = false;

    if (capacityRows.length > 0) {
      const capacity = capacityRows[0];
      maxOrders = capacity.max_orders;
      currentOrders = capacity.current_orders;
      isFullyBooked = capacity.is_fully_booked;
    } else {
      // If date not in table, count actual orders
      const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM custom_cake_request
         WHERE scheduled_pickup_date = ?
         AND status IN ('approved', 'completed')`,
        [date]
      );
      currentOrders = countRows[0]?.count || 0;
    }

    const remainingSlots = maxOrders - currentOrders;
    const available = !isFullyBooked && remainingSlots > 0;

    return {
      date,
      available,
      currentOrders,
      maxOrders,
      remainingSlots: Math.max(0, remainingSlots),
    };
  }

  /**
   * Reserve a slot for a specific date
   */
  async reserveSlot(date: string): Promise<boolean> {
    const availability = await this.checkDateAvailability(date);

    if (!availability.available) {
      return false;
    }

    // Upsert capacity record
    await pool.query(
      `INSERT INTO custom_cake_daily_capacity
       (capacity_date, current_orders, max_orders, is_fully_booked)
       VALUES (?, 1, 10, FALSE)
       ON DUPLICATE KEY UPDATE
       current_orders = current_orders + 1,
       is_fully_booked = (current_orders + 1 >= max_orders)`,
      [date]
    );

    return true;
  }

  /**
   * Release a slot for a specific date (when order is cancelled)
   */
  async releaseSlot(date: string): Promise<void> {
    await pool.query(
      `UPDATE custom_cake_daily_capacity
       SET current_orders = GREATEST(0, current_orders - 1),
           is_fully_booked = FALSE
       WHERE capacity_date = ?`,
      [date]
    );
  }

  /**
   * Get available dates for the next N days
   */
  async getAvailableDates(daysAhead: number = 30, minDaysNotice: number = 3): Promise<DateAvailability[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + minDaysNotice);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const dates: DateAvailability[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Check if it's a closed day (you can customize this)
      const isClosedDay = false; // Implement your business logic here

      if (isClosedDay) {
        dates.push({
          date: dateStr,
          dayOfWeek,
          isAvailable: false,
          reason: 'Store closed',
          currentOrders: 0,
          maxOrders: 0,
        });
      } else {
        const availability = await this.checkDateAvailability(dateStr);
        dates.push({
          date: dateStr,
          dayOfWeek,
          isAvailable: availability.available,
          reason: availability.available ? undefined : 'Fully booked',
          currentOrders: availability.currentOrders,
          maxOrders: availability.maxOrders,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Set capacity for a specific date
   */
  async setCapacity(date: string, maxOrders: number): Promise<void> {
    await pool.query(
      `INSERT INTO custom_cake_daily_capacity
       (capacity_date, max_orders, current_orders, is_fully_booked)
       VALUES (?, ?, 0, FALSE)
       ON DUPLICATE KEY UPDATE
       max_orders = ?,
       is_fully_booked = (current_orders >= ?)`,
      [date, maxOrders, maxOrders, maxOrders]
    );
  }

  /**
   * Block a specific date (set as unavailable)
   */
  async blockDate(date: string): Promise<void> {
    await pool.query(
      `INSERT INTO custom_cake_daily_capacity
       (capacity_date, max_orders, current_orders, is_fully_booked)
       VALUES (?, 0, 0, TRUE)
       ON DUPLICATE KEY UPDATE
       is_fully_booked = TRUE`,
      [date]
    );
  }

  /**
   * Unblock a specific date
   */
  async unblockDate(date: string): Promise<void> {
    await pool.query(
      `UPDATE custom_cake_daily_capacity
       SET is_fully_booked = FALSE
       WHERE capacity_date = ?`,
      [date]
    );
  }

  /**
   * Get capacity overview for a date range
   */
  async getCapacityOverview(startDate: string, endDate: string): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        capacity_date,
        max_orders,
        current_orders,
        is_fully_booked,
        (max_orders - current_orders) as remaining_slots
       FROM custom_cake_daily_capacity
       WHERE capacity_date BETWEEN ? AND ?
       ORDER BY capacity_date ASC`,
      [startDate, endDate]
    );

    return rows;
  }

  /**
   * Sync capacity table with actual orders
   * This ensures the capacity table reflects reality
   */
  async syncCapacity(): Promise<void> {
    console.log('🔄 Syncing custom cake capacity with actual orders...');

    // Get all dates with scheduled pickups
    const [dates] = await pool.query<RowDataPacket[]>(
      `SELECT
        scheduled_pickup_date,
        COUNT(*) as actual_count
       FROM custom_cake_request
       WHERE scheduled_pickup_date IS NOT NULL
       AND status IN ('approved', 'completed')
       GROUP BY scheduled_pickup_date`
    );

    for (const row of dates) {
      const date = row.scheduled_pickup_date;
      const actualCount = row.actual_count;

      // Update or insert capacity record
      await pool.query(
        `INSERT INTO custom_cake_daily_capacity
         (capacity_date, current_orders, max_orders, is_fully_booked)
         VALUES (?, ?, 10, ?)
         ON DUPLICATE KEY UPDATE
         current_orders = ?,
         is_fully_booked = (? >= max_orders)`,
        [date, actualCount, actualCount >= 10, actualCount, actualCount]
      );
    }

    console.log(`✅ Synced capacity for ${dates.length} dates`);
  }

  /**
   * Calculate minimum preparation days based on cake complexity
   */
  calculatePreparationDays(numLayers: number, hasTheme: boolean, has3DDecorations: boolean): number {
    let days = 2; // Base preparation time

    // More layers = more time
    if (numLayers >= 4) {
      days += 1;
    }
    if (numLayers >= 5) {
      days += 1;
    }

    // Theme cakes need extra time
    if (hasTheme) {
      days += 1;
    }

    // 3D decorations need extra time
    if (has3DDecorations) {
      days += 1;
    }

    return days;
  }

  /**
   * Suggest pickup dates based on preparation time
   */
  async suggestPickupDates(preparationDays: number, count: number = 5): Promise<DateAvailability[]> {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + preparationDays);

    const suggestions: DateAvailability[] = [];
    const currentDate = new Date(minDate);
    let attempts = 0;
    const maxAttempts = 60; // Look up to 60 days ahead

    while (suggestions.length < count && attempts < maxAttempts) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

      const availability = await this.checkDateAvailability(dateStr);

      if (availability.available) {
        suggestions.push({
          date: dateStr,
          dayOfWeek,
          isAvailable: true,
          currentOrders: availability.currentOrders,
          maxOrders: availability.maxOrders,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
      attempts++;
    }

    return suggestions;
  }
}

// Export singleton instance
export const capacityService = new CapacityService();
