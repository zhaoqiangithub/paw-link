/**
 * 支付服务
 *
 * BUG-009 修复: 集成支付 API
 *
 * 支持的支付方式：
 * - 微信支付
 * - 支付宝
 */

export interface PaymentOrder {
  orderId: string;
  amount: number; // 金额（元）
  subject: string; // 订单标题
  body?: string; // 订单描述
  userId: string;
  type: 'recharge' | 'donation' | 'crowdfunding'; // 订单类型
  metadata?: Record<string, any>; // 额外元数据
}

export interface PaymentResult {
  success: boolean;
  orderId: string;
  transactionId?: string; // 支付平台交易号
  paidAmount?: number;
  paidAt?: number;
  error?: string;
}

interface PaymentConfig {
  wechat?: {
    appId: string;
    merchantId: string;
    apiKey: string;
    notifyUrl: string;
  };
  alipay?: {
    appId: string;
    privateKey: string;
    publicKey: string;
    notifyUrl: string;
  };
  useMock?: boolean;
}

class PaymentServiceClass {
  private config: PaymentConfig = {
    useMock: true, // 默认使用 Mock
  };

  configure(config: PaymentConfig) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 发起微信支付
   */
  async payWithWechat(order: PaymentOrder): Promise<PaymentResult> {
    if (this.config.useMock) {
      return this.mockPayment(order, 'wechat');
    }

    const { wechat } = this.config;

    if (!wechat) {
      throw new Error('微信支付配置缺失');
    }

    // TODO: 集成微信支付 SDK
    // 参考: https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml

    /*
    // React Native 环境需要使用 react-native-wechat-lib
    import * as WeChat from 'react-native-wechat-lib';

    // 1. 后端生成预支付订单
    const prepayResult = await fetch('YOUR_BACKEND_API/wechat/prepay', {
      method: 'POST',
      body: JSON.stringify({
        orderId: order.orderId,
        amount: order.amount * 100, // 转为分
        subject: order.subject,
        notifyUrl: wechat.notifyUrl
      })
    });

    const { prepayId, timestamp, nonceStr, sign } = await prepayResult.json();

    // 2. 调起微信支付
    const payResult = await WeChat.pay({
      partnerId: wechat.merchantId,
      prepayId: prepayId,
      nonceStr: nonceStr,
      timeStamp: timestamp,
      package: 'Sign=WXPay',
      sign: sign
    });

    if (payResult.errCode === 0) {
      return {
        success: true,
        orderId: order.orderId,
        transactionId: payResult.transactionId,
        paidAmount: order.amount,
        paidAt: Date.now()
      };
    } else {
      return {
        success: false,
        orderId: order.orderId,
        error: payResult.errStr
      };
    }
    */

    throw new Error('微信支付尚未集成，请安装 react-native-wechat-lib 并配置');
  }

  /**
   * 发起支付宝支付
   */
  async payWithAlipay(order: PaymentOrder): Promise<PaymentResult> {
    if (this.config.useMock) {
      return this.mockPayment(order, 'alipay');
    }

    const { alipay } = this.config;

    if (!alipay) {
      throw new Error('支付宝配置缺失');
    }

    // TODO: 集成支付宝 SDK
    // 参考: https://opendocs.alipay.com/open/204/105051

    /*
    // React Native 环境需要使用 @alipay/rn-sdk
    import Alipay from '@alipay/rn-sdk';

    // 1. 后端生成订单字符串
    const orderResult = await fetch('YOUR_BACKEND_API/alipay/create_order', {
      method: 'POST',
      body: JSON.stringify({
        orderId: order.orderId,
        amount: order.amount,
        subject: order.subject,
        notifyUrl: alipay.notifyUrl
      })
    });

    const { orderString } = await orderResult.json();

    // 2. 调起支付宝支付
    const payResult = await Alipay.pay(orderString);

    if (payResult.resultStatus === '9000') {
      return {
        success: true,
        orderId: order.orderId,
        transactionId: payResult.result?.alipay_trade_app_pay_response?.trade_no,
        paidAmount: order.amount,
        paidAt: Date.now()
      };
    } else {
      return {
        success: false,
        orderId: order.orderId,
        error: payResult.memo
      };
    }
    */

    throw new Error('支付宝尚未集成，请安装 @alipay/rn-sdk 并配置');
  }

  /**
   * 提现
   */
  async withdraw(params: {
    userId: string;
    amount: number;
    account: string; // 提现账号（微信openid或支付宝账号）
    accountType: 'wechat' | 'alipay';
    realName: string; // 真实姓名
  }): Promise<PaymentResult> {
    if (this.config.useMock) {
      return this.mockWithdraw(params);
    }

    // TODO: 实现提现逻辑
    // 需要调用后端 API 进行提现操作

    throw new Error('提现功能尚未实现，需要后端支持');
  }

  /**
   * 查询订单状态
   */
  async queryOrder(orderId: string): Promise<{
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
    paidAt?: number;
    paidAmount?: number;
  }> {
    // TODO: 实现订单查询
    throw new Error('订单查询功能尚未实现');
  }

  /**
   * 退款
   */
  async refund(params: {
    orderId: string;
    amount: number;
    reason: string;
  }): Promise<PaymentResult> {
    // TODO: 实现退款逻辑
    throw new Error('退款功能尚未实现');
  }

  /**
   * Mock 支付（仅供开发测试）
   */
  private async mockPayment(order: PaymentOrder, method: 'wechat' | 'alipay'): Promise<PaymentResult> {
    console.log('[Mock Payment] 模拟支付:', { order, method });

    // 模拟支付延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 模拟 90% 支付成功
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        orderId: order.orderId,
        transactionId: `MOCK_${method.toUpperCase()}_${Date.now()}`,
        paidAmount: order.amount,
        paidAt: Date.now(),
      };
    } else {
      return {
        success: false,
        orderId: order.orderId,
        error: '用户取消支付',
      };
    }
  }

  /**
   * Mock 提现
   */
  private async mockWithdraw(params: any): Promise<PaymentResult> {
    console.log('[Mock Withdraw] 模拟提现:', params);

    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      orderId: `WITHDRAW_${Date.now()}`,
      transactionId: `MOCK_WITHDRAW_${Date.now()}`,
      paidAmount: params.amount,
      paidAt: Date.now(),
    };
  }
}

export const PaymentService = new PaymentServiceClass();

/**
 * 使用示例：
 *
 * // 配置支付服务
 * PaymentService.configure({
 *   wechat: {
 *     appId: 'YOUR_WECHAT_APP_ID',
 *     merchantId: 'YOUR_MERCHANT_ID',
 *     apiKey: 'YOUR_API_KEY',
 *     notifyUrl: 'https://your-domain.com/api/wechat/notify'
 *   },
 *   alipay: {
 *     appId: 'YOUR_ALIPAY_APP_ID',
 *     privateKey: 'YOUR_PRIVATE_KEY',
 *     publicKey: 'ALIPAY_PUBLIC_KEY',
 *     notifyUrl: 'https://your-domain.com/api/alipay/notify'
 *   },
 *   useMock: false // 生产环境设为 false
 * });
 *
 * // 发起支付
 * const order: PaymentOrder = {
 *   orderId: 'ORDER_123456',
 *   amount: 100.00,
 *   subject: '捐赠给流浪猫小花',
 *   userId: 'user_123',
 *   type: 'donation'
 * };
 *
 * const result = await PaymentService.payWithWechat(order);
 * if (result.success) {
 *   console.log('支付成功，交易号:', result.transactionId);
 * }
 */
