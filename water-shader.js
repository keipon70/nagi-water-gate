export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`;

// Shower Zone: irregular depth layers and offscreen water masses, no common origin.
// Time moves water; progress only changes the camera/scene envelope.
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
float fbm(vec2 p){float n=noise(p)*.67+noise(p*2.03+8.4)*.33;if(u_mobile<.5)n=n*.85+noise(p*4.11+27.1)*.15;return n;}
vec2 cover(vec2 uv,vec2 size){float a=u_resolution.x/u_resolution.y,b=size.x/size.y;vec2 s=vec2(min(a/b,1.),min(b/a,1.));return (uv-.5)*s+.5;}
// Flow bands use independent entry positions and inclinations, never a vanishing point.
float depthWater(vec2 q,float scale,float seed,float depth){
  float cell=floor(q.x*scale),h=0.;
  for(int i=-1;i<=1;i++){
    float id=cell+float(i),r=hash(vec2(id,seed));
    float flow=q.y-u_time*(.22+r*.28+depth*.65);
    float lean=(r-.5)*.12;
    float bend=(noise(vec2(flow*4.5,id+seed))-.5)*(.035+depth*.09);
    float center=(id+.18+r*.62)/scale+lean*(q.y-.5)+bend;
    float swelling=noise(vec2(flow*7.+3.,id*2.+seed));
    float width=mix(.0014,.018,depth)*(.38+swelling*1.7);
    float dx=(q.x-center)/width;
    float breakup=smoothstep(.21,.64,noise(vec2(flow*12.,id+seed*2.)));
    // Broad density pockets leave clear gaps between clusters.
    float pocket=smoothstep(.16,.58,noise(vec2(id*.41+seed,flow*1.2)));
    h+=exp(-dx*dx)*breakup*pocket*(.6+r*.4);
    float branch=(q.x-center-.02*sin(flow*9.+id))/(width*.33);
    h+=exp(-branch*branch)*breakup*pocket*depth*.22;
  }
  return h;
}
// No particles or ballistic objects: broad, torn surfaces sweep through the camera.
// x: optical height, y: near coverage, z: impact, w: deposited lens film.
vec4 zoneEvents(vec2 q,float p){
  float aspect=u_resolution.x/u_resolution.y;
  float approach=smoothstep(.18,.48,p);
  vec4 result=vec4(0.);
  for(int i=0;i<3;i++){
    float id=float(i);
    // The mobile second event carries the same surface area, not a miniaturized jet.
    if(u_mobile>.5 && i>=2) break;
    float activation=i==0 ? 1. : mix(.16,1.,approach);
    float period=3.6+id*.37;
    float clock=u_time+id*1.19+.28;
    float age=mod(clock,period),cycle=floor(clock/period);
    float r=hash(vec2(cycle,id+27.));
    vec2 target=vec2((.25+.5*r)*aspect,.38+.27*hash(vec2(cycle+3.,id)));
    float side=mod(id+cycle,2.)<1. ? -1. : 1.;
    // Different offscreen entry points; movement remains predominantly downward.
    vec2 start=target+vec2(side*aspect*.52,-.95);
    float arrival=.82;
    vec2 center=mix(start,target,clamp(age/arrival,0.,1.));
    center+=vec2(-side*.09*aspect,max(age-arrival,0.)*.8);
    vec2 size=vec2(aspect*mix(.23,.40,approach),mix(.33,.47,approach));
    vec2 d=(q-center)/size;
    d.x+=d.y*side*.28;
    vec2 flow=d*vec2(2.1,2.8)+vec2(id*6.,-age*.75);
    float surface=fbm(flow);
    vec2 torn=d+vec2(noise(flow+7.)-.5,noise(flow*.8+13.)-.5)*.48;
    float outline=length(torn)*(.86+.35*noise(flow*2.));
    float footprint=1.-smoothstep(.65,1.13,outline);
    footprint*=.65+.35*smoothstep(.24,.5,noise(flow*3.2+5.));
    float mass=footprint*(.4+.6*surface)*(1.-smoothstep(.84,1.10,age));
    // Rippled internal thickness and a broken, softly focused edge (never a flat shape).
    float thickness=mass*(.16+.84*fbm(flow*vec2(3.8,1.2)+4.));
    float hitAge=max(age-arrival,0.);
    float landed=smoothstep(arrival,arrival+.055,age);
    vec2 local=(q-target)/vec2(size.x*.94,size.y*.68);
    local.x+=sin(local.y*3.+id)*.12;
    float spread=length(local)/(1.+hitAge*.8);
    float impact=(1.-smoothstep(.4,1.1,spread))*landed*exp(-hitAge*5.);
    impact*=.55+.45*noise(local*4.+id);
    // Water stays where this same surface hit, then drains down with gravity.
    vec2 residue=q-target-vec2(side*.014*hitAge,hitAge*.17);
    residue/=vec2(size.x*.68,size.y*.48+hitAge*.15);
    residue.x+=(noise(vec2(residue.y*3.-u_time*.4,id))-.5)*.32;
    float lens=(1.-smoothstep(.35,1.25,length(residue)))*landed;
    lens*=exp(-hitAge*.9)*(1.-smoothstep(period-.35,period,age));
    lens*=.48+.52*noise(residue*vec2(5.,1.5)-vec2(0.,u_time*.3));
    result+=vec4(thickness,mass,impact,lens)*activation;
  }
  return result;
}
// x: height, y: body light, z: local loss of focus, w: near/impact coverage.
vec4 waterField(vec2 uv,float p){
  float aspect=u_resolution.x/u_resolution.y;
  vec2 q=vec2(uv.x*aspect,1.-uv.y);
  float approach=smoothstep(.18,.48,p);
  float calm=1.-smoothstep(.76,.945,p);
  float far=depthWater(q,17.,3.,.08);
  float mid=depthWater(q+vec2(p*.025,0.),5.7,17.,.72);
  mid+=depthWater(q+vec2(.21-p*.018,0.),8.2,29.,.53)*.62;
  if(u_mobile<.5) far+=depthWater(q+vec2(.17,0.),24.,31.,.03)*.3;
  vec4 event=zoneEvents(q,p);
  float formed=smoothstep(.48,.61,p)*(1.-smoothstep(.70,.91,p));
  // Dense lens coverage builds only after the first impact; it remains scroll-reversible.
  formed*=smoothstep(.82,1.15,u_time+.28);
  vec2 flow=q*vec2(4.,2.4)-vec2(0.,u_time*.20);
  float sheet=formed*(.40+.60*fbm(flow+fbm(flow*.7)));
  float drain=smoothstep(.70,.94,p);
  float edge=drain*1.23-.13+(noise(vec2(q.x*4.,2.))-.5)*.17;
  float wet=smoothstep(edge-.055,edge+.055,q.y);
  float lens=(event.w*(.4+approach*.5)+sheet)*wet;
  float body=far*.14+mid*(.62+.32*approach);
  float height=body*.36+event.x*.85+event.z*.35+lens*.68;
  float localSoft=clamp(event.y*.85+event.z*.7+lens*.9,0.,1.);
  return vec4(height,body,localSoft,clamp(event.y+event.z,0.,1.))*calm;
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
vec3 scene(vec2 uv,float change,float p,float localSoft){
  vec2 g=cover(uv,u_gateSize);
  // Millimetric scene drift; foreground water travels independently.
  g+=(vec2(.010,-.014)*p)*(1.-change);
  float film=smoothstep(.51,.60,p)*(1.-smoothstep(.70,.88,p));
  float soft=clamp(max(film*.94,localSoft),0.,.98);
  vec3 a=mix(texture2D(u_gate,clamp(g,.001,.999)).rgb,texture2D(u_gateBlur,clamp(g,.001,.999)).rgb,soft);
  a*=.78+.10*smoothstep(0.,.4,p);
  return mix(a,hero(uv,soft),change);
}
void main(){
  vec2 uv=v_uv;float p=u_progress;
  if(p>=.945){gl_FragColor=vec4(hero(uv,0.),1.);return;}
  float film=smoothstep(.48,.61,p)*(1.-smoothstep(.70,.91,p));
  vec2 e=vec2(.0012*u_resolution.y/u_resolution.x,.0012);
  vec4 water=waterField(uv,p);
  vec2 grad=2.*vec2(waterField(uv+vec2(e.x,0.),p).x-water.x,waterField(uv+vec2(0.,e.y),p).x-water.x);
  vec2 normal=grad*vec2(2.8,2.2);
  vec2 refractUV=uv+clamp(normal,vec2(-.25),vec2(.25))*(.055+.065*film+water.w*.10);
  vec2 distortion=vec2(fbm(vec2(uv.x*4.,uv.y*5.-u_time*.7)),fbm(vec2(uv.x*5.+9.,uv.y*3.-u_time*.6)))-.5;
  refractUV+=distortion*(film*.028+water.w*.11)*vec2(.7,1.);
  // Scene replacement is spatially staggered beneath maximum film, not a global fade.
  float boundary=.613+(fbm(uv*vec2(3.,2.))-.5)*.14;
  float change=smoothstep(boundary-.012,boundary+.012,p);
  float blur=film*.007+water.z*.013;
  vec3 c=scene(refractUV,change,p,water.z)*.6;
  c+=scene(refractUV+vec2(blur,blur*.7),change,p,water.z)*.2;
  c+=scene(refractUV-vec2(blur,blur*.7),change,p,water.z)*.2;
  float light=dot(normal,normalize(vec2(-.6,.8)));
  float glint=pow(max(light,0.),1.45)*1.35;
  float wet=1.-smoothstep(.88,.945,p);
  c*=1.-clamp(-light*.5,0.,.22)*wet;
  c+=vec3(.88,.86,.79)*min(glint,.23)*wet;
  // Mostly refracted room light, with only a little warm edge scattering.
  c=mix(c,vec3(.76,.75,.69),min(water.y*.26,.22));
  c+=vec3(.085,.082,.074)*water.w;
  // Soft scattered daylight through the contiguous sheet obscures the boundary.
  float veil=film*(.09+.12*fbm(vec2(uv.x*4.,uv.y*2.-u_time*.20)));
  c=mix(c,vec3(.57,.56,.51),veil);
  float vignette=(1.-smoothstep(.2,.8,distance(uv,vec2(.52,.55))))*.12+.88;
  c*=mix(vignette,1.,smoothstep(.6,.9,p));
  gl_FragColor=vec4(c,1.);
}
`;
