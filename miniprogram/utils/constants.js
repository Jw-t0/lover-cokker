const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  REVIEWED: 'reviewed',
  CANCELLED: 'cancelled'
};

const DISH_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};

const INVITE_STATUS = {
  ACTIVE: 'active',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

const INVITE_DURATION = 24 * 60 * 60 * 1000;
const ORDER_NOTIFY_TEMPLATE_ID = '';
const MONTHLY_REPORT_TEMPLATE_ID = '';

const DEFAULT_CATEGORIES = [
  { name: '肉菜', sort: 1 },
  { name: '家常菜', sort: 2 },
  { name: '主食', sort: 3 },
  { name: '早餐', sort: 4 },
  { name: '汤', sort: 5 },
  { name: '凉菜', sort: 6 },
  { name: '甜品', sort: 7 },
  { name: '饮料', sort: 8 },
  { name: '水果', sort: 9 }
];

const DEFAULT_DISHES = [
  { name: '可乐鸡翅', categoryName: '肉菜', description: '甜咸口，适合下饭', price: 28, emoji: '🍗', ingredients: '鸡翅、可乐、姜片', method: '鸡翅煎香后倒入可乐和调味料，小火收汁。', tasteOptions: ['少甜', '多汁', '微辣'] },
  { name: '红烧鸡翅', categoryName: '肉菜', description: '酱香浓郁，家常下饭', price: 28, emoji: '🍗', ingredients: '鸡翅、葱、姜', method: '鸡翅煎香后加酱油和清水，小火收汁。', tasteOptions: ['少油', '多汁', '不辣'] },
  { name: '黄焖鸡', categoryName: '肉菜', description: '鸡肉软嫩，汤汁拌饭', price: 32, emoji: '🍲', ingredients: '鸡腿、土豆、青椒', method: '鸡肉煸香后加土豆和酱汁焖熟。', tasteOptions: ['少辣', '多汤', '多土豆'] },
  { name: '宫保鸡丁', categoryName: '肉菜', description: '酸甜微辣，花生香脆', price: 28, emoji: '🥜', ingredients: '鸡胸肉、花生、黄瓜', method: '鸡丁滑炒后加入宫保汁和花生快速翻匀。', tasteOptions: ['不辣', '少糖', '不要花生'] },
  { name: '回锅肉', categoryName: '肉菜', description: '咸香下饭，肥而不腻', price: 32, emoji: '🥓', ingredients: '五花肉、蒜苗、豆瓣酱', method: '五花肉煮熟切片，回锅煸香后加入蒜苗。', tasteOptions: ['少油', '微辣', '多蒜苗'] },
  { name: '糖醋排骨', categoryName: '肉菜', description: '酸甜入味，大人小孩都爱吃', price: 38, emoji: '🍖', ingredients: '排骨、冰糖、醋', method: '排骨煎香后加糖醋汁，小火焖至收汁。', tasteOptions: ['少糖', '多汁', '少醋'] },
  { name: '红烧肉', categoryName: '肉菜', description: '软糯浓香，配米饭刚好', price: 36, emoji: '🍖', ingredients: '五花肉、冰糖、八角', method: '五花肉煸油后加糖色和香料慢炖。', tasteOptions: ['少油', '软烂', '多汁'] },
  { name: '土豆炖牛腩', categoryName: '肉菜', description: '软烂入味，适合认真吃饭', price: 38, emoji: '🥩', ingredients: '牛腩、土豆、胡萝卜', method: '牛腩焯水后慢炖，土豆最后加入保持绵软。', tasteOptions: ['少辣', '多汤', '软烂'] },
  { name: '水煮肉片', categoryName: '肉菜', description: '麻辣鲜香，特别下饭', price: 36, emoji: '🌶️', ingredients: '猪里脊、豆芽、辣椒', method: '肉片上浆后煮熟，最后淋热油激香。', tasteOptions: ['不辣', '少油', '多豆芽'] },
  { name: '鱼香肉丝', categoryName: '肉菜', description: '酸甜咸香，经典家常味', price: 24, emoji: '🥢', ingredients: '猪肉丝、木耳、胡萝卜', method: '肉丝滑炒后加入鱼香汁快速翻匀。', tasteOptions: ['少辣', '少糖', '多木耳'] },
  { name: '番茄炒蛋', categoryName: '家常菜', description: '家常味，酸甜开胃', price: 16, emoji: '🍅', ingredients: '番茄、鸡蛋、葱花', method: '鸡蛋先炒嫩，番茄炒出汁后回锅拌匀。', tasteOptions: ['少油', '多汁', '不葱'] },
  { name: '青椒肉丝', categoryName: '家常菜', description: '经典家常菜，微微下饭', price: 22, emoji: '🥘', ingredients: '青椒、猪肉丝、蒜', method: '肉丝滑炒后加入青椒大火快炒。', tasteOptions: ['不辣', '少蒜', '多肉'] },
  { name: '麻婆豆腐', categoryName: '家常菜', description: '麻辣鲜香，拌饭很满足', price: 18, emoji: '🍲', ingredients: '豆腐、肉末、豆瓣酱', method: '肉末炒香后加豆腐和酱汁烧入味。', tasteOptions: ['不辣', '少油', '多汤汁'] },
  { name: '鱼香茄子', categoryName: '家常菜', description: '茄子软糯，鱼香浓郁', price: 20, emoji: '🍆', ingredients: '茄子、蒜、豆瓣酱', method: '茄子煎软后加入鱼香汁烧入味。', tasteOptions: ['少油', '少辣', '多蒜'] },
  { name: '手撕包菜', categoryName: '家常菜', description: '爽脆清香，简单下饭', price: 16, emoji: '🥬', ingredients: '包菜、蒜、干辣椒', method: '包菜大火快炒，加入蒜和调味料。', tasteOptions: ['不辣', '少油', '多蒜'] },
  { name: '地三鲜', categoryName: '家常菜', description: '土豆茄子青椒的家常组合', price: 20, emoji: '🥔', ingredients: '土豆、茄子、青椒', method: '蔬菜分别煎香后回锅加酱汁翻匀。', tasteOptions: ['少油', '不辣', '少盐'] },
  { name: '青椒土豆炒肉', categoryName: '家常菜', description: '食材简单，香辣下饭', price: 22, emoji: '🥔', ingredients: '土豆、青椒、猪肉', method: '肉片先炒香，加入土豆和青椒炒熟。', tasteOptions: ['不辣', '多肉', '少油'] },
  { name: '蒜苔炒肉末', categoryName: '家常菜', description: '咸香脆嫩，配饭很香', price: 22, emoji: '🥢', ingredients: '蒜苔、猪肉末、辣椒', method: '肉末炒散后加入蒜苔大火翻炒。', tasteOptions: ['不辣', '多肉', '少油'] },
  { name: '酸辣土豆丝', categoryName: '家常菜', description: '爽脆开胃，百吃不腻', price: 14, emoji: '🥔', ingredients: '土豆、醋、辣椒', method: '土豆丝泡水后大火快炒，出锅前加醋。', tasteOptions: ['不辣', '多醋', '少油'] },
  { name: '清炒时蔬', categoryName: '家常菜', description: '清爽简单，搭配正餐', price: 14, emoji: '🥦', ingredients: '时令蔬菜、蒜', method: '蔬菜焯水或直接大火快炒，保持脆嫩。', tasteOptions: ['少油', '少盐', '多蒜'] },
  { name: '蛋炒饭', categoryName: '主食', description: '剩饭也能炒出香气', price: 16, emoji: '🍳', ingredients: '米饭、鸡蛋、葱花', method: '鸡蛋炒散后加入米饭大火翻炒。', tasteOptions: ['少油', '多蛋', '不葱'] },
  { name: '扬州炒饭', categoryName: '主食', description: '颗粒分明，配料丰富', price: 22, emoji: '🍚', ingredients: '米饭、鸡蛋、火腿、豌豆', method: '配料炒香后加入米饭和鸡蛋翻炒均匀。', tasteOptions: ['少油', '多蛋', '不要火腿'] },
  { name: '煎蛋三明治', categoryName: '早餐', description: '简单但很幸福', price: 12, emoji: '🥪', ingredients: '吐司、鸡蛋、生菜', method: '吐司烘热，夹入煎蛋和生菜。', tasteOptions: ['不酱', '加蛋', '少菜'] },
  { name: '速冻水饺', categoryName: '早餐', description: '方便快速的一餐', price: 18, emoji: '🥟', ingredients: '水饺、葱花、醋', method: '水开后下饺子，煮熟捞出搭配蘸料。', tasteOptions: ['少醋', '不要葱', '多蘸料'] },
  { name: '紫菜蛋花汤', categoryName: '汤', description: '清淡暖胃', price: 10, emoji: '🥣', ingredients: '紫菜、鸡蛋、虾皮', method: '清汤烧开后淋入蛋液，撒紫菜虾皮。', tasteOptions: ['少盐', '多蛋', '不虾皮'] },
  { name: '冬瓜排骨汤', categoryName: '汤', description: '清淡鲜美，适合日常喝', price: 24, emoji: '🥣', ingredients: '冬瓜、排骨、姜', method: '排骨焯水后与冬瓜一起炖至软烂。', tasteOptions: ['少盐', '多汤', '软烂'] },
  { name: '番茄牛腩汤', categoryName: '汤', description: '酸香开胃，汤汁浓郁', price: 32, emoji: '🍅', ingredients: '牛腩、番茄、土豆', method: '牛腩炖软后加入番茄和土豆煮熟。', tasteOptions: ['少油', '多汤', '软烂'] },
  { name: '凉拌黄瓜', categoryName: '凉菜', description: '清爽脆口，开胃解腻', price: 12, emoji: '🥒', ingredients: '黄瓜、蒜、醋', method: '黄瓜拍碎切段，加入调味料拌匀。', tasteOptions: ['不辣', '多醋', '多蒜'] },
  { name: '凉拌鸡丝', categoryName: '凉菜', description: '鲜嫩爽口，低负担', price: 22, emoji: '🥗', ingredients: '鸡胸肉、黄瓜、芝麻', method: '鸡肉煮熟撕丝，与黄瓜和调味汁拌匀。', tasteOptions: ['不辣', '少油', '多黄瓜'] },
  { name: '银耳羹', categoryName: '甜品', description: '清甜软糯，饭后小甜品', price: 12, emoji: '🍵', ingredients: '银耳、红枣、冰糖', method: '银耳泡发后与红枣炖至出胶。', tasteOptions: ['少糖', '多银耳', '温热'] },
  { name: '懒人蛋挞', categoryName: '甜品', description: '外酥里嫩，简单满足', price: 16, emoji: '🥧', ingredients: '蛋挞皮、鸡蛋、牛奶', method: '蛋液倒入蛋挞皮，烤至表面金黄。', tasteOptions: ['少糖', '多蛋', '热乎'] },
  { name: '柠檬水', categoryName: '饮料', description: '清新解腻，冷热皆可', price: 8, emoji: '🍋', ingredients: '柠檬、蜂蜜、饮用水', method: '柠檬切片后加入水和蜂蜜浸泡。', tasteOptions: ['少糖', '多冰', '温热'] },
  { name: '蜂蜜水', categoryName: '饮料', description: '清甜顺口，日常饮品', price: 8, emoji: '🍯', ingredients: '蜂蜜、饮用水', method: '蜂蜜加入温水搅匀即可。', tasteOptions: ['少糖', '温热', '多水'] },
  { name: '水果拼盘', categoryName: '水果', description: '饭后清爽一点', price: 18, emoji: '🍓', ingredients: '草莓、苹果、蓝莓', method: '水果洗净切块，冷藏后装盘。', tasteOptions: ['不要苹果', '多草莓', '常温'] }
];

const QUICK_REMARKS = ['少辣', '不辣', '多放葱', '少油', '不吃香菜', '不要蒜'];

module.exports = {
  ORDER_STATUS,
  DISH_STATUS,
  INVITE_STATUS,
  INVITE_DURATION,
  ORDER_NOTIFY_TEMPLATE_ID,
  MONTHLY_REPORT_TEMPLATE_ID,
  DEFAULT_CATEGORIES,
  DEFAULT_DISHES,
  QUICK_REMARKS
};
