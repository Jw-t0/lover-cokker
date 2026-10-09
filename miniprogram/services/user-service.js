const { call, db, isCollectionMissingError } = require('./cloud');

let userPromise = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableLoginError(error) {
  const message = String((error && error.message) || error || '');
  return message.includes('云调用失败') || message.includes('timeout') || message.includes('system error');
}

async function loginWithRetry() {
  try {
    return await call('login');
  } catch (error) {
    if (!isRetryableLoginError(error)) throw error;
    await wait(600);
    return call('login');
  }
}

async function getCurrentUser(options = {}) {
  const app = options.app || getApp();
  if (!options.force && app.globalData.user && app.globalData.user.id) {
    return app.globalData.user;
  }

  if (!options.force && app.globalData.userReady) {
    await app.globalData.userReady.catch(() => {});
    if (app.globalData.user && app.globalData.user.id) return app.globalData.user;
  }

  if (!userPromise) {
    userPromise = loginWithRetry()
      .then((result) => {
        app.globalData.user = result.user;
        return result.user;
      })
      .finally(() => {
        userPromise = null;
      });
  }
  return userPromise;
}

async function refreshCurrentUser() {
  const result = await loginWithRetry();
  getApp().globalData.user = result.user;
  return result.user;
}

async function saveProfile(profile) {
  const result = await call('saveProfile', profile);
  getApp().globalData.user = result.user;
  return result.user;
}

async function getUserById(userId) {
  try {
    const res = await db().collection('users').doc(userId).get();
    return res.data;
  } catch (error) {
    if (isCollectionMissingError(error)) return null;
    throw error;
  }
}

module.exports = {
  getCurrentUser,
  refreshCurrentUser,
  saveProfile,
  getUserById
};
