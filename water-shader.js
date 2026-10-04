export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`;

// Every animated coordinate derives from progress, never elapsed time.
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
    float yy=q.y*(4.6+r*7.)+seed;
    float bend=(noise(vec2(yy*.5,id+seed))-.5)*.42;
    float width=.035+.18*pow(noise(vec2(yy*.8+5.,id)),2.);
    if(seed>40.) width=.13+.38*noise(vec2(yy*.57,id+4.));
    float dx=(x-center-bend)/width;
    float breakup=smoothstep(.22,.56,noise(vec2(yy*.65,id*3.)));
    sum+=exp(-dx*dx)*breakup*(.6+.4*r);
  }
  return sum;
}
float heightField(vec2 uv,float p){
  vec2 q=vec2(uv.x*u_resolution.x/u_resolution.y,uv.y);
  float flow=p*3.8;
  float film=smoothstep(.27,.49,p)*(1.-smoothstep(.62,.84,p));
  float strength=.8+.2*smoothstep(0.,.32,p);
  float h=rivulets(q+vec2(0.,flow),12.,2.)*.30;
  h+=rivulets(q+vec2(.4,flow*1.53),24.,19.)*.12;
  h+=rivulets(q+vec2(.7,flow*.72),5.8,41.)*.42;
  // A connected uneven sheet, elongated with gravity rather than circular particles.
  vec2 w=q*vec2(3.2,1.8)+vec2(0.,flow*.63);
  h+=(.42+film)*(fbm(w+fbm(w*1.4)*1.1)*1.3+fbm(w*vec2(3.,.5))*.24);
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
  float soft=smoothstep(.31,.48,p)*(1.-smoothstep(.63,.84,p))*.98;
  vec3 a=mix(texture2D(u_gate,clamp(g,.001,.999)).rgb,texture2D(u_gateBlur,clamp(g,.001,.999)).rgb,soft);
  a*=.78+.10*smoothstep(0.,.4,p);
  return mix(a,hero(uv,soft),change);
}
void main(){
  vec2 uv=v_uv;float p=u_progress;
  if(p>=.945){gl_FragColor=vec4(hero(uv,0.),1.);return;}
  float film=smoothstep(.30,.49,p)*(1.-smoothstep(.62,.84,p));
  float h=heightField(uv,p);
  vec2 e=vec2(1.3/u_resolution.x,1.3/u_resolution.y);
  vec2 grad=vec2(heightField(uv+vec2(e.x,0.),p)-heightField(uv-vec2(e.x,0.),p),heightField(uv+vec2(0.,e.y),p)-heightField(uv-vec2(0.,e.y),p));
  vec2 normal=grad*vec2(2.8,2.2);
  vec2 refractUV=uv+normal*(.075+.04*film);
  refractUV+=(vec2(fbm(vec2(uv.x*4.,uv.y*2.+p*5.)),fbm(vec2(uv.x*3.+9.,uv.y+p*4.)))-.5)*film*.027;
  // Scene replacement is spatially staggered beneath maximum film, not a global fade.
  float boundary=.525+(fbm(uv*vec2(3.,2.))-.5)*.095;
  float change=smoothstep(boundary-.014,boundary+.014,p);
  float blur=film*.005;
  vec3 c=scene(refractUV,change,p)*.24;
  c+=scene(refractUV+vec2(blur,blur*.5),change,p)*.13;
  c+=scene(refractUV-vec2(blur,blur*.5),change,p)*.13;
  c+=scene(refractUV+vec2(-blur*.5,blur),change,p)*.13;
  c+=scene(refractUV-vec2(-blur*.5,blur),change,p)*.13;
  c+=scene(refractUV+normal*.05,change,p)*.12;
  c+=scene(refractUV-normal*.05,change,p)*.12;
  float light=dot(normal,normalize(vec2(-.6,.8)));
  float glint=pow(max(light,0.),1.45)*2.5;
  float wet=1.-smoothstep(.88,.945,p);
  c*=1.-clamp(-light*.5,0.,.22)*wet;
  c+=vec3(.88,.86,.79)*min(glint,.35)*wet;
  // Soft scattered daylight through the contiguous sheet obscures the boundary.
  float veil=film*(.15+.14*fbm(vec2(uv.x*4.,uv.y*2.+p*4.)));
  c=mix(c,vec3(.57,.56,.51),veil);
  float vignette=(1.-smoothstep(.2,.8,distance(uv,vec2(.52,.55))))*.12+.88;
  c*=mix(vignette,1.,smoothstep(.6,.9,p));
  gl_FragColor=vec4(c,1.);
}
`;
