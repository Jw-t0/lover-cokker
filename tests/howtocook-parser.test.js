const test = require('node:test');
const assert = require('node:assert/strict');
const { parseHowToCookMarkdown } = require('../scripts/lib/howtocook-parser');

test('parses HowToCook markdown into recipe library records', () => {
  const markdown = `# 可乐鸡翅的做法

可乐鸡翅色泽红亮、口感嫩滑。从备料到完成大约耗时 40 分钟。

预估烹饪难度：★★★

## 必备原料和工具

* 鸡翅中
* 可乐
* 生抽

## 计算

按照 1 盘的份量：

* 鸡翅 10 ～ 12 只
* 可乐 500ml

## 操作

1. 鸡翅入锅，倒入冷水淹没。
2. 捞出鸡翅，两边划口。
3. 倒入可乐没过鸡翅，煮至收汁。

## 附加内容

* 本菜品偏甜。
`;

  const recipe = parseHowToCookMarkdown(markdown, {
    path: 'dishes/meat_dish/可乐鸡翅.md',
    downloadUrl: 'https://raw.githubusercontent.com/Anduin2017/HowToCook/master/dishes/meat_dish/%E5%8F%AF%E4%B9%90%E9%B8%A1%E7%BF%85.md'
  });

  assert.equal(recipe.name, '可乐鸡翅');
  assert.equal(recipe.category, '荤菜');
  assert.equal(recipe.difficulty, '★★★');
  assert.equal(recipe.sourceName, 'HowToCook');
  assert.equal(recipe.sourceType, 'howtocook');
  assert.equal(recipe.ingredients.includes('鸡翅 10 ～ 12 只'), true);
  assert.deepEqual(recipe.steps, [
    '鸡翅入锅，倒入冷水淹没。',
    '捞出鸡翅，两边划口。',
    '倒入可乐没过鸡翅，煮至收汁。'
  ]);
});
