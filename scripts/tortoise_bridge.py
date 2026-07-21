#!/usr/bin/env python3
"""Small, argument-safe local bridge from the Node worker to Tortoise TTS."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path


# Tortoise's first model download is several GB. Hugging Face defaults to a
# short socket read timeout, which is unhelpful on ordinary home connections.
# Keep it local and resumable, while allowing an operator to choose a value.
os.environ.setdefault(
    "HF_HUB_DOWNLOAD_TIMEOUT", os.environ.get("TORTOISE_DOWNLOAD_TIMEOUT", "600")
)


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate one or more Tortoise TTS WAV clips.")
    parser.add_argument("--text-file")
    parser.add_argument("--output")
    parser.add_argument("--batch-file")
    parser.add_argument("--voice", default="random")
    parser.add_argument("--preset", default="ultra_fast")
    parser.add_argument("--models-dir")
    parser.add_argument("--voice-dir")
    return parser.parse_args()


def narration_requests(args: argparse.Namespace) -> list[tuple[str, Path]]:
    if args.batch_file:
        if args.text_file or args.output:
            raise ValueError("Use either --batch-file or --text-file with --output, not both.")
        payload = json.loads(Path(args.batch_file).read_text(encoding="utf-8"))
        if not isinstance(payload, list) or not payload:
            raise ValueError("Tortoise batch must contain at least one narration request.")
        requests: list[tuple[str, Path]] = []
        for index, item in enumerate(payload):
            if not isinstance(item, dict):
                raise ValueError(f"Narration request {index + 1} must be an object.")
            text = item.get("text")
            output = item.get("output")
            if not isinstance(text, str) or not text.strip():
                raise ValueError(f"Narration request {index + 1} has empty text.")
            if not isinstance(output, str) or not output.strip():
                raise ValueError(f"Narration request {index + 1} is missing an output path.")
            requests.append((text.strip(), Path(output)))
        return requests

    if not args.text_file or not args.output:
        raise ValueError("Provide --batch-file, or both --text-file and --output.")
    text = Path(args.text_file).read_text(encoding="utf-8").strip()
    if not text:
        raise ValueError("Narration text is empty.")
    return [(text, Path(args.output))]


def main() -> None:
    args = arguments()
    requests = narration_requests(args)

    import torch
    import torchaudio
    from tortoise.api import TextToSpeech
    from tortoise.utils.audio import load_voice

    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device != "cuda":
        raise RuntimeError("Tortoise requires an NVIDIA CUDA GPU for this studio worker.")

    voice_dirs = [args.voice_dir] if args.voice_dir else []
    voice_samples, conditioning_latents = load_voice(args.voice, voice_dirs)
    tts = TextToSpeech(
        models_dir=args.models_dir,
        enable_redaction=False,
        kv_cache=True,
        half=True,
        device=device,
    )
    with torch.inference_mode():
        for text, output in requests:
            generated = tts.tts_with_preset(
                text,
                k=1,
                voice_samples=voice_samples,
                conditioning_latents=conditioning_latents,
                preset=args.preset,
                verbose=False,
            )
            if isinstance(generated, list):
                generated = generated[0]
            output.parent.mkdir(parents=True, exist_ok=True)
            torchaudio.save(str(output), generated.squeeze(0).cpu(), 24000)


if __name__ == "__main__":
    main()
