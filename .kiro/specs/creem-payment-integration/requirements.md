# Requirements Document

## Introduction

本功能旨在将现有的 Stripe 支付系统迁移到 Creem 支付平台，并重新启用被隐藏的支付功能。系统需要支持基于订阅套餐的权限控制，为用户提供不同级别的服务访问权限。

## Requirements

### Requirement 1

**User Story:** 作为系统管理员，我希望重新启用支付功能入口，以便用户可以访问付费服务

#### Acceptance Criteria

1. WHEN 用户访问定价页面 THEN 系统 SHALL 显示所有可用的付费套餐选项
2. WHEN 支付功能被启用 THEN 系统 SHALL 移除所有隐藏支付入口的配置
3. WHEN 用户点击升级按钮 THEN 系统 SHALL 正确跳转到支付流程

### Requirement 2

**User Story:** 作为开发者，我希望移除现有的 Stripe 支付集成，以便为 Creem 集成做准备

#### Acceptance Criteria

1. WHEN 系统初始化 THEN 系统 SHALL 不再依赖 Stripe SDK 和配置
2. WHEN 处理支付请求 THEN 系统 SHALL 不再调用 Stripe API
3. WHEN 接收支付回调 THEN 系统 SHALL 不再处理 Stripe webhook
4. WHEN 用户选择支付方式 THEN 系统 SHALL 不再显示 wechat_pay、alipay、card 选项

### Requirement 3

**User Story:** 作为用户，我希望通过 Creem 支付平台完成付款，以便获得订阅服务

#### Acceptance Criteria

1. WHEN 用户选择套餐并点击支付 THEN 系统 SHALL 使用 Creem 标准集成方式创建支付会话
2. WHEN 支付会话创建成功 THEN 系统 SHALL 重定向用户到 Creem 支付页面
3. WHEN 用户完成支付 THEN Creem SHALL 通过 webhook 通知系统支付结果
4. WHEN 系统接收到支付成功通知 THEN 系统 SHALL 更新用户订阅状态

### Requirement 4

**User Story:** 作为系统管理员，我希望在 Supabase 中管理订阅套餐信息，以便灵活配置产品和价格

#### Acceptance Criteria

1. WHEN 系统启动 THEN 系统 SHALL 从 subscription_plans 表读取可用套餐
2. WHEN 管理员添加新套餐 THEN 系统 SHALL 在 subscription_plans 表中创建记录
3. WHEN 套餐信息更新 THEN 系统 SHALL 反映在前端定价页面
4. WHEN 套餐包含 product_id THEN 系统 SHALL 使用该 ID 与 Creem 系统对接

### Requirement 5

**User Story:** 作为系统，我希望记录用户的订阅历史，以便跟踪付费用户的服务使用情况

#### Acceptance Criteria

1. WHEN 用户完成支付 THEN 系统 SHALL 在 user_subscriptions 表中创建订阅记录
2. WHEN 订阅记录创建 THEN 系统 SHALL 包含开始日期、结束日期、支付状态等信息
3. WHEN 订阅状态变更 THEN 系统 SHALL 更新 user_subscriptions 表中的相应记录
4. WHEN 订阅过期 THEN 系统 SHALL 将 is_active 字段设置为 false

### Requirement 6

**User Story:** 作为登录用户，我希望系统根据我的订阅状态控制功能访问权限，以便享受相应级别的服务

#### Acceptance Criteria

1. WHEN 用户登录 THEN 系统 SHALL 检查用户当前有效的订阅状态
2. WHEN 用户访问付费功能 THEN 系统 SHALL 验证用户是否有相应的订阅权限
3. WHEN 用户订阅已过期 THEN 系统 SHALL 限制用户访问付费功能
4. WHEN 用户没有订阅 THEN 系统 SHALL 显示升级提示并引导用户到支付页面

### Requirement 7

**User Story:** 作为用户，我希望在支付过程中获得清晰的反馈，以便了解支付状态和结果

#### Acceptance Criteria

1. WHEN 用户发起支付 THEN 系统 SHALL 显示加载状态和进度提示
2. WHEN 支付成功 THEN 系统 SHALL 重定向到成功页面并显示订阅详情
3. WHEN 支付失败 THEN 系统 SHALL 显示错误信息并提供重试选项
4. WHEN 支付被取消 THEN 系统 SHALL 返回到定价页面并保留用户选择

### Requirement 8

**User Story:** 作为开发者，我希望系统能够处理 Creem 的 webhook 回调，以便及时更新订阅状态

#### Acceptance Criteria

1. WHEN Creem 发送 webhook 通知 THEN 系统 SHALL 验证请求的真实性
2. WHEN webhook 包含支付成功事件 THEN 系统 SHALL 更新对应的订阅记录
3. WHEN webhook 包含订阅取消事件 THEN 系统 SHALL 将订阅标记为非活跃状态
4. WHEN webhook 处理失败 THEN 系统 SHALL 记录错误日志并返回适当的HTTP状态码