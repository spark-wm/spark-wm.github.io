# SparkStream 项目主页：维护说明

Maintainer notes for the SparkStream team (in Chinese). 仓库首页的介绍见 [README.md](README.md)。

网址：<https://SparkDiffusion-AR.github.io/>

推送到 `main` 后，GitHub Actions 会自动构建并发布，大约两分钟后生效。

## 改文字和数字

页面只有英文版。页面上的文字、数字、链接和样片都写在 `src/content.ts` 里，组件只负责排版。

| 要改什么 | 在哪里 |
|---|---|
| 论文、代码链接，作者名单 | `links`、`authors` |
| RTX 5090 每块耗时 | `efficiency.speed`（一张卡、四张卡），以及 `facts` 的第一项 |
| 和 H3 的端到端耗时对比 | `efficiency.latency`：`setup` 写测试条件，`rows` 里填两行的秒数 |
| 样片的提示词 | `clips[].prompt` |
| 引用 | `bibtex` 是 SparkStream 自己的条目，论文上 arXiv 后换成 arXiv 导出的 BibTeX；`relatedBibtex` 是 SparkDiffusion 和 RoLA 两条，照 SparkDiffusion 仓库 README 里的写法 |
| 正式发布 | 把 `DRAFT` 改成 `false`，并删掉 `index.html` 里 `robots noindex` 那一行 |

`DRAFT = true` 时，页面顶上有一条预览横幅，还没测的数在“加速效果”一节标一次“待补”；改成 `false` 后，空着的地方直接隐藏，“加速效果”一节在一个数都没有时整节不显示。

页面用两套拉丁字体（Archivo、Newsreader 斜体），已经按固定的字符范围裁剪好，放在 `src/assets/fonts/`。换字体文件，或者页面上用到了范围之外的符号时，改 `tools/build_fonts.py` 里的范围再跑一次，把生成的 woff2 一起提交。

## 加样片

需要一段 mp4（1344×768、24 fps、带 AAC 声音，原画质也行，脚本会重新压缩），以及 ffmpeg 和 `tools/requirements.txt` 里的 Python 包。脚本很吃 CPU，`FF_THREADS` 控制 ffmpeg 用几个线程（默认 2）；`GAIN_DB` 给声音加增益（默认 0），只在原片太轻时用，增益不要让峰值超过 -1.5 dBFS。

```bash
python3 tools/prep_assets.py clip.mp4 my-clip public/media
cp public/media/my-clip/meta.json src/data/clips/my-clip.json
```

然后在 `content.ts` 的 `clips` 里加一行 `clip('my-clip', 'English title')`，`src/data/clips/` 里的 json 会自动读进来。样片墙按 `clips` 的顺序排列。方法一节的逐块示意图用哪段、长视频一节放哪几段，分别是 `chunkFigureClip` 和 `rolloutClips`。

首屏轮播放哪几段、每段取哪几秒，写在 `src/data/reel.config.json` 里。改完跑一次 `python3 tools/build_reel.py`。

## 本地预览

```bash
npm ci
npm run dev
```

## README 用的图

都在 `.github/assets/`，不进网站产物。

- `sparkstream-reel.webp`：首屏轮播的无声动图。换了轮播片段后重新生成：
  ```bash
  ffmpeg -i public/media/reel/reel-sd.mp4 -vf "fps=10,scale=800:-2:flags=lanczos" -c:v libwebp_anim -quality 40 -compression_level 6 -loop 0 -an .github/assets/sparkstream-reel.webp
  ```
- `sparkstream-pipeline-en.gif`：训练流程动画，从网页（`index.html?record=pipeline`）上逐帧录下来的，改了 `PipelineFigure.vue` 或 `content.ts` 里 `training.fig` 的标签要重录。
- `sparkstream-pipeline-zh.gif`：中文 README 用的同一段动画，是网页还有中文版时录的，现在不能重录；动画改了以后，让 `README.zh-CN.md` 也用英文那张，并删掉这个文件。
- `sparkstream-logo-light.svg`、`sparkstream-logo-dark.svg`：从 `BrandMark.vue` 导出，按 GitHub 的深浅色主题切换。
- `social-preview.jpg`（1280×640）：仓库的社交预览图，在 Settings → General → Social preview 里上传。它和 `public/og.jpg`（1200×630，网页的分享卡片）是同一个版式，用的是模型生成的画面。
