# SparkWM 项目主页

网址：<https://spark-wm.github.io/>

推送到 `main` 后，GitHub Actions 会自动构建并发布，大约两分钟后生效。

## 改文字和数字

页面上的文字（中英两版）、数字、链接和样片都写在 `src/content.ts` 里，组件只负责排版。

| 要改什么 | 在哪里 |
|---|---|
| 论文、代码链接，作者名单 | `links`、`authors` |
| RTX 5090 每块耗时 | `efficiency.speed`，以及 `facts` 的第一项 |
| 样片的提示词 | `clips[].prompt` |
| 正式发布 | 把 `DRAFT` 改成 `false`，并删掉 `index.html` 里 `robots noindex` 那一行 |

`DRAFT = true` 时，还空着的地方显示“待补”，页面顶上有一条预览横幅；改成 `false` 后，空着的地方直接隐藏。

中文字体只保留页面上用到的字。CI 每次构建都会按 `src/` 里的文字重新裁剪；本地预览时如果加了新字，先跑一次 `python3 tools/build_fonts.py`。

## 加样片

需要一段压缩好的 mp4（1344×768、24 fps、带 AAC 声音），以及 ffmpeg 和 `tools/requirements.txt` 里的 Python 包。

```bash
python3 tools/prep_assets.py clip.mp4 demo3 public/media
cp public/media/demo3/meta.json src/data/demo3.json
```

然后在 `content.ts` 的 `clips` 里加一行：照 `demo1` 的写法 import 这个 json，再写上标题和提示词。样片墙按 `clips` 的顺序排列。

首屏轮播放哪几段、每段取哪几秒，写在 `src/data/reel.config.json` 里。改完跑一次 `python3 tools/build_reel.py`。

## 本地预览

```bash
npm ci
npm run dev
```
