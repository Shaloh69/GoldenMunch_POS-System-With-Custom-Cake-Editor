import { Request } from 'express';

// Enums based on database schema
export enum ItemType {
  CAKE = 'cake',
  PASTRY = 'pastry',
  BEVERAGE = 'beverage',
  SNACK = 'snack',
  MAIN_DISH = 'main_dish',
  APPETIZER = 'appetizer',
  DESSERT = 'dessert',
  BREAD = 'bread',
  OTHER = 'other'
}

export enum UnitOfMeasure {
  PIECE = 'piece',
  DOZEN = 'dozen',
  HALF_DOZEN = 'half_dozen',
  KILOGRAM = 'kilogram',
  GRAM = 'gram',
  LITER = 'liter',
  MILLILITER = 'milliliter',
  SERVING = 'serving',
  BOX = 'box',
  PACK = 'pack'
}

export enum ItemStatus {
  AVAILABLE = 'available',
  SOLD_OUT = 'sold_out',
  DISCONTINUED = 'discontinued'
}

export enum PriceType {
  REGULAR = 'regular',
  PROMOTION = 'promotion',
  SEASONAL = 'seasonal',
  BULK = 'bulk'
}

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
  BUNDLE = 'bundle',
  SEASONAL = 'seasonal'
}

export enum TaxType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export enum FrostingType {
  BUTTERCREAM = 'buttercream',
  FONDANT = 'fondant',
  WHIPPED_CREAM = 'whipped_cream',
  GANACHE = 'ganache',
  CREAM_CHEESE = 'cream_cheese'
}

export enum DesignComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  INTRICATE = 'intricate'
}

export enum OrderType {
  WALK_IN = 'walk_in',
  PICKUP = 'pickup',
  PRE_ORDER = 'pre_order',
  CUSTOM_ORDER = 'custom_order'
}

export enum OrderSource {
  KIOSK = 'kiosk',
  CASHIER = 'cashier',
  ADMIN = 'admin'
}

export enum PaymentMethod {
  CASH = 'cash',
  GCASH = 'gcash',
  PAYMAYA = 'paymaya',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL_PAID = 'partial_paid',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentTransactionStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RefundType {
  FULL = 'full',
  PARTIAL = 'partial',
  ITEM = 'item'
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'customer_request',
  WRONG_ITEM = 'wrong_item',
  QUALITY_ISSUE = 'quality_issue',
  DELAY = 'delay',
  CANCELLATION = 'cancellation',
  OTHER = 'other'
}

export enum RefundMethod {
  CASH = 'cash',
  GCASH = 'gcash',
  PAYMAYA = 'paymaya',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  STORE_CREDIT = 'store_credit'
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

export enum FeedbackType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

export enum TransactionType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  WASTE = 'waste',
  TRANSFER = 'transfer'
}

export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRING_SOON = 'expiring_soon',
  OVERSTOCKED = 'overstocked'
}

export enum WasteReason {
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
  OVERPRODUCTION = 'overproduction',
  QUALITY_ISSUE = 'quality_issue',
  CUSTOMER_RETURN = 'customer_return',
  OTHER = 'other'
}

export enum ChangeReason {
  ORDER_PLACED = 'order_placed',
  DAILY_DECAY = 'daily_decay',
  SYSTEM_RECALCULATION = 'system_recalculation',
  MANUAL_ADJUSTMENT = 'manual_adjustment'
}

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json'
}

// Database Models
export interface Role {
  role_id: number;
  role_name: string;
  description: string | null;
  created_at: Date;
}

export interface Admin {
  admin_id: number;
  username: string;
  password_hash: string;
  name: string;
  email: string;
  role_id: number;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Cashier {
  cashier_id: number;
  name: string;
  cashier_code: string;
  pin_hash: string;
  phone: string | null;
  email: string | null;
  hire_date: Date | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  category_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  admin_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItem {
  menu_item_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  item_type: ItemType;
  unit_of_measure: UnitOfMeasure;
  stock_quantity: number;
  is_infinite_stock: boolean;
  min_stock_level: number;
  status: ItemStatus;
  can_customize: boolean;
  can_preorder: boolean;
  preparation_time_minutes: number;
  popularity_score: number;
  total_orders: number;
  total_quantity_sold: number;
  last_ordered_date: Date | null;
  supplier_id: number | null;
  is_featured: boolean;
  allergen_info: string | null;
  nutritional_info: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItemPrice {
  price_id: number;
  menu_item_id: number;
  price: number;
  start_date: Date;
  end_date: Date;
  price_type: PriceType;
  is_active: boolean;
  created_by: number;
  created_at: Date;
}

export interface PromotionRule {
  promotion_id: number;
  promotion_name: string;
  description: string | null;
  promotion_type: PromotionType;
  discount_percentage: number;
  discount_amount: number;
  min_purchase_amount: number;
  min_quantity: number;
  buy_quantity: number;
  get_quantity: number;
  start_date: Date;
  end_date: Date;
  start_time: string;
  end_time: string;
  max_uses_per_customer: number | null;
  total_usage_limit: number | null;
  current_usage_count: number;
  is_active: boolean;
  is_stackable: boolean;
  display_on_kiosk: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaxRule {
  tax_id: number;
  tax_name: string;
  tax_type: TaxType;
  tax_rate: number;
  fixed_amount: number;
  is_inclusive: boolean;
  apply_to_item_types: string | null;
  is_active: boolean;
  effective_date: Date;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface CakeFlavor {
  flavor_id: number;
  flavor_name: string;
  description: string | null;
  image_url: string | null;
  additional_cost: number;
  is_available: boolean;
  display_order: number;
  created_at: Date;
}

export interface CakeSize {
  size_id: number;
  size_name: string;
  description: string | null;
  serves_people: number | null;
  diameter_inches: number | null;
  size_multiplier: number;
  is_available: boolean;
  display_order: number;
  created_at: Date;
}

export interface CustomCakeTheme {
  theme_id: number;
  theme_name: string;
  description: string | null;
  theme_image_url: string | null;
  base_additional_cost: number;
  preparation_days: number;
  is_available: boolean;
  display_order: number;
  created_at: Date;
}

export interface CustomCakeDesign {
  design_id: number;
  theme_id: number | null;
  frosting_color: string | null;
  frosting_type: FrostingType;
  decoration_details: string | null;
  cake_text: string | null;
  special_instructions: string | null;
  design_complexity: DesignComplexity;
  additional_cost: number;
  created_at: Date;
}

export interface CustomCakeDailyCapacity {
  capacity_id: number;
  capacity_date: Date;
  max_simple_cakes: number;
  max_moderate_cakes: number;
  max_complex_cakes: number;
  max_intricate_cakes: number;
  current_simple_count: number;
  current_moderate_count: number;
  current_complex_count: number;
  current_intricate_count: number;
  is_available: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  customer_id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: Date | null;
  loyalty_points: number;
  total_orders: number;
  total_spent: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerOrder {
  order_id: number;
  order_number: string;
  verification_code: string;
  customer_id: number | null;
  order_datetime: Date;
  scheduled_pickup_datetime: Date | null;
  actual_pickup_datetime: Date | null;
  order_type: OrderType;
  order_source: OrderSource;
  is_preorder: boolean;
  advance_payment_required: boolean;
  advance_payment_amount: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  cashier_id: number | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  gcash_reference_number: string | null;
  paymaya_reference_number: string | null;
  card_transaction_ref: string | null;
  payment_verified_at: Date | null;
  payment_verified_by: number | null;
  is_printed: boolean;
  special_instructions: string | null;
  kiosk_session_id: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  menu_item_id: number;
  custom_cake_design_id: number | null;
  flavor_id: number | null;
  size_id: number | null;
  quantity: number;
  unit_price: number;
  flavor_cost: number;
  size_multiplier: number;
  design_cost: number;
  item_total: number;
  special_instructions: string | null;
  created_at: Date;
}

export interface PaymentTransaction {
  transaction_id: number;
  order_id: number;
  payment_method: PaymentMethod;
  amount: number;
  reference_number: string | null;
  payment_status: PaymentTransactionStatus;
  verified_by: number | null;
  verified_at: Date | null;
  payment_notes: string | null;
  created_at: Date;
}

export interface RefundRequest {
  refund_id: number;
  order_id: number;
  order_item_id: number | null;
  refund_type: RefundType;
  refund_amount: number;
  refund_reason: RefundReason;
  reason_details: string | null;
  refund_method: RefundMethod;
  requested_by: number;
  approved_by: number | null;
  refund_status: RefundStatus;
  processed_at: Date | null;
  reference_number: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerFeedback {
  feedback_id: number;
  order_id: number;
  customer_id: number | null;
  rating: number;
  service_rating: number | null;
  food_rating: number | null;
  cleanliness_rating: number | null;
  feedback_text: string | null;
  feedback_type: FeedbackType;
  is_anonymous: boolean;
  responded_by: number | null;
  response_text: string | null;
  responded_at: Date | null;
  created_at: Date;
}

export interface InventoryTransaction {
  transaction_id: number;
  menu_item_id: number;
  transaction_type: TransactionType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason_id: number | null;
  notes: string | null;
  reference_number: string | null;
  performed_by: number;
  created_at: Date;
}

export interface InventoryAlert {
  alert_id: number;
  menu_item_id: number;
  alert_type: AlertType;
  alert_message: string | null;
  threshold_value: number | null;
  current_value: number | null;
  is_acknowledged: boolean;
  acknowledged_by: number | null;
  acknowledged_at: Date | null;
  created_at: Date;
}

export interface WasteTracking {
  waste_id: number;
  menu_item_id: number;
  quantity_wasted: number;
  waste_reason: WasteReason;
  waste_cost: number;
  reason_details: string | null;
  reported_by: number;
  waste_date: Date;
  created_at: Date;
}

export interface KioskSettings {
  setting_id: number;
  setting_key: string;
  setting_value: string;
  setting_type: SettingType;
  description: string | null;
  updated_by: number;
  updated_at: Date;
}

export interface KioskSession {
  session_id: string;
  session_start: Date;
  session_end: Date | null;
  total_orders: number;
  session_duration_minutes: number;
  last_activity: Date;
}

export interface CategoryHasMenuItem {
  category_id: number;
  menu_item_id: number;
  display_order: number;
  created_at: Date;
}

export interface PromotionApplicableItem {
  promotion_id: number;
  menu_item_id: number;
  created_at: Date;
}

export interface PromotionApplicableCategory {
  promotion_id: number;
  category_id: number;
  created_at: Date;
}

export interface PromotionUsageLog {
  usage_id: number;
  promotion_id: number;
  order_id: number;
  customer_id: number | null;
  discount_applied: number;
  used_at: Date;
}

export interface OrderTimeline {
  timeline_id: number;
  order_id: number;
  status: OrderStatus;
  changed_by: number | null;
  change_reason: string | null;
  notes: string | null;
  timestamp: Date;
}

export interface StockAdjustmentReason {
  reason_id: number;
  reason_code: string;
  reason_description: string;
  is_active: boolean;
  created_at: Date;
}

export interface MenuItemDailyStats {
  stats_id: number;
  menu_item_id: number;
  stats_date: Date;
  daily_orders: number;
  daily_quantity_sold: number;
  daily_revenue: number;
}

export interface PopularityHistory {
  history_id: number;
  menu_item_id: number;
  old_popularity_score: number | null;
  new_popularity_score: number | null;
  change_reason: ChangeReason;
  change_details: string | null;
  changed_at: Date;
}

// Request/Response DTOs
export interface LoginRequest {
  username: string;
  password: string;
}

export interface CashierLoginRequest {
  cashier_code: string;
  pin: string;
}

export interface CreateOrderRequest {
  customer_id?: number;
  order_type: OrderType;
  order_source: OrderSource;
  scheduled_pickup_datetime?: string;
  payment_method: PaymentMethod;
  payment_reference_number?: string;
  special_instructions?: string;
  kiosk_session_id?: string;
  items: OrderItemRequest[];
}

export interface OrderItemRequest {
  menu_item_id: number;
  quantity: number;
  custom_cake_design?: CustomCakeDesignRequest;
  flavor_id?: number;
  size_id?: number;
  special_instructions?: string;
}

export interface CustomCakeDesignRequest {
  theme_id?: number;
  frosting_color?: string;
  frosting_type: FrostingType;
  decoration_details?: string;
  cake_text?: string;
  special_instructions?: string;
  design_complexity: DesignComplexity;
}

export interface PaymentVerificationRequest {
  order_id: number;
  reference_number: string;
  payment_method: PaymentMethod;
  qr_code_image?: string;
}

export interface VerifyOrderRequest {
  verification_code: string;
  cashier_id: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT Payload
export interface JwtPayload {
  id: number;
  username?: string;
  email?: string;
  role?: string;
  type: 'admin' | 'cashier' | 'customer';
}

// Extended Request Type
export interface AuthRequest extends Request {
  user?: JwtPayload;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}
