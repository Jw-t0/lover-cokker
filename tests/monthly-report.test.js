const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildMonthlyReport } = require('../miniprogram/utils/domain/report');

test('builds a monthly dish report from completed and reviewed orders', () => {
  const report = buildMonthlyReport({
    month: '2026-07',
    orders: [
      {
        status: 'reviewed',
        createdAt: new Date('2026-07-03T12:00:00+08:00').getTime(),
        totalPrice: 92,
        items: [
          { dishId: 'd1', name: '可乐鸡翅', quantity: 2, subtotal: 56 },
          { dishId: 'd2', name: '番茄炒蛋', quantity: 1, subtotal: 16 }
        ]
      },
      {
        status: 'completed',
        createdAt: new Date('2026-07-20T12:00:00+08:00').getTime(),
        totalPrice: 28,
        items: [{ dishId: 'd1', name: '可乐鸡翅', quantity: 1, subtotal: 28 }]
      },
      {
        status: 'reviewed',
        createdAt: new Date('2026-06-20T12:00:00+08:00').getTime(),
        totalPrice: 99,
        items: [{ dishId: 'd3', name: '六月菜', quantity: 9, subtotal: 99 }]
      }
    ],
    reviews: [{ rating: 5 }, { rating: 4 }]
  });

  assert.equal(report.month, '2026-07');
  assert.equal(report.orderCount, 2);
  assert.equal(report.totalPrice, 120);
  assert.equal(report.totalDishes, 4);
  assert.equal(report.topDish.name, '可乐鸡翅');
  assert.deepEqual(report.dishes.map((dish) => ({ name: dish.name, quantity: dish.quantity })), [
    { name: '可乐鸡翅', quantity: 3 },
    { name: '番茄炒蛋', quantity: 1 }
  ]);
  assert.equal(report.rating, 4.5);
});

test('monthly report rating only includes reviews from the requested month', () => {
  const report = buildMonthlyReport({
    month: '2026-07',
    orders: [
      { status: 'reviewed', createdAt: new Date('2026-07-10T10:00:00Z').getTime(), totalPrice: 20, items: [] }
    ],
    reviews: [
      { rating: 5, createdAt: new Date('2026-07-11T10:00:00Z').getTime() },
      { rating: 1, createdAt: new Date('2026-06-11T10:00:00Z').getTime() }
    ]
  });

  assert.equal(report.rating, 5);
});

test('monthly report page supports selecting another month and distinguishes generation from push', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/monthly-report/monthly-report.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/monthly-report/monthly-report.wxml'), 'utf8');

  assert.match(js, /onMonthChange/);
  assert.match(js, /MONTHLY_REPORT_TEMPLATE_ID/);
  assert.match(wxml, /fields="month"/);
  assert.match(wxml, /生成并推送月报|刷新月报/);
});

test('monthly report keeps role navigation and distinguishes an unrated month', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/monthly-report/monthly-report.wxml'), 'utf8');
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, '../miniprogram/pages/monthly-report/monthly-report.json'), 'utf8'));

  assert.match(wxml, /<role-tab-bar current="\/pages\/monthly-report\/monthly-report" \/>/);
  assert.match(wxml, /暂未评分/);
  assert.match(wxml, /刷新月报/);
  assert.equal(json.usingComponents['role-tab-bar'], '/components/role-tab-bar/role-tab-bar');
});

test('monthly report ignores stale results after quickly switching months', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/monthly-report/monthly-report.js'), 'utf8');

  assert.match(js, /typeof wx !== 'undefined'/);
  assert.match(js, /reportRequestId/);
});
