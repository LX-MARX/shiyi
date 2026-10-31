/**
 * 文件名：js/cloud.js
 * 功能描述：石椅答卷网站云服务入口——初始化 WorkBuddy 云服务客户端
 *           （数据库 / 用户认证），全站共享同一实例。
 * 作者：云上党旗飘项目组
 * 创建日期：2026-10-21
 * 版权声明：本代码为项目原创代码，用于软件著作权登记。
 */
window.ShiyiCloud = (function () {
  /* 云服务公共配置（由 WorkBuddy 云服务开通后下发，可安全置于前端） */
  const PUBLIC_CONFIG = {
    endpoint: 'https://shiyi-dajuan.app.workbuddy.host',
    oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
    publishableKey: 'wbpk_YTg20GGq2WJXb5ji5Oa0oU_5WFAktQErdDyK61Kfx28InwmR26L6OQh',
  };

  if (!window.WorkBuddyCloud || typeof WorkBuddyCloud.createWorkBuddyCloud !== 'function') {
    // SDK 加载失败（离线等）：保留空客户端，各功能自动退回游客模式
    return { cloud: null, ready: false };
  }

  const cloud = WorkBuddyCloud.createWorkBuddyCloud({
    endpoint: PUBLIC_CONFIG.endpoint,
    oauthRelayBaseUrl: PUBLIC_CONFIG.oauthRelayBaseUrl,
    publishableKey: PUBLIC_CONFIG.publishableKey,
  });

  return { cloud, ready: true };
})();
