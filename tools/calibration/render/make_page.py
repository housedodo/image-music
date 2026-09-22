#!/usr/bin/env python3
"""Wrap web/pad.body.html into a test page that exposes the engine on window.__pad,
so the render scripts can drive the real Web Audio graph in headless Chromium.

    python3 make_page.py after            # current web/pad.body.html -> t_after.html
    python3 make_page.py before OLD.html  # any older fragment        -> t_before.html
"""
import pathlib, sys
here = pathlib.Path(__file__).resolve().parent
tag = sys.argv[1] if len(sys.argv) > 1 else "after"
src = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else here.parent.parent.parent / "web" / "pad.body.html"
s = src.read_text(); i = s.rindex("})();")
s = s[:i] + ("window.__pad={graph:graph,applyTo:applyTo,buildPatch:buildPatch,analysePixels:analysePixels,"
             "render:render,seamless:seamless,loopSeconds:loopSeconds};\n") + s[i:]
(here / f"t_{tag}.html").write_text("<!doctype html><html><head><meta charset=utf-8></head><body>" + s + "</body></html>")
print("wrote", here / f"t_{tag}.html")
