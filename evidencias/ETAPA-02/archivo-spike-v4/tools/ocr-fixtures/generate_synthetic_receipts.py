"""Render the synthetic OCR receipts defined in app/src/poc/ocrFixtures.ts.

Usage:
  node --experimental-strip-types tools/ocr-fixtures/export-fixtures.mjs > fixtures.json
  python3 tools/ocr-fixtures/generate_synthetic_receipts.py fixtures.json OUTPUT_DIR --font FONT.ttf

Every image and expected.json is derived from the fixtures file. The output
directory must not exist and must be outside the repository.
"""

import argparse
import hashlib
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SCHEMA_VERSION = 1


def render(fixture, font_path):
    conditions = fixture["conditions"]
    width = conditions["widthPx"]
    height = conditions["heightPx"]
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    font_size = max(12, width // 26)
    font = ImageFont.truetype(font_path, font_size)
    margin = width // 12
    line_height = int(font_size * 1.6)
    y = margin
    for line in fixture["lines"]:
        draw.text((margin, y), line, fill="black", font=font)
        y += line_height
    if conditions["blurRadius"] > 0:
        image = image.filter(ImageFilter.GaussianBlur(conditions["blurRadius"]))
    if conditions["rotationDeg"]:
        image = image.rotate(-conditions["rotationDeg"], expand=True, fillcolor="white")
    return image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("fixtures")
    parser.add_argument("output")
    parser.add_argument("--font", required=True)
    args = parser.parse_args()

    output = pathlib.Path(args.output)
    if output.exists():
        sys.exit(f"output directory already exists: {output}")
    output.mkdir(parents=True)

    fixtures = json.loads(pathlib.Path(args.fixtures).read_text(encoding="utf-8"))
    manifest = []
    for fixture in fixtures:
        if fixture.get("synthetic") is not True:
            sys.exit(f"fixture {fixture.get('id')} is not marked as synthetic")
        image_path = output / f"{fixture['id']}.jpg"
        render(fixture, args.font).save(
            image_path, "JPEG", quality=fixture["conditions"]["jpegQuality"]
        )
        image_hash = hashlib.sha256(image_path.read_bytes()).hexdigest()
        expected = {
            "schemaVersion": SCHEMA_VERSION,
            "synthetic": True,
            "id": fixture["id"],
            "index": fixture["index"],
            "canaryToken": fixture["canaryToken"],
            "fields": fixture["fields"],
            "lines": fixture["lines"],
            "conditions": fixture["conditions"],
            "imageSha256": image_hash,
        }
        (output / f"{fixture['id']}.expected.json").write_text(
            json.dumps(expected, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        manifest.append({"id": fixture["id"], "imageSha256": image_hash})
    (output / "manifest.json").write_text(
        json.dumps({"schemaVersion": SCHEMA_VERSION, "images": manifest}, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
