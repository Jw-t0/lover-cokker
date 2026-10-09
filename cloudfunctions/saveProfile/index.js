const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const nickname = String(event.nickname || '').trim().slice(0, 12);
  if (!nickname) throw new Error('昵称不能为空');
  const avatarUrl = event.avatarUrl || '';
  await db.collection('users').doc(user._id).update({
    data: {
      nickname,
      avatarUrl,
      updatedAt: Date.now()
    }
  });
  return {
    user: {
      ...user,
      id: user._id,
      nickname,
      avatarUrl,
      updatedAt: Date.now()
    }
  };
};
