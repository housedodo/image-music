#!/usr/bin/env python3
"""Wrap the artifact-style page fragment in a standalone HTML document.

The fragment (web/pad.body.html) carries only <title>, <style>, markup and
<script>, because the claude.ai artifact host supplies the skeleton itself.
A normal web server supplies nothing, so this adds the parts that matter:
the viewport meta (without it a phone renders at 980px and every mobile
media query is skipped), cache directives, and a build stamp.
"""
import datetime, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
frag = (root / "web" / "pad.body.html").read_text()
# the fragment opens with <title>/<link>/<style>; those belong in <head>,
# everything after the last </style> is body content
split = frag.rindex("</style>") + len("</style>")
frag_head, frag_body = frag[:split], frag[split:]
build = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

doc = f"""<!doctype html>
<html lang="en" data-build="{build}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0d1012" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f2f3f1" media="(prefers-color-scheme: light)">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<meta name="description" content="Take a picture, keep the pad. One photo becomes one sustained chord you can export as a loop, a one-shot and MIDI.">
<link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230d1012'/%3E%3Cpath d='M8 32c6-14 10 14 16 0s10 14 16 0 10 14 16 0' stroke='%235fd3b8' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
<style>
  *{{box-sizing:border-box;}}
  html,body{{margin:0;}}
  :root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);}}
  img{{max-width:100%;}}
  [hidden]{{display:none!important;}}
</style>
{frag_head}
</head>
<body>
{frag_body}
</body>
</html>
"""
(root / "index.html").write_text(doc)
print(f"built index.html  ({len(doc)} bytes, build {build})")
