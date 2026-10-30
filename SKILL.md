# GitHub Image Upload Skill

Upload a local image to the public `Abdohamada5000/image-hosting` repository and return a jsDelivr CDN URL.

## Requirements
- Python 3.9+
- `requests`
- A GitHub fine-grained personal access token restricted to this repository, with **Contents: Read and write** permission.

## Configuration
Set `GITHUB_TOKEN` securely in the environment. Optional: `GITHUB_OWNER` (default `Abdohamada5000`) and `GITHUB_REPO` (default `image-hosting`). Never paste or commit tokens.

Install: `python -m pip install -r requirements.txt`

Run: `python upload_image.py /path/to/image.png`

Optional filename: `python upload_image.py /path/to/image.png --name custom-name.png`

Uploads go to `images/`; the script prints raw GitHub and jsDelivr URLs.

## Safety
- Upload only files explicitly selected by the user.
- This repository is public; uploaded images are publicly accessible and may be cached.
- Never print or log the token.
- Reject empty files and files larger than 20 MiB.
- Do not overwrite existing names; a unique suffix is added.
