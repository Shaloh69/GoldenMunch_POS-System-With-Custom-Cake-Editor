import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { capacityService } from '../services/capacity.service';

/**
 * Get available dates for the next N days
 * GET /api/admin/capacity/available-dates
 */
export const getAvailableDates = async (req: AuthRequest, res: Response) => {
  const daysAhead = parseInt(req.query.days as string) || 30;
  const minDaysNotice = parseInt(req.query.minDays as string) || 3;

  const dates = await capacityService.getAvailableDates(daysAhead, minDaysNotice);

  res.json(successResponse('Available dates retrieved', dates));
};

/**
 * Check capacity for a specific date
 * GET /api/admin/capacity/check/:date
 */
export const checkDateCapacity = async (req: AuthRequest, res: Response) => {
  const { date } = req.params;

  const availability = await capacityService.checkDateAvailability(date);

  res.json(successResponse('Date capacity retrieved', availability));
};

/**
 * Set capacity for a specific date
 * POST /api/admin/capacity/set
 */
export const setDateCapacity = async (req: AuthRequest, res: Response) => {
  const { date, maxOrders } = req.body;

  if (!date || !maxOrders) {
    throw new AppError('Date and maxOrders are required', 400);
  }

  if (maxOrders < 0 || maxOrders > 50) {
    throw new AppError('Max orders must be between 0 and 50', 400);
  }

  await capacityService.setCapacity(date, maxOrders);

  res.json(successResponse('Capacity set successfully'));
};

/**
 * Block a specific date (make unavailable)
 * POST /api/admin/capacity/block
 */
export const blockDate = async (req: AuthRequest, res: Response) => {
  const { date } = req.body;

  if (!date) {
    throw new AppError('Date is required', 400);
  }

  await capacityService.blockDate(date);

  res.json(successResponse('Date blocked successfully'));
};

/**
 * Unblock a specific date
 * POST /api/admin/capacity/unblock
 */
export const unblockDate = async (req: AuthRequest, res: Response) => {
  const { date } = req.body;

  if (!date) {
    throw new AppError('Date is required', 400);
  }

  await capacityService.unblockDate(date);

  res.json(successResponse('Date unblocked successfully'));
};

/**
 * Get capacity overview for a date range
 * GET /api/admin/capacity/overview
 */
export const getCapacityOverview = async (req: AuthRequest, res: Response) => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }

  const overview = await capacityService.getCapacityOverview(startDate, endDate);

  res.json(successResponse('Capacity overview retrieved', overview));
};

/**
 * Sync capacity with actual orders
 * POST /api/admin/capacity/sync
 */
export const syncCapacity = async (req: AuthRequest, res: Response) => {
  await capacityService.syncCapacity();

  res.json(successResponse('Capacity synced successfully'));
};

/**
 * Suggest pickup dates based on preparation time
 * GET /api/capacity/suggest
 */
export const suggestPickupDates = async (req: AuthRequest, res: Response) => {
  const preparationDays = parseInt(req.query.preparationDays as string) || 3;
  const count = parseInt(req.query.count as string) || 5;

  const suggestions = await capacityService.suggestPickupDates(preparationDays, count);

  res.json(successResponse('Suggested dates retrieved', suggestions));
};

/**
 * Calculate preparation days based on cake details
 * POST /api/capacity/calculate-prep-days
 */
export const calculatePreparationDays = async (req: AuthRequest, res: Response) => {
  const { numLayers, hasTheme, has3DDecorations } = req.body;

  if (numLayers === undefined) {
    throw new AppError('numLayers is required', 400);
  }

  const days = capacityService.calculatePreparationDays(
    numLayers,
    hasTheme || false,
    has3DDecorations || false
  );

  res.json(successResponse('Preparation days calculated', { preparationDays: days }));
};
