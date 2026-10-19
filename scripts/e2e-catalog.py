#!/usr/bin/env python3
"""Regenerates sections 1 and 2 of E2E_TESTS.md (the test lists) from the test files.

Run: python3 scripts/e2e-catalog.py   (section 3, the former manual steps, is hand-written).
"""
import glob
import re

def titles(path):
    src = open(path).read()
    pattern = r'\btest\(\s*(?:\n\s*)?("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'|`(?:[^`\\]|\\.)*`)'
    return [m.group(1)[1:-1].replace('\\"', '"').replace("\\'", "'") for m in re.finditer(pattern, src)]

def real_titles(path):
    src = open(path).read()
    pattern = r'^\s*(describe|it)\(\s*(?:\n\s*)?("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)'
    return [(m.group(1), m.group(2)[1:-1]) for m in re.finditer(pattern, src, re.M)]

specs = sorted(glob.glob("e2e/*.spec.ts"))
real = sorted(glob.glob("real-app/*.test.mjs"))
out = ["## 1. Real-app suite\n"]
for path in real:
    out.append(f"### `{path}`\n")
    for kind, title in real_titles(path):
        out.append(f"- **{title}**" if kind == "describe" else f"  - {title}")
    out.append("")
out.append("## 2. Browser end-to-end specs\n")
for path in specs:
    found = titles(path)
    out.append(f"### `{path}` ({len(found)})\n")
    out.extend(f"- {t}" for t in found)
    out.append("")
block = "\n".join(out) + "\n"
doc = open("E2E_TESTS.md").read()
start = doc.index("## 1. Real-app suite")
end = doc.index("## 3. Former manual steps")
open("E2E_TESTS.md", "w").write(doc[:start] + block + doc[end:])
print("e2e specs:", len(specs), "tests:", sum(len(titles(p)) for p in specs), "| real-app files:", len(real))
