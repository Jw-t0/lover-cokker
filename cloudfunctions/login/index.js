const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function isCollectionMissing(error) {
  const message = error && (error.message || error.errMsg || String(error));
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function ensureCollection(name) {
  await db.createCollection(name).catch((error) => {
    const message = error && (error.message || error.errMsg || String(error));
    if (!message.includes('exist') && !message.includes('already')) throw error;
  });
}

async function findUser(openid) {
  try {
    return await db.collection('users').where({ openid }).limit(1).get();
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('users');
    return { data: [] };
  }
}

async function addUser(user) {
  try {
    return await db.collection('users').add({ data: user });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('users');
    return db.collection('users').add({ data: user });
  }
}

function createUid(openid) {
  return openid.slice(-8).toUpperCase();
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const found = await findUser(OPENID);
  const now = Date.now();

  if (found.data.length) {
    const user = found.data[0];
    return { user: { ...user, id: user._id } };
  }

  const user = {
    openid: OPENID,
    uid: createUid(OPENID),
    nickname: '还没有昵称',
    avatarUrl: '',
    coupleId: '',
    createdAt: now,
    updatedAt: now
  };
  const res = await addUser(user);
  return { user: { ...user, _id: res._id, id: res._id } };
};
