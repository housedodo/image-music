#!/usr/bin/env python3
"""Draw the app icons. Run after changing the mark: python3 tools/icons.py"""
from PIL import Image, ImageDraw
import math, pathlib

BG=(13,16,18); JADE=(95,211,184); DIM=(38,74,68)
ROOT=pathlib.Path(__file__).resolve().parent.parent

def stroke_path(d, pts, width, fill):
    """Stamp circles along the path — smooth round joins and caps, unlike
    ImageDraw.line, whose mitred joins are visibly jagged at icon sizes."""
    r=width/2.0; prev=None
    for p in pts:
        if prev is not None:
            dist=math.hypot(p[0]-prev[0], p[1]-prev[1])
            for s in range(1, max(1,int(dist/(r*0.35)))+1):
                t=s/max(1,int(dist/(r*0.35)))
                x=prev[0]+(p[0]-prev[0])*t; y=prev[1]+(p[1]-prev[1])*t
                d.ellipse([x-r,y-r,x+r,y+r], fill=fill)
        else:
            d.ellipse([p[0]-r,p[1]-r,p[0]+r,p[1]+r], fill=fill)
        prev=p

def draw_mark(size, pad_frac, bg=True, radius_frac=0.22):
    """A picture frame whose landscape is a sound wave."""
    S=size*4
    im=Image.new("RGBA",(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    if bg: d.rounded_rectangle([0,0,S-1,S-1], radius=int(S*radius_frac), fill=BG)
    pad=int(S*pad_frac); box=[pad,pad,S-pad,S-pad]
    w=box[2]-box[0]; h=box[3]-box[1]
    d.rounded_rectangle([box[0],box[1]+h*0.06,box[2],box[3]-h*0.06],
                        radius=int(w*0.16), outline=DIM, width=max(2,int(w*0.075)))
    cx=box[0]+w*0.29; cy=box[1]+h*0.29; rr=w*0.08
    d.ellipse([cx-rr,cy-rr,cx+rr,cy+rr], fill=JADE)
    amp=h*0.155; base=box[1]+h*0.615
    pts=[]
    for i in range(401):
        t=i/400
        pts.append((box[0]+w*0.13+t*(w*0.74),
                    base - math.sin(t*math.pi*2.0)*amp*(0.45+0.55*math.sin(t*math.pi))))
    stroke_path(d, pts, max(3,int(w*0.10)), JADE)
    return im.resize((size,size), Image.LANCZOS)

if __name__=="__main__":
    out=ROOT/"icons"; out.mkdir(exist_ok=True)
    for size in (192,512): draw_mark(size,0.20).save(out/f"icon-{size}.png")
    # maskable: content inside the centre 80%, background across the whole tile
    m=Image.new("RGBA",(512,512),BG); m.alpha_composite(draw_mark(512,0.30,bg=False))
    m.save(out/"icon-maskable-512.png")
    # iOS applies its own mask, so no rounding and no alpha
    draw_mark(180,0.20,radius_frac=0.0).convert("RGB").save(out/"apple-touch-icon.png")
    draw_mark(64,0.14).save(out/"favicon-64.png")
    print("icons written to", out)
