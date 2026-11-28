// All text, numbers, links and clips of the page live here. The page is in English only.
// Fill an empty string / null and the page shows it; leave it empty and the page hides it
// (in a DRAFT build a "pending" marker is shown instead, so the team can see what is missing).
// Every number below was checked against the training code and records; check the source before changing one.

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
  { name: 'Haoyu Li', aff: [2] },
  { name: 'Baole Ai', aff: [2] },
  { name: 'Ang Wang', aff: [2] },
  { name: 'Jiamang Wang', aff: [2] },
  { name: 'Lin Qu', aff: [2] },
  { name: 'Kun Yuan', aff: [1], corr: true },
]
/** Superscript after a name: affiliations, then * equal contribution, † corresponding, ‡ project leader. */
export const authorMarks = (a: Author) => a.aff.join(',') + (a.equal ? '*' : '') + (a.corr ? '†' : '') + (a.lead ? '‡' : '')
export const authorNotes = ['* Equal contribution', '† Corresponding authors', '‡ Project leader']

export const affiliations = [
  { id: 1, name: 'Peking University, Melon Group', logo: 'logos/pku.svg' },
  { id: 2, name: 'Alibaba Group', logo: 'logos/alibaba.svg' },
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
  title: string
  /** The text prompt used for this clip. null = not yet provided. */
  prompt: string | null
  meta: ClipMeta
  /** Seconds of audio cut before each video chunk boundary (H3 audio encoder look-ahead, measured ~290 ms). */
  audioLead: number
}

// src/data/clips/<id>.json is the meta.json that tools/prep_assets.py writes next to public/media/<id>/.
const metas = import.meta.glob<ClipMeta>('./data/clips/*.json', { eager: true, import: 'default' })
function meta(id: string): ClipMeta {
  const m = metas[`./data/clips/${id}.json`]
  if (!m) throw new Error(`missing src/data/clips/${id}.json`)
  return m
}
const clip = (id: string, title: string): Clip => ({ id, title, prompt: null, meta: meta(id), audioLead: 0.3 })

/**
 * The demo wall, in this order. Clips from the team's 11-26 release demos: seven picked on 11-27 after checking every
 * 20 s clip frame by frame, plus the snowboard take the project lead chose (11-28). Realistic scenes first, then the
 * two fantasy ones.
 */
export const clips: Clip[] = [
  clip('dance-studio', 'Dance studio'),
  clip('kayak-cove', 'Kayak cove'),
  clip('waterfall-trail', 'Waterfall trail'),
  clip('balloon', 'Hot-air balloon'),
  clip('subway-guitar', 'Subway guitarist'),
  clip('snowboard', 'Snowboarder'),
  clip('sunken-city', 'Sunken city'),
  clip('lantern-boat', 'Lantern boat'),
]
const byId = (id: string) => clips.find((c) => c.id === id) ?? clips[0]
/** Clip whose frames illustrate chunk-by-chunk generation in the method section (keep t.method.chunkCaption in step). */
export const chunkFigureClip = byId('waterfall-trail')
/** Clips shown as 5-second strips in the long-video section: the three that keep their subject for the full 20 s. */
export const rolloutClips = ['dance-studio', 'balloon', 'waterfall-trail'].map(byId)

export const mediaPath = (id: string, file: string) => `media/${id}/${file}`

/** Slots on the demo wall. In a DRAFT build the slots without a clip show a pending marker; the release shows only real clips. */
export const wallSlots = 8

/** Shown in the facts row. value null = pending. */
export const facts: { value: string | null; unit?: string; label: string; countTo?: number }[] = [
  { value: '10', unit: 's', countTo: 10, label: 'of video and sound a single RTX 5090 can generate' },
  { value: '4', countTo: 4, label: 'denoising steps per chunk' },
  { value: '≈10', unit: '%', label: 'of video token groups get exact attention from each query group, from chunk 3 on' },
  { value: '≈0.7', unit: 's', label: 'of video per chunk' },
  { value: '33', unit: 'B', countTo: 33, label: 'H3 parameters, frozen during training' },
]

/** Speed figures. The claim is: SparkStream runs on a single RTX 5090, plus the end-to-end speed-up of distributed inference on RTX 5090s. */
export const efficiency = {
  /** Longest clip one RTX 5090 (32 GB) generates, in seconds (Shikun, group chat 11-23 20:32). */
  singleGpuSeconds: 10,
  /** End-to-end speed-up of distributed inference on `gpus` RTX 5090s. null = pending. */
  multi: { speedup: null as number | null, gpus: null as number | null },
  /**
   * End-to-end time to generate the same clip, H3 vs SparkStream. seconds null = pending; the speed-up is
   * computed from the first and the `ours` row once both are filled. `setup` is the measurement condition.
   */
  latency: {
    setup: null as string | null,
    rows: [
      { name: 'H3', note: 'whole clip at once, about 30 steps', seconds: null as number | null, ours: false },
      { name: 'SparkStream', note: 'chunk by chunk, 4 steps per chunk', seconds: null as number | null, ours: true },
    ],
  },
}

/**
 * BibTeX in the format arXiv exports. The author field follows `authors`.
 * Replace this entry with the arXiv export once the report is posted.
 */
export const bibtex = `@misc{sparkstream2026,
  title={SparkStream},
  author={${authors.map((a) => a.name).join(' and ')}},
  year={2026},
}`

/**
 * Prior work SparkStream builds on, shown as a second BibTeX block. Both entries are copied from the
 * SparkDiffusion README (github.com/AlibabaResearch/SparkDiffusion) and match the arXiv records.
 */
export const relatedBibtex = `@misc{liu2026sparkdiffusionmitigatinghighsparsitytrap,
  title={SparkDiffusion: Mitigating the High-Sparsity Trap --- A Unified Framework for up to $265\\times$ Single-GPU Acceleration of Visual Generation},
  author={Yuxi Liu and Haoyu Li and Zekun Zhang and Tengxu Sun and Yixiang Cai and Jiayong Li and Yifei Xia and Tianle Liu and Baole Ai and Ang Wang and Jiamang Wang and Lin Qu and Kai Zhang and Kun Yuan and Bin Cui},
  year={2026},
  eprint={2609.23153},
  archivePrefix={arXiv},
  primaryClass={cs.CV},
  url={https://arxiv.org/abs/2609.23153},
}

@misc{zhang2026rolarotarypositionedlowranklinear,
  title={RoLA: Rotary-Positioned Low-Rank Linear Attention for Efficient Diffusion Transformers},
  author={Zekun Zhang and Yixiang Cai and Yuxi Liu and Tengxu Sun and Tianle Liu and Zhoutong Wu and Haoyu Li and Baole Ai and Ang Wang and Jiamang Wang and Lin Qu and Kun Yuan},
  year={2026},
  eprint={2609.06712},
  archivePrefix={arXiv},
  primaryClass={cs.CV},
  url={https://arxiv.org/abs/2609.06712},
}`

// ---------------------------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------------------------

export const t = {
  pageTitle: 'SparkStream: Streaming Long Audio-Visual Generation',
  nav: {
    demos: 'Demos',
    method: 'Method',
    results: 'Speed-up',
    training: 'Training',
    citation: 'Citation',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    theme: 'Switch color theme',
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
    sound: 'Sound',
    sections: 'Sections',
    skip: 'Skip to content',
  },
  hero: {
    lead: 'SparkStream is a streaming audio-video generation model post-trained from MiniMax H3 33B. H3 generates a whole audio-video clip of about 6.6 s at once, in about 30 denoising steps; SparkStream generates video and sound chunk by chunk, in only 4 denoising steps per chunk.',
    base: 'Each chunk covers about 0.7 s of video and is conditioned on a text prompt, a given first frame and a camera trajectory. To generate a chunk, the model reads from its KV cache only the prompt, the first frame and up to 5 preceding chunks, so the compute per chunk does not grow with video length. From chunk 3 on, sparse attention reduces the attention compute further. The model is also trained with 8-bit (MXFP8) fake quantization. A single RTX 5090 can generate 10 s of video and sound.',
    paper: 'Paper',
    code: 'Code',
    weights: 'Weights',
    soon: 'soon',
  },
  player: {
    video: 'Video',
    sound: 'Sound',
    memory: 'Cache',
    play: 'Play',
    pause: 'Pause',
    turnOn: 'Turn sound on',
    turnOff: 'Mute',
    seek: 'Timeline. Use the arrow keys to step one chunk.',
    promptPending: 'Prompt to be added',
  },
  reel: {
    label: 'Generated clips, playing in turn',
    open: 'Watch the full clip',
    seg: 'Clip',
  },
  demos: {
    title: 'Generated clips',
    more: 'More clips',
    seconds: 's',
    body: 'Every clip is generated chunk by chunk from a given first frame. The player steps through the chunks in generation order, and the Cache bracket above the timeline marks the cached chunks that the current chunk reads.',
  },
  method: {
    title: 'Method',
    body: 'H3 applies full attention across all frames of the clip. SparkStream changes the generation scheme, the number of denoising steps, the attention computation and the numeric precision.',
    chunkTitle: 'Chunk-by-chunk generation, 4 steps per chunk',
    chunkBody: 'Video is generated in chunks of about 0.7 s. For each chunk, SparkStream reads the prompt, the first frame and up to 5 preceding chunks from its KV cache, denoises in 4 steps, then writes the chunk into the cache and drops the oldest one. The cache never holds more than 5 chunks, so the compute per chunk does not grow with video length.',
    chunkCaption: 'Frames from the Waterfall trail clip. Noise is drawn on pixels for illustration; the model denoises latents.',
    condition: 'Prompt and first frame',
    cache: '5 most recent chunks',
    current: 'Current chunk',
    done: 'Done, written to the cache',
    sparseTitle: 'Sparse attention with RoLA',
    sparseBody: 'From chunk 3 on, attention switches to RoLA. Queries and keys are split into token groups. Each query group computes exact attention only over the video token groups most relevant to it, about 10% of them, and a low-rank branch adds a cheap approximation over all groups. The first 2 chunks keep full attention: their history is still short, so full attention costs little there.',
    sparseCaption: 'Schematic with 10 token groups per chunk (a real chunk has 5,040 video tokens). Besides its selected 10%, each query group also attends to the key group at its own position, so the share computed exactly is slightly above 10%.',
    full: 'Full attention',
    sparse: 'RoLA',
    exact: 'computed exactly',
    lowrank: 'low-rank branch',
    always: 'always read',
    promptFrame: 'Prompt, first frame',
    quantTitle: 'Quantization-aware training (QAT)',
    quantBody: 'SparkStream is built to run on a single RTX 5090 (32 GB). To this end, from training stage 5 on, the weights and activations of the backbone’s attention and feed-forward layers are fake-quantized to MXFP8 in the forward pass, so the model adapts to 8-bit precision during training. Our inference code reuses the quantization settings recorded in training and needs no separate post-training quantization.',
    quantCaption: 'MXFP8 splits values into groups of 32 that share one power-of-two scale, and rounds each value to the nearest 8-bit float.',
    qGroup: 'One group of 32 values sharing one scale',
    qBits: 'bits per value',
    qOrig: 'BF16 value',
    qSnap: 'MXFP8 value',
    qGrid: 'representable 8-bit values',
    overview: {
      label: 'From H3 to SparkStream',
      saves: 'Reduces',
      result: 'End-to-end speed-up',
      cards: [
        { name: 'MiniMax H3 33B', note: 'whole clip at once, about 30 steps', cut: null },
        { name: 'Chunk by chunk', note: 'each chunk reads up to 5 preceding chunks from the cache', cut: 'context read per chunk' },
        { name: '4-step distillation', note: 'about 30 steps to 4 per chunk', cut: 'denoising steps' },
        { name: 'RoLA sparse attention', note: 'from chunk 3, exact attention on about 10% of video token groups', cut: 'attention compute' },
        { name: 'MXFP8 quantization-aware training', note: 'weights and activations of the backbone attention and FFN layers in 8 bits', cut: 'bit width, 16 to 8' },
      ] as { name: string; note: string; cut: string | null }[],
    },
  },
  training: {
    title: 'Training pipeline',
    body: 'SparkStream is trained in seven successive stages. Only the LoRA and RoLA parameters added to H3 are trained; the 33B H3 weights stay frozen. Stage 1 adds camera control to H3, and stages 2 to 4 turn it into a chunk-by-chunk model with sparse attention and 4 denoising steps. From stage 5 on, the model is trained on its own generated history and adapted to quantized inference and longer videos.',
    stages: [
      {
        name: 'Camera control',
        body: 'A LoRA is added to H3 and trained so that the video follows a given camera trajectory; the training clips carry stereo sound. At this stage the model still generates the whole clip at once. From stage 5 on, the stage-1 model is frozen and serves as the real score model of DMD; it also initializes the fake score model.',
      },
      {
        name: 'Chunk-causal training',
        body: 'The model is trained with teacher forcing to generate chunk by chunk: each chunk attends to the prompt, the first frame, itself and the clean versions of up to 5 preceding chunks, the same window as the inference cache. Sound is split into chunks as well.',
      },
      {
        name: 'Sparse attention',
        body: 'Attention is switched to RoLA while the model still samples in many steps, so it adapts to sparse attention before distillation.',
      },
      {
        name: '4-step distillation',
        body: 'Causal consistency distillation reduces the number of steps from about 30 to 4. The teacher is the full-attention model from stage 2 and the student is the sparse model from stage 3, so the student learns 4-step generation while also learning to correct the error introduced by sparse attention.',
      },
      {
        name: 'Self-forcing with quantization-aware training',
        body: 'From this stage on, training is quantization-aware with MXFP8. The student now generates its own history chunk by chunk and is trained on it with Self Gradient Forcing (SGF) and DMD; gradients are backpropagated through that history.',
      },
      {
        name: 'Cache-writing and denoising parameters',
        body: 'Training switches to SGF+: the student has two copies of its LoRA and RoLA parameters, one writing finished chunks into the cache and one denoising the current chunk.',
      },
      {
        name: 'Mixed-length extrapolation',
        body: 'Rollout lengths vary from about 7 to 20 s across samples. The score models take a window of about 6.6 s at a time, so longer rollouts are scored in sliding windows.',
      },
    ] as { name: string; body: string }[],
    stageWord: 'Stage',
    hyperTitle: 'Main hyperparameters',
    hyper: [
      { k: 'Base model', v: 'MiniMax H3 33B, frozen' },
      { k: 'LoRA rank', v: '384' },
      { k: 'Chunk length', v: '5 latent frames, about 0.7 s' },
      { k: 'KV cache', v: 'up to 5 preceding chunks, plus the prompt and the first frame' },
      { k: 'Sound chunks', v: 'each ends 300 ms before its video chunk' },
      { k: 'Denoising steps', v: '4 per chunk (from stage 4 on)' },
      { k: 'RoLA', v: '64 tokens per group, exact attention on about 10% of video token groups, low-rank branch of rank 128, full attention for the first 2 chunks' },
      { k: 'Causal consistency distillation', v: '48 noise levels' },
      { k: 'DMD score models', v: 'real: stage 1, frozen; fake: initialized from stage 1, 5 updates per student update' },
      { k: 'Quantization', v: 'MXFP8 for attention and feed-forward layers (from stage 5 on)' },
      { k: 'Stages 5 and 6', v: 'student learning rate 2e-6 (fake score model 4e-7), global batch size 50' },
      { k: 'Rollout lengths (stage 7)', v: '50, 75, 100 or 145 latent frames, equally likely; scoring window 47 latent frames, stride 45' },
    ] as { k: string; v: string }[],
    /** Labels inside the stage animation. The README GIF is recorded from it: change one and the GIF must be recorded again. */
    fig: {
      camera: 'camera trajectory',
      sound: 'sound',
      steps30: 'about 30 steps',
      steps4: '4 steps',
      real: 'real score model',
      fake: 'fake score model',
      writer: 'cache-writing parameters',
      denoiser: 'denoising parameters',
      past: 'sees up to 5 preceding chunks',
      wholeClip: 'whole clip at once',
      dense: 'full attention at the start',
      sparse10: 'about 10% exact',
      noise: 'noise',
      clean: 'clean',
      teacher30: 'teacher: full attention',
      student4: 'student: sparse attention, 4 steps',
      levels48: '48 noise levels',
      generate: 'student generates chunk by chunk',
      grad: 'gradients backpropagate through the history',
      qAttn: 'attn MXFP8',
      qFfn: 'FFN MXFP8',
      rollout: 'rollout',
      window: 'scoring window, about 6.6 s',
      play: 'Play the animation',
      pause: 'Pause the animation',
    },
  },
  results: {
    title: 'Speed-up',
    body: 'SparkStream runs on a single RTX 5090. The numbers below are the end-to-end speed-up over H3 when SparkStream inference is distributed over several RTX 5090s, and the time each model takes to generate the same clip.',
    measuring: 'Measurements pending',
    headline: 'End-to-end speed-up, distributed inference on RTX 5090s',
    headlineN: 'End-to-end speed-up, {n} RTX 5090s',
    single: 'of video and sound a single RTX 5090 (32 GB) can generate',
    latencyTitle: 'End-to-end time',
    setupPending: 'Measurement setup to be added',
  },
  rollout: {
    title: 'Long videos',
    body: 'Every clip above is 20 s long (about 29 chunks) and was generated chunk by chunk from its first frame. The strips below show one frame every 5 s.',
  },
  credits: {
    title: 'Team',
    authorsPending: 'Author list to be added',
    ack: 'SparkStream is post-trained from MiniMax H3 33B and builds on SolarWM, RoLA, SparkDiffusion, Light Forcing, ForgeWM, Causal Forcing, Causal Forcing++, Self Forcing, Self Gradient Forcing, SGF+, DMD2 and PRoPE. Use of H3 and its outputs is subject to the MiniMax H3 Community License.',
    cite: 'Citation',
    related: 'Related work',
    copy: 'Copy',
    copyBoth: 'Copy both',
    copied: 'Copied',
    copyMain: 'Copy the SparkStream citation',
    copyRelated: 'Copy the related-work citations',
  },
  pending: 'pending',
  draftBanner: 'Preview build. Items marked pending are not final.',
}
