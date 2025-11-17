/**
 * OCR 服务 - 身份证识别
 *
 * BUG-001 修复: 集成 OCR API
 *
 * 支持的 OCR 服务商：
 * - 阿里云 OCR
 * - 腾讯云 OCR
 * - 百度 OCR
 *
 * 使用方式：
 * import { OCRService } from '@/lib/services/ocr';
 * const result = await OCRService.recognizeIDCard(imageUri, 'front');
 */

export interface IDCardInfo {
  name?: string;
  idNumber?: string;
  address?: string;
  nationality?: string;
  gender?: string;
  birthday?: string;
  issuedBy?: string;
  validFrom?: string;
  validTo?: string;
}

export interface OCRResult {
  success: boolean;
  data?: IDCardInfo;
  error?: string;
  confidence?: number; // 识别置信度 0-1
}

/**
 * OCR 配置
 */
interface OCRConfig {
  provider: 'aliyun' | 'tencent' | 'baidu' | 'mock';
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
}

class OCRServiceClass {
  private config: OCRConfig = {
    provider: 'mock', // 默认使用 Mock，生产环境切换为真实服务商
  };

  /**
   * 配置 OCR 服务
   */
  configure(config: Partial<OCRConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 识别身份证
   * @param imageUri 图片 URI（本地路径或远程 URL）
   * @param side 'front' | 'back' 正面或反面
   */
  async recognizeIDCard(
    imageUri: string,
    side: 'front' | 'back'
  ): Promise<OCRResult> {
    try {
      switch (this.config.provider) {
        case 'aliyun':
          return await this.recognizeWithAliyun(imageUri, side);
        case 'tencent':
          return await this.recognizeWithTencent(imageUri, side);
        case 'baidu':
          return await this.recognizeWithBaidu(imageUri, side);
        case 'mock':
        default:
          return await this.recognizeWithMock(imageUri, side);
      }
    } catch (error) {
      console.error('OCR识别失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '识别失败',
      };
    }
  }

  /**
   * 阿里云 OCR 识别
   * 文档: https://help.aliyun.com/document_detail/442275.html
   */
  private async recognizeWithAliyun(
    imageUri: string,
    side: 'front' | 'back'
  ): Promise<OCRResult> {
    // TODO: 集成阿里云 OCR SDK
    // import RPCClient from '@alicloud/pop-core';

    const { apiKey, apiSecret, endpoint } = this.config;

    if (!apiKey || !apiSecret) {
      throw new Error('阿里云 OCR 配置缺失：apiKey 或 apiSecret');
    }

    // 示例代码框架（需安装 @alicloud/pop-core）
    /*
    const client = new RPCClient({
      accessKeyId: apiKey,
      accessKeySecret: apiSecret,
      endpoint: endpoint || 'https://ocr.cn-shanghai.aliyuncs.com',
      apiVersion: '2021-07-07'
    });

    const params = {
      RegionId: 'cn-shanghai',
      ImageURL: imageUri, // 或使用 ImageContent (base64)
      Side: side === 'front' ? 'face' : 'back'
    };

    const response = await client.request('RecognizeIdcard', params);

    return {
      success: true,
      data: {
        name: response.Data?.Name,
        idNumber: response.Data?.IdNumber,
        address: response.Data?.Address,
        // ... 其他字段映射
      },
      confidence: response.Data?.Confidence / 100
    };
    */

    // 当前返回提示信息
    throw new Error('阿里云 OCR 尚未集成，请先安装 @alicloud/pop-core 并配置 API 密钥');
  }

  /**
   * 腾讯云 OCR 识别
   * 文档: https://cloud.tencent.com/document/product/866/33524
   */
  private async recognizeWithTencent(
    imageUri: string,
    side: 'front' | 'back'
  ): Promise<OCRResult> {
    // TODO: 集成腾讯云 OCR SDK
    // import tencentcloud from 'tencentcloud-sdk-nodejs';

    const { apiKey, apiSecret } = this.config;

    if (!apiKey || !apiSecret) {
      throw new Error('腾讯云 OCR 配置缺失：apiKey 或 apiSecret');
    }

    // 示例代码框架（需安装 tencentcloud-sdk-nodejs）
    /*
    const OcrClient = tencentcloud.ocr.v20181119.Client;
    const client = new OcrClient({
      credential: {
        secretId: apiKey,
        secretKey: apiSecret,
      },
      region: 'ap-guangzhou',
    });

    const params = {
      ImageUrl: imageUri,
      CardSide: side === 'front' ? 'FRONT' : 'BACK'
    };

    const response = await client.IDCardOCR(params);

    return {
      success: true,
      data: {
        name: response.Name,
        idNumber: response.IdNum,
        address: response.Address,
        // ... 其他字段映射
      }
    };
    */

    throw new Error('腾讯云 OCR 尚未集成，请先安装 tencentcloud-sdk-nodejs 并配置 API 密钥');
  }

  /**
   * 百度 OCR 识别
   * 文档: https://cloud.baidu.com/doc/OCR/s/rk3h7xzck
   */
  private async recognizeWithBaidu(
    imageUri: string,
    side: 'front' | 'back'
  ): Promise<OCRResult> {
    const { apiKey, apiSecret } = this.config;

    if (!apiKey || !apiSecret) {
      throw new Error('百度 OCR 配置缺失：apiKey 或 apiSecret');
    }

    // TODO: 集成百度 OCR API
    // 百度 OCR 使用 RESTful API，无需 SDK

    throw new Error('百度 OCR 尚未集成，请配置 API 密钥并实现 HTTP 请求');
  }

  /**
   * Mock 模拟识别（仅供开发测试）
   */
  private async recognizeWithMock(
    imageUri: string,
    side: 'front' | 'back'
  ): Promise<OCRResult> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[Mock OCR] 模拟识别身份证:', { imageUri, side });

    if (side === 'front') {
      return {
        success: true,
        data: {
          name: '张三',
          idNumber: '110101199001011234',
          address: '北京市东城区XX街道XX号',
          nationality: '汉',
          gender: '男',
          birthday: '1990-01-01',
        },
        confidence: 0.95,
      };
    } else {
      return {
        success: true,
        data: {
          issuedBy: '北京市公安局东城分局',
          validFrom: '2010-01-01',
          validTo: '2030-01-01',
        },
        confidence: 0.93,
      };
    }
  }

  /**
   * 验证身份证号格式
   */
  validateIDNumber(idNumber: string): boolean {
    const regex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return regex.test(idNumber);
  }

  /**
   * 从身份证号提取信息
   */
  parseIDNumber(idNumber: string): {
    province: string;
    birthday: string;
    gender: 'male' | 'female';
  } | null {
    if (!this.validateIDNumber(idNumber)) {
      return null;
    }

    const provinceCode = idNumber.substring(0, 2);
    const year = idNumber.substring(6, 10);
    const month = idNumber.substring(10, 12);
    const day = idNumber.substring(12, 14);
    const genderCode = parseInt(idNumber.substring(16, 17));

    const provinceMap: Record<string, string> = {
      '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
      '21': '辽宁', '22': '吉林', '23': '黑龙江',
      '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
      '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
      '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
      '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
      // ... 更多省份代码
    };

    return {
      province: provinceMap[provinceCode] || '未知',
      birthday: `${year}-${month}-${day}`,
      gender: genderCode % 2 === 0 ? 'female' : 'male',
    };
  }
}

export const OCRService = new OCRServiceClass();

/**
 * 使用示例：
 *
 * // 配置 OCR 服务（在 app/_layout.tsx 中配置）
 * OCRService.configure({
 *   provider: 'aliyun', // 或 'tencent', 'baidu'
 *   apiKey: 'YOUR_API_KEY',
 *   apiSecret: 'YOUR_API_SECRET'
 * });
 *
 * // 识别身份证
 * const result = await OCRService.recognizeIDCard(imageUri, 'front');
 * if (result.success && result.data) {
 *   console.log('识别结果:', result.data);
 *   // 自动填充表单
 *   setName(result.data.name);
 *   setIdNumber(result.data.idNumber);
 * }
 */
