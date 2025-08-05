import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/services/subscription';
import { getUserUuid } from '@/services/user';
import { findUserByUuid } from '@/models/user';
import { PlanTypeEnum } from '@/types/subscription';

export interface SubscriptionMiddlewareConfig {
  requiredPlan: PlanTypeEnum;
  redirectUrl?: string;
}

export async function withSubscriptionCheck(
  request: NextRequest,
  config: SubscriptionMiddlewareConfig
): Promise<NextResponse | null> {
  try {
    // 获取用户信息
    const userUuid = await getUserUuid();
    if (!userUuid) {
      // 用户未登录，重定向到登录页面
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const user = await findUserByUuid(userUuid);
    if (!user) {
      const loginUrl = new URL('/auth/signin', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 检查订阅权限
    const hasPermission = await subscriptionService.checkUserPermission(
      user.id,
      config.requiredPlan
    );

    if (!hasPermission) {
      // 没有权限，重定向到升级页面
      const upgradeUrl = new URL(config.redirectUrl || '/#pricing', request.url);
      return NextResponse.redirect(upgradeUrl);
    }

    // 有权限，继续处理请求
    return null;
  } catch (error) {
    console.error('Subscription middleware error:', error);
    // 发生错误时，重定向到首页
    return NextResponse.redirect(new URL('/', request.url));
  }
}

// 创建特定套餐的中间件函数
export const withBasicPlan = (request: NextRequest) =>
  withSubscriptionCheck(request, { requiredPlan: PlanTypeEnum.BASIC });

export const withProPlan = (request: NextRequest) =>
  withSubscriptionCheck(request, { requiredPlan: PlanTypeEnum.PRO });

export const withPremiumPlan = (request: NextRequest) =>
  withSubscriptionCheck(request, { requiredPlan: PlanTypeEnum.PREMIUM });

export const withUltimatePlan = (request: NextRequest) =>
  withSubscriptionCheck(request, { requiredPlan: PlanTypeEnum.ULTIMATE });