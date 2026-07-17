/* ============================================================
   EcomXprt — js/hero.js  (index.html ONLY)
   Heavy 3D hero visuals live in their own file so every other
   page on the site skips this weight entirely — better load
   speed = better Core Web Vitals = better SEO on every subpage.
   ============================================================ */

/* THREE.JS PARTICLE HERO */
(function(){
  const c=document.getElementById('hcanvas');
  if(!c||!window.THREE)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){c.style.display='none';return;}
  const W=window.innerWidth,H=window.innerHeight;
  const renderer=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(W,H);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(65,W/H,.1,200);
  cam.position.z=10;
  scene.add(new THREE.AmbientLight(0x001020,2));
  const pl=new THREE.PointLight(0x0EA5E9,3.5,40);pl.position.set(4,4,5);scene.add(pl);
  const N=1600,pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*42;pos[i*3+1]=(Math.random()-.5)*28;pos[i*3+2]=(Math.random()-.5)*18-4;}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  scene.add(new THREE.Points(pg,new THREE.PointsMaterial({color:0x0EA5E9,size:.04,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false})));
  const oc=new THREE.Mesh(new THREE.OctahedronGeometry(2.8,1),new THREE.MeshPhongMaterial({color:0x0284C7,wireframe:true,transparent:true,opacity:.09}));
  oc.position.set(3.5,0,-3);scene.add(oc);
  const flts=[];
  for(let i=0;i<10;i++){
    const m=new THREE.Mesh(new THREE.IcosahedronGeometry(Math.random()*.4+.1,0),new THREE.MeshPhongMaterial({color:[0x0284C7,0x0EA5E9,0x38BDF8,0x0C4A6E][i%4],wireframe:true,transparent:true,opacity:Math.random()*.28+.12}));
    m.position.set((Math.random()-.5)*20,(Math.random()-.5)*13,(Math.random()-.5)*6-3);
    m.userData={rx:Math.random()*.013+.004,ry:Math.random()*.01+.003,ix:m.position.x,iy:m.position.y,v:Math.random()*.008};
    scene.add(m);flts.push(m);
  }
  let mx=0,my=0,tmx=0,tmy=0,t=0;
  window.addEventListener('mousemove',e=>{mx=(e.clientX/window.innerWidth-.5)*2;my=-(e.clientY/window.innerHeight-.5)*2;},{passive:true});
  let _hRT;window.addEventListener('resize',()=>{clearTimeout(_hRT);_hRT=setTimeout(()=>{cam.aspect=window.innerWidth/window.innerHeight;cam.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);},150);},{passive:true});
  (function anim(){requestAnimationFrame(anim);t+=.005;oc.rotation.x=t*.2;oc.rotation.y=t*.32;flts.forEach(f=>{f.rotation.x+=f.userData.rx;f.rotation.y+=f.userData.ry;f.position.x=f.userData.ix+Math.sin(t*.6+f.userData.v*100)*.8;f.position.y=f.userData.iy+Math.cos(t*.5+f.userData.v*100)*.6;});tmx+=(mx-tmx)*.04;tmy+=(my-tmy)*.04;cam.position.x=tmx*.8;cam.position.y=tmy*.5;cam.lookAt(0,0,0);pl.position.x=Math.sin(t*.7)*7;pl.position.y=Math.cos(t*.5)*5;renderer.render(scene,cam);})();
})();

/* HERO REVENUE BAR CHART */
const bEl=document.getElementById('hBars');
if(bEl)[28,40,33,52,45,68,58,80,72,88,84,100].forEach((v,i)=>{const b=document.createElement('div');b.className='bar'+(i===11?' hi':'');b.style.height=Math.round(v*.46)+'px';bEl.appendChild(b);});

/* LIVE REVENUE COUNTER */
(function(){let v=0,target=284920,s=Date.now(),d=2400;function t(){const p=Math.min((Date.now()-s)/d,1),e=1-Math.pow(1-p,3);v=Math.round(e*target);const el=document.getElementById('revNum');if(el)el.textContent='$'+v.toLocaleString();if(p<1)setTimeout(t,16);}setTimeout(t,900);})();

/* HERO ELEMENTS ANIMATE IN ON LOAD */
[['#hEb',280],['#hH1',420],['#hSub',590],['#hBtns',740],['#hTrust',880],['#heroDash',560]].forEach(([s,d])=>{const el=document.querySelector(s);if(!el)return;el.style.cssText+='opacity:0;transform:translateY(26px)';setTimeout(()=>{el.style.transition='opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)';el.style.opacity='1';el.style.transform='none';},d);});
