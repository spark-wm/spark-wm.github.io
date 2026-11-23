# SparkWM 项目主页：维护说明

Maintainer notes for the SparkWM team (in Chinese). 仓库首页的介绍见 [README.md](README.md)。

网址：<https://spark-wm.github.io/>

推送到 `main` 后，GitHub Actions 会自动构建并发布，大约两分钟后生效。

## 改文字和数字

页面上的文字（中英两版）、数字、链接和样片都写在 `src/content.ts` 里，组件只负责排版。

| 要改什么 | 在哪里 |
|---|---|
| 论文、代码链接，作者名单 | `links`、`authors` |
| RTX 5090 每块耗时 | `efficiency.speed`（一张卡、四张卡），以及 `facts` 的第一项 |
| 和 H3 的端到端耗时对比 | `efficiency.latency`：`setup` 写测试条件，`rows` 里填两行的秒数 |
| 样片的提示词 | `clips[].prompt` |
| 正式发布 | 把 `DRAFT` 改成 `false`，并删掉 `index.html` 里 `robots noindex` 那一行 |

`DRAFT = true` 时，页面顶上有一条预览横幅，还没测的数在“加速效果”一节标一次“待补”；改成 `false` 后，空着的地方直接隐藏，“加速效果”一节在一个数都没有时整节不显示。

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

## README 用的图

都在 `.github/assets/`，不进网站产物。

- `sparkwm-reel.webp`：首屏轮播的无声动图。换了轮播片段后重新生成：
  ```bash
  ffmpeg -i public/media/reel/reel-sd.mp4 -vf "fps=15,scale=800:-2:flags=lanczos" -c:v libwebp_anim -quality 55 -compression_level 6 -loop 0 -an .github/assets/sparkwm-reel.webp
  ```
- `sparkwm-pipeline-en.gif`、`sparkwm-pipeline-zh.gif`：训练流程动画，从网页上逐帧录下来的，改了 `PipelineFigure.vue` 要重录。
- `sparkwm-logo-light.svg`、`sparkwm-logo-dark.svg`：从 `BrandMark.vue` 导出，按 GitHub 的深浅色主题切换。
- `social-preview.jpg`（1280×640）：仓库的社交预览图，在 Settings → General → Social preview 里上传。它和 `public/og.jpg`（1200×630，网页的分享卡片）是同一个版式，用的是模型生成的画面。
