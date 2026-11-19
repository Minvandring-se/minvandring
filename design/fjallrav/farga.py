# Färgar räven och grytet i design/fjallrav så att de syns på kartan: räven i sommarpäls (gråbrun
# rygg, grått huvud, ljus mage) och grytet med grön kulle och jord nertill. Skriver *-farg.png.
# Kräver Python med numpy och Pillow. Körs från repots rot:
#   python3 design/fjallrav/farga.py
#   node design/fjallrav/gor-webp.cjs
import numpy as np, colorsys
from PIL import Image
def hx(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
def gradient(L, stops):
    out=np.zeros(L.shape+(3,))
    xs=[s[0] for s in stops]; cs=[hx(s[1]) for s in stops]
    for c in range(3): out[...,c]=np.interp(L,xs,[k[c] for k in cs])
    return out
def stretch(L,a):
    m=a>40; lo,hi=np.percentile(L[m],2),np.percentile(L[m],99.5); return np.clip((L-lo)/(hi-lo),0,1)
def fargla(src,dst,stops,gron=None):
    im=np.array(Image.open(src).convert('RGBA')).astype(float)
    rgb=im[...,:3]/255; a=im[...,3]
    L=0.299*rgb[...,0]+0.587*rgb[...,1]+0.114*rgb[...,2]
    Ls=stretch(L,a)
    out=gradient(Ls,stops)
    if gron is not None:
        mx=rgb.max(-1); mn=rgb.min(-1); sat=(mx-mn)/np.maximum(mx,1e-6)
        g=(rgb[...,1]>rgb[...,0]+0.01)&(rgb[...,1]>=rgb[...,2])&(sat>0.06)
        gc=gradient(Ls,gron)
        out[g]=gc[g]
    res=np.dstack([out,a]).clip(0,255).astype(np.uint8)
    Image.fromarray(res,'RGBA').save(dst)
fargla('design/fjallrav/fjallrav-staende.png','/tmp/rav.png',[(0,'#2f2a24'),(0.35,'#6e5f4e'),(0.62,'#9a8770'),(0.85,'#d6c8b2'),(1,'#f6efe3')])
fargla('design/fjallrav/fjallrav-gryt.png','/tmp/gryt.png',[(0,'#3b3328'),(0.4,'#7c6a52'),(0.7,'#b39d7b'),(0.9,'#d9c9a8'),(1,'#efe5cf')],gron=[(0,'#2f4f2a'),(0.5,'#5f8a45'),(1,'#a9c98a')])

def tona(src, dst, farg, styrka, omrade):
    im=np.array(Image.open(src).convert('RGBA')).astype(float)
    a=im[...,3]; ys,xs=np.where(a>8); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
    H,W=a.shape; yy,xx=np.mgrid[0:H,0:W]
    v=(yy-y0)/(y1-y0); u=(xx-x0)/(x1-x0)
    w=omrade(u,v)*styrka
    f=hx(farg)
    rgb=im[...,:3]
    # Multiplikativ toning bevarar linjer och skuggor.
    ny=rgb*(1-w[...,None])+ (rgb*f/255)*w[...,None]
    im[...,:3]=ny
    Image.fromarray(im.clip(0,255).astype(np.uint8),'RGBA').save(dst)

def ss(x,a,b):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
# Räven: brun rygg och svansens ovansida, grått huvud, ljus mage och benens insidor.
tona('/tmp/rav.png','/tmp/rav2.png','#8c7558',0.75, lambda u,v: (1-ss(v,0.28,0.62))*(1-ss(u,0.62,0.75)))
tona('/tmp/rav2.png','design/fjallrav/fjallrav-staende-farg.png','#9a948a',0.5, lambda u,v: ss(u,0.66,0.8)*(1-ss(v,0.35,0.5)))
# Grytet: grön kulle överst, jord nertill.
tona('/tmp/gryt.png','design/fjallrav/fjallrav-gryt-farg.png','#8fb36a',0.6, lambda u,v: (1-ss(v,0.35,0.8)))
