export interface User {
  id?: number;
  uuid?: string;
  email: string;
  created_at?: string | Date;
  nickname: string;
  avatar_url: string;
  locale?: string;
  signin_type?: string;
  signin_ip?: string;
  signin_provider?: string;
  signin_openid?: string;

  invite_code?: string;
  invited_by?: string;
  is_affiliate?: boolean;
  plan?: 'free' | 'paid';
  subscription?: {
    plan: 'free' | 'paid';
    planType?: string;
    isActive: boolean;
    expiresAt?: Date;
    daysRemaining?: number;
  };
}

// UserCredits interface removed - no credit system
