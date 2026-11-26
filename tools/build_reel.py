"""Build the hero reel: one seamless loop of short segments from the demo clips.

usage: python3 tools/build_reel.py            (from the repository root)

Reads  src/data/reel.config.json   {"crossfade": 0.5, "segments": [{"id": "demo1", "from": 2, "to": 9}, ...]}
Uses   public/media/<id>/full.mp4  (the compressed web copies made by prep_assets.py)
Writes public/media/reel/reel.mp4      1344 wide, H.264 + AAC
       public/media/reel/reel-sd.mp4   960 wide, for phones
       public/media/reel/poster.webp, poster-sm.webp
       src/data/reel.json          segment windows in reel time, for the captions and the progress bars

Neighbouring segments crossfade (video and sound). The first segment starts `crossfade` seconds in and the
file ends by fading into the first `crossfade` seconds of that segment, so the loop point is seamless.
Each segment's caption window runs from the middle of the fade into it to the middle of the fade out of it;
the first segment's window wraps around the loop point (its start is negative).
"""
import json
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT
MEDIA = SITE / "public" / "media"
FPS = 24
SR = 32000
TH = os.environ.get("FF_THREADS", "2")  # encoding threads; keep low on a shared machine


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def frames(sec):
    n = round(sec * FPS)
    if abs(n / FPS - sec) > 1e-6:
        raise SystemExit(f"{sec} s is not a whole number of frames at {FPS} fps")
    return n / FPS


def main():
    cfg = json.loads((SITE / "src" / "data" / "reel.config.json").read_text())
    d = frames(cfg["crossfade"])
    segs = cfg["segments"]
    for s in segs:
        s["from"], s["to"] = frames(s["from"]), frames(s["to"])
        if s["to"] - s["from"] < 3 * d:
            raise SystemExit(f"{s['id']}: segment too short for a {d} s crossfade")
        if not (MEDIA / s["id"] / "full.mp4").exists():
            raise SystemExit(f"{s['id']}: run prep_assets.py first")

    # pieces in playing order: (clip id, source start, length)
    if len(segs) == 1:
        s = segs[0]
        pieces = [(s["id"], s["from"], s["to"] - s["from"])]
    else:
        first = segs[0]
        pieces = [(first["id"], first["from"] + d, first["to"] - first["from"] - d)]
        pieces += [(s["id"], s["from"], s["to"] - s["from"]) for s in segs[1:]]
        pieces.append((first["id"], first["from"], d))

    args = ["ffmpeg", "-y", "-threads", TH]
    for cid, start, length in pieces:
        args += ["-ss", f"{start:.6f}", "-t", f"{length + 1:.6f}", "-i", str(MEDIA / cid / "full.mp4")]
    graph = []
    for k, (_, _, length) in enumerate(pieces):
        graph.append(f"[{k}:v]fps={FPS},format=yuv420p,setsar=1,trim=duration={length:.6f},setpts=PTS-STARTPTS,settb=AVTB[v{k}]")
        graph.append(f"[{k}:a]aresample={SR},aformat=sample_fmts=fltp:channel_layouts=stereo,apad,"
                     f"atrim=duration={length:.6f},asetpts=PTS-STARTPTS[a{k}]")
    offsets = []
    if len(pieces) == 1:
        vout, aout = "[v0]", "[a0]"
        total = pieces[0][2]
    else:
        acc = pieces[0][2]
        vprev, aprev = "[v0]", "[a0]"
        for k in range(1, len(pieces)):
            off = acc - d
            offsets.append(off)
            graph.append(f"{vprev}[v{k}]xfade=transition=fade:duration={d:.6f}:offset={off:.6f}[x{k}]")
            graph.append(f"{aprev}[a{k}]acrossfade=d={d:.6f}:c1=tri:c2=tri[y{k}]")
            vprev, aprev = f"[x{k}]", f"[y{k}]"
            acc = off + pieces[k][2]
        vout, aout = vprev, aprev
        total = acc

    out = MEDIA / "reel"
    out.mkdir(parents=True, exist_ok=True)
    master = out / "reel.mp4"
    run(args + ["-filter_complex", ";".join(graph), "-map", vout, "-map", aout,
                "-c:v", "libx264", "-threads", TH, "-preset", "slow", "-crf", "21", "-maxrate", "5M", "-bufsize", "10M",
                "-profile:v", "high", "-pix_fmt", "yuv420p",
                "-g", str(FPS * 2), "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(master)])
    run(["ffmpeg", "-y", "-threads", TH, "-i", str(master), "-vf", "scale=960:-2", "-c:v", "libx264", "-threads", TH,
         "-preset", "slow", "-crf", "25", "-maxrate", "2M", "-bufsize", "4M",
         "-profile:v", "high", "-pix_fmt", "yuv420p", "-g", str(FPS * 2), "-c:a", "aac", "-b:a", "96k",
         "-movflags", "+faststart", str(out / "reel-sd.mp4")])
    run(["ffmpeg", "-y", "-i", str(master), "-frames:v", "1", "-c:v", "libwebp", "-quality", "82", str(out / "poster.webp")])
    run(["ffmpeg", "-y", "-i", str(master), "-frames:v", "1", "-vf", "scale=672:-2", "-c:v", "libwebp", "-quality", "78",
         str(out / "poster-sm.webp")])

    # caption windows: cut at the middle of each fade
    windows = []
    if len(segs) == 1:
        windows.append({"id": segs[0]["id"], "start": 0.0, "end": total, "jump": 0.0})
    else:
        cuts = [o + d / 2 for o in offsets]  # cuts[k-1]: from piece k-1 to piece k
        n = len(segs)
        windows.append({"id": segs[0]["id"], "start": cuts[-1] - total, "end": cuts[0], "jump": 0.0})
        for k in range(1, n):
            windows.append({"id": segs[k]["id"], "start": cuts[k - 1], "end": cuts[k], "jump": cuts[k - 1] + d / 2})
    meta = {"duration": round(total, 4), "crossfade": d,
            "segments": [{k: (round(v, 4) if isinstance(v, float) else v) for k, v in w.items()} for w in windows]}
    (SITE / "src" / "data" / "reel.json").write_text(json.dumps(meta, indent=2) + "\n")

    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,duration", "-of", "csv=p=0",
                            str(master)], capture_output=True, text=True, check=True).stdout.split()
    print(json.dumps(meta, indent=2))
    print("streams:", probe, "sizes:", {p.name: p.stat().st_size for p in sorted(out.iterdir())})


if __name__ == "__main__":
    main()
