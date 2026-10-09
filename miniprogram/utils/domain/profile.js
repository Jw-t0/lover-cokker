function isProfileComplete(user) {
  const nickname = String(user && user.nickname || '').trim();
  const avatarUrl = String(user && user.avatarUrl || '').trim();
  return Boolean(nickname && nickname !== '还没有昵称' && avatarUrl);
}

module.exports = {
  isProfileComplete
};
