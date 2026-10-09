function extractCloudBusinessMessage(message) {
  const source = String(message || '');
  const markers = [
    'Error: ',
    'message: '
  ];

  for (const marker of markers) {
    const index = source.lastIndexOf(marker);
    if (index >= 0) {
      const text = source.slice(index + marker.length).trim();
      if (text && !text.startsWith('errCode')) return text;
    }
  }

  return source;
}

function normalizeCloudError(error) {
  const rawMessage = error && (error.errMsg || error.message || String(error));
  const message = extractCloudBusinessMessage(rawMessage);

  if (message.includes('USER_NOT_FOUND')) {
    return new Error('云端用户还没初始化，请进入“我的”页刷新后再试');
  }

  if (message.includes('webapi_getwxaasyncsecinfo:fail')) {
    return new Error('云开发初始化失败，请确认当前项目 AppID 与云环境 envId 匹配后重新编译');
  }

  if (message.includes('timeout') || message.includes('system error (Error)')) {
    return new Error('云调用失败，请检查云开发环境、网络状态后再试');
  }

  if (message && !message.includes('cloud.callFunction')) {
    return new Error(message);
  }

  return new Error('云端服务暂时没有响应，请稍后再试');
}

function isCollectionMissingError(error) {
  const rawMessage = error && (error.errMsg || error.message || String(error));
  return String(rawMessage || '').includes('-502005') ||
    String(rawMessage || '').includes('collection not exists') ||
    String(rawMessage || '').includes('Db or Table not exist');
}

function call(name, data) {
  return wx.cloud
    .callFunction({ name, data })
    .then((res) => res.result)
    .catch((error) => {
      throw normalizeCloudError(error);
    });
}

function db() {
  return wx.cloud.database();
}

function now() {
  return Date.now();
}

module.exports = {
  call,
  db,
  now,
  isCollectionMissingError,
  normalizeCloudError
};
