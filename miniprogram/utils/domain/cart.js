function normalizePrice(price) {
  const value = Number(price);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeTastes(tastes) {
  return (Array.isArray(tastes) ? tastes : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);
}

function tasteKey(tastes) {
  return normalizeTastes(tastes).sort().join('|');
}

function cartItemKey(item) {
  return `${item.dishId || item.id}::${tasteKey(item.selectedTastes || item.tastes)}`;
}

function toCartItem(dish, quantity) {
  const price = normalizePrice(dish.price);
  const selectedTastes = normalizeTastes(dish.selectedTastes || dish.tastes);
  const dishId = dish.dishId || dish.id;
  return {
    dishId,
    cartKey: `${dishId}::${tasteKey(selectedTastes)}`,
    name: dish.name,
    price,
    quantity,
    subtotal: price * quantity,
    imageUrl: dish.imageUrl || '',
    emoji: dish.emoji || '',
    selectedTastes,
    tasteText: selectedTastes.join('、')
  };
}

function addDishToCart(cart, dish) {
  const source = Array.isArray(cart) ? cart : [];
  const nextKey = cartItemKey(dish);
  const existing = source.find((item) => cartItemKey(item) === nextKey);

  if (!existing) {
    return [...source, toCartItem(dish, 1)];
  }

  return source.map((item) => {
    if (cartItemKey(item) !== nextKey) return item;
    const quantity = Math.min(99, Number(item.quantity || 0) + 1);
    return { ...item, cartKey: nextKey, quantity, subtotal: item.price * quantity };
  });
}

function changeCartQuantity(cart, dishId, delta) {
  const source = Array.isArray(cart) ? cart : [];
  let changed = false;
  return source
    .map((item) => {
      const matched = item.cartKey === dishId || (!changed && item.dishId === dishId);
      if (!matched) return item;
      changed = true;
      const quantity = Math.max(0, item.quantity + delta);
      return { ...item, quantity, subtotal: item.price * quantity };
    })
    .filter((item) => item.quantity > 0);
}

function summarizeCart(cart) {
  const source = Array.isArray(cart) ? cart : [];
  return source.reduce(
    (summary, item) => {
      const quantity = Number(item.quantity) || 0;
      const subtotal = Number.isFinite(Number(item.subtotal))
        ? Number(item.subtotal)
        : normalizePrice(item.price) * quantity;
      return {
        count: summary.count + quantity,
        totalPrice: summary.totalPrice + subtotal
      };
    },
    { count: 0, totalPrice: 0 }
  );
}

function clearCart() {
  return [];
}

module.exports = {
  addDishToCart,
  changeCartQuantity,
  summarizeCart,
  clearCart,
  normalizeTastes
};
