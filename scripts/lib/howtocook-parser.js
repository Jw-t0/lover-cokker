const CATEGORY_LABELS = {
  aquatic: '水产',
  breakfast: '早餐',
  condiment: '调料',
  dessert: '甜品',
  drink: '饮品',
  meat_dish: '荤菜',
  'semi-finished': '半成品',
  soup: '汤羹',
  staple: '主食',
  vegetable_dish: '素菜'
};

const CATEGORY_COVERS = {
  水产: '🐟',
  早餐: '🥣',
  调料: '🧂',
  甜品: '🍰',
  饮品: '🥤',
  荤菜: '🍖',
  半成品: '🥟',
  汤羹: '🍲',
  主食: '🍚',
  素菜: '🥬'
};

function stripMarkdown(text) {
  return String(text || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .trim();
}

function normalizeLine(line) {
  return stripMarkdown(line)
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/^\s*\d+[.)、]\s*/, '')
    .trim();
}

function splitSections(markdown) {
  const sections = {};
  let current = 'intro';
  sections[current] = [];
  String(markdown || '').split(/\r?\n/).forEach((line) => {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = stripMarkdown(heading[1]);
      sections[current] = [];
      return;
    }
    sections[current].push(line);
  });
  return sections;
}

function extractListItems(lines) {
  return lines
    .map((line) => line.match(/^\s*(?:[-*+]|\d+[.)、])\s+(.+?)\s*$/))
    .filter(Boolean)
    .map((match) => normalizeLine(match[1]))
    .filter(Boolean)
    .filter((line) => !line.startsWith('这一步') && !line.startsWith('注意'));
}

function extractSteps(lines) {
  const steps = [];
  let current = '';
  lines.forEach((line) => {
    const ordered = line.match(/^\s*\d+[.)、]\s+(.+?)\s*$/);
    if (ordered) {
      if (current) steps.push(current);
      current = normalizeLine(ordered[1]);
      return;
    }
    const continuation = normalizeLine(line);
    if (current && continuation && !line.match(/^\s*[-*+]\s+/)) {
      current = `${current} ${continuation}`.trim();
    }
  });
  if (current) steps.push(current);
  return steps.filter(Boolean);
}

function extractSummary(introLines) {
  const summary = introLines
    .map(stripMarkdown)
    .filter(Boolean)
    .filter((line) => !line.startsWith('预估烹饪难度') && !line.startsWith('预估卡路里'))
    .join(' ');
  return summary.slice(0, 88);
}

function extractDifficulty(markdown) {
  const match = String(markdown || '').match(/预估烹饪难度[:：]\s*([★☆]+)/);
  return match ? match[1] : '家常';
}

function pathToCategory(path) {
  const folder = String(path || '').split('/')[1] || '';
  return CATEGORY_LABELS[folder] || '菜谱';
}

function pathToId(path) {
  return `howtocook-${String(path || '')
    .replace(/^dishes\//, '')
    .replace(/\.md$/, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')}`;
}

function pathToName(path) {
  const file = decodeURIComponent(String(path || '').split('/').pop() || '').replace(/\.md$/, '');
  return file.replace(/的做法$/, '');
}

function parseHowToCookMarkdown(markdown, meta = {}) {
  const title = String(markdown || '').match(/^#\s+(.+?)\s*$/m);
  const name = title ? stripMarkdown(title[1]).replace(/的做法$/, '') : pathToName(meta.path);
  const sections = splitSections(markdown);
  const category = pathToCategory(meta.path);
  const calculatedIngredients = extractListItems(sections['计算'] || []);
  const baseIngredients = extractListItems(sections['必备原料和工具'] || []);
  const ingredients = calculatedIngredients.length ? calculatedIngredients : baseIngredients;
  const steps = extractSteps(sections['操作'] || []);
  const shortTips = extractListItems(sections['附加内容'] || []).filter((tip) => tip.length <= 8);

  return {
    id: pathToId(meta.path || name),
    name,
    category,
    difficulty: extractDifficulty(markdown),
    time: '按步骤制作',
    cover: CATEGORY_COVERS[category] || '🍽️',
    summary: extractSummary(sections.intro || []) || `${name}的做法来自 HowToCook 开源菜谱。`,
    ingredients,
    steps,
    tags: [category, 'HowToCook'].concat(shortTips.slice(0, 2)),
    sourceName: 'HowToCook',
    sourceType: 'howtocook',
    sourceUrl: meta.htmlUrl || meta.downloadUrl || ''
  };
}

module.exports = {
  CATEGORY_LABELS,
  parseHowToCookMarkdown
};
