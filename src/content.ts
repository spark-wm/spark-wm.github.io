// All text, numbers, links and clips of the page live here.
// Fill an empty string / null and the page shows it; leave it empty and the page hides it
// (in a DRAFT build a "pending" marker is shown instead, so the team can see what is missing).
// Every number below was checked against the training code and records; check the source before changing one.

import demo1 from './data/demo1.json'
import demo2 from './data/demo2.json'

export type L = { en: string; zh: string }
export type Lang = keyof L

/** Preview build: shows pending markers and a banner. Set to false for the public release. */
export const DRAFT = true

export const links = {
  paper: '', // arXiv or PDF URL
  code: '', // GitHub repository URL
  weights: '', // Hugging Face URL
}

export interface Author { name: string; aff: number[]; equal?: boolean; corr?: boolean; lead?: boolean; url?: string }
/** Order and marks follow the technical report (Overleaf main.tex, 11-23). aff indexes into `affiliations` (1-based). */
export const authors: Author[] = [
  { name: 'Yuxi Liu', aff: [1, 2], equal: true, lead: true },
  { name: 'Zhengyang Huang', aff: [1], equal: true },
  { name: 'Haiming Sun', aff: [1], equal: true },
  { name: 'Shikun Ruan', aff: [1], equal: true },
  { name: 'Tianle Liu', aff: [1] },
  { name: 'Yixiang Cai', aff: [1] },
  { name: 'Zekun Zhang', aff: [1], corr: true },
  { name: 'Tengxu Sun', aff: [2], corr: true },
  { name: 'Baole Ai', aff: [2] },
  { name: 'Ang Wang', aff: [2] },
  { name: 'Jiamang Wang', aff: [2] },
  { name: 'Lin Qu', aff: [2] },
  { name: 'Kun Yuan', aff: [1], corr: true },
]
/** Superscript after a name: affiliations, then * equal contribution, † corresponding, ‡ project leader. */
export const authorMarks = (a: Author) => a.aff.join(',') + (a.equal ? '*' : '') + (a.corr ? '†' : '') + (a.lead ? '‡' : '')
export const authorNotes: L[] = [
  { en: '* Equal contribution', zh: '* 共同第一作者' },
  { en: '† Corresponding authors', zh: '† 通讯作者' },
  { en: '‡ Project leader', zh: '‡ 项目负责人' },
]

export const affiliations = [
  { id: 1, name: { en: 'Peking University, Melon Group', zh: '北京大学 Melon Group' }, logo: 'logos/pku.svg' },
  { id: 2, name: { en: 'Alibaba Group', zh: '阿里巴巴集团' }, logo: 'logos/alibaba.svg' },
]

export interface ClipMeta {
  id: string; duration: number; width: number; height: number; fps: number; chunkSec: number; chunks: number
  strip: { tileW: number; tileH: number }; chunksBig: { tileW: number; tileH: number }; revisit: number[]
  spec: { bins: number; cols: number; colsPerSec: number }
  envelope: { rate: number; l: number[]; r: number[] }
  camera: null | { c2w: number[][] }
}

export interface Clip {
  id: string
  title: L
  /** The text prompt used for this clip. null = not yet provided. */
  prompt: L | null
  meta: ClipMeta
  /** Seconds of audio cut before each video chunk boundary (H3 audio encoder look-ahead, measured ~290 ms). */
  audioLead: number
}

export const clips: Clip[] = [
  { id: 'demo1', title: { en: 'Rail yard', zh: '铁路货场' }, prompt: null, meta: demo1 as ClipMeta, audioLead: 0.3 },
  { id: 'demo2', title: { en: 'Bathhouse', zh: '浴场' }, prompt: null, meta: demo2 as ClipMeta, audioLead: 0.3 },
]

export const mediaPath = (id: string, file: string) => `media/${id}/${file}`

/** Slots on the demo wall. In a DRAFT build the slots without a clip show a pending marker; the release shows only real clips. */
export const wallSlots = 9

/** Shown in the facts row. value null = pending. */
export const facts: { value: string | null; unit?: string; label: L; countTo?: number }[] = [
  { value: '10', unit: 's', countTo: 10, label: { en: 'of audio-video generated on a single RTX 5090', zh: '单张 RTX 5090 上能生成的音视频长度' } },
  { value: '4', countTo: 4, label: { en: 'denoising steps per chunk', zh: '每块的去噪步数' } },
  { value: '≈10', unit: '%', label: { en: 'of video token groups each query group attends to exactly, from chunk 3 on', zh: '每个查询组精确计算的视频 token 组占比（第 3 块起）' } },
  { value: '≈0.7', unit: 's', label: { en: 'of video per chunk', zh: '每块的视频长度' } },
  { value: '33', unit: 'B', countTo: 33, label: { en: 'H3 parameters, frozen during training', zh: 'H3 参数，训练时冻结' } },
]

/** Speed figures. The claim is: SparkWM runs on a single RTX 5090, plus the end-to-end speed-up of distributed inference on RTX 5090s. */
export const efficiency = {
  /** Longest clip one RTX 5090 (32 GB) generates, in seconds (Shikun, group chat 11-23 20:32). */
  singleGpuSeconds: 10,
  /** End-to-end speed-up of distributed inference on `gpus` RTX 5090s. null = pending. */
  multi: { speedup: null as number | null, gpus: null as number | null },
  /**
   * End-to-end time to generate the same clip, H3 vs SparkWM. seconds null = pending; the speed-up is
   * computed from the first and the `ours` row once both are filled. `setup` is the measurement condition.
   */
  latency: {
    setup: null as L | null,
    rows: [
      { name: { en: 'H3', zh: 'H3' }, note: { en: 'whole clip at once, about 30 steps', zh: '整段一起生成，约 30 步' }, seconds: null as number | null, ours: false },
      { name: { en: 'SparkWM', zh: 'SparkWM' }, note: { en: 'chunk by chunk, 4 steps per chunk', zh: '逐块生成，每块 4 步' }, seconds: null as number | null, ours: true },
    ],
  },
}

export const bibtex = `@article{sparkwm2026,
  title = {SparkWM},
  author = {Liu, Yuxi and Huang, Zhengyang and Sun, Haiming and Ruan, Shikun and Liu, Tianle and Cai, Yixiang and Zhang, Zekun and Sun, Tengxu and Ai, Baole and Wang, Ang and Wang, Jiamang and Qu, Lin and Yuan, Kun},
  journal = {arXiv preprint},
  year = {2026}
}`

// ---------------------------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------------------------

export const t = {
  pageTitle: { en: 'SparkWM: Audio-Video World Model', zh: 'SparkWM：音视频世界模型' },
  nav: {
    demos: { en: 'Demos', zh: '样片' },
    method: { en: 'Method', zh: '加速方法' },
    results: { en: 'Speed-up', zh: '加速效果' },
    training: { en: 'Training', zh: '训练' },
    citation: { en: 'Citation', zh: '引用' },
    lang: { en: '中文', zh: 'EN' },
    soundOn: { en: 'Sound on', zh: '声音已开' },
    soundOff: { en: 'Sound off', zh: '声音已关' },
    theme: { en: 'Switch colour theme', zh: '切换深浅色' },
    toLight: { en: 'Switch to light theme', zh: '切换到浅色' },
    toDark: { en: 'Switch to dark theme', zh: '切换到深色' },
    sound: { en: 'Sound', zh: '声音' },
    sections: { en: 'Sections', zh: '章节' },
    langLabel: { en: 'Switch to Chinese', zh: '切换到英文' },
    skip: { en: 'Skip to content', zh: '跳到正文' },
  },
  hero: {
    lead: {
      en: 'SparkWM is an audio-video world model post-trained from MiniMax H3 33B. H3 generates a whole audio-video clip of about 6.6 s at once in about 30 denoising steps; SparkWM generates it chunk by chunk, in only 4 denoising steps per chunk.',
      zh: 'SparkWM 是由 MiniMax H3 33B（330 亿参数）后训练而成的音视频世界模型。H3 一次生成整段约 6.6 秒的音视频，要去噪约 30 步；SparkWM 改为逐块生成，每块只去噪 4 步。',
    },
    base: {
      en: 'Each chunk covers about 0.7 s of video and is conditioned on a text prompt, the first frame and a camera trajectory. From its KV cache, a chunk reads only the prompt, the first frame and up to 5 preceding chunks, so the cost per chunk does not grow with video length. From chunk 3 on, sparse attention cuts compute further, and the model is trained with 8-bit (MXFP8) fake quantization; a single RTX 5090 generates 10 s of audio and video.',
      zh: '每块是约 0.7 秒的视频，根据提示词、第一帧和相机轨迹生成。生成每一块时，从缓存只读取提示词、第一帧和前面最多 5 块，因此每块的计算量不随视频变长而增加。从第 3 块起改用稀疏注意力，进一步减少计算量；训练时还对模型做了 8 位精度（MXFP8）的伪量化，单张 RTX 5090 上就能生成 10 秒的音视频。',
    },
    paper: { en: 'Paper', zh: '论文' },
    code: { en: 'Code', zh: '代码' },
    weights: { en: 'Weights', zh: '权重' },
    soon: { en: 'soon', zh: '即将公开' },
  },
  player: {
    chunk: { en: 'Chunk', zh: '第' },
    chunkOf: { en: 'of', zh: '块，共' },
    chunkEnd: { en: '', zh: '块' },
    video: { en: 'Video', zh: '画面' },
    sound: { en: 'Sound', zh: '声音' },
    prompt: { en: 'Prompt', zh: '提示词' },
    memory: { en: 'Cache', zh: '缓存' },
    play: { en: 'Play', zh: '播放' },
    pause: { en: 'Pause', zh: '暂停' },
    turnOn: { en: 'Turn sound on', zh: '打开声音' },
    turnOff: { en: 'Mute', zh: '静音' },
    seek: { en: 'Timeline, use arrow keys to step one chunk', zh: '时间轴，方向键逐块跳转' },
    promptPending: { en: 'Prompt to be added', zh: '提示词待补' },
  },
  reel: {
    label: { en: 'Generated clips, playing in turn', zh: '生成样片轮播' },
    open: { en: 'Watch the full clip', zh: '看完整样片' },
    seg: { en: 'Clip', zh: '样片' },
  },
  demos: {
    title: { en: 'Generated clips', zh: '生成样片' },
    more: { en: 'More clips', zh: '更多样片' },
    seconds: { en: 's', zh: '秒' },
    body: {
      en: 'Every clip is generated chunk by chunk from a given first frame. The player steps through the chunks in generation order and marks, above the current chunk, the cached chunks it read.',
      zh: '每段样片都从给定的第一帧开始逐块生成。播放器按生成顺序逐块推进，并在当前块上方标出它读取的缓存块。',
    },
  },
  method: {
    title: { en: 'Method', zh: '加速方法' },
    body: {
      en: 'H3 applies full attention across all frames of the clip. SparkWM changes the generation scheme, the number of denoising steps, the attention computation and the numeric precision.',
      zh: 'H3 生成时所有帧之间做全量注意力。SparkWM 改变了生成方式、去噪步数、注意力的计算方式和模型的数值精度。',
    },
    chunkTitle: { en: 'Chunk-by-chunk generation in 4 steps', zh: '逐块生成与 4 步去噪' },
    chunkBody: {
      en: 'Video is generated chunk by chunk, about 0.7 s each. For each chunk, SparkWM reads the prompt, the first frame and up to 5 preceding chunks from its KV cache, denoises in 4 steps, then writes the chunk into the cache and drops the oldest one. The cache never holds more than 5 chunks, so the cost per chunk does not grow with video length.',
      zh: '视频逐块生成，每块约 0.7 秒。生成一块时，SparkWM 从 KV 缓存读取提示词、第一帧和前面最多 5 块，去噪 4 步，再把这一块写入缓存、移出最早的一块。缓存始终不超过 5 块，所以每块的计算量不随视频变长而增加。',
    },
    chunkCaption: {
      en: 'Frames from the Rail yard clip. Noise is drawn on pixels for illustration; the model denoises latents.',
      zh: '画面取自铁路货场样片；噪声画在像素上，模型实际在 latent 上去噪。',
    },
    condition: { en: 'Prompt and first frame', zh: '提示词和第一帧' },
    cache: { en: 'Five most recent chunks', zh: '最近 5 块' },
    current: { en: 'Current chunk', zh: '当前块' },
    step: { en: 'Step', zh: '第' },
    stepOf: { en: 'of 4', zh: '步，共 4 步' },
    done: { en: 'Done, written to the cache', zh: '完成，写入缓存' },
    sparseTitle: { en: 'Sparse attention with RoLA', zh: '稀疏注意力（RoLA）' },
    sparseBody: {
      en: 'From chunk 3 on, attention switches to RoLA: queries and keys are split into token groups, and each query group computes exact attention only over about 10% of the video token groups, those most similar to it, while a low-rank branch adds a cheap approximation over all groups. The first 2 chunks keep full attention: their history is still short, so full attention costs little there.',
      zh: '从第 3 块起，注意力换成 RoLA：查询和键分成若干 token 组，每个查询组只和最相关的约 10% 视频 token 组做精确计算，另有一条低秩支路对全部 token 组做代价很低的近似。开头 2 块的历史还短、计算量小，仍用全量注意力。',
    },
    sparseCaption: {
      en: 'Schematic with 10 token groups per chunk (a real chunk has 5,040 video tokens). Besides its selected 10%, each query group also reads the group at its own position, so the share it reads is slightly above 10%.',
      zh: '示意图：每块画成 10 个 token 组（实际每块有 5040 个视频 token）。每个查询组除了选出的 10%，还读取同一位置的 token 组，所以实际读取的比例略高于 10%。',
    },
    full: { en: 'Full attention', zh: '全量注意力' },
    sparse: { en: 'SparkWM', zh: 'SparkWM' },
    exact: { en: 'computed exactly', zh: '精确计算' },
    lowrank: { en: 'low-rank branch', zh: '低秩支路' },
    always: { en: 'always read', zh: '固定读取' },
    queries: { en: 'Query groups of the current chunk', zh: '当前块的查询 token 组' },
    keys: { en: 'Key groups', zh: '键 token 组' },
    quantTitle: { en: 'Quantization-aware training (QAT)', zh: '量化感知训练' },
    quantBody: {
      en: 'SparkWM is built to run on a single RTX 5090 (32 GB). To this end, from training stage 5 on, the weights and activations of the backbone\u2019s attention and feed-forward layers are fake-quantized to MXFP8 in the forward pass, so the model adapts to 8-bit precision during training. Our inference code reuses the quantization settings recorded in training and needs no separate post-training quantization.',
      zh: 'SparkWM 要在单张 RTX 5090（32 GB 显存）上运行。为此，从训练阶段 5 起，前向计算就对主干网络注意力层和前馈层的权重和激活做 MXFP8 伪量化，让模型在训练中适应 8 位精度；我们的推理代码直接沿用训练时记录的量化设置，不需要再做训练后量化。',
    },
    quantCaption: {
      en: 'MXFP8 splits values into groups of 32 that share one power-of-two scale, and rounds each value to the nearest 8-bit float.',
      zh: 'MXFP8 把数值每 32 个分成一组，组内共用一个 2 的幂缩放因子，每个数取最近的 8 位浮点值。',
    },
    qGroup: { en: 'One group of 32 values sharing one scale', zh: '一组 32 个数，共用一个缩放因子' },
    qBits: { en: 'bits per value', zh: '位，每个数' },
    qOrig: { en: 'BF16 value', zh: 'BF16 原值' },
    qSnap: { en: 'MXFP8 value', zh: 'MXFP8 取值' },
    qGrid: { en: 'representable 8-bit values', zh: '可取的 8 位浮点值' },
    compareTitle: { en: 'Compared with H3', zh: '和 H3 对比' },
    overview: {
      label: { en: 'From H3 to SparkWM', zh: '从 H3 到 SparkWM' },
      saves: { en: 'Reduces', zh: '减少的开销' },
      result: { en: 'End-to-end speed-up', zh: '端到端加速' },
      cards: [
        { name: { en: 'MiniMax H3 33B', zh: 'MiniMax H3 33B' }, note: { en: 'whole clip at once, about 30 steps', zh: '整段一起生成，约 30 步' }, cut: null },
        { name: { en: 'Chunk by chunk', zh: '逐块生成' }, note: { en: 'each chunk reads up to 5 preceding chunks from the cache', zh: '每块只从缓存读取前面最多 5 块' }, cut: { en: 'context read per chunk', zh: '每块读取的上下文' } },
        { name: { en: '4-step distillation', zh: '4 步蒸馏' }, note: { en: 'about 30 steps to 4 per chunk', zh: '约 30 步减到每块 4 步' }, cut: { en: 'denoising steps', zh: '去噪步数' } },
        { name: { en: 'RoLA sparse attention', zh: 'RoLA 稀疏注意力' }, note: { en: 'from chunk 3, exact attention on about 10% of video token groups', zh: '第 3 块起，每个查询组只精确计算约 10% 的视频 token 组' }, cut: { en: 'attention compute', zh: '注意力计算量' } },
        { name: { en: 'MXFP8 quantization-aware training', zh: 'MXFP8 量化感知训练' }, note: { en: 'weights and activations of the backbone attention and FFN layers in 8 bits', zh: '主干注意力和前馈层的权重和激活用 8 位' }, cut: { en: 'bit width, 16 to 8', zh: '位宽从 16 位降到 8 位' } },
      ] as { name: L; note: L; cut: L | null }[],
    },
  },
  training: {
    title: { en: 'Training pipeline', zh: '训练流程' },
    body: {
      en: 'SparkWM is trained in seven successive stages. Only the LoRA and RoLA parameters added to H3 are trained; the 33B H3 weights stay frozen. Stage 1 adds camera control to H3, and stages 2 to 4 turn it into a chunk-by-chunk model with sparse attention and 4 denoising steps. From stage 5 on, the model is trained on its own generated history and adapted to quantized inference and longer videos.',
      zh: 'SparkWM 的训练分七个阶段，依次进行。全程只训练附加在 H3 上的 LoRA 和 RoLA 参数，H3 本身的 330 亿参数保持冻结。阶段 1 给 H3 加上相机控制，阶段 2 到 4 把它改成逐块生成、稀疏注意力、每块 4 步；从阶段 5 起，模型在自己生成的历史上训练，并适应量化推理和更长的视频。',
    },
    stages: [
      {
        name: { en: 'Camera control', zh: '相机控制' },
        body: {
          en: 'A LoRA is added to H3 and trained so that the video follows a given camera trajectory; the training clips carry stereo sound. The model still generates the whole clip at once; from stage 5 on, it serves, frozen, as the real score model of DMD and initializes the fake score model.',
          zh: '在 H3 上加一个 LoRA 并训练它，让画面跟随给定的相机轨迹；训练片段都带立体声。这一阶段模型仍然整段生成；从阶段 5 起，它冻结后用作 DMD 的 real 打分模型，也用来初始化 fake 打分模型。',
        },
      },
      {
        name: { en: 'Chunk-causal training', zh: '块因果训练' },
        body: {
          en: 'The model is trained with teacher forcing to generate chunk by chunk: each chunk attends to the prompt, the first frame, itself and the clean versions of up to 5 preceding chunks, the same window as the inference cache. Sound is split into chunks as well.',
          zh: '用 teacher forcing 训练模型逐块生成：每一块能看到提示词、第一帧、它自己，以及前面最多 5 块的干净版本，范围与推理时的缓存相同。声音也逐块切分。',
        },
      },
      {
        name: { en: 'Sparse attention', zh: '稀疏注意力' },
        body: {
          en: 'Attention is switched to RoLA while the model still samples in many steps, so it adapts to sparse attention before distillation.',
          zh: '在模型还是多步生成时就换成 RoLA，让模型在蒸馏前先适应稀疏注意力。',
        },
      },
      {
        name: { en: '4-step distillation', zh: '4 步蒸馏' },
        body: {
          en: 'Causal consistency distillation reduces about 30 steps to 4. The teacher is the full-attention model from stage 2 and the student is the sparse model from stage 3, so the student learns 4-step generation while also learning to correct the error introduced by sparse attention.',
          zh: '用因果一致性蒸馏把约 30 步减到 4 步。教师是阶段 2 的全量注意力模型，学生是阶段 3 的稀疏注意力模型，因此学生在学习 4 步生成的同时，也在学着纠正稀疏注意力带来的误差。',
        },
      },
      {
        name: { en: 'Self-forcing with quantization-aware training', zh: '自生成历史与量化感知训练' },
        body: {
          en: 'From this stage on, training is quantization-aware with MXFP8, and the student is trained on its own chunk-by-chunk history with Self Gradient Forcing (SGF) and DMD, backpropagating gradients through that history.',
          zh: '从这一阶段起做 MXFP8 量化感知训练。同时，学生改为在自己逐块生成的历史上用 Self Gradient Forcing（SGF）和 DMD 训练，梯度沿这段历史反向传播。',
        },
      },
      {
        name: { en: 'Cache-writing and denoising parameters', zh: '写缓存参数与去噪参数' },
        body: {
          en: 'Training switches to SGF+: the student has two copies of its LoRA and RoLA, one writing finished chunks into the cache and one denoising the current chunk.',
          zh: '改用 SGF+：学生的 LoRA 和 RoLA 各有两份，一份把生成好的块写进缓存，一份给当前块去噪。',
        },
      },
      {
        name: { en: 'Mixed-length extrapolation', zh: '混合长度外推' },
        body: {
          en: 'Rollout lengths vary from about 7 to 20 s across samples. The score models take a window of about 6.6 s at a time, so longer rollouts are scored in sliding windows.',
          zh: '每条样本的生成长度从约 7 秒到 20 秒不等。打分模型每次处理约 6.6 秒的窗口，长样本按滑动窗口分段打分。',
        },
      },
    ] as { name: L; body: L }[],
    stageWord: { en: 'Stage', zh: '阶段' },
    hyperTitle: { en: 'Main hyperparameters', zh: '主要超参数' },
    hyper: [
      { k: { en: 'Base model', zh: '底座模型' }, v: { en: 'MiniMax H3 33B, frozen', zh: 'MiniMax H3 33B，训练时冻结' } },
      { k: { en: 'LoRA rank', zh: 'LoRA 秩' }, v: { en: '384', zh: '384' } },
      { k: { en: 'Chunk length', zh: '块长' }, v: { en: '5 latent frames, about 0.7 s', zh: '5 个 latent 帧，约 0.7 秒' } },
      { k: { en: 'KV cache', zh: 'KV 缓存' }, v: { en: 'up to 5 preceding chunks, plus the prompt and first frame', zh: '前面最多 5 块，另加提示词和第一帧' } },
      { k: { en: 'Sound chunks', zh: '声音分块' }, v: { en: 'each ends 300 ms before its video chunk', zh: '每块比对应的画面块早 300 毫秒结束' } },
      { k: { en: 'Denoising steps', zh: '去噪步数' }, v: { en: '4 per chunk (stage 4 on)', zh: '每块 4 步（阶段 4 起）' } },
      { k: { en: 'RoLA', zh: 'RoLA' }, v: { en: '64-token tiles, about 10% of video tiles exact, low-rank branch rank 128, first 2 chunks full attention', zh: '每 64 个 token 一组，约 10% 视频 token 组精确计算，低秩支路秩 128，开头 2 块全量注意力' } },
      { k: { en: 'Causal consistency distillation', zh: '因果一致性蒸馏' }, v: { en: '48 noise levels', zh: '48 个噪声水平' } },
      { k: { en: 'DMD score models', zh: 'DMD 打分模型' }, v: { en: 'real: stage 1, frozen; fake: initialized from stage 1, 5 updates per student update', zh: 'real：阶段 1，冻结；fake：由阶段 1 初始化，学生每更新 1 次它更新 5 次' } },
      { k: { en: 'Quantization', zh: '量化格式' }, v: { en: 'MXFP8 for attention and feed-forward layers (stage 5 on)', zh: '注意力和前馈层都用 MXFP8（阶段 5 起）' } },
      { k: { en: 'Stages 5 and 6', zh: '阶段 5、6' }, v: { en: 'student learning rate 2e-6 (fake score model 4e-7), global batch size 50', zh: '学生学习率 2e-6（fake 打分模型 4e-7），全局批大小 50' } },
      { k: { en: 'Rollout lengths (stage 7)', zh: '生成长度（阶段 7）' }, v: { en: '50, 75, 100 or 145 latent frames, equally likely; scoring window 47 latent frames, stride 45', zh: '50、75、100、145 个 latent 帧等概率抽取；打分窗口 47 个 latent 帧，步长 45' } },
    ] as { k: L; v: L }[],
    fig: {
      camera: { en: 'camera trajectory', zh: '相机轨迹' },
      sound: { en: 'sound', zh: '声音' },
      steps30: { en: 'about 30 steps', zh: '约 30 步' },
      steps4: { en: '4 steps', zh: '4 步' },
      teacher: { en: 'teacher, full attention', zh: '教师：全量注意力' },
      student: { en: 'student, sparse', zh: '学生：稀疏注意力' },
      ownHistory: { en: 'self-generated history', zh: '自己生成的历史' },
      real: { en: 'real score model', zh: 'real 打分模型' },
      fake: { en: 'fake score model', zh: 'fake 打分模型' },
      writer: { en: 'cache-writing parameters', zh: '写缓存参数' },
      denoiser: { en: 'denoising parameters', zh: '去噪参数' },
      sees: { en: 'sees past and future', zh: '前后都能看到' },
      past: { en: 'sees up to 5 preceding chunks', zh: '最多看前面 5 块' },
      lengths: { en: '', zh: '' },
      wholeClip: { en: 'whole clip at once', zh: '整段一起生成' },
      denoise: { en: 'denoising', zh: '去噪' },
      dense: { en: 'full attention at the start', zh: '开头用全量注意力' },
      sparse10: { en: 'about 10% exact', zh: '约 10% 精确计算' },
      noise: { en: 'noise', zh: '噪声' },
      clean: { en: 'clean', zh: '干净' },
      teacher30: { en: 'teacher: full attention', zh: '教师：全量注意力' },
      student4: { en: 'student: sparse attention, 4 steps', zh: '学生：稀疏注意力，4 步' },
      levels48: { en: '48 noise levels', zh: '48 个噪声水平' },
      generate: { en: 'student generates chunk by chunk', zh: '学生逐块生成' },
      grad: { en: 'gradients backpropagate through the history', zh: '梯度沿历史反向传播' },
      qAttn: { en: 'attn MXFP8', zh: '注意力 MXFP8' },
      qFfn: { en: 'FFN MXFP8', zh: '前馈层 MXFP8' },
      rollout: { en: 'rollout', zh: '生成长度' },
      window: { en: 'scoring window, about 6.6 s', zh: '打分窗口约 6.6 秒' },
      play: { en: 'Play the animation', zh: '播放动画' },
      pause: { en: 'Pause the animation', zh: '暂停动画' },
    },
  },
  efficiency: {
    before: { en: 'H3', zh: 'H3' },
    after: { en: 'SparkWM', zh: 'SparkWM' },
    speedTitle: { en: 'Seconds per chunk', zh: '每块耗时' },
    oneGpu: { en: 'one RTX 5090', zh: '一张 RTX 5090' },
    fourGpu: { en: 'four RTX 5090s', zh: '四张 RTX 5090' },
  },
  results: {
    title: { en: 'Speed-up', zh: '加速效果' },
    body: {
      en: 'SparkWM runs on a single RTX 5090. Below: the end-to-end speed-up over H3 when SparkWM runs distributed over several RTX 5090s, and the time each takes for the same clip.',
      zh: 'SparkWM 在单张 RTX 5090 上就能运行。下面是用多张 RTX 5090 分布式推理时相对 H3 的端到端加速，以及两者生成同一段视频的耗时。',
    },
    measuring: { en: 'Measurements pending', zh: '实测数据待补' },
    headline: { en: 'End-to-end speed-up, distributed on RTX 5090s', zh: '端到端加速（多张 RTX 5090 分布式推理）' },
    headlineN: { en: 'End-to-end speed-up, {n} RTX 5090s', zh: '端到端加速（{n} 张 RTX 5090）' },
    single: { en: 'of audio-video on a single RTX 5090 (32 GB)', zh: '单张 RTX 5090（32 GB）上能生成的音视频长度' },
    latencyTitle: { en: 'End-to-end time', zh: '端到端耗时' },
    setupPending: { en: 'Measurement setup to be added', zh: '测量条件待补' },
  },
  rollout: {
    title: { en: 'Long videos', zh: '长视频' },
    body: {
      en: 'The Rail yard and Bathhouse clips above are each about 29 chunks long. They were generated by a checkpoint taken before stage 7 (mixed-length extrapolation), whose training rollouts were only 10 chunks long, so each clip is almost three times the length it was trained on. The strips below show one frame every 5 s.',
      zh: '上面的铁路货场和浴场两段样片各约 29 块，由阶段 7（混合长度外推）之前的模型生成。当时模型在训练中每次只生成 10 块，所以样片长度接近训练时生成长度的三倍。下面的画面条每 5 秒取一帧。',
    },
  },
  credits: {
    title: { en: 'Team', zh: '团队' },
    authorsPending: { en: 'Author list to be added', zh: '作者名单待补' },
    ack: {
      en: 'SparkWM is post-trained from MiniMax H3 33B and builds on SolarWM, RoLA, SparkDiffusion, Light Forcing, ForgeWM, Causal Forcing and Causal Forcing++, Self Forcing, Self Gradient Forcing and SGF+, DMD2 and PRoPE. Use of H3 and its outputs follows the MiniMax H3 Community License.',
      zh: 'SparkWM 在 MiniMax H3 33B 上后训练而成，用到了 SolarWM、RoLA、SparkDiffusion、Light Forcing、ForgeWM、Causal Forcing 与 Causal Forcing++、Self Forcing、Self Gradient Forcing 与 SGF+、DMD2 和 PRoPE 的工作。H3 及其输出的使用遵守 MiniMax H3 Community License。',
    },
    cite: { en: 'Citation', zh: '引用' },
    copy: { en: 'Copy', zh: '复制' },
    copied: { en: 'Copied', zh: '已复制' },
  },
  pending: { en: 'pending', zh: '待补' },
  draftBanner: {
    en: 'Preview build. Items marked pending are not final.',
    zh: '预览版。标着“待补”的内容还没定。',
  },
}
