"""Build web assets for the SparkStream site from compressed demo videos.

usage: python3 tools/prep_assets.py <video.mp4> <id> public/media

Writes into <out_dir>/<id>/:
  full.mp4      1344x768 H.264 + AAC (copied from input, faststart)
  sd.mp4        960-wide H.264 + AAC for phones
  tile.mp4      640-wide H.264, no audio, for the demo wall
  poster.webp   first frame (the conditioning image)
  strip.webp    one thumbnail per ~0.7 s chunk, laid out left to right
  meta.json     duration, chunk timing, audio envelope
  spec.png      log-mel spectrogram, 8-bit grayscale, 50 columns per second (colourised in the page)
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import cv2
cv2.setNumThreads(1)
import numpy as np
from PIL import Image

FFMPEG = "ffmpeg"
FPS = 24.0
# H3: 158 frames at 24 fps become 47 latent positions; one chunk = 5 latents.
LATENT_SEC = (158 / FPS) / 47
CHUNK_SEC = 5 * LATENT_SEC  # ~0.700 s
SR = 32000


def run(*args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def probe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True).stdout
    return float(out.strip())


def read_frames(path, step=1):
    cap = cv2.VideoCapture(str(path))
    frames = []
    i = 0
    while True:
        ok, f = cap.read()
        if not ok:
            break
        if i % step == 0:
            frames.append(f)
        i += 1
    cap.release()
    return frames


def audio_pcm(path):
    raw = subprocess.run([FFMPEG, "-v", "error", "-threads", "1", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).T.copy()


def envelope(pcm, rate=60):
    hop = SR // rate
    n = pcm.shape[1] // hop
    x = pcm[:, : n * hop].reshape(2, n, hop)
    rms = np.sqrt((x ** 2).mean(axis=2) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    lo, hi = -60.0, max(-6.0, float(db.max()))
    v = np.clip((db - lo) / (hi - lo), 0, 1)
    return (v * 255).round().astype(int).tolist()


def mel_filterbank(n_fft, n_mels, fmin, fmax):
    def hz2mel(f):
        return 2595 * np.log10(1 + f / 700)

    def mel2hz(m):
        return 700 * (10 ** (m / 2595) - 1)

    mels = np.linspace(hz2mel(fmin), hz2mel(fmax), n_mels + 2)
    hz = mel2hz(mels)
    bins = np.floor((n_fft + 1) * hz / SR).astype(int)
    fb = np.zeros((n_mels, n_fft // 2 + 1))
    for m in range(1, n_mels + 1):
        a, b, c = bins[m - 1], bins[m], bins[m + 1]
        for k in range(a, b):
            fb[m - 1, k] = (k - a) / max(1, b - a)
        for k in range(b, c):
            fb[m - 1, k] = (c - k) / max(1, c - b)
    return fb


def spectrogram(pcm, out_png, cols_per_sec=50, n_mels=96):
    mono = pcm.mean(axis=0)
    n_fft = 2048
    hop = SR // cols_per_sec
    win = np.hanning(n_fft)
    pad = np.pad(mono, (n_fft // 2, n_fft // 2))
    n = 1 + (len(pad) - n_fft) // hop
    frames = np.stack([pad[i * hop: i * hop + n_fft] * win for i in range(n)])
    mag = np.abs(np.fft.rfft(frames, axis=1)) ** 2
    mel = mel_filterbank(n_fft, n_mels, 30, 15000) @ mag.T
    db = 10 * np.log10(mel + 1e-10)
    top = np.percentile(db, 99.5)
    v = np.clip((db - (top - 70)) / 70, 0, 1)
    img = (v[::-1] * 255).astype(np.uint8)  # low frequencies at the bottom
    Image.fromarray(img, mode="L").save(out_png, optimize=True)
    return img.shape


def revisit(frames_all, duration, d, w=640):
    """Frames at 0, 5, 10, 15 s and the last frame, for the long-rollout row."""
    times = [t for t in (0, 5, 10, 15) if t < duration - 1] + [duration - 1 / FPS]
    out = []
    for i, t in enumerate(times):
        f = frames_all[min(len(frames_all) - 1, int(round(t * FPS)))]
        h = int(round(f.shape[0] * w / f.shape[1]))
        img = cv2.cvtColor(cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
        Image.fromarray(img).save(d / f"at{i}.webp", quality=78, method=6)
        out.append(round(t, 2))
    return out


def strip(frames_all, duration, out_webp, h=112):
    n_chunks = int(np.ceil(duration / CHUNK_SEC - 1e-6))
    tiles = []
    for k in range(n_chunks):
        t = min(duration - 0.05, (k + 0.5) * CHUNK_SEC)
        f = frames_all[min(len(frames_all) - 1, int(round(t * FPS)))]
        w = int(round(f.shape[1] * h / f.shape[0]))
        tiles.append(cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA))
    sheet = cv2.cvtColor(np.concatenate(tiles, axis=1), cv2.COLOR_BGR2RGB)
    Image.fromarray(sheet).save(out_webp, quality=72, method=6)
    return n_chunks, tiles[0].shape[1], h


def camera_path(frames_all, step=2, focal_frac=0.78):
    """Monocular visual odometry on the generated video.

    Rotation is well defined; translation only up to scale. Each step's length is set
    proportional to the median de-rotated feature motion, so the shape of the path is
    meaningful but the units are not.
    """
    frames = frames_all[::step]
    h, w = frames[0].shape[:2]
    f = focal_frac * w
    K = np.array([[f, 0, w / 2], [0, f, h / 2], [0, 0, 1.0]])
    Kinv = np.linalg.inv(K)
    orb = cv2.ORB_create(3000)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    R_wc = np.eye(3)
    pos = np.zeros(3)
    out = [{"t": 0.0, "p": [0, 0, 0], "f": [0, 0, 1], "u": [0, -1, 0]}]
    prev = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
    kp0, d0 = orb.detectAndCompute(prev, None)
    for i in range(1, len(frames)):
        cur = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY)
        kp1, d1 = orb.detectAndCompute(cur, None)
        ok = d0 is not None and d1 is not None and len(kp0) > 30 and len(kp1) > 30
        R = np.eye(3)
        t = np.zeros(3)
        mag = 0.0
        if ok:
            m = bf.match(d0, d1)
            m = sorted(m, key=lambda x: x.distance)[:800]
            p0 = np.float32([kp0[x.queryIdx].pt for x in m])
            p1 = np.float32([kp1[x.trainIdx].pt for x in m])
            moving = len(m) > 40 and float(np.median(np.linalg.norm(p1 - p0, axis=1))) > 0.3
            if moving:
                try:
                    E, inl = cv2.findEssentialMat(p0, p1, K, cv2.RANSAC, 0.999, 1.0)
                except cv2.error:
                    E = None
                if E is not None and E.shape == (3, 3):
                    _, R, tt, inl2 = cv2.recoverPose(E, p0, p1, K, mask=inl)
                    t = tt.ravel()
                    sel = inl2.ravel() > 0
                    if sel.sum() > 20:
                        # de-rotate: map p0 through R and compare with p1 -> residual parallax
                        h0 = (Kinv @ np.c_[p0[sel], np.ones(sel.sum())].T)
                        r0 = K @ (R @ h0)
                        r0 = (r0[:2] / r0[2]).T
                        mag = float(np.median(np.linalg.norm(p1[sel] - r0, axis=1)))
        # camera motion in world frame: recoverPose gives x1 = R x0 + t (points), so the camera
        # moved by -R^T t and rotated by R^T.
        R_step = R.T
        move = -R_step @ t
        nrm = np.linalg.norm(move)
        if nrm > 0:
            move = move / nrm * (mag / f)
        pos = pos + R_wc @ move
        R_wc = R_wc @ R_step
        fwd = R_wc @ np.array([0, 0, 1.0])
        up = R_wc @ np.array([0, -1.0, 0])
        out.append({"t": round(i * step / FPS, 3), "p": pos.round(5).tolist(), "f": fwd.round(4).tolist(),
                    "u": up.round(4).tolist()})
        prev, kp0, d0 = cur, kp1, d1
    return out


def main():
    src, vid, out_dir = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    d = out_dir / vid
    d.mkdir(parents=True, exist_ok=True)
    # the team's masters run at 6-28 Mbit/s; re-encode for the web with a bitrate cap.
    # GAIN_DB: peak-safe loudness gain (the masters sit at -27 to -47 LUFS). FF_THREADS keeps the machine quiet.
    th = os.environ.get("FF_THREADS", "2")
    gain = os.environ.get("GAIN_DB", "0")
    af = ["-af", f"volume={gain}dB"]
    run(FFMPEG, "-y", "-threads", th, "-i", str(src), "-c:v", "libx264", "-threads", th, "-preset", "slow", "-crf", "23",
        "-maxrate", "4M", "-bufsize", "8M", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        *af, "-c:a", "aac", "-b:a", "160k", str(d / "full.mp4"))
    run(FFMPEG, "-y", "-threads", th, "-i", str(src), "-vf", "scale=960:-2", "-c:v", "libx264", "-threads", th,
        "-preset", "slow", "-crf", "26", "-maxrate", "1.8M", "-bufsize", "3.6M",
        "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", *af, "-c:a", "aac", "-b:a", "96k",
        str(d / "sd.mp4"))
    # muted 640-wide loop for the demo wall
    run(FFMPEG, "-y", "-threads", th, "-i", str(src), "-an", "-vf", "scale=640:-2,fps=24", "-c:v", "libx264",
        "-threads", th, "-preset", "slow", "-crf", "30", "-maxrate", "600k", "-bufsize", "1200k", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(d / "tile.mp4"))
    duration = probe_duration(src)
    frames_all = read_frames(src)
    first = cv2.cvtColor(frames_all[0], cv2.COLOR_BGR2RGB)
    Image.fromarray(first).save(d / "poster.webp", quality=82, method=6)
    small = cv2.resize(first, (672, 384), interpolation=cv2.INTER_AREA)
    Image.fromarray(small).save(d / "poster-sm.webp", quality=78, method=6)
    n_chunks, tile_w, tile_h = strip(frames_all, duration, d / "strip.webp")
    _, big_w, big_h = strip(frames_all, duration, d / "chunks.webp", h=270)
    at = revisit(frames_all, duration, d)
    pcm = audio_pcm(src)
    spec_shape = spectrogram(pcm, d / "spec.png")
    meta = {
        "id": vid,
        "duration": round(duration, 3),
        "width": int(frames_all[0].shape[1]),
        "height": int(frames_all[0].shape[0]),
        "fps": FPS,
        "chunkSec": round(CHUNK_SEC, 5),
        "chunks": n_chunks,
        "strip": {"tileW": tile_w, "tileH": tile_h},
        "chunksBig": {"tileW": big_w, "tileH": big_h},
        "revisit": at,
        "spec": {"bins": int(spec_shape[0]), "cols": int(spec_shape[1]), "colsPerSec": 50},
        "envelope": {"rate": 60, "l": envelope(pcm)[0], "r": envelope(pcm)[1]},
        # Input camera trajectories come from the team (per-frame c2w); monocular VO on the
        # output was tried on 11-20 and was too unstable to show (yaw flipped through +-180 deg).
        "camera": None,
    }
    (d / "meta.json").write_text(json.dumps(meta, separators=(",", ":")))
    print(vid, "duration", duration, "chunks", n_chunks, "frames", len(frames_all), "spec", spec_shape)


if __name__ == "__main__":
    main()
