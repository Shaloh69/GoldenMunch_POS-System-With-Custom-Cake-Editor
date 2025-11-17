import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error.middleware';

// ENUM definitions (must match database schema)
export const ENUMS = {
  item_type: ['cake', 'pastry', 'beverage', 'snack', 'main_dish', 'appetizer', 'dessert', 'bread', 'other'],
  unit_of_measure: ['piece', 'dozen', 'half_dozen', 'kilogram', 'gram', 'liter', 'milliliter', 'serving', 'box', 'pack'],
  menu_status: ['available', 'sold_out', 'discontinued'],
  price_type: ['regular', 'promotion', 'seasonal', 'bulk'],
  promotion_type: ['percentage', 'fixed_amount', 'buy_x_get_y', 'bundle', 'seasonal'],
  tax_type: ['percentage', 'fixed'],
  frosting_type: ['buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese'],
  design_complexity: ['simple', 'moderate', 'complex', 'intricate'],
  order_type: ['walk_in', 'pickup', 'pre_order', 'custom_order'],
  order_source: ['kiosk', 'cashier', 'admin'],
  payment_method: ['cash', 'gcash', 'paymaya', 'card', 'bank_transfer'],
  payment_status: ['pending', 'partial_paid', 'paid', 'failed', 'refunded'],
  order_status: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
  refund_type: ['full', 'partial', 'item'],
  refund_reason: ['customer_request', 'wrong_item', 'quality_issue', 'delay', 'cancellation', 'other'],
  refund_method: ['cash', 'gcash', 'paymaya', 'card', 'bank_transfer', 'store_credit'],
  refund_status: ['pending', 'approved', 'rejected', 'completed'],
  feedback_type: ['positive', 'neutral', 'negative'],
  transaction_type: ['in', 'out', 'adjustment', 'return', 'waste', 'transfer'],
  waste_reason: ['expired', 'damaged', 'overproduction', 'quality_issue', 'customer_return', 'other'],
  alert_type: ['low_stock', 'out_of_stock', 'expiring_soon', 'overstocked'],
  change_reason: ['order_placed', 'daily_decay', 'system_recalculation', 'manual_adjustment'],
} as const;

// ENUM validation function
export const validateEnum = (value: string, enumType: keyof typeof ENUMS, fieldName: string): void => {
  const validValues = ENUMS[enumType];
  if (!validValues.includes(value as any)) {
    throw new AppError(
      `Invalid ${fieldName}: '${value}'. Must be one of: ${validValues.join(', ')}`,
      400
    );
  }
};

// ENUM validation middleware factory
export const validateEnumField = (fieldName: string, enumType: keyof typeof ENUMS, required: boolean = false) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const value = req.body[fieldName];

    if (!value) {
      if (required) {
        return next(new AppError(`${fieldName} is required`, 400));
      }
      return next();
    }

    try {
      validateEnum(value, enumType, fieldName);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validation schemas
export const schemas = {
  // Auth schemas
  adminLogin: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  cashierLogin: Joi.object({
    cashier_code: Joi.string().required(),
    pin: Joi.string().length(4).required(),
  }),

  // Order schemas
  createOrder: Joi.object({
    customer_id: Joi.number().optional(),
    order_type: Joi.string()
      .valid('walk_in', 'pickup', 'pre_order', 'custom_order')
      .required(),
    order_source: Joi.string()
      .valid('kiosk', 'cashier', 'admin')
      .default('kiosk'),
    scheduled_pickup_datetime: Joi.date().optional(),
    payment_method: Joi.string()
      .valid('cash', 'gcash', 'paymaya', 'card', 'bank_transfer')
      .required(),
    special_instructions: Joi.string().optional().allow(''),
    kiosk_session_id: Joi.string().optional(),
    items: Joi.array()
      .items(
        Joi.object({
          menu_item_id: Joi.number().required(),
          quantity: Joi.number().min(1).required(),
          flavor_id: Joi.number().optional(),
          size_id: Joi.number().optional(),
          special_instructions: Joi.string().optional().allow(''),
          custom_cake_design: Joi.object({
            theme_id: Joi.number().optional(),
            frosting_color: Joi.string().optional(),
            frosting_type: Joi.string()
              .valid('buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese')
              .required(),
            decoration_details: Joi.string().optional().allow(''),
            cake_text: Joi.string().optional().allow(''),
            special_instructions: Joi.string().optional().allow(''),
            design_complexity: Joi.string()
              .valid('simple', 'moderate', 'complex', 'intricate')
              .required(),
          }).optional(),
        })
      )
      .min(1)
      .required(),
  }),

  verifyPayment: Joi.object({
    order_id: Joi.number().required(),
    reference_number: Joi.string().required(),
    payment_method: Joi.string()
      .valid('gcash', 'paymaya', 'card')
      .required(),
  }),

  verifyOrder: Joi.object({
    verification_code: Joi.string().length(6).required(),
  }),

  // Menu item schemas
  createMenuItem: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional().allow(''),
    item_type: Joi.string()
      .valid('cake', 'pastry', 'beverage', 'snack', 'main_dish', 'appetizer', 'dessert', 'bread', 'other')
      .required(),
    unit_of_measure: Joi.string()
      .valid('piece', 'dozen', 'half_dozen', 'kilogram', 'gram', 'liter', 'milliliter', 'serving', 'box', 'pack')
      .default('piece'),
    stock_quantity: Joi.number().min(0).default(0),
    is_infinite_stock: Joi.boolean().default(false),
    min_stock_level: Joi.number().min(0).default(5),
    can_customize: Joi.boolean().default(false),
    can_preorder: Joi.boolean().default(false),
    preparation_time_minutes: Joi.number().min(0).default(0),
    supplier_id: Joi.number().optional(),
    is_featured: Joi.boolean().default(false),
    allergen_info: Joi.string().optional().allow(''),
    nutritional_info: Joi.string().optional().allow(''),
  }),

  updateMenuItem: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional().allow(''),
    item_type: Joi.string()
      .valid('cake', 'pastry', 'beverage', 'snack', 'main_dish', 'appetizer', 'dessert', 'bread', 'other')
      .optional(),
    stock_quantity: Joi.number().min(0).optional(),
    status: Joi.string()
      .valid('available', 'sold_out', 'discontinued')
      .optional(),
    is_featured: Joi.boolean().optional(),
  }),

  // Feedback schema
  createFeedback: Joi.object({
    order_id: Joi.number().required(),
    rating: Joi.number().min(1).max(5).required(),
    service_rating: Joi.number().min(1).max(5).optional(),
    food_rating: Joi.number().min(1).max(5).optional(),
    cleanliness_rating: Joi.number().min(1).max(5).optional(),
    feedback_text: Joi.string().optional().allow(''),
    is_anonymous: Joi.boolean().default(false),
  }),

  // Customer schema
  createCustomer: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    phone: Joi.string().pattern(/^(\+63|0)?9\d{9}$/).required(),
    email: Joi.string().email().optional(),
    date_of_birth: Joi.date().optional(),
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
  }),
};

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    req.query = value;
    next();
  };
};
