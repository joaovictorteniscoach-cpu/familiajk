#!/usr/bin/env python3
"""Poses da JV em alta resolucao para a folha deitada (jogador grande e a
sequencia do movimento).

Cada pose sai da prancha (ferramentas/originais/prancha-poses-jv.png),
e' ampliada 4x por super-resolucao (EDSR, opencv-contrib) e so' depois
recortada pelo rembg (birefnet-general-lite), como no recortar-poses-jv.py.
Ampliar antes de recortar deixa a borda do cabelo e da raquete limpa.

Precisa de: pip install rembg onnxruntime opencv-contrib-python-headless
e do modelo EDSR_x4.pb (github.com/Saafke/EDSR_Tensorflow) em sr/EDSR_x4.pb.

    uso: python3 ferramentas/ampliar-poses-jv.py [pose ...]
Grava em sr/<pose>-hd.webp; copie para app-exercicios/.
O backhand de costas da prancha esconde a raquete: a quadra usa o backhand
de duas maos de perfil (jv-lat-bh-hd espelhado = jv-lat-bh-esq.webp).
"""
import sys, importlib.util, time
import numpy as np, cv2
from PIL import Image
from scipy import ndimage
spec=importlib.util.spec_from_file_location('r','ferramentas/recortar-poses-jv.py');r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
from rembg import remove, new_session
s=new_session('birefnet-general-lite')
sr=cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel('sr/EDSR_x4.pb'); sr.setModel('edsr',4)
p=Image.open('ferramentas/originais/prancha-poses-jv.png').convert('RGB')
BOX={'jv-lat-espera':(15,470,200,725),'jv-lat-fh':(205,470,455,725),'jv-lat-bh':(415,470,630,725),'jv-lat-reves':(975,470,1150,725),
 'jv-fh-fim':(188,815,340,1005),'jv-saque-lanca':(768,795,880,1005),'jv-split':(1337,815,1525,1005),
 'jv-desloca':(1345,490,1500,725),'jv-aproxima':(1150,480,1330,725),'jv-voleio':(595,460,810,725),'jv-saque-frente':(810,415,960,725),
 'jv-espera-frente':(10,55,232,372),'jv-saque-costas':(994,815,1133,1005),'jv-golpe-costas-bh':(1290,55,1530,372)}
LIMPA={'jv-lat-fh':.10,'jv-lat-bh':.10,'jv-golpe-costas-bh':.10}
alvo=sys.argv[1:] or list(BOX)
for n in alvo:
    t=time.time(); c=np.array(p.crop(BOX[n]))[:,:,::-1]
    up=Image.fromarray(sr.upsample(c)[:,:,::-1])
    o=np.array(remove(up,session=s)); a=o[...,3]>40
    rot,k=ndimage.label(a)
    if k>1:
        ar=ndimage.sum(a,rot,range(1,k+1)); keep=[i+1 for i,v in enumerate(ar) if v>=LIMPA.get(n,.015)*ar.max()]
        o[~np.isin(rot,keep),3]=0
    ys,xs=np.where(o[...,3]>40); o=o[max(ys.min()-8,0):ys.max()+9, max(xs.min()-8,0):xs.max()+9]
    im=Image.fromarray(o)
    if n=='jv-saque-costas': im,_=r.espelhar(im)
    if im.height>1000: im=im.resize((round(im.width*1000/im.height),1000),Image.LANCZOS)
    out='sr/'+n+('' if n=='jv-golpe-costas-bh' else '-hd')+'.webp'
    im.save(out,'WEBP',quality=90,method=6)
    print(n,im.size,'pes %.3f'%r.pes(im),'%.0fs'%(time.time()-t),flush=True)
