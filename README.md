# Shiori · 栞

> 一个为视觉小说爱好者做的 VNDB 客户端 —— 深蓝、克制、把「找到下一部想玩的」这件事做顺。

Shiori（日语「栞」，书签）是一个基于 **VNDB（Visual Novel Database）** 的 Android 应用。界面参考了 [Kazumi](https://github.com/Predidit/Kazumi) 的信息密度与浏览手感，配色取自 VNDB 官方默认主题（深蓝 `#051523` / `#0d2741`）。

![status](https://img.shields.io/badge/version-0.1.8-blue)
![platform](https://img.shields.io/badge/platform-Android%207.0%2B-green)

## 功能

**浏览**
- 首页：分类胶囊（高分 / 新作 / 人气 / 恋爱 / 奇幻 / 悬疑 / 科幻 / 日常 / 校园 / 泣系）+ 三列封面墙，下拉续页
- 每日台词：每天随机一条 VN 台词卡片，点进作品
- 搜索：实时搜索 + 组合筛选（排序、平台、年份、时长、评分下限、标签搜索）
- 发售日历：按月浏览，按发售日分组；只有月份/年份的条目归到「日期未定」
- 作品详情：大幅封面（横竖自适应）、日/英/中多语言标题、评分与时长、简介（剧透可展开）、标签、外部链接
- 角色：角色详情页（属性标签、生日/年龄/三围/血型、简介、出演作品）
- 制作：按职位分组的制作人员
- 发行：发行版列表（平台 / 语言 / 介质 / 分级 / 语音 / 无修正 / 开发发行商）
- 截图：双列 + 全屏灯箱
- 相关作品：续作 / 前作 / FD / 同系列等
- 标签页：标签简介 + 该标签下的作品

**账号**
- 支持 VNDB API Token 登录，读取真实收藏列表与统计
- 收藏状态写入（在玩 / 已完成 / 搁置 / 弃坑 / 想玩）、移出收藏、评分

**体验**
- 深蓝 / 浅色 / 跟随系统
- 标题语言：VNDB 默认（罗马字）/ 日语原名 / 英语 / 简体中文 / 繁体中文
- 成人内容封面遮罩
- 记录「我的时长」（本机保存；VNDB 官方 API 不提供时长写入）
- 离线缓存：数据 stale-while-revalidate + 封面图 Service Worker 缓存
- 沉浸式显示：状态栏 / 导航栏透明，内容延伸到系统栏下

## 技术结构

```
.
├── prototype/              # 前端：纯 HTML/CSS/JS，无构建
│   ├── index.html
│   ├── assets/{app.js,style.css}
│   ├── sw.js               # 静态资源 / 封面图缓存
│   └── serve.mjs           # 本地预览服务器 + /kana API 代理
├── android-app/            # Android 壳（WebView + 原生 HTTP 桥）
│   └── app/src/main/java/com/vnlookup/app/MainActivity.java
└── release/                # 打包好的 APK
```

几个关键点：

- **数据**：直接调用 VNDB Kana API。浏览用 `fetch`；写操作（PATCH/DELETE）在浏览器里会被 CORS 拦截，因此提供两条通路：
  - 网页预览：`serve.mjs` 的 `/kana/*` 同源代理
  - APK：`AndroidApp.request()` 原生 HTTP 桥（OkHttp），完全绕开 CORS
- **缓存**：`localStorage` 存 API 结果（列表 2h / 详情 24h / 收藏 60s），过期先显示旧数据再后台刷新；Service Worker 缓存封面图
- **沉浸式**：`setDecorFitsSystemWindows(false)` + 透明系统栏，通过 JS 桥把系统栏高度传给页面做安全区

## 本地开发

### 网页预览

```bash
node prototype/serve.mjs 5188
# http://127.0.0.1:5188
```

### 构建 APK

需要 JDK 17、Android SDK（platform 34 / build-tools 34.0.0）、Gradle 8.7。

1. 生成调试签名（仓库里不含密钥）：

```bash
keytool -genkeypair -v -keystore android-app/app/debug.keystore \
  -storepass android -alias androiddebugkey -keypass android \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Android Debug,O=Android,C=US"
```

2. 写入 SDK 路径并构建：

```bash
echo "sdk.dir=/path/to/Android/Sdk" > android-app/local.properties
cd android-app && gradle assembleDebug
```

产物：`android-app/app/build/outputs/apk/debug/app-debug.apk`

## 免责声明

- 本项目是**非官方**应用，与 VNDB 及 Kazumi 项目均无隶属关系。
- 所有数据版权归 VNDB 及其贡献者所有，使用需遵守 [VNDB API 使用条款](https://api.vndb.org/kana)（非商业用途、请求频率限制）。
- 应用内写操作会直接修改你自己的 VNDB 收藏，请自行确认。
- API Token 仅保存在本机，不会上传。

## License

[MIT](LICENSE)
