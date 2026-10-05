export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`;

// V3: common-source jets -> approaching packets -> impact -> draining film.
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
float fbm(vec2 p){return noise(p)*.57+noise(p*2.03+8.4)*.28+noise(p*4.11+27.1)*.15;}
vec2 cover(vec2 uv,vec2 size){float a=u_resolution.x/u_resolution.y,b=size.x/size.y;vec2 s=vec2(min(a/b,1.),min(b/a,1.));return (uv-.5)*s+.5;}
float jetFan(vec2 q,vec2 source,float spacing,float seed,float depth){
  vec2 d=q-source;
  float travel=max(d.y,.04);
  float slope=d.x/travel;
  float cell=floor(slope/spacing),sum=0.;
  for(int i=-1;i<=1;i++){
    float id=cell+float(i);float r=hash(vec2(id,seed));
    float angle=(id+.18+.64*r)*spacing;
    // The same origin, but unequal speeds, nozzle offsets and widening streams.
    float flow=travel-u_time*(.35+depth*.55+r*.30);
    float wobble=(noise(vec2(flow*11.,id+seed))-.5)*(.002+depth*.011)*travel;
    float center=angle*travel+wobble;
    float width=(.00065+depth*.0035)*(1.+travel*1.8)*(.6+r);
    float segment=noise(vec2(flow*(22.-depth*8.),id*3.+seed));
    float broken=mix(.025,1.,smoothstep(.28,.72,segment));
    float dx=(d.x-center)/width;
    float stream=exp(-dx*dx)*broken;
    // A thinner strand splits away downstream and shares its parent's speed.
    float split=(d.x-center-sin(flow*13.+r*6.)*.015*travel)/(width*.35);
    stream+=exp(-split*split)*smoothstep(.42,.8,travel)*segment*.25;
    sum+=stream*(.65+r*.35);
  }
  return sum*smoothstep(0.,.12,travel)*(1.-smoothstep(1.1,1.65,abs(slope)));
}
// x: approaching water, y: local impact/splash, z: deposited water.
// Each packet and its residue share target, cycle and collision time.
vec3 collisions(vec2 q,vec2 source,float p){
  vec3 result=vec3(0.);
  float aspect=u_resolution.x/u_resolution.y;
  for(int i=0;i<5;i++){
    if(u_mobile>.5 && i>=3) break;
    float id=float(i),period=2.25+hash(vec2(id,7.))*.8;
    float clock=u_time+id*.69+.42;
    float cycle=floor(clock/period),age=mod(clock,period);
    vec2 target=vec2((.07+.86*hash(vec2(id+cycle*3.,31.)))*aspect,.32+.56*hash(vec2(id+cycle*2.,42.)));
    vec2 axis=target-source;float len=length(axis);vec2 dir=axis/len;
    vec2 delta=q-source;
    float along=dot(delta,dir),across=dot(delta,vec2(-dir.y,dir.x));
    float flight=clamp(age/.80,0.,1.);
    float head=len*pow(flight,1.55);
    float width=mix(.002,.040+.030*smoothstep(.18,.5,p),pow(flight,3.));
    float wav=sin(along*24.-u_time*14.+id)*.004*flight;
    float packet=exp(-pow((across+wav)/width,2.));
    packet*=smoothstep(head-.28,head-.05,along)*(1.-smoothstep(head,head+.035,along));
    packet*=1.-smoothstep(.77,.83,age);
    float hitAge=age-.80;
    float landed=smoothstep(0.,.04,hitAge);
    vec2 d=q-target;
    float radius=.055+max(hitAge,0.)*.48;
    // Continuous irregular footprint: no angular singularity/star at its center.
    vec2 smear=d/vec2(1.15,.72);
    smear.x+=sin(d.y*23.+id)*.018;
    float splash=exp(-dot(smear,smear)/(radius*radius))*landed*exp(-max(hitAge,0.)*5.);
    splash*=.75+.25*noise(d*24.+id);
    // Three tiny, short-lived torn-off flecks travel out from the same impact.
    for(int j=0;j<3;j++){
      float a=float(j)*2.3+id;
      vec2 offset=vec2(cos(a),sin(a))*(.02+max(hitAge,0.)*.42);
      vec2 speck=(d-offset)/vec2(.006,.014);
      splash+=exp(-dot(speck,speck))*landed*exp(-max(hitAge,0.)*12.)*.12;
    }
    vec2 residue=d-vec2(sin(id)*max(hitAge,0.)*.013,max(hitAge,0.)*.10);
    float film=exp(-pow(residue.x/(.06+.065*landed),2.)-pow(residue.y/(.08+max(hitAge,0.)*.20),2.));
    film*=landed*exp(-max(hitAge,0.)*.95);
    result+=vec3(packet,splash,film);
  }
  return result;
}
// x = optical height, y = jet body scattering, z = local blur/impact.
vec3 waterField(vec2 uv,float p){
  float aspect=u_resolution.x/u_resolution.y;
  vec2 q=vec2(uv.x*aspect,1.-uv.y);
  vec2 source=vec2(aspect*.64,-.14);
  float approach=smoothstep(.18,.48,p);
  float calm=1.-smoothstep(.72,.945,p);
  float formed=smoothstep(.38,.56,p)*(1.-smoothstep(.70,.91,p));
  float startup=smoothstep(.15,1.3,u_time);
  float far=jetFan(q,source,.075,2.,.08);
  float mid=jetFan(q,source+vec2(.012,-.01),.145,19.,.40+approach*.2);
  if(u_mobile<.5) far+=jetFan(q,source-vec2(.008,0.),.054,35.,.04)*.4;
  vec3 hits=collisions(q,source,p);
  float jet=far*.12+mid*(.32+.18*approach)+hits.x*(.95+approach*.8);
  float impact=hits.y*(.6+approach*1.8);
  float deposited=hits.z*(.18+approach*.6);
  // Dense collisions build a connected sheet only after arrival at the lens.
  vec2 flow=q*vec2(5.,2.2)-vec2(0.,u_time*.22);
  float uneven=fbm(flow+vec2(fbm(flow*1.7),0.));
  float sheet=formed*startup*(.40+uneven*.8);
  float drain=smoothstep(.70,.94,p);
  float edge=drain*1.25-.12+(noise(vec2(q.x*4.,2.))-.5)*.13;
  float wet=smoothstep(edge-.045,edge+.045,q.y);
  float h=jet*.28+impact*.6+(deposited+sheet)*wet;
  return vec3(h,jet,impact+deposited*.28+sheet*.9)*calm;
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
  float soft=smoothstep(.43,.57,p)*(1.-smoothstep(.70,.88,p))*.98;
  vec3 a=mix(texture2D(u_gate,clamp(g,.001,.999)).rgb,texture2D(u_gateBlur,clamp(g,.001,.999)).rgb,soft);
  a*=.78+.10*smoothstep(0.,.4,p);
  return mix(a,hero(uv,soft),change);
}
void main(){
  vec2 uv=v_uv;float p=u_progress;
  if(p>=.945){gl_FragColor=vec4(hero(uv,0.),1.);return;}
  float film=smoothstep(.40,.57,p)*(1.-smoothstep(.70,.91,p));
  vec2 e=vec2(.0012*u_resolution.y/u_resolution.x,.0012);
  vec3 water=waterField(uv,p);
  vec2 grad=2.*vec2(waterField(uv+vec2(e.x,0.),p).x-water.x,waterField(uv+vec2(0.,e.y),p).x-water.x);
  vec2 normal=grad*vec2(2.8,2.2);
  vec2 refractUV=uv+clamp(normal,vec2(-.25),vec2(.25))*(.045+.06*film);
  refractUV+=(vec2(fbm(vec2(uv.x*4.,uv.y*2.+u_time*.09)),fbm(vec2(uv.x*3.+9.,uv.y+u_time*.06)))-.5)*film*.018;
  // Scene replacement is spatially staggered beneath maximum film, not a global fade.
  float boundary=.625+(fbm(uv*vec2(3.,2.))-.5)*.14;
  float change=smoothstep(boundary-.014,boundary+.014,p);
  float blur=film*.009+min(water.z,1.)*.018;
  vec3 c=scene(refractUV,change,p)*.6;
  c+=scene(refractUV+vec2(blur,blur*.5),change,p)*.2;
  c+=scene(refractUV-vec2(blur,blur*.5),change,p)*.2;
  float light=dot(normal,normalize(vec2(-.6,.8)));
  float glint=pow(max(light,0.),1.45)*1.15;
  float wet=1.-smoothstep(.88,.945,p);
  c*=1.-clamp(-light*.5,0.,.22)*wet;
  c+=vec3(.88,.86,.79)*min(glint,.35)*wet;
  // Fresnel-like body light keeps the source fan legible against the dark room.
  c=mix(c,vec3(.76,.75,.69),min(water.y*.23,.32));
  c+=vec3(.12,.115,.10)*min(water.z,.9);
  // Soft scattered daylight through the contiguous sheet obscures the boundary.
  float veil=film*(.15+.14*fbm(vec2(uv.x*4.,uv.y*2.+u_time*.07)));
  c=mix(c,vec3(.57,.56,.51),veil);
  float vignette=(1.-smoothstep(.2,.8,distance(uv,vec2(.52,.55))))*.12+.88;
  c*=mix(vignette,1.,smoothstep(.6,.9,p));
  gl_FragColor=vec4(c,1.);
}
`;
