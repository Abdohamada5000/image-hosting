#!/usr/bin/env python3
"""Upload an image to the public GitHub image-hosting repository."""
import argparse, base64, os, re, sys, uuid
from pathlib import Path
import requests

OWNER = os.getenv("GITHUB_OWNER", "Abdohamada5000")
REPO = os.getenv("GITHUB_REPO", "image-hosting")
MAX_BYTES = 20 * 1024 * 1024
ALLOWED = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"}

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("image")
    p.add_argument("--name")
    a = p.parse_args()
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        sys.exit("Set GITHUB_TOKEN securely in your environment; never put it in this script.")
    src = Path(a.image).expanduser()
    if not src.is_file() or src.suffix.lower() not in ALLOWED:
        sys.exit("Input must be an existing image file with a supported extension.")
    if not 0 < src.stat().st_size <= MAX_BYTES:
        sys.exit("Image must be non-empty and no larger than 20 MiB.")
    requested = Path(a.name or src.name).name
    ext = Path(requested).suffix.lower()
    if ext not in ALLOWED:
        sys.exit("Destination name must use a supported image extension.")
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", Path(requested).stem).strip(".-_") or "image"
    filename = f"{stem}-{uuid.uuid4().hex[:8]}{ext}"
    path = f"images/{filename}"
    headers = {"Accept":"application/vnd.github+json", "Authorization":f"Bearer {token}", "X-GitHub-Api-Version":"2022-11-28"}
    payload = {"message":f"Upload image {filename}", "content":base64.b64encode(src.read_bytes()).decode("ascii")}
    try:
        res = requests.put(f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{path}", headers=headers, json=payload, timeout=60)
    except requests.RequestException as e:
        sys.exit(f"Upload failed: {e}")
    if res.status_code not in (200, 201):
        try: detail = res.json().get("message", res.reason)
        except ValueError: detail = res.reason
        sys.exit(f"GitHub upload failed ({res.status_code}): {detail}")
    print(f"Raw URL: https://raw.githubusercontent.com/{OWNER}/{REPO}/main/{path}")
    print(f"CDN URL: https://cdn.jsdelivr.net/gh/{OWNER}/{REPO}@main/{path}")

if __name__ == "__main__": main()
