# 菜品大全数据源调研

## 结论

当前版本不直接抓取下厨房、美食天下等站点的菜谱正文，而是使用 HowToCook 开源仓库作为“菜品大全”的主数据源。实现方式不是抓取 Dashboard 页面 HTML，而是下载 GitHub 仓库中的 `dishes/**/*.md` Markdown 菜谱并离线解析成本地小程序数据。

## 候选来源

### HowToCook

- 网站：https://howtocook.aiursoft.com/Dashboard
- 仓库：https://github.com/Anduin2017/HowToCook
- 许可证：Unlicense，授权非常宽松，可复制、修改、发布和商用。
- 状态：仓库活跃，`dishes/` 下有数百个 Markdown 菜谱，结构包含原料、计算、操作和附加内容。
- 当前项目采用方式：运行 `npm run sync:recipes` 下载仓库压缩包，解析 `dishes/**/*.md`，生成 `miniprogram/data/howtocook-recipes.js`。
- 优点：授权清晰、结构稳定、可追溯、适合离线打包，不需要绕反爬。
- 注意：菜谱是社区内容，上线前仍建议保留来源署名；当前页面已保存 `sourceName`、`sourceType` 和 `sourceUrl`。

### 天行数据菜谱 API

- 地址：https://apis.tianapi.com/caipu/index
- 状态：接口可访问，但需要 API key；未带 key 返回“缺少API密钥参数”，错误 key 返回“API密钥无效”。
- 适合：通过云函数按关键词查询或定时同步到云数据库。
- 注意：需要在服务商后台确认套餐、调用额度、授权范围和是否允许在小程序中展示做法正文。

### 聚合数据菜谱大全 API

- 地址：https://www.juhe.cn/docs/api/id/46
- 页面说明：菜谱大全 API 收录蛋、奶制品、饼、面、蔬菜、水果、干果、肉类、水产等类别，十多万条菜谱数据，每日更新。
- 适合：有正式 API 文档和服务商授权，适合上线版本。
- 注意：需要申请 API key，并确认费用、商用授权和缓存策略。

### Ta-da recipe dataset

- 地址：https://github.com/Eimo-Bai/Ta-da-recipe-dataset
- 页面说明：中文菜谱数据集，包含菜谱信息、食材信息、口味信息等；README 显示完整数据尚未全部公开。
- 适合：研究、原型验证和数据结构参考。
- 注意：公开数据量可能有限；正式使用前需要确认许可证和可再发布范围。

### 下厨房

- 地址：https://www.xiachufang.com/robots.txt
- 调研结果：robots.txt 对搜索页、评论页、部分菜谱参数页等有明确限制，并设置 Crawl-delay。
- 建议：不作为直接爬虫来源。若要使用，应只抓允许路径、控制频率，并先确认服务条款和版权授权。

### 美食中国

- 地址：https://home.meishichina.com/robots.txt
- 调研结果：robots.txt 允许普通抓取，但通过 Content-Signal 明确限制部分 AI 训练用途。
- 建议：可作为人工参考或搜索索引入口，不建议未经授权批量复制菜谱正文到小程序。

## 推荐落地路径

1. 当前版本：使用 HowToCook 离线数据生成本地菜谱库，保证页面、搜索、分类、食材和做法完整可用。
2. 下一阶段：如果需要动态更新，新增云函数 `syncRecipeLibrary`，定期同步 HowToCook 或接入天行数据/聚合数据 API。
3. 上线前：补充数据更新时间、来源署名、缓存策略和失败降级。
