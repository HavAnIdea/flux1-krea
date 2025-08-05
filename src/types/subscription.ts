export interface SubscriptionPlan {
  id: number;
  name: string;
  type: 'basic' | 'pro' | 'premium' | 'ultimate';
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  product_id: string;
  created_at: Date;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  start_date: Date;
  end_date: Date;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  order_id?: string;
  amount_paid: number;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateSubscriptionData {
  user_id: number;
  plan_id: number;
  start_date: Date;
  end_date: Date;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  order_id?: string;
  amount_paid: number;
}

export interface CreemCheckoutRequest {
  product_id: string;
  request_id?: string;
  success_url?: string;
}

export interface CreemCheckoutResponse {
  checkout_url: string;
  checkout_id: string;
}

export interface CreemReturnUrlParams {
  checkout_id: string;
  order_id: string;
  customer_id: string;
  subscription_id?: string;
  product_id: string;
  request_id?: string;
  signature: string;
}

export interface CreemWebhookPayload {
  event_type: 'payment.completed' | 'subscription.cancelled' | 'payment.failed';
  checkout_id: string;
  order_id: string;
  customer_id: string;
  customer_email: string;
  product_id: string;
  subscription_id?: string;
  request_id?: string;
  amount: number;
  currency: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PlanType = 'basic' | 'pro' | 'premium' | 'ultimate';
export type PlanPeriod = 'monthly' | 'yearly';

export enum PaymentStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PlanTypeEnum {
  BASIC = 'basic',
  PRO = 'pro',
  PREMIUM = 'premium',
  ULTIMATE = 'ultimate'
}

export enum PlanPeriodEnum {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface UserSubscriptionWithPlan extends UserSubscription {
  plan: SubscriptionPlan;
}

export interface SubscriptionSummary {
  user_id: number;
  current_plan?: SubscriptionPlan;
  is_active: boolean;
  expires_at?: Date;
  days_remaining?: number;
}