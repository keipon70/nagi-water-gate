export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`;

// Time advects water downward. Progress controls only the scene envelope.
export const fragmentShader = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform vec2 u_gateSize;
uniform vec2 u_heroSize;
uniform sampler2D u_gate;
uniform sampler2D u_hero;
uniform sampler2D u_gateBlur;
uniform sampler2D u_heroBlur;
uniform float u_progress;
uniform float u_time;
uniform float u_mobile;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.57+noise(p*2.03+8.4)*.28+noise(p*4.11+27.1)*.15;}
vec2 cover(vec2 uv,vec2 size){float a=u_resolution.x/u_resolution.y,b=size.x/size.y;vec2 s=vec2(min(a/b,1.),min(b/a,1.));return (uv-.5)*s+.5;}
float rivulets(vec2 q,float scale,float seed){
  float x=q.x*scale;
  float cell=floor(x);float sum=0.;
  for(int i=-1;i<=1;i++){
    float id=cell+float(i);float r=hash(vec2(id,seed));
    float center=id+.15+.7*r;
    float yy=(q.y+u_time*(.10+r*.13))*(4.6+r*7.)+seed;
    float bend=(noise(vec2(yy*.5,id+seed))-.5)*.42;
    float width=.035+.18*pow(noise(vec2(yy*.8+5.,id)),2.);
    if(seed>40.) width=.13+.38*noise(vec2(yy*.57,id+4.));
    float dx=(x-center-bend)/width;
    float breakup=smoothstep(.22,.56,noise(vec2(yy*.65,id*3.)));
    sum+=exp(-dx*dx)*breakup*(.6+.4*r);
  }
  return sum;
}
float lensDrops(vec2 q){
  float h=0.;
  for(int i=0;i<9;i++){
    if(u_mobile>.5 && i>=4) break;
    float id=float(i),r=hash(vec2(id,71.));
    float x=(.05+.9*hash(vec2(id,16.)))*u_resolution.x/u_resolution.y;
    float y=1.15-mod(hash(vec2(id,29.))*1.4+u_time*(.012+r*.019),1.4);
    vec2 d=q-vec2(x,y);
    float radius=.009+r*.012;
    // Uneven elongated footprint and a narrow trailing neck, no spherical particles.
    d.x+=sin(d.y*65.+id)*.0015;
    float body=exp(-pow(d.x/radius,2.)-pow(d.y/(radius*2.4),2.));
    float neck=exp(-pow(d.x/(radius*.35),2.))*smoothstep(-.01,.025,d.y)*(1.-smoothstep(.03,.14,d.y));
    h+=body*.24+neck*.07;
  }
  return h;
}
float heightField(vec2 uv,float p){
  vec2 q=vec2(uv.x*u_resolution.x/u_resolution.y,uv.y);
  float film=smoothstep(.36,.52,p)*(1.-smoothstep(.65,.87,p));
  float strength=.68+.32*smoothstep(.2,.4,p);
  float h=rivulets(q+vec2(p*.018,0.),12.,2.)*.30;
  if(u_mobile<.5) h+=rivulets(q+vec2(.4-p*.012,0.),24.,19.)*.10*strength;
  h+=rivulets(q+vec2(.7+p*.027,0.),5.8,41.)*.34;
  h+=lensDrops(q)*(1.-smoothstep(.82,.94,p));
  // A connected uneven sheet, elongated with gravity rather than circular particles.
  vec2 w=q*vec2(3.2,1.8)+vec2(0.,u_time*.07);
  h+=(.20+film)*(fbm(w+fbm(w*1.4)*1.1)*1.3+fbm(w*vec2(3.,.5))*.24);
  float drain=smoothstep(.64,.94,p);
  float edge=drain*1.15-.08 + (noise(vec2(q.x*4.,p*3.))-.5)*.15;
  float wet=1.-smoothstep(1.-edge-.035,1.-edge+.035,uv.y);
  return h*strength*wet*(1.-smoothstep(.90,.945,p));
}
vec3 hero(vec2 uv,float soft){
  vec3 ivory=vec3(.94902,.93725,.90980);
  if(u_mobile>.5){
    // Bottom 64% carries the photograph; a warm plaster veil protects live type above.
    vec2 photo=vec2(uv.x,uv.y/.64);
    float a=u_resolution.x/(u_resolution.y*.64),b=u_heroSize.x/u_heroSize.y;
    vec2 s=vec2(min(a/b,1.),min(b/a,1.));
    vec2 tex=vec2((photo.x-.5)*s.x+.5+(1.-s.x)*.21,(photo.y-.5)*s.y+.5);
    vec3 c=mix(texture2D(u_hero,clamp(tex,.001,.999)).rgb,texture2D(u_heroBlur,clamp(tex,.001,.999)).rgb,soft);
    return mix(c,ivory,smoothstep(.42,.65,uv.y));
  }
  vec2 t=clamp(cover(uv,u_heroSize),.001,.999);
  return mix(texture2D(u_hero,t).rgb,texture2D(u_heroBlur,t).rgb,soft);
}
vec3 scene(vec2 uv,float change,float p){
  vec2 g=cover(uv,u_gateSize);
  // Millimetric scene drift; foreground water travels independently.
  g+=(vec2(.006,-.009)*p)*(1.-change);
  float soft=smoothstep(.37,.51,p)*(1.-smoothstep(.65,.86,p))*.98;
  vec3 a=mix(texture2D(u_gate,clamp(g,.001,.999)).rgb,texture2D(u_gateBlur,clamp(g,.001,.999)).rgb,soft);
  a*=.78+.10*smoothstep(0.,.4,p);
  return mix(a,hero(uv,soft),change);
}
void main(){
  vec2 uv=v_uv;float p=u_progress;
  if(p>=.945){gl_FragColor=vec4(hero(uv,0.),1.);return;}
  float film=smoothstep(.36,.52,p)*(1.-smoothstep(.65,.87,p));
  vec2 e=vec2(.0012*u_resolution.y/u_resolution.x,.0012);
  vec2 grad=vec2(heightField(uv+vec2(e.x,0.),p)-heightField(uv-vec2(e.x,0.),p),heightField(uv+vec2(0.,e.y),p)-heightField(uv-vec2(0.,e.y),p));
  vec2 normal=grad*vec2(2.8,2.2);
  vec2 refractUV=uv+normal*(.075+.04*film);
  refractUV+=(vec2(fbm(vec2(uv.x*4.,uv.y*2.+u_time*.09)),fbm(vec2(uv.x*3.+9.,uv.y+u_time*.06)))-.5)*film*.018;
  // Scene replacement is spatially staggered beneath maximum film, not a global fade.
  float boundary=.55+(fbm(uv*vec2(3.,2.))-.5)*.095;
  float change=smoothstep(boundary-.014,boundary+.014,p);
  float blur=film*.005;
  vec3 c=scene(refractUV,change,p)*.6;
  c+=scene(refractUV+vec2(blur,blur*.5),change,p)*.2;
  c+=scene(refractUV-vec2(blur,blur*.5),change,p)*.2;
  float light=dot(normal,normalize(vec2(-.6,.8)));
  float glint=pow(max(light,0.),1.45)*1.9;
  float wet=1.-smoothstep(.88,.945,p);
  c*=1.-clamp(-light*.5,0.,.22)*wet;
  c+=vec3(.88,.86,.79)*min(glint,.35)*wet;
  // Soft scattered daylight through the contiguous sheet obscures the boundary.
  float veil=film*(.15+.14*fbm(vec2(uv.x*4.,uv.y*2.+u_time*.07)));
  c=mix(c,vec3(.57,.56,.51),veil);
  float vignette=(1.-smoothstep(.2,.8,distance(uv,vec2(.52,.55))))*.12+.88;
  c*=mix(vignette,1.,smoothstep(.6,.9,p));
  gl_FragColor=vec4(c,1.);
}
`;
