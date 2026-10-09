function pickRandomDishes(dishes, count = 3, random = Math.random) {
  const pool = Array.isArray(dishes) ? [...dishes] : [];
  const limit = Math.max(0, Math.min(Number(count) || 0, pool.length));

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, limit);
}

module.exports = {
  pickRandomDishes
};
