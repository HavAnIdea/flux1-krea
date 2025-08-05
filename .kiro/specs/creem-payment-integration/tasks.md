# Implementation Plan

- [x] 1. 创建 Supabase 数据库表结构
  - 在 Supabase 中创建 subscription_plans 表，包含套餐信息字段
  - 在 Supabase 中创建 user_subscriptions 表，包含用户订阅记录字段
  - 为新表添加适当的索引和外键约束
  - _Requirements: 4.1, 4.2, 5.1, 5.2_

- [x] 2. 实现订阅套餐管理功能
  - [x] 2.1 创建 SubscriptionPlan 数据模型和类型定义
    - 定义 SubscriptionPlan 接口，包含 id、name、type、price 等字段
    - 创建套餐相关的 TypeScript 类型定义
    - _Requirements: 4.3, 4.4_

  - [x] 2.2 实现套餐数据访问层
    - 创建 subscription-plans 模型文件，实现 CRUD 操作
    - 实现从 Supabase 查询可用套餐的函数
    - 实现根据 product_id 查找套餐的函数
    - _Requirements: 4.1, 4.2_

  - [x] 2.3 创建套餐管理 API 端点
    - 实现 /api/subscription-plans GET 接口，返回所有可用套餐
    - 添加错误处理和数据验证逻辑
    - 编写 API 端点的单元测试
    - _Requirements: 4.3_

- [x] 3. 实现用户订阅管理功能
  - [x] 3.1 创建 UserSubscription 数据模型
    - 定义 UserSubscription 接口，包含订阅状态、时间等字段
    - 创建订阅状态枚举类型定义
    - _Requirements: 5.1, 5.2_

  - [x] 3.2 实现订阅数据访问层
    - 创建 user-subscriptions 模型文件，实现订阅记录的 CRUD 操作
    - 实现查询用户当前有效订阅的函数
    - 实现更新订阅状态的函数
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.3 创建订阅服务层
    - 实现 SubscriptionService 类，封装订阅业务逻辑
    - 实现用户权限检查方法
    - 实现订阅创建和状态更新方法
    - _Requirements: 6.1, 6.2_

- [ ] 4. 集成 Creem 支付平台
  - [x] 4.1 研究 Creem API 文档和集成方式
    - 阅读 Creem 官方文档，了解 Checkout Flow 集成方式
    - 确定所需的 API 密钥和配置参数
    - 了解 webhook 签名验证机制
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 实现 Creem 服务层
    - 创建 CreemService 类，封装 Creem API 调用
    - 实现创建支付会话的方法
    - 实现 webhook 签名验证方法
    - _Requirements: 3.1, 3.2_

  - [x] 4.3 创建 Creem 支付 API 端点
    - 实现 /api/creem-checkout POST 接口，创建支付会话
    - 添加用户身份验证和套餐验证逻辑
    - 实现错误处理和日志记录
    - _Requirements: 3.1, 3.2_

  - [x] 4.4 实现 Creem webhook 处理
    - 创建 /api/creem-webhook POST 接口，处理支付回调
    - 实现 webhook 签名验证逻辑
    - 实现支付成功后的订阅创建逻辑
    - 添加幂等性处理，防止重复处理
    - _Requirements: 3.3, 8.1, 8.2, 8.3_

- [x] 5. 重构前端支付组件
  - [x] 5.1 移除 Stripe 相关代码
    - 从 Pricing 组件中移除 Stripe SDK 导入和相关代码
    - 移除 wechat_pay、alipay、card 支付方式选项
    - 清理 Stripe 相关的环境变量和配置
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 5.2 更新 Pricing 组件使用新的支付流程
    - 修改 handleCheckout 函数调用新的 Creem API
    - 更新支付按钮的点击处理逻辑
    - 实现支付过程中的加载状态显示
    - _Requirements: 3.1, 7.1_

  - [x] 5.3 集成套餐数据从 Supabase 获取
    - 修改 Pricing 组件从新的 API 获取套餐数据
    - 移除硬编码的套餐配置，改为动态加载
    - 添加套餐数据加载的错误处理
    - _Requirements: 4.3, 4.4_

- [x] 6. 实现权限控制系统
  - [x] 6.1 创建权限验证中间件
    - 实现 SubscriptionGuard 组件，用于保护付费功能
    - 创建权限检查的 hook 函数
    - 实现基于订阅状态的路由保护
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 更新现有功能添加权限控制
    - 在图像生成等付费功能中添加订阅验证
    - 实现订阅过期时的提示和引导逻辑
    - 添加未订阅用户的升级提示组件
    - _Requirements: 6.3, 6.4_

  - [x] 6.3 创建用户订阅状态显示组件
    - 实现显示用户当前订阅信息的组件
    - 添加订阅到期提醒功能
    - 实现订阅管理页面的基础结构
    - _Requirements: 6.1, 6.2_

- [x] 7. 实现支付流程用户体验优化
  - [x] 7.1 创建支付成功页面
    - 实现支付成功后的确认页面
    - 显示订阅详情和生效时间
    - 添加返回主页和开始使用的引导
    - _Requirements: 7.2_

  - [x] 7.2 创建支付失败处理页面
    - 实现支付失败时的错误显示页面
    - 显示具体错误信息和客服邮箱 (support@flux1-krea.dev)
    - 提供重试支付的选项
    - _Requirements: 7.3_

  - [x] 7.3 优化支付过程中的用户反馈
    - 在支付按钮上添加加载状态和进度指示
    - 实现支付会话创建失败时的错误提示
    - 添加支付取消后返回定价页面的逻辑
    - _Requirements: 7.1, 7.4_

- [x] 8. 清理旧的支付系统代码
  - [x] 8.1 移除 Stripe 相关依赖和配置
    - 从 package.json 中移除 @stripe/stripe-js 和 stripe 依赖
    - 清理环境变量中的 Stripe 配置项
    - 移除 Stripe 相关的类型定义
    - _Requirements: 2.1, 2.2_

  - [x] 8.2 删除旧的支付 API 端点
    - 删除 /api/checkout 路由文件
    - 删除 /api/stripe-notify webhook 处理文件
    - 清理相关的服务层代码
    - _Requirements: 2.2, 2.3_

  - [x] 8.3 清理数据库中的旧字段和表
    - 移除 users 表中不再使用的支付相关字段
    - 清理代码中对 orders 表的引用
    - 移除 credits 表中与旧支付系统相关的逻辑
    - _Requirements: 2.1, 2.2_

- [ ] 9. 重新启用支付功能入口
  - [ ] 9.1 检查并移除支付功能的隐藏配置
    - 检查 Pricing 组件的 disabled 属性设置
    - 移除任何隐藏支付入口的条件判断
    - 确保定价页面在所有环境中都可访问
    - _Requirements: 1.1, 1.2_

  - [ ] 9.2 更新导航和页面链接
    - 确保主页和导航中的定价页面链接正常工作
    - 更新升级提示中的链接指向
    - 测试所有支付入口的可访问性
    - _Requirements: 1.3_

- [ ] 10. 编写测试和文档
  - [ ] 10.1 编写单元测试
    - 为 SubscriptionService 和 CreemService 编写单元测试
    - 为新的 API 端点编写测试用例
    - 为权限验证逻辑编写测试
    - _Requirements: 所有需求的测试覆盖_

  - [ ] 10.2 编写集成测试
    - 编写完整支付流程的端到端测试
    - 测试 webhook 处理的正确性
    - 测试权限控制在不同订阅状态下的行为
    - _Requirements: 所有需求的集成测试_

  - [ ] 10.3 更新项目文档
    - 更新 README 文件，说明新的支付系统配置
    - 编写 Creem 集成的配置指南
    - 更新环境变量配置文档
    - _Requirements: 项目维护和部署需求_