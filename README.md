# Shiori · 栞

> 一个为视觉小说爱好者做的 VNDB 客户端

Shiori（日语「栞」，书签）是一个基于 **VNDB（Visual Novel Database）** 的 Android 应用,配色取自 VNDB 官方默认主题（深蓝 `#051523` / `#0d2741`）。

![status](https://img.shields.io/badge/version-0.1.8-blue)
![platform](https://img.shields.io/badge/platform-Android%207.0%2B-green)


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


## 免责声明

- 本项目是**非官方**应用，与 VNDB 无隶属关系。
- 所有数据版权归 VNDB 及其贡献者所有，使用需遵守 [VNDB API 使用条款](https://api.vndb.org/kana)（非商业用途、请求频率限制）。
- 应用内写操作会直接修改你自己的 VNDB 收藏，请自行确认。
- API Token 仅保存在本机，不会上传。

## License

[MIT](LICENSE)
