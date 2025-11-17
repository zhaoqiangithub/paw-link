/**
 * 隐私保护工具
 *
 * BUG-005 修复: 位置信息脱敏
 */

/**
 * 位置脱敏 - 添加随机偏移量
 *
 * @param latitude 真实纬度
 * @param longitude 真实经度
 * @param radius 模糊半径（米），默认500米
 * @returns 模糊化后的坐标
 */
export function fuzzyLocation(
  latitude: number,
  longitude: number,
  radius: number = 500
): { latitude: number; longitude: number } {
  // 地球半径（米）
  const EARTH_RADIUS = 6371000;

  // 生成随机角度（0-360度）
  const randomAngle = Math.random() * 2 * Math.PI;

  // 生成随机距离（0-radius米）
  const randomDistance = Math.random() * radius;

  // 计算纬度偏移（1度纬度约111km）
  const deltaLat = (randomDistance * Math.cos(randomAngle)) / 111000;

  // 计算经度偏移（1度经度 = 111km * cos(纬度)）
  const deltaLon =
    (randomDistance * Math.sin(randomAngle)) /
    (111000 * Math.cos((latitude * Math.PI) / 180));

  return {
    latitude: latitude + deltaLat,
    longitude: longitude + deltaLon,
  };
}

/**
 * 脱敏手机号
 * 138****5678
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 脱敏身份证号
 * 110101********1234
 */
export function maskIDNumber(idNumber: string): string {
  if (!idNumber || idNumber.length < 10) return idNumber;
  return idNumber.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
}

/**
 * 脱敏姓名
 * 张三 -> 张*
 * 欧阳娜娜 -> 欧阳**
 */
export function maskName(name: string): string {
  if (!name || name.length === 0) return name;
  if (name.length === 1) return name;
  if (name.length === 2) return name[0] + '*';
  // 复姓保留前两个字
  return name.substring(0, 2) + '*'.repeat(name.length - 2);
}

/**
 * 脱敏邮箱
 * test@example.com -> te***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return username[0] + '***@' + domain;
  }
  return username.substring(0, 2) + '***@' + domain;
}

/**
 * 检查是否需要联系后才可见
 */
export interface PrivacyRule {
  showPreciseLocation: boolean; // 是否显示精确位置
  showPhoneNumber: boolean; // 是否显示手机号
  showWechat: boolean; // 是否显示微信号
  showQQ: boolean; // 是否显示QQ号
}

/**
 * 获取隐私规则
 * @param hasContacted 是否已联系
 * @param isOwner 是否是发布者本人
 */
export function getPrivacyRule(hasContacted: boolean, isOwner: boolean): PrivacyRule {
  if (isOwner) {
    // 发布者本人，全部可见
    return {
      showPreciseLocation: true,
      showPhoneNumber: true,
      showWechat: true,
      showQQ: true,
    };
  }

  if (hasContacted) {
    // 已联系，联系方式可见，但位置仍模糊
    return {
      showPreciseLocation: false,
      showPhoneNumber: true,
      showWechat: true,
      showQQ: true,
    };
  }

  // 未联系，全部脱敏
  return {
    showPreciseLocation: false,
    showPhoneNumber: false,
    showWechat: false,
    showQQ: false,
  };
}

/**
 * 应用隐私保护到宠物信息
 */
export function applyPrivacyToPetInfo(petInfo: any, hasContacted: boolean, isOwner: boolean) {
  const rule = getPrivacyRule(hasContacted, isOwner);

  return {
    ...petInfo,
    // 位置脱敏
    latitude: rule.showPreciseLocation
      ? petInfo.latitude
      : fuzzyLocation(petInfo.latitude, petInfo.longitude, 500).latitude,
    longitude: rule.showPreciseLocation
      ? petInfo.longitude
      : fuzzyLocation(petInfo.latitude, petInfo.longitude, 500).longitude,
    address: rule.showPreciseLocation ? petInfo.address : petInfo.address?.split(/区|县|市/)[0] + '区附近',

    // 联系方式脱敏
    contactPhone: rule.showPhoneNumber ? petInfo.contactPhone : maskPhoneNumber(petInfo.contactPhone || ''),
    contactWechat: rule.showWechat ? petInfo.contactWechat : petInfo.contactWechat ? '***' : undefined,
    contactQQ: rule.showQQ ? petInfo.contactQQ : petInfo.contactQQ ? '***' : undefined,
  };
}
