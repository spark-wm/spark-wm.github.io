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

export interface Author { name: string; aff: number[]; equal?: boolean; lead?: boolean; url?: string }
/** Fill in final order. aff indexes into `affiliations` (1-based). */
export const authors: Author[] = []

export const affiliations = [
  { id: 1, name: { en: 'Peking University', zh: '北京大学' }, logo: 'logos/pku.svg' },
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
  { value: null, label: { en: 'per chunk on one RTX 5090', zh: '每块耗时（一张 RTX 5090）' } },
  { value: '4', countTo: 4, label: { en: 'denoising steps per chunk', zh: '每块的去噪步数' } },
  { value: '≈10', unit: '%', label: { en: 'of video tiles get exact attention, from chunk 3 on', zh: '的视频 token 组精确计算注意力（第 3 块起）' } },
  { value: '≈0.7', unit: 's', label: { en: 'of video per chunk; each chunk reads up to 5 preceding chunks', zh: '每块的视频长度，生成时最多读取前面 5 块' } },
  { value: '33', unit: 'B', countTo: 33, label: { en: 'H3 parameters, frozen during training', zh: 'H3 参数，训练时冻结' } },
]

/** Efficiency comparison bars. */
export const efficiency = {
  rows: [
    { label: { en: 'Denoising steps', zh: '去噪步数' }, before: 30, after: 4, beforeText: { en: 'about 30, whole clip', zh: '约 30，整段一起' }, afterText: { en: '4 per chunk', zh: '每块 4 步' }, unit: '' },
    { label: { en: 'Video tiles with exact attention', zh: '精确计算的视频 token 组' }, before: 100, after: 10, beforeText: { en: '100%', zh: '100%' }, afterText: { en: 'about 10% (from chunk 3)', zh: '约 10%（第 3 块起）' }, unit: '' },
  ],
  /** Seconds per chunk on one / four RTX 5090. null = pending. */
  speed: { oneGpu: null as number | null, fourGpu: null as number | null },
}

export const bibtex = `@article{sparkwm2026,
  title   = {SparkWM},
  author  = {},
  journal = {arXiv preprint},
  year    = {2026}
}`

// ---------------------------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------------------------

export const t = {
  nav: {
    demos: { en: 'Demos', zh: '样片' },
    method: { en: 'Acceleration', zh: '加速方法' },
    training: { en: 'Training', zh: '训练' },
    citation: { en: 'Citation', zh: '引用' },
    lang: { en: '中文', zh: 'EN' },
    soundOn: { en: 'Sound on', zh: '声音已开' },
    soundOff: { en: 'Sound off', zh: '声音已关' },
    theme: { en: 'Switch colour theme', zh: '切换深浅色' },
  },
  hero: {
    lead: {
      en: 'SparkWM is an audio-video world model post-trained from MiniMax H3 33B. H3 generates a whole clip of about 6.6 s at once in about 30 denoising steps; SparkWM generates video and sound chunk by chunk, in only 4 denoising steps per chunk.',
      zh: 'SparkWM 是由 330 亿参数的 MiniMax H3 后训练而成的音视频世界模型。H3 一次生成整段约 6.6 秒的视频，要去噪约 30 步；SparkWM 改为逐块生成视频和声音，每块只去噪 4 步。',
    },
    base: {
      en: 'Each chunk covers about 0.7 s of video and is conditioned on a text prompt, the first frame and a camera trajectory. A chunk reads only the prompt, the first frame and up to 5 preceding chunks, so the cost per chunk does not grow with video length. From chunk 3 on, sparse attention further reduces the attention computation, and the model adapts to 8-bit precision (MXFP8) during training for deployment on the RTX 5090.',
      zh: '每块是约 0.7 秒的视频，根据提示词、第一帧和相机轨迹生成。生成每一块时只读取提示词、第一帧和前面最多 5 块，因此每块的计算量不随视频变长而增加。从第 3 块起，稀疏注意力进一步减少了注意力的计算量；模型还在训练中适应了 8 位精度（MXFP8），计划部署在 RTX 5090 上。',
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
    slot: { en: 'Clip', zh: '样片' },
    seconds: { en: 's', zh: '秒' },
    body: {
      en: 'Every clip starts from a given first frame. Click any clip to play it with sound in the player below. The player\u2019s timeline replays the generation in order: when a chunk appears, the cached chunks it read are marked above it.',
      zh: '每段样片都从给定的第一帧开始生成。点任意一段，下方的播放器会带声音播放它。播放器的时间轴按生成顺序回放：每一块出现时，上方标出它读取的缓存块。',
    },
  },
  method: {
    title: { en: 'Acceleration', zh: '加速方法' },
    body: {
      en: 'H3 generates a whole clip of about 6.6 s at once, with full attention across all frames and about 30 denoising steps. SparkWM changes the generation scheme, the attention computation and the numeric precision.',
      zh: 'H3 一次生成整段约 6.6 秒的视频，生成时所有帧之间做全量注意力，要去噪约 30 步。SparkWM 改变了生成方式、注意力的计算方式和模型的数值精度。',
    },
    chunkTitle: { en: 'Chunk-by-chunk generation, 4 steps per chunk', zh: '逐块生成，每块 4 步' },
    chunkBody: {
      en: 'Video is generated chunk by chunk, about 0.7 s each. For each chunk, SparkWM reads the prompt, the first frame and up to 5 preceding chunks from its KV cache, denoises in 4 steps, then writes the chunk into the cache and drops the oldest one. The cache never holds more than 5 chunks, so the cost per chunk does not grow with video length.',
      zh: '视频逐块生成，每块约 0.7 秒。生成一块时，SparkWM 从 KV 缓存读取提示词、第一帧和前面最多 5 块，去噪 4 步，再把这一块写入缓存、移出最早的一块。缓存始终不超过 5 块，所以每块的计算量不随视频变长而增加。',
    },
    chunkCaption: {
      en: 'Frames from the rail-yard clip. Noise is drawn on pixels for illustration; the model denoises latents.',
      zh: '画面取自铁路货场样片。噪声画在像素上只是示意，模型实际是在 latent 上去噪。',
    },
    condition: { en: 'Prompt and first frame', zh: '提示词和第一帧' },
    cache: { en: 'Five most recent chunks', zh: '最近 5 块' },
    current: { en: 'Current chunk', zh: '当前块' },
    step: { en: 'Step', zh: '第' },
    stepOf: { en: 'of 4', zh: '步，共 4 步' },
    done: { en: 'Done, written to the cache', zh: '完成，写入缓存' },
    sparseTitle: { en: 'Sparse attention with RoLA', zh: '稀疏注意力（RoLA）' },
    sparseBody: {
      en: 'From chunk 3 on, attention switches to RoLA: queries and keys are split into tiles, and each query tile computes exact attention only over about 10% of the video tiles, those most similar to it, while a low-rank branch adds a cheap approximation over all tiles. The first 2 chunks keep full attention: their history is still short, so full attention costs little there.',
      zh: '从第 3 块起，注意力换成 RoLA：查询和键分成若干 token 组，每个查询组只和最相关的约 10% 视频 token 组做精确计算，另有一条低秩支路对全部 token 组做代价很低的近似。开头 2 块历史还短，全量注意力代价不高，所以仍用全量注意力。',
    },
    sparseCaption: {
      en: 'Schematic with 10 tiles per chunk. Each query tile reads its selected 10% plus the tile at its own position, so the share shown is a little above 10%. A real chunk has 5,040 video tokens.',
      zh: '示意图：每块画成 10 组。每个查询组读取选出的 10%，再加上同一位置的那一组，所以图上的比例略高于 10%。实际每块有 5040 个视频 token。',
    },
    full: { en: 'Full attention', zh: '全量注意力' },
    sparse: { en: 'SparkWM', zh: 'SparkWM' },
    exact: { en: 'computed exactly', zh: '精确计算' },
    lowrank: { en: 'low-rank branch', zh: '低秩支路' },
    always: { en: 'always read', zh: '固定读取' },
    queries: { en: 'Query tiles of the current chunk', zh: '当前块的查询组' },
    keys: { en: 'Key tiles', zh: '键组' },
    quantTitle: { en: 'Quantization-aware training', zh: '量化感知训练' },
    quantBody: {
      en: 'SparkWM is meant to run on the RTX 5090 (32 GB). To this end, from training stage 5 on, the weights and activations of the backbone\u2019s attention and feed-forward layers are fake-quantized to MXFP8 in the forward pass, so the model adapts to 8-bit precision during training; our inference code runs with the quantization settings recorded in training, with no separate post-training quantization.',
      zh: 'SparkWM 计划部署在 RTX 5090（32 GB 显存）上。为此，从训练阶段 5 起，前向计算就对主干网络注意力层和前馈层的权重和激活做 MXFP8 伪量化，让模型在训练中适应 8 位精度；我们的推理代码按训练时记录的量化设置运行，不需要再做训练后量化。',
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
          en: 'A LoRA is added to H3 and trained on clips with stereo sound, so that the video follows a given camera trajectory. The model still generates the whole clip at once; from stage 5 on, it serves as the score model for DMD.',
          zh: '在 H3 上加一个 LoRA，用带立体声的视频片段训练，让画面跟随给定的相机轨迹。这一阶段模型仍然整段生成；从阶段 5 起，它用作 DMD 的打分模型。',
        },
      },
      {
        name: { en: 'Chunk-causal training', zh: '块因果训练' },
        body: {
          en: 'The model is trained with teacher forcing to generate chunk by chunk: each chunk attends to the prompt, the first frame, itself and clean versions of at most the 5 preceding chunks, the same window as the inference cache. Sound is split into chunks as well.',
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
        name: { en: 'Four-step distillation', zh: '4 步蒸馏' },
        body: {
          en: 'Causal consistency distillation reduces about 30 steps to 4. The teacher is the full-attention model from stage 2 and the student is the sparse model from stage 3, so the student learns 4-step generation while also learning to correct the error introduced by sparse attention.',
          zh: '用因果一致性蒸馏把约 30 步减到 4 步。教师是阶段 2 的全量注意力模型，学生是阶段 3 的稀疏注意力模型，因此学生在学习 4 步生成的同时，也在学着纠正稀疏注意力带来的误差。',
        },
      },
      {
        name: { en: 'Quantization-aware training', zh: '量化感知训练' },
        body: {
          en: 'From this stage on, training is quantization-aware with MXFP8. At the same time, the student switches to training on its own chunk-by-chunk history with Self Gradient Forcing (SGF) and DMD, with gradients backpropagated through that history.',
          zh: '从这一阶段起做 MXFP8 量化感知训练。同时，学生改为在自己逐块生成的历史上用 Self Gradient Forcing（SGF）和 DMD 训练，梯度沿这段历史反向传播。',
        },
      },
      {
        name: { en: 'Cache-writer and denoiser LoRAs', zh: '写缓存 LoRA 与去噪 LoRA' },
        body: {
          en: 'Training switches to SGF+: the student has two copies of its LoRA and RoLA, one writing finished chunks into the cache and one denoising the current chunk.',
          zh: '改用 SGF+：学生的 LoRA 和 RoLA 各有两份，一份把生成好的块写进缓存，一份给当前块去噪。',
        },
      },
      {
        name: { en: 'Mixed-length extrapolation', zh: '混合长度外推' },
        body: {
          en: 'Rollout lengths vary from about 7 to 20 s across samples. The score models take a window of about 6.6 s at a time, so longer rollouts are scored in sliding windows.',
          zh: '每条样本的生成长度在约 7 到 20 秒之间变化。打分模型每次处理约 6.6 秒的窗口，长样本按滑动窗口分段打分。',
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
      real: { en: 'real score', zh: 'real 打分模型' },
      fake: { en: 'fake score', zh: 'fake 打分模型' },
      writer: { en: 'cache-writer LoRA', zh: '写缓存 LoRA' },
      denoiser: { en: 'denoiser LoRA', zh: '去噪 LoRA' },
      sees: { en: 'sees past and future', zh: '前后都能看到' },
      past: { en: 'sees up to 5 preceding chunks', zh: '最多看前面 5 块' },
      lengths: { en: '', zh: '' },
      wholeClip: { en: 'whole clip at once', zh: '整段一起生成' },
      denoise: { en: 'denoising', zh: '去噪' },
      dense: { en: 'full attention at the start', zh: '开头用全量注意力' },
      sparse10: { en: 'about 10% exact', zh: '约 10% 精确计算' },
      noise: { en: 'noise', zh: '噪声' },
      clean: { en: 'clean', zh: '干净' },
      teacher30: { en: 'teacher: full attention, about 30 steps', zh: '教师：全量注意力，约 30 步' },
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
  rollout: {
    title: { en: 'Long videos', zh: '长视频' },
    body: {
      en: 'The Rail yard and Bathhouse clips above are each about 29 chunks long. They were generated by a checkpoint from before stage 7 (mixed-length extrapolation), which had only produced 10-chunk rollouts in training, so the clips are almost three times as long as anything it generated in training. The strips below show one frame every 5 s.',
      zh: '上面的铁路货场和浴场两段样片各约 29 块，由阶段 7（混合长度外推）之前的模型生成。当时模型在训练中每次只生成 10 块，所以样片长度接近训练时生成长度的三倍。下面每 5 秒取一帧。',
    },
  },
  credits: {
    title: { en: 'Team', zh: '团队' },
    authorsPending: { en: 'Author list to be added', zh: '作者名单待补' },
    ack: {
      en: 'SparkWM is post-trained from MiniMax H3 33B and builds on SolarWM, RoLA, SparkDiffusion, Light Forcing, ForgeWM, Causal Forcing and Causal Forcing++, Self Gradient Forcing and SGF+, DMD2 and PRoPE. Use of H3 and its outputs follows the MiniMax H3 Community License.',
      zh: 'SparkWM 在 MiniMax H3 33B 上后训练而成，用到了 SolarWM、RoLA、SparkDiffusion、Light Forcing、ForgeWM、Causal Forcing 与 Causal Forcing++、Self Gradient Forcing 与 SGF+、DMD2 和 PRoPE 的工作。H3 及其输出的使用遵守 MiniMax H3 Community License。',
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
