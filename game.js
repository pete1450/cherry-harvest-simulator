// CHERRY SHAKER SIMULATOR — OMC one-man shaker, v1
// Small-voxel look: leaves/cherries/machine built from small boxes.
// Model note: this is a front-approach one-man unit built to the brief —
// drive in, face the trunk, wings out, boom grips, shake, tarp -> centre
// side conveyors -> (right via cross conveyor) -> left-side tank. Real OMC Shockwave systems are often
// two-piece (shaker + receiver); this v1 is the single-unit version.
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function lerp(a,b,t){return a+(b-a)*t;}
function rand(a,b){return a+Math.random()*(b-a);}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

// ---------- renderer / scene ----------
var renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);
var scene=new THREE.Scene();
scene.background=new THREE.Color(0x87b5e0);
scene.fog=new THREE.Fog(0x87b5e0,60,140);
var camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,0.1,300);
var hemi=new THREE.HemisphereLight(0xcfe8ff,0x5a7a3a,0.95); scene.add(hemi);
var sun=new THREE.DirectionalLight(0xfff2cc,1.25);
sun.position.set(30,45,20); sun.castShadow=true;
sun.shadow.camera.left=-50; sun.shadow.camera.right=50;
sun.shadow.camera.top=50; sun.shadow.camera.bottom=-50;
sun.shadow.mapSize.set(2048,2048); scene.add(sun);

function mat(color,opts){
  var o=opts||{};
  return new THREE.MeshLambertMaterial({color:color, emissive:o.emissive||0x000000});
}
function box(parent,w,h,d,color,x,y,z,opts){
  var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,opts));
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true;
  if(parent) parent.add(m); return m;
}
function vox(parent,size,color,x,y,z){
  return box(parent,size,size,size,color,x,y,z);
}

// ---------- ground / orchard ----------
var ground=new THREE.Mesh(new THREE.PlaneGeometry(120,90),mat(0x5d9a3f));
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
// dirt aisles + headland, as flat voxel strips
for(var ai=-1;ai<=1;ai++){
  var strip=box(scene,96,0.06,3.2,0x9a7a4e,0,0.03,ai*12+6);
  strip.receiveShadow=true;
  var strip2=box(scene,96,0.06,3.2,0x9a7a4e,0,0.03,ai*12-6);
  strip2.receiveShadow=true;
}
box(scene,3.5,0.06,90,0x8a6a42,41,0.03,0);
box(scene,3.5,0.06,90,0x8a6a42,-41,0.03,0);
// fence posts along the edges (small voxels)
// Moved out 2026-10-26 with the new outer rows: old fence at ±22
// would have cut between rows 12 and 24. New fence at ±34 is
// 10 m beyond the outer rows at ±24, same margin as before
// (old outer row 12, fence 22). Ground is 120 x 90 (z ±45), so
// the fence stays inside the ground.
for(var fx=-44;fx<=44;fx+=4){
  vox(scene,0.28,0x6b4a2a,fx,0.5,-34); vox(scene,0.28,0x6b4a2a,fx,0.5,34);
}
box(scene,92,0.18,0.18,0x6b4a2a,0,0.9,-34); box(scene,92,0.18,0.18,0x6b4a2a,0,0.9,34);

// ---------- trees ----------
// 5 rows x 8 trees = 40 trees, 2026-10-26 (was 3 rows x 8 = 24).
// Rows at z -24,-12,0,12,24, spacing 12 m, same as before, so
// canopies (radius 2.5 m) do not crowd each other. Dirt aisles
// already at z -18,-6,6,18 are exactly halfway between the new
// rows (-24/-12, -12/0, 0/12, 12/24), so no aisle change was
// needed — you drive in an aisle and line up on the row beside it.
// Ranked mode, 2026-10-26, CORRECTED same day: ?ranked=1 => one
// driving row, meaning TWO tree lines at z -6 and +6 with the
// player driving down the middle aisle at z 0. That is the normal
// 12 m row spacing, so the aisle is 6 m from each line, exactly
// like a casual aisle. 8 trees per line = 16 trees.
// Casual stays 5 rows x 8 = 40 trees. Ranked is chosen on the
// start screen, which reloads with / without ?ranked=1, so the
// orchard is built correctly from the start — no mid-game rebuild.
var IS_RANKED=(typeof location!=='undefined'&&location.search.indexOf('ranked=1')>=0);
var ROW_Z=IS_RANKED?[-6,6]:[-24,-12,0,12,24], TREE_X=[-28,-20,-12,-4,4,12,20,28];
var trees=[], treeGroupById={};
var leafCols=[0x2e7d2e,0x3a8f35,0x2a6b28,0x4aa344,0x357f2f];
var cherryCols=[0xd21f2e,0xe8323f,0xb3121f,0xf04a55];
function makeTree(id,tx,tz){
  var g=new THREE.Group(); g.position.set(tx,0,tz); scene.add(g);
  // trunk: stacked small voxels, slightly tapered, with a crotch fork
  for(var y=0;y<5;y++) vox(g,0.5,0x6b4226,0,0.25+y*0.45,0);
  vox(g,0.45,0x6b4226,0.35,2.35,0.1); vox(g,0.45,0x6b4226,-0.35,2.35,-0.1);
  vox(g,0.4,0x5d3a20,0,2.7,0);
  // canopy: small-voxel ellipsoid
  var leaves=[], dummy=new THREE.Object3D();
  for(var lx=-2.4;lx<=2.4;lx+=0.55) for(var ly=3.0;ly<=6.4;ly+=0.55) for(var lz=-2.4;lz<=2.4;lz+=0.55){
    var nx=lx/2.5, ny=(ly-4.7)/1.9, nz=lz/2.5;
    if(nx*nx+ny*ny+nz*nz<1 && Math.random()<0.82){
      leaves.push({x:lx,y:ly,z:lz,c:pick(leafCols)});
    }
  }
  var lm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.42,0.42,0.42),new THREE.MeshLambertMaterial({color:0xffffff}),leaves.length);
  leaves.forEach(function(L,i){ dummy.position.set(L.x,L.y,L.z); dummy.rotation.set(0,0,0); dummy.scale.setScalar(1); dummy.updateMatrix(); lm.setMatrixAt(i,dummy.matrix); lm.setColorAt(i,new THREE.Color(L.c)); });
  lm.castShadow=true; g.add(lm);
  // cherries: small red voxels on the outer canopy
  // Ranked: fixed 130 cherries per tree (16 trees = 2,080 total), so
  // ranked runs are comparable — casual keeps 118-140 random.
  var cherries=[], nCh=IS_RANKED?130:(118+Math.floor(Math.random()*22));
  for(var ci=0;ci<nCh;ci++){
    var a=Math.random()*Math.PI*2, r=1.6+Math.random()*0.9, cy=3.2+Math.random()*2.9;
    cherries.push({x:Math.cos(a)*r,y:cy,z:Math.sin(a)*r,c:pick(cherryCols),alive:true});
  }
  var cm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.15,0.15,0.15),new THREE.MeshLambertMaterial({color:0xffffff}),cherries.length);
  cherries.forEach(function(C,i){ dummy.position.set(C.x,C.y,C.z); dummy.rotation.set(rand(0,3),rand(0,3),0); dummy.scale.setScalar(1); dummy.updateMatrix(); cm.setMatrixAt(i,dummy.matrix); cm.setColorAt(i,new THREE.Color(C.c)); });
  cm.castShadow=true; g.add(cm);
  var t={id:id,x:tx,z:tz,group:g,leafMesh:lm,cherryMesh:cm,cherries:cherries,remaining:cherries.length,harvested:false,shake:0,ring:null};
  // target ring under tree
  var ring=new THREE.Mesh(new THREE.RingGeometry(1.4,1.7,32),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:0.9,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.set(tx,0.08,tz); scene.add(ring); t.ring=ring;
  trees.push(t); treeGroupById[id]=t; return t;
}
var tid=0; ROW_Z.forEach(function(rz){ TREE_X.forEach(function(tx){ makeTree(tid++,tx,rz); }); });

// ---------- OMC one-man shaker ----------
var machine=new THREE.Group(); scene.add(machine);
var M={pos:new THREE.Vector3(-36,0,IS_RANKED?0:-6), heading:Math.PI/2, speed:0, steer:0,
  wings:0, wingsTarget:0, wingsOpen:false, umbTravel:0, boom:0, boomTarget:0, gripped:false,
  gripClose:0, shaking:false, shakePower:0, tankFill:0, tankCap:520};
// chassis — rebuilt to the photo: long yellow frame, elevated operator
// mid-machine facing forward (+Z), big sagging canvas tarp on arms that
// wrap around the tree at the front, tank on the LEFT flank.
box(machine,2.4,0.4,7.6,0xd8a017,0,0.7,0);            // long frame
box(machine,2.2,0.5,1.6,0xb8860b,0,1.05,-2.6);        // rear engine deck
box(machine,1.6,0.7,1.0,0x333333,0,1.5,-3.1);         // engine block
box(machine,0.5,0.35,0.5,0x222222,0,1.95,-3.1);        // air cleaner
// wheels: TRICYCLE, as in the rear-view photo — one wide smooth rear
// wheel on the centreline, two treaded front wheels. ROUND now,
// 2026-10-26 (were square boxes): each wheel is a cylinder with
// its axis along X, in a spin group that rolls with distance
// (spin += speed*dt/radius, in animate), plus a grey hub. Front
// wheels carry 10 tread blocks around the rim, still children of
// the spin group so they roll with the tyre. The REAR wheel is
// the steering wheel: it sits in a steer group whose yaw is set
// in animate from the steering input. Rear-steer is inverted
// vs a front wheel — turning left swings the rear wheel right,
// which is what pushes the tail the other way and turns the
// machine left — so rear yaw = -steerIn*0.5 rad (max ~29 deg).
// [x, z, diameter, width, isRear]
// Front wheels moved back 2026-10-26: z 2.2 -> 1.9 (0.3 m, 'just a
// little'), so their front edge is now 2.45 m, 0.75 m clear of the
// belts starting at 3.2 m (was 0.45 m). Wheel Y is NOT radius:
// the machine is tilted 5 deg forward (see syncMachineTransform),
// so a wheel at local Z would sink/float if its axle stayed at
// radius height. Instead axle Y = (radius + Z*sin(5deg))/cos(5deg),
// which puts every wheel bottom exactly on the ground in world
// space (front: 0.718 m, rear: 0.499 m) while the body pitches.
var MACHINE_TILT=0.087266; // 5 deg, nose down (front +Z down)
var wheels=[], rearSteerGroup=null;
[[0,-2.9,1.5,0.62,true],[-1.2,1.9,1.1,0.5,false],[1.2,1.9,1.1,0.5,false]].forEach(function(w){
  var steerG=new THREE.Group(); steerG.position.set(w[0],(w[2]/2+w[1]*Math.sin(MACHINE_TILT))/Math.cos(MACHINE_TILT),w[1]); machine.add(steerG);
  var spinG=new THREE.Group(); steerG.add(spinG);
  var tyreGeo=new THREE.CylinderGeometry(w[2]/2,w[2]/2,w[3],28); tyreGeo.rotateZ(Math.PI/2);
  var tyre=new THREE.Mesh(tyreGeo,mat(0x1a1a1a)); tyre.castShadow=true; tyre.receiveShadow=true; spinG.add(tyre);
  var hubGeo=new THREE.CylinderGeometry(0.25,0.25,w[3]+0.04,16); hubGeo.rotateZ(Math.PI/2);
  var hub=new THREE.Mesh(hubGeo,mat(0x888888)); hub.castShadow=true; spinG.add(hub);
  if(!w[4]){
    for(var ti=0;ti<10;ti++){
      var a=ti/10*Math.PI*2;
      var tread=box(spinG,w[3]+0.02,0.09,0.20,0x222222,0,Math.cos(a)*(w[2]/2),Math.sin(a)*(w[2]/2));
      tread.rotation.x=-a;
    }
  }
  if(w[4]) rearSteerGroup=steerG;
  wheels.push({spin:spinG,steer:steerG,radius:w[2]/2,isRear:w[4]});
});
// side ladder + SHOCK WAVE sign panel on the left flank
for(var li=0;li<3;li++) box(machine,0.5,0.08,0.35,0x666666,-1.35,0.5+li*0.5,-1.2);
box(machine,0.06,0.7,1.4,0xeeeeee,-1.22,1.35,-1.6);
// elevated operator station (mid-machine, seat ~2.4 m up)
box(machine,2.0,0.2,1.8,0xb8860b,0,1.95,-0.8);         // platform
box(machine,0.7,0.45,0.7,0x222222,0,2.3,-1.15);        // seat
box(machine,0.7,0.7,0.2,0x222222,0,2.65,-1.5);         // seat back
// ---------- control console, 2026-10-26 ----------
// Old panel was a low slim dash at y 2.05-2.18, way down in front
// of the driver, with a flat-box steering wheel and two generic
// levers. Replaced with a YELLOW pedestal box rising from the
// chassis top (y 0.90) to a control surface at y 2.65, in front
// of the seat (seat z -1.15, console z 0.40), and all controls
// sit ON TOP of it. Console top 2.65 m is below the FP sightline
// at that z (about 2.98 m from eye 3.35 m to look 0.9 m at z 6.5),
// so the console sits at the bottom of the FP view and never
// blocks the trunk. Left-to-right, from the driver's seat
// (screen left = machine +X, the tank side, as in the user's
// corrected picture):
//   1. tank up/down lever, x +0.80 — tall black bar in the picture
//   2. steering wheel, x +0.15 — circle with cross spokes and a
//      SILVER ball on the rim at upper right, as drawn
//   3. 2D joystick, x -0.45 — black ball on a stem (ball on top
//      in 3D; the picture's ball-and-stem, read as a joystick)
//   4. tarps open/close lever, x -0.85 — single black bar in the
//      corrected picture (the first picture wrongly showed two)
// Lever angle, SCREEN direction (fixed 2026-10-26, was backwards):
// +0.4 = up on screen / forward away from driver, -0.4 = down
// on screen / back toward driver. Why: the FP camera looks
// down-forward, so forward tilt raises the lever top on screen
// and back tilt lowers it. Tank: up = tank on board, down =
// tank on ground. Tarps (effect flipped 2026-10-26, motion
// unchanged): up = tarps up / stowed against the machine,
// down = tarps down / deployed out around the tree. Note the
// two levers are NOT symmetric in code terms: tank up = pickup
// (mounted), tarps up = stow (wingsOpen false) — both mirror
// height, not the word 'open'.
var CONSOLE_TOP=2.65;
box(machine,1.9,1.75,0.9,0xd8a017,0,1.775,0.40); // yellow pedestal, bottom 0.90 (chassis top) to top 2.65
var controlHit=[], tankLeverAngle=0, tarpsLeverAngle=0;
function makeLever(x,control){
  var pivot=new THREE.Group(); pivot.position.set(x,CONSOLE_TOP,0.40); pivot.userData.control=control; machine.add(pivot);
  var stick=box(pivot,0.06,0.38,0.06,0x111111,0,0.19,0);
  var knob=new THREE.Mesh(new THREE.SphereGeometry(0.09,12,10),mat(0x111111)); knob.position.set(0,0.40,0); knob.castShadow=true; pivot.add(knob);
  controlHit.push(pivot); return pivot;
}
var tankLeverGroup=makeLever(0.80,'tank');
var tarpsLeverGroup=makeLever(-0.85,'tarps');
// Steering wheel: ring + cross spokes + silver spinner ball.
// Wheel group tilted back toward the driver (rotation.x -0.35),
// spin group rotates around the wheel's own Z axis.
// Steering wheel moved 0.25 m back toward the driver, 2026-10-26 (was z 0.35).
var wheelGroup=new THREE.Group(); wheelGroup.position.set(0.15,CONSOLE_TOP+0.28,0.10); wheelGroup.rotation.x=-0.35; wheelGroup.userData.control='steer'; machine.add(wheelGroup);
var wheelSpin=new THREE.Group(); wheelGroup.add(wheelSpin);
var wheelRing=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.03,10,28),mat(0x111111)); wheelRing.castShadow=true; wheelSpin.add(wheelRing);
box(wheelSpin,0.44,0.04,0.04,0x111111,0,0,0);
box(wheelSpin,0.04,0.44,0.04,0x111111,0,0,0);
var wheelHub=new THREE.Mesh(new THREE.SphereGeometry(0.06,12,10),mat(0x111111)); wheelHub.castShadow=true; wheelSpin.add(wheelHub);
var silverBall=new THREE.Mesh(new THREE.SphereGeometry(0.05,14,12),new THREE.MeshLambertMaterial({color:0xcccccc})); silverBall.position.set(0.155,0.155,0); silverBall.castShadow=true; wheelSpin.add(silverBall);
controlHit.push(wheelGroup);
// 2D joystick: base + tilting handle (stem + black ball on top).
var joyBase=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.15,0.06,20),mat(0x111111)); joyBase.position.set(-0.45,CONSOLE_TOP+0.03,0.40); joyBase.castShadow=true; machine.add(joyBase);
var joyHandleGroup=new THREE.Group(); joyHandleGroup.position.set(-0.45,CONSOLE_TOP+0.06,0.40); joyHandleGroup.userData.control='joystick'; machine.add(joyHandleGroup);
var joyStem=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.28,12),mat(0x111111)); joyStem.position.set(0,0.14,0); joyStem.castShadow=true; joyHandleGroup.add(joyStem);
var joyBall=new THREE.Mesh(new THREE.SphereGeometry(0.10,14,12),mat(0x111111)); joyBall.position.set(0,0.30,0); joyBall.castShadow=true; joyHandleGroup.add(joyBall);
controlHit.push(joyHandleGroup); controlHit.push(joyBase);
// Note: joyBase has no userData.control of its own — pickControl
// climbs parents, and joyBase is a direct child of machine, so
// give it one explicitly so a tap on the base also grabs the joystick.
joyBase.userData.control='joystick';
// voxel operator, seated high (visible in third-person; behind the FP camera)
box(machine,0.6,0.7,0.35,0x888888,0,2.75,-1.15);
box(machine,0.35,0.35,0.35,0xe8c39a,0,3.25,-1.15);
box(machine,0.38,0.12,0.38,0xd21f2e,0,3.46,-1.15);
box(machine,0.38,0.05,0.22,0xd21f2e,0,3.42,-0.92);
var armOpL=box(machine,0.15,0.15,1.1,0x888888,-0.35,2.68,-0.4); armOpL.rotation.x=0.35;
var armOpR=box(machine,0.15,0.15,1.1,0x888888,0.35,2.68,-0.4); armOpR.rotation.x=0.35;
box(machine,0.22,0.22,0.55,0x2a4a7a,-0.18,2.48,-0.85);
box(machine,0.22,0.22,0.55,0x2a4a7a,0.18,2.48,-0.85);
box(machine,0.2,0.43,0.2,0x2a4a7a,-0.18,2.26,-0.55);
box(machine,0.2,0.43,0.2,0x2a4a7a,0.18,2.26,-0.55);
box(machine,0.2,0.12,0.3,0x222222,-0.18,2.11,-0.48);
box(machine,0.2,0.12,0.3,0x222222,0.18,2.11,-0.48);
// platform guard rails, side + back only (front would block the FP view)
box(machine,0.08,0.08,1.5,0xd8a017,-1.0,2.95,-0.95);
box(machine,0.08,0.08,1.5,0xd8a017,1.0,2.95,-0.95);
box(machine,2.08,0.08,0.08,0xd8a017,0,2.95,-1.7);
box(machine,0.08,0.9,0.08,0xd8a017,-1.0,2.5,-1.7); box(machine,0.08,0.9,0.08,0xd8a017,1.0,2.5,-1.7);
box(machine,0.08,0.9,0.08,0xd8a017,-1.0,2.5,-0.2); box(machine,0.08,0.9,0.08,0xd8a017,1.0,2.5,-0.2);
// long guard rail running over the operator to the front tarp frame
box(machine,0.12,0.12,5.2,0xd8a017,-1.15,3.0,-0.6);
box(machine,0.12,1.1,0.12,0xd8a017,-1.15,2.5,2.1);
// Clamp / shaker head: FIXED, it does not move forward. It sits on a
// rigid boom at the front, centre, between the two side conveyors, tip at
// machine-local z 5.0 (boomGroup z 2.4 + head z 2.6). The machine drives
// until that fixed clamp meets the trunk, then the jaws only open and
// close — no telescoping, no boom travel. Alignment 4.8-5.2 m is the
// distance from the machine centre to the trunk, i.e. the clamp tip
// (and the umbrella hub centre).
var boomGroup=new THREE.Group(); boomGroup.position.set(0,1.35,2.4); machine.add(boomGroup);
var boomMesh=box(boomGroup,0.5,0.5,2.6,0xd8a017,0,0,1.3);
var headGroup=new THREE.Group(); headGroup.position.set(0,0,2.6); boomGroup.add(headGroup);
box(headGroup,0.9,0.27,0.5,0x111111,0,0,0); // clamp head, 2026-10-26: height 0.9 -> 0.27 m (down 70%), colour grey -> black; red jaws untouched
var jawL=box(headGroup,0.22,0.9,0.9,0x8a1a1a,-0.55,0,0.3);
var jawR=box(headGroup,0.22,0.9,0.9,0x8a1a1a,0.55,0,0.3);
// Umbrella tarps, from the user's 2026-10-26 complete description,
// corrected 2026-10-26: arms START AT EACH SIDE, not both met in
// the middle. The deep-funnel two-fan version is backed up in
// backup-deep-funnel/ (all arms stowed pointing back to the middle,
// tips together at (0, 2.26)).
//  * A large circular fabric catching umbrella, ~36 ft in diameter
//    (outer radius 5.486 m), attached to the front of the machine.
//  * The tree trunk sits at its CENTRE, through a central opening
//    in the fabric (inner radius 1.4 m).
//  * There is an OPENING in the umbrella where the machine enters:
//    a 60-degree gap on the machine side (angles 240-300 deg, centred
//    on the back direction, 270 deg). The two side conveyors sit in
//    that gap (249-291 deg around the hub).
//  * ONE MAIN ARM ON EACH SIDE, plus trailing arms on that side:
//    - Left (+X) side, 7 arms, final angles 300, 325, 350, 375, 400,
//      425, 450 deg. The last one, 450 deg = 90 deg, is the left
//      MAIN arm: it ends pointing straight forward.
//    - Right (-X) side, 7 arms, final angles 240, 215, 190, 165, 140,
//      115, 90 deg. The last one, 90 deg, is the right MAIN arm:
//      it also ends pointing straight forward.
//    So the two main arms ROTATE FORWARD, one on each side, and
//    MEET IN THE MIDDLE IN FRONT: both tips land at the front rim
//    point (0, 2.60, 10.486). No arm ever rotates all the way from
//    one side to the other.
//  * STOWED, the arms do NOT meet in the middle. Each side's arms
//    start together at THAT SIDE'S gap edge: left arms all point
//    to 300 deg, right arms all point to 240 deg. So the left bundle
//    tip is at (2.74, 1.95, 0.25) — the left side of the machine —
//    and the right bundle tip is at (-2.74, 1.95, 0.25) — the right
//    side — separated by 5.49 m, not together at (0, 2.26) in the
//    middle. Opening rotates each side's arms forward on that side
//    only, at a common angular travel: left arm j is at 300 +
//    min(its rotation, travel), right arm j is at 240 -
//    min(its rotation, travel), travel 0..150 deg. The gap arms
//    (300 / 240 deg) never move — they are the side anchors — the
//    trailing arms peel off them one by one, gap to front, and the
//    two main arms arrive last and meet in front. Closing runs the
//    same travel backwards. There is NO sector between the two main
//    arms (they share the front point), so no sector ever stretches
//    across the front while the arms move in opposite directions.
//  * The fabric is NEVER interpolated as a solid sheet sliding
//    across the ground. Every fabric vertex is computed from the
//    CURRENT angles of its two bounding arms, so the fabric can only
//    unfold and refold through the motion of the arms themselves.
//  * The fabric is a DEEP funnel, outer rim much higher than the
//    inside, funnelled toward the middle of the machine. Fabric
//    height at radius r and math angle a (x = cos a, z = sin a,
//    front = +z) is y = 1.35 + 0.90*(r/OUTER) + 0.35*sin(a)*(r/OUTER).
//    Outer rim: front 2.75, side 2.40, machine side 2.05. Inner ring:
//    front 1.52, side 1.43, machine side 1.34. Lowest point is the
//    inner back point, on the machine centreline just ahead of the
//    conveyors, so cherries roll inward and backward, out through
//    the gap to the conveyors.
//  * Arms are beams from the hub to the current rim point, so their
//    tips track the fabric edge exactly — including the main arms
//    meeting exactly at the front rim point. Their length varies
//    only with the funnel slope (5.52 m at the gap rim to 5.63 m at
//    the front rim, <2% — Y rise is unchanged, so length grows less than 2x), not with the unfolding: the unfolding is
//    rotation, the length change is just the funnel surface rising
//    toward the front. Main arms are thicker, and their pivots are
//    offset 0.12 m to their own side of the hub, so at the front
//    their beams form a V meeting at the front point, visibly two
//    arms meeting, not one beam overlapping itself.
//  * Animation is SLOW on purpose: arms travel at 37.5 deg/sec, so
//    a full open or close takes 150/37.5 = 4.0 seconds.
var UMB_OUTER=5.486, UMB_INNER=1.4, UMB_HUB=new THREE.Vector3(0,1.35,5.0); // tarps/mechanism doubled 2026-10-26: 18 ft -> 36 ft diameter, inner opening 0.7 -> 1.4 m; hub position unchanged
var UMB_STOWED_L=300*Math.PI/180, UMB_STOWED_R=240*Math.PI/180;
var UMB_LEFT=[300,325,350,375,400,425,450].map(function(d){ return d*Math.PI/180; });
var UMB_RIGHT=[240,215,190,165,140,115,90].map(function(d){ return d*Math.PI/180; });
var UMB_MAX_TRAVEL=150*Math.PI/180; // 150 deg, max rotation on either side
var UMB_SPEED=37.5*Math.PI/180; // rad/sec, hydraulic drive speed
function umbFabricY(r,a){
  // Cone reshaped 2026-10-26: inside (inner ring) down ~0.15 m,
  // top (outer rim) up ~0.15 m, for a more defined cone.
  // Old: 1.35 + 0.90*t + 0.35*sin*t, inner avg 1.58, outer avg 2.25.
  // New: 1.10 + 1.30*t + 0.35*sin*t, inner avg 1.43, outer avg 2.40.
  // Inner t = 1.4/5.486 = 0.255, so inner drops 0.148 m, outer
  // rises 0.150 m, funnel depth grows 0.67 -> 0.97 m average.
  var tt=r/UMB_OUTER;
  return 1.10 + 1.30*tt + 0.35*Math.sin(a)*tt;
}
function umbPoint(a,r){
  // a = current math angle of an arm (rad, unwrapped ok: cos/sin are
  // periodic). Machine-local point on the fabric at radius r along a.
  return new THREE.Vector3(UMB_HUB.x+Math.cos(a)*r, umbFabricY(r,a), UMB_HUB.z+Math.sin(a)*r);
}
var canvasMat=new THREE.MeshLambertMaterial({color:0xcbb489,side:THREE.DoubleSide});
var UMB_SECTORS=12; // 6 per side. No sector across the gap, none between the two main arms.
var umbGeo=new THREE.BufferGeometry();
umbGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(UMB_SECTORS*6*3),3));
var umbMesh=new THREE.Mesh(umbGeo,canvasMat);
umbMesh.castShadow=true; umbMesh.receiveShadow=true; machine.add(umbMesh);
// Two ring geometries at the head REMOVED 2026-10-26 (user request):
// the hub TorusGeometry ring around the trunk/clamp and the red
// hydraulic slider TorusGeometry ring that moved down as the
// umbrella opened. Struts below are now anchored at the hub itself
// (UMB_HUB), not at a moving slider ring, so nothing floats from
// an invisible anchor point.
var armMat=new THREE.MeshLambertMaterial({color:0xd8a017});
var mainMat=new THREE.MeshLambertMaterial({color:0xb8860b});
var armMeshesL=[], armMeshesR=[];
// Ribs (arms) 2026-10-26: 70% smaller AND poles, not blocks.
// Were boxes 0.48 m (main) / 0.36 m (trailing) square — massive
// after the 2x tarp scale. Now cylinders, diameter 30% of before:
// main 0.144 m (radius 0.072), trailing 0.108 m (radius 0.054).
// Cylinder axis is Y by default; rotateX(PI/2) makes it Z, so
// placeBeam's scale.z = length still works, cross-section stays round.
var armGeoMain=new THREE.CylinderGeometry(0.072,0.072,1,12); armGeoMain.rotateX(Math.PI/2);
var armGeoTrail=new THREE.CylinderGeometry(0.054,0.054,1,12); armGeoTrail.rotateX(Math.PI/2);
for(var ai=0;ai<7;ai++){
  var isMain=(ai===6);
  var mL=new THREE.Mesh(isMain?armGeoMain:armGeoTrail,isMain?mainMat:armMat); mL.castShadow=true; machine.add(mL); armMeshesL.push(mL);
  var mR=new THREE.Mesh(isMain?armGeoMain:armGeoTrail,isMain?mainMat:armMat); mR.castShadow=true; machine.add(mR); armMeshesR.push(mR);
}
var strutMat=new THREE.MeshLambertMaterial({color:0x888888});
var strutsL=[], strutsR=[];
var strutGeo=new THREE.CylinderGeometry(0.07,0.07,1,10); strutGeo.rotateX(Math.PI/2);
for(var si=0;si<7;si++){
  var smL=new THREE.Mesh(strutGeo,strutMat); smL.castShadow=true; machine.add(smL); strutsL.push(smL);
  var smR=new THREE.Mesh(strutGeo,strutMat); smR.castShadow=true; machine.add(smR); strutsR.push(smR);
}
var _v1=new THREE.Vector3(), _v2=new THREE.Vector3(), _dir=new THREE.Vector3(), _mid=new THREE.Vector3(), _zAxis=new THREE.Vector3(0,0,1);
function placeBeam(mesh,from,to){
  _dir.copy(to).sub(from); var len=_dir.length();
  _mid.copy(from).add(to).multiplyScalar(0.5);
  mesh.position.copy(_mid);
  mesh.quaternion.setFromUnitVectors(_zAxis,_dir.normalize());
  mesh.scale.set(1,1,Math.max(0.05,len));
}
// Folded bundles, one on each side: thin pleat strips from the hub
// to each side's gap rim point, visible only while the umbrella is
// mostly folded. They are placed once here; updateUmbrella only
// shrinks their width and hides them after half open.
var bundleL=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.10,1),canvasMat); machine.add(bundleL);
placeBeam(bundleL,UMB_HUB,umbPoint(UMB_STOWED_L,UMB_OUTER));
var bundleR=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.10,1),canvasMat); machine.add(bundleR);
placeBeam(bundleR,UMB_HUB,umbPoint(UMB_STOWED_R,UMB_OUTER));
function umbArmAngles(travel){
  // travel: common angular travel, 0..150 deg. Left arm j is at
  // 300 + min(its rotation, travel); right arm j is at 240 -
  // min(its rotation, travel). Arms on a side stay in order,
  // sectors stay <= 25 deg wide, and sectors unfold one at a time,
  // gap to front, on each side. The two main arms (j=6) reach the
  // front last, together, and meet there.
  var left=[], right=[];
  for(var j=0;j<7;j++){
    left.push(UMB_STOWED_L+Math.min(UMB_LEFT[j]-UMB_STOWED_L,travel));
    right.push(UMB_STOWED_R-Math.min(UMB_STOWED_R-UMB_RIGHT[j],travel));
  }
  return {left:left, right:right};
}
function updateUmbrella(travel){
  var angs=umbArmAngles(travel);
  var te=clamp(travel/UMB_MAX_TRAVEL,0,1);
  // Struts are anchored at the hub (slider ring removed 2026-10-26).
  function setArm(meshes,struts,angsArr,side){
    for(var j=0;j<7;j++){
      var a=angsArr[j];
      var tip=umbPoint(a,UMB_OUTER);
      var pivot=new THREE.Vector3(UMB_HUB.x,UMB_HUB.y,UMB_HUB.z);
      if(j===6) pivot.x+= (side==='L'?0.12:-0.12); // main arms: pivots offset to their own side, beams form a V meeting at the front point
      placeBeam(meshes[j],pivot,tip);
      var mid=new THREE.Vector3((pivot.x+tip.x)/2,(pivot.y+tip.y)/2,(pivot.z+tip.z)/2);
      placeBeam(struts[j],new THREE.Vector3(UMB_HUB.x,UMB_HUB.y,UMB_HUB.z),mid);
    }
  }
  setArm(armMeshesL,strutsL,angs.left,'L');
  setArm(armMeshesR,strutsR,angs.right,'R');
  // Fabric: every vertex comes from its bounding arms' CURRENT
  // angles. No vertex is ever interpolated from a collapsed sheet.
  // Left sectors: L0-L1 ... L5-L6. Right sectors: R0-R1 ... R5-R6.
  // No sector across the gap, and none between the two main arms —
  // they share the front point, so the fabric is continuous there
  // through the main arms meeting, not through a stretched sector.
  var pos=umbGeo.attributes.position.array, k=0;
  function addSector(a1,a2){
    var i1=umbPoint(a1,UMB_INNER), o1=umbPoint(a1,UMB_OUTER);
    var i2=umbPoint(a2,UMB_INNER), o2=umbPoint(a2,UMB_OUTER);
    [i1,o1,o2, i1,o2,i2].forEach(function(v){ pos[k++]=v.x; pos[k++]=v.y; pos[k++]=v.z; });
  }
  for(var s=0;s<6;s++) addSector(angs.left[s],angs.left[s+1]);
  for(var s2=0;s2<6;s2++) addSector(angs.right[s2],angs.right[s2+1]);
  umbGeo.attributes.position.needsUpdate=true;
  umbGeo.computeVertexNormals();
  var bw=Math.max(0,1-te*2);
  bundleL.scale.x=bw; bundleR.scale.x=bw;
  bundleL.visible=te<0.5; bundleR.visible=te<0.5;
}
updateUmbrella(0);






// conveyors: one belt on EACH side of the clamp, running back/up toward
// the operator, plus the cross conveyor under the controls (right -> left).
// Widened centre, 2026-10-26: belts moved OUT by their own width
// (0.7 m each side), from x ±0.7 to x ±1.4. Centre area between
// the belt inner edges widens from 0.70 m (-0.35..0.35) to 2.10 m
// (-1.05..1.05), so the clamp boom (width 0.5, x -0.25..0.25) now
// has 0.80 m clearance to each belt instead of 0.10 m, and the
// trunk has room to pass between the belts. Belt outer edges are
// now at ±1.75 m, 0.55 m outside the 2.4 m chassis (half-width
// 1.20 m) — the belts sit on side extensions, inner edge still
// overlapping the chassis by 0.15 m, so they are not floating.
var beltTex=(function(){
  var c=document.createElement('canvas'); c.width=64; c.height=64;
  var x=c.getContext('2d'); x.fillStyle='#222'; x.fillRect(0,0,64,64);
  x.fillStyle='#444'; x.fillRect(0,0,64,10); return new THREE.CanvasTexture(c);
})();
beltTex.wrapS=beltTex.wrapT=THREE.RepeatWrapping; beltTex.repeat.set(1,6);
var beltMat=new THREE.MeshLambertMaterial({map:beltTex});
[-1.4,1.4].forEach(function(bx){
  var b=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.08,3.8),beltMat);
  b.position.set(bx,1.48,1.45); b.rotation.x=0.27; machine.add(b);
  box(machine,0.08,0.35,3.8,0x888888,bx-0.4,1.55,1.45).rotation.x=0.27;
  box(machine,0.08,0.35,3.8,0x888888,bx+0.4,1.55,1.45).rotation.x=0.27;
});
var crossBeltTex=(function(){
  var c=document.createElement('canvas'); c.width=64; c.height=64;
  var x=c.getContext('2d'); x.fillStyle='#222'; x.fillRect(0,0,64,64);
  x.fillStyle='#444'; x.fillRect(0,0,10,64); return new THREE.CanvasTexture(c);
})();
crossBeltTex.wrapS=crossBeltTex.wrapT=THREE.RepeatWrapping; crossBeltTex.repeat.set(6,1);
var crossBeltMat=new THREE.MeshLambertMaterial({map:crossBeltTex});
var crossBelt=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.08,0.7),crossBeltMat);
crossBelt.position.set(0,1.35,-0.3); machine.add(crossBelt);
// Horizontal extension belts, 2026-10-26: flat (not sloped) belts on
// each side, starting at the BOTTOM of the current side belts
// (machine-local y 1.0, z 3.2 — the side belts' low front end) and
// running forward to the SAME forward position as the clamp tip,
// z 5.0. So each horizontal belt is at x ±1.4, y 1.0, z 3.2–5.0
// (length 1.8, centre z 4.1), clear of the clamp boom (boom width
// 0.5, x -0.25..0.25; belt inner edge at 1.05, rail inner edge at
// 1.00 — centre area 2.10 m wide) and clear of the front wheels
// (wheels end at z 2.45, belts start at 3.2). They sit just under
// the umbrella's inner ring (inner ring y 1.49–1.67 at z 5.0,
// belts at y 1.0) and under the clamp head (y 1.35), so cherries
// falling through the umbrella gap or rolling down the funnel
// land on them, and they carry cherries back to the side belts'
// bottom, then up the side belts. An under-rail under each belt
// (y 0.92) is the frame extension that carries the belt past the
// chassis front (chassis ends at z 3.8).
[-1.4,1.4].forEach(function(bx){
  var hb=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.08,1.8),beltMat);
  hb.position.set(bx,1.0,4.1); machine.add(hb);
  box(machine,0.08,0.20,1.8,0x888888,bx-0.4,1.10,4.1);
  box(machine,0.08,0.20,1.8,0x888888,bx+0.4,1.10,4.1);
  box(machine,0.08,0.08,1.8,0x666666,bx,0.92,4.1);
});
// STATIC CENTRE TARP, 2026-10-26 (user request). This is the piece
// the umbrella could not cover: the umbrella has a 60 deg gap on
// the machine side (240-300 deg around the hub), so cherries
// falling in that gap used to fall through an imaginary fabric
// surface onto the clamp boom / between the belts. Now a fixed
// tarp, bolted to the machine (NOT to the umbrella arms — it does
// not open, close, or fold), covers the whole centre, x -1.4 to
// +1.4, z 2.2 to 5.0, i.e. from just behind the side belts' front
// end back to the clamp tip, over the boom. Shape: a ridge roof,
// peak at centre x 0, sloping DOWN sideways to each conveyor, so
// cherries landing in the centre roll sideways OUT to the belts,
// not into the middle. Side edge height follows the belt it drops
// onto: for z <= 3.2 it follows the sloped side belt centre line
// (y 1.48 at z 1.45, slope tan(0.27) ~0.277, +0.05 clearance), for
// z > 3.2 it is flat at 1.05, the horizontal belt top +0.05. Ridge
// is side edge + 0.5*1.4 = +0.70 m, slope 0.5 (26.6 deg), steep
// enough for round cherries to roll, and ridge 1.74-2.02 m clears
// the boom top (1.60 m) everywhere. The tarp is a grid surface
// (x -1.4,-0.7,0,0.7,1.4; z 2.2,3.2,5.0, kink at 3.2 where the
// side belt meets the horizontal belt), with a ridge bar, side
// edge bars, and front/back cross bars, all fixed to the machine.
// Catch logic below uses the same staticTarpY() height for gap
// cherries, and it works even with the umbrella closed — the
// static tarp is always there, so centre cherries (the 60 deg
// gap sector, ~1/6 of a tree) are still collected with the
// umbrella shut, while side cherries are lost. Umbrella is still
// needed for a full harvest.
function staticTarpSideY(lz){
  return lz<=3.2 ? 1.48-0.277*(lz-1.45)+0.05 : 1.05;
}
function staticTarpY(lx,lz){
  return staticTarpSideY(lz)+(1.4-Math.abs(lx))*0.5;
}
(function(){
  var xs=[-1.4,-0.7,0,0.7,1.4], zs=[2.2,3.2,5.0], verts=[], idx=[];
  zs.forEach(function(z){ xs.forEach(function(x){ verts.push(x,staticTarpY(x,z),z); }); });
  for(var j=0;j<zs.length-1;j++) for(var i=0;i<xs.length-1;i++){
    var a=j*xs.length+i, b=a+1, c=a+xs.length, d=c+1; idx.push(a,c,b, b,c,d);
  }
  var g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setIndex(idx); g.computeVertexNormals();
  var tarp=new THREE.Mesh(g,canvasMat); tarp.castShadow=true; tarp.receiveShadow=true; machine.add(tarp);
  var barMat=new THREE.MeshLambertMaterial({color:0x888888});
  function bar(from,to){ var m=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,1),barMat); m.castShadow=true; machine.add(m); placeBeam(m,from,to); }
  // ridge, two segments (kink at z 3.2)
  bar(new THREE.Vector3(0,staticTarpY(0,2.2),2.2),new THREE.Vector3(0,staticTarpY(0,3.2),3.2));
  bar(new THREE.Vector3(0,staticTarpY(0,3.2),3.2),new THREE.Vector3(0,staticTarpY(0,5.0),5.0));
  // side edges, two segments per side, over the belt centres
  [-1.4,1.4].forEach(function(sx){
    bar(new THREE.Vector3(sx,staticTarpSideY(2.2),2.2),new THREE.Vector3(sx,staticTarpSideY(3.2),3.2));
    bar(new THREE.Vector3(sx,staticTarpSideY(3.2),3.2),new THREE.Vector3(sx,1.05,5.0));
  });
  // front and back cross bars
  bar(new THREE.Vector3(-1.4,1.05,5.0),new THREE.Vector3(1.4,1.05,5.0));
  bar(new THREE.Vector3(-1.4,staticTarpSideY(2.2),2.2),new THREE.Vector3(1.4,staticTarpSideY(2.2),2.2));
})();
// Tank, square and visible, 2026-10-26. The old tank was a long
// opaque box, 0.9 x 1.3 x 2.4 m, with the cherry fill hidden
// INSIDE it — so the fill number rose in the HUD but you could
// never see the level rising in the world. That is why the user
// asked for a visible level. New tank:
//  * SQUARE footprint: 1.5 m x 1.5 m, height 1.3 m (same height as
//    before, so the conveyor drop point at y 1.85, the mount slot
//    at (1.55,1.15,-0.6) and the drop-to-ground centre y 0.65 all
//    still line up; volume 1.5*1.5*1.3 = 2.93 m3 vs old 2.81 m3,
//    so capacity 520 cherries is unchanged). Centre stays at
//    (1.55,1.15,-0.6) on the left flank, so pickup geometry is
//    unchanged, and the square tank fits the tractor trailer
//    better than the old long tank (trailer 1.7 x 2.2 m).
//  * OPEN TOP, no lid: the top is a rim frame only, so you can
//    look down into the bin from the third-person camera.
//  * TRANSPARENT WALLS (grey, opacity 0.35, depthWrite off) with
//    solid corner posts, bottom and rim, so the cherry level is
//    visible from the side as well, through the walls, from any
//    angle — not just from above.
//  * CHERRY FILL: an opaque red block, 1.34 x 1.34 m in plan,
//    whose height rises linearly with fill: height = f*1.1 m,
//    centre y = -0.60 + height/2, so at f=0 it is invisible,
//    at f=0.5 it is 0.55 m high (top at local y -0.05, world
//    1.10 m), at f=1 it is 1.10 m high (top at local y 0.50,
//    world 1.65 m, 0.15 m below the rim at 1.80 m). The fill is
//    stored as group.userData.fill, so pickup code does not depend
//    on child indices.
function makeTank(){
  var g=new THREE.Group();
  var wallMat=new THREE.MeshLambertMaterial({color:0xcccccc,transparent:true,opacity:0.35,side:THREE.DoubleSide,depthWrite:false});
  var walls=new THREE.Group(); g.add(walls);
  function wallIn(parent,w,h,d,x,y,z){
    var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wallMat);
    m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  wallIn(walls,1.5,1.3,0.08,0,0,0.71); wallIn(walls,1.5,1.3,0.08,0,0,-0.71);
  wallIn(walls,0.08,1.3,1.5,0.71,0,0); wallIn(walls,0.08,1.3,1.5,-0.71,0,0);
  var rim=new THREE.Group(); g.add(rim);
  box(rim,1.58,0.08,0.08,0x666666,0,0.65,0.71); box(rim,1.58,0.08,0.08,0x666666,0,0.65,-0.71);
  box(rim,0.08,0.08,1.58,0x666666,0.71,0.65,0); box(rim,0.08,0.08,1.58,0x666666,-0.71,0.65,0);
  // solid corner posts and bottom, so the square shape reads
  // even with transparent walls
  [[0.71,0.71],[-0.71,0.71],[0.71,-0.71],[-0.71,-0.71]].forEach(function(p){
    box(g,0.10,1.3,0.10,0x888888,p[0],0,p[1]);
  });
  box(g,1.5,0.10,1.5,0x999999,0,-0.60,0);
  var fill=box(g,1.34,0.10,1.34,0xd21f2e,0,-0.55,0);
  fill.visible=false; fill.scale.y=0.001; fill.position.y=-0.60;
  g.userData.savedFill=0;
  var water=box(g,1.34,0.05,1.34,0x3a7bd5,0,-0.55,0);
  water.material.transparent=true; water.material.opacity=0; water.visible=false;
  g.userData.fill=fill; g.userData.water=water;
  // Use userData.fill everywhere, never children indices, for
  // the fill — the group also holds walls, rim, posts and bottom.
  return g;
}
// tank — LEFT flank, not the rear. Square, open-top, visible fill.
var tankGroup=makeTank(); tankGroup.position.set(1.55,1.15,-0.6); machine.add(tankGroup);
var tankFillMesh=tankGroup.userData.fill;
var tankWater=tankGroup.userData.water;
function syncTankVisual(){
  var f=Math.min(1,M.tankFill/M.tankCap);
  var h=f*1.1;
  tankFillMesh.visible=f>0.01;
  tankFillMesh.scale.y=Math.max(0.001,h/0.10);
  tankFillMesh.position.y=-0.60+h/2;
  if(tankWater){ tankWater.visible=false; }
}
syncTankVisual();

// ---------- cherry particle pool (fall -> tarp -> horizontal belt -> side conveyor -> [cross] -> left tank) ----------
var pool=[];
for(var pi=0;pi<300;pi++){
  var pm=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.15,0.15),mat(pick(cherryCols)));
  pm.visible=false; pm.castShadow=true; scene.add(pm);
  pool.push({mesh:pm,mode:'idle',t:0,side:1,from:new THREE.Vector3(),to:new THREE.Vector3(),vel:new THREE.Vector3(),life:0});
}
function spawnFalling(worldPos){
  var p=pool.find(function(q){return q.mode==='idle';});
  if(!p) return;
  p.mode='fall'; p.mesh.visible=true; p.mesh.position.copy(worldPos);
  p.vel.set(rand(-0.3,0.3),rand(-0.5,0),rand(-0.3,0.3)); p.life=0;
}
function localOf(world){ return machine.worldToLocal(world.clone()); }
function worldOfLocal(lx,ly,lz){ return machine.localToWorld(new THREE.Vector3(lx,ly,lz)); }

// ---------- NPC tractor + spare tanks ----------
var npc={group:null,phase:'idle',pos:new THREE.Vector3(),heading:0,speed:0,carried:null};
function makeTractor(){
  var g=new THREE.Group();
  box(g,1.6,0.5,2.6,0xc23b22,0,0.7,0);
  box(g,1.2,0.9,1.0,0xc23b22,0,1.4,-0.4);
  box(g,0.4,0.8,0.4,0xdddddd,0.6,1.5,-0.9); box(g,0.4,0.8,0.4,0xdddddd,-0.6,1.5,-0.9);
  for(var a=-1;a<=1;a+=2) for(var b=-1;b<=1;b+=2) box(g,0.35,0.8,0.8,0x111111,a*0.85,0.4,b*1.0);
  // flatbed trailer behind
  box(g,1.7,0.25,2.2,0x666666,0,0.6,-2.6);
  var tk=makeTank(); tk.position.set(0,1.35,-2.6); g.add(tk);
  g.visible=false; scene.add(g);
  return {group:g,tank:tk};
}
npc.obj=makeTractor();
var droppedTank=null, emptyTank=null, fullTanks=[], pickingTank=null;
var tankState='mounted'; // mounted, dropping, dropped, npcComing, npcDropping, npcLeaving, emptyWaiting, picking
var npcDropSpot=new THREE.Vector3();
// Direction the player was facing when the full tank was dropped.
// "In front of the dropped tank" and "from behind" are both defined
// by this direction, not by the player's later heading.
var dropFwd=new THREE.Vector3(0,0,1), dropLeft=new THREE.Vector3(1,0,0), dropHeading=0;
function makeEmptyTank(){
  var tk=makeTank(); tk.position.set(0,1.35,-2.6);
  return tk;
}
function detachTankToWorld(){
  tankGroup.userData.savedFill=M.tankFill;
  scene.attach(tankGroup); droppedTank=tankGroup; fullTanks.push(tankGroup); tankState='dropped';
  // Record the drop direction now, while the player is still facing
  // the way they were when they dropped it. Local +Z is forward,
  // local +X is the driver's left, so in world: fwd=(sin,cos),
  // left=(cos,-sin) in XZ.
  dropHeading=M.heading;
  dropFwd.set(Math.sin(M.heading),0,Math.cos(M.heading));
  dropLeft.set(Math.cos(M.heading),0,-Math.sin(M.heading));
  // New tank goes IN FRONT of the dropped tank, on the same line:
  // 3.5 m ahead along dropFwd. Tank length is 2.4 m, so centre-to-
  // centre 3.5 m leaves a 1.1 m gap between the tanks, and the
  // player, who drove forward past the drop, can BACK UP to it.
  npcDropSpot.copy(droppedTank.position).addScaledVector(dropFwd,3.5); npcDropSpot.y=0;
}
function startNPC(){
  if(tankState!=='dropped'||!droppedTank) return;
  tankState='npcComing'; npc.phase='approach';
  var o=npc.obj; o.group.visible=true;
  // Fresh empty tank on the trailer for every swap. The old code
  // reused the tractor's single tank object, which after the first
  // pickup was the machine's own tank — so a second swap would
  // teleport the full tank away instead of bringing a new one.
  if(!o.tank||o.tank.parent!==o.group){ o.tank=makeEmptyTank(); o.group.add(o.tank); }
  npc.carried=o.tank; o.tank.visible=true; o.tank.position.set(0,1.35,-2.6);
  // Tractor COMES FROM BEHIND: it starts 18 m behind the dropped
  // tank, 3.5 m to its left, facing the drop direction, so it
  // drives forward along the player's old path, not in from the
  // east edge (old spawn at x=42, heading west, regardless of
  // where the player was).
  var dp=droppedTank.position;
  npc.pos.copy(dp).addScaledVector(dropFwd,-18).addScaledVector(dropLeft,3.5); npc.pos.y=0;
  o.group.position.copy(npc.pos); npc.heading=dropHeading; npc.speed=0;
  // Waypoints, in order — this is the "drive around the dropped
  // tank" path, on the left side, not a steering push that could
  // fight the target: (1) behind-left of the dropped tank,
  // (2) left side of the dropped tank, passing it with 3.5 m
  // lateral clearance, (3) tractor centre so the trailer tank
  // (2.6 m behind the tractor centre) lands exactly on the drop
  // spot in front of the dropped tank.
  npc.wps=[
    new THREE.Vector3(dp.x,0,dp.z).addScaledVector(dropLeft,3.5).addScaledVector(dropFwd,-4),
    new THREE.Vector3(dp.x,0,dp.z).addScaledVector(dropLeft,3.5).addScaledVector(dropFwd,1),
    new THREE.Vector3(npcDropSpot.x,0,npcDropSpot.z).addScaledVector(dropFwd,2.6)
  ];
  npc.wp=0; npc.parkTarget=npc.wps[2].clone(); npc.parkHeading=dropHeading;
}
function npcUpdate(dt){
  if(npc.phase==='idle') return;
  var o=npc.obj;
  var target=new THREE.Vector3();
  if(npc.phase==='approach'){
    target.copy(npc.wps[npc.wp]);
    if(npc.pos.distanceTo(target)<1.2){
      npc.wp++;
      if(npc.wp>=npc.wps.length){ npc.phase='dropping'; npc.dropT=0; return; }
    }
  } else if(npc.phase==='leaving'){
    // Leave forward, along the drop direction, on the drop-spot
    // line (left of the player's path, so it passes clear of the
    // player backing up to the new tank), then despawn.
    target.copy(npcDropSpot).addScaledVector(dropFwd,25);
    if(npc.pos.distanceTo(target)<3||Math.abs(npc.pos.x)>55||Math.abs(npc.pos.z)>50){ npc.phase='idle'; o.group.visible=false; return; }
  } else if(npc.phase==='dropping'){
    npc.dropT+=dt;
    // Park adjustment first: ease the tractor centre onto the
    // park target and its heading onto the drop heading, so the
    // trailer tank lands on the drop spot, not 1 m off it because
    // the tractor arrived at an angle.
    var parkK=1-Math.pow(0.001,dt);
    npc.pos.lerp(npc.parkTarget,parkK);
    var hdiff=((npc.parkHeading-npc.heading+Math.PI*3)%(Math.PI*2))-Math.PI;
    npc.heading+=hdiff*parkK;
    var k=clamp(npc.dropT/1.1,0,1);
    o.tank.position.y=lerp(1.35,0.65,k);
    if(k>=1){
      scene.attach(o.tank); emptyTank=o.tank; tankState='emptyWaiting';
      npc.phase='leaving'; npc.carried=null;
      setMsg('Empty tank dropped IN FRONT of the full tank. Line your left mount up over it — within about 1.2 m — and press Pick Up (T).');
    }
    o.group.position.copy(npc.pos); o.group.rotation.y=npc.heading; return;
  }
  // steering toward target (waypoint or leaving target)
  var to=target.clone().sub(npc.pos); to.y=0;
  var dist=to.length(); if(dist<0.01) return;
  var desired=Math.atan2(to.x,to.z);
  var diff=((desired-npc.heading+Math.PI*3)%(Math.PI*2))-Math.PI;
  npc.heading+=clamp(diff,-1.6*dt,1.6*dt);
  npc.speed=Math.min(4.5,npc.speed+3*dt);
  // Tractor must not drive through the shaker either: if the next
  // step would overlap the machine chassis (or its mounted tank),
  // pause this frame. The player can drive clear, and the tractor
  // resumes. This does not apply to trees — the tractor's path is
  // precomputed, and stopping for a tree could deadlock a swap.
  var candSpeed=npc.speed;
  var candX=npc.pos.x+Math.sin(npc.heading)*candSpeed*dt;
  var candZ=npc.pos.z+Math.cos(npc.heading)*candSpeed*dt;
  var tractorWouldHit=false;
  try{
    var tCentre={x:candX+Math.sin(npc.heading)*(-1.2), z:candZ+Math.cos(npc.heading)*(-1.2)};
    var tCorners=obbCorners(tCentre.x,tCentre.z,0.85,2.5,npc.heading);
    var tAxes=obbAxes(npc.heading);
    var mChassis=obbCorners(M.pos.x,M.pos.z,1.2,3.8,M.heading);
    if(obbPush(mChassis,{x:M.pos.x,z:M.pos.z},tCorners,tCentre,tAxes.concat(obbAxes(M.heading)))) tractorWouldHit=true;
    if(!tractorWouldHit&&tankState==='mounted'){
      var mtc=machineXZ(1.55,-0.6);
      var mTank=obbCorners(mtc.x,mtc.z,0.75,0.75,M.heading);
      if(obbPush(mTank,mtc,tCorners,tCentre,tAxes.concat(obbAxes(M.heading)))) tractorWouldHit=true;
    }
  }catch(e){ tractorWouldHit=false; }
  // Fabric, fully deployed only: if the tractor's next step
  // would put any of its corners into the fabric ring at a
  // height the fabric actually reaches (cab top ~2.0 m), pause
  // and tell the player to stow. Stowing works at any distance,
  // even while clamped, so this cannot deadlock a swap — it
  // just waits for E / tarps lever up.
  if(!tractorWouldHit&&M.wings>=0.999){
    try{
      var fcCentre={x:candX+Math.sin(npc.heading)*(-1.2), z:candZ+Math.cos(npc.heading)*(-1.2)};
      var fcCorners=obbCorners(fcCentre.x,fcCentre.z,0.85,2.5,npc.heading);
      for(var fci=0; fci<fcCorners.length; fci++){
        if(fabricPointHits(fcCorners[fci].x,fcCorners[fci].z,2.0)){ tractorWouldHit=true; break; }
      }
      if(tractorWouldHit) setMsg('Tractor waiting — stow the tarps (E) so it can get through.');
    }catch(e){}
  }
  if(tractorWouldHit){
    npc.speed=0;
    o.group.position.copy(npc.pos); o.group.rotation.y=npc.heading;
    return;
  }
  npc.pos.x=candX;
  npc.pos.z=candZ;
  o.group.position.copy(npc.pos); o.group.rotation.y=npc.heading;
}

// ---------- game state / UI ----------
var stats={trees:0,collected:0,lost:0,tanks:0};
var targetTree=null, grippedTree=null, shakeTimer=0, msgTimer=0;
function setMsg(s){ $('msg').textContent=s; msgTimer=4; }
function setStep(s){ $('steps').textContent=s; }
function updateHUD(){
  $('viewtxt').textContent=(viewMode==='third'?'Third-person (V)':'First-person cab (V)');
  if($('modetxt')) $('modetxt').textContent=IS_RANKED?'Ranked — 1 row':'Casual';
  var rt=$('rankedtxt');
  if(rt){ rt.style.display=IS_RANKED?'block':'none'; if(IS_RANKED) rt.textContent='Ranked: '+fmtRankedTime(rankedElapsed)+(rankedFinished?' — Final '+fmtRankedTime(rankedFinal):''); }
  $('tankbar').style.width=(Math.min(100,M.tankFill/M.tankCap*100))+'%';
  $('tanktxt').textContent=Math.floor(M.tankFill)+' / '+M.tankCap+' cherries';
  $('stat').textContent='Trees: '+stats.trees+'  •  Collected: '+stats.collected+'  •  Lost: '+stats.lost+'  •  Tanks swapped: '+stats.tanks;
  $('tankbtn').textContent=(tankState==='picking'||tankState==='dropping')?'Tank…':(tankState==='mounted'?'Drop Tank (T)':'Pick Up Tank (T)');
  // levers
  $('levWing').style.transform='rotate('+(M.wingsOpen? -38:38)+'deg)';
  $('levGrip').style.transform='rotate('+(M.gripped? -38:38)+'deg)';
  $('levShake').style.transform='rotate('+(M.shaking? -38:20)+'deg)';
  $('levTank').style.transform='rotate('+((tankState==='mounted')?20:-38)+'deg)';
}
// ---------- ranked mode ----------
function fmtRankedTime(sec){
  var tenths=Math.max(0,Math.round(sec*10));
  var m=Math.floor(tenths/600), rem=tenths%600, s=Math.floor(rem/10), th=rem%10;
  return m+':'+(s<10?'0':'')+s+'.'+th;
}
var rankedElapsed=0, rankedRunning=false, rankedFinished=false, rankedFinal=0, rankedSaved=false;
function loadRankedScores(){
  try{ var a=JSON.parse(localStorage.getItem('cherryRankedScores')||'[]'); return Array.isArray(a)?a:[]; }
  catch(e){ return []; }
}
// Firebase global leaderboard, 2026-10-26: project cherrysimleaderboard,
// Realtime Database, node "scores". REST only — no Firebase SDK and
// no CDN, so the single-file game stays self-contained. REST needs
// only the database URL, so the apiKey and other config values the
// user pasted are deliberately NOT embedded in the game.
var FIREBASE_DB_URL='https://cherrysimleaderboard-default-rtdb.firebaseio.com';
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function renderRankedBoardRows(el,a,label){
  if(!a.length){ el.innerHTML='<p>No ranked scores yet — be the first.</p>'; return; }
  var html='<table style="width:100%;border-collapse:collapse;font-size:14px"><tr><th style="text-align:left">#</th><th style="text-align:left">Initials</th><th style="text-align:left">Final</th><th style="text-align:left">Elapsed</th><th style="text-align:left">Spilled</th></tr>';
  a.forEach(function(s,i){ html+='<tr><td>'+(i+1)+'</td><td>'+escHtml(s.name)+'</td><td>'+fmtRankedTime(s.final)+'</td><td>'+fmtRankedTime(s.elapsed)+'</td><td>'+s.lost+'</td></tr>'; });
  html+='</table><p style="font-size:12px;opacity:.8">'+label+' • Lower final time wins. Final = elapsed + 0.5s per spilled cherry.</p>';
  el.innerHTML=html;
}
function renderRankedBoard(el){
  if(!el) return;
  el.innerHTML='<p>Loading global leaderboard…</p>';
  fetch(FIREBASE_DB_URL+'/scores.json?orderBy=%22final%22&limitToFirst=10')
    .then(function(r){ if(!r.ok) throw new Error('Firebase '+r.status); return r.json(); })
    .then(function(data){
      var a=[];
      if(data){ Object.keys(data).forEach(function(k){ var s=data[k]; if(s&&typeof s.final==='number') a.push(s); }); a.sort(function(x,y){ return x.final-y.final; }); a=a.slice(0,10); }
      renderRankedBoardRows(el,a,'Global leaderboard');
    })
    .catch(function(){
      // Offline, or the global board is unreachable: fall back to
      // the local cache saved on this device, so the board is
      // never just blank.
      renderRankedBoardRows(el,loadRankedScores(),'Local scores — global board unreachable');
    });
}
function showRankedFinish(){
  rankedFinal=rankedElapsed+0.5*stats.lost;
  $('rankedScoreLine').innerHTML='Final time: <b>'+fmtRankedTime(rankedFinal)+'</b><br>Elapsed: '+fmtRankedTime(rankedElapsed)+'<br>Spilled: '+stats.lost+' x 0.5s = '+(0.5*stats.lost).toFixed(1)+'s penalty<br>Trees: '+stats.trees+'  •  Collected: '+stats.collected+'  •  Lost: '+stats.lost;
  $('rankedFinish').style.display='block';
  renderRankedBoard($('rankedFinishBoard'));
  setStep('Ranked complete — add your 3 initials.');
}
function checkRankedFinish(){
  if(!IS_RANKED||!rankedRunning||rankedFinished) return;
  if(!trees.length||!trees.every(function(t){ return t.harvested; })) return;
  // Scoring is only complete when every tree has every cherry
  // removed AND every detached cherry has resolved (collected,
  // lost to the ground, or spilled from a full tank). Ground-
  // fading cherries already counted as lost, so they do not
  // block finishing. Without the second part, shaking the last
  // tree with the tarps open would stop the timer before those
  // misses counted as spilled.
  var pending=pool.some(function(p){ return p.mode==='fall'||p.mode==='tarp'||p.mode==='horiz'||p.mode==='side'||p.mode==='cross'||p.mode==='drop'||p.mode==='spill'; });
  if(pending) return;
  rankedFinished=true; rankedRunning=false; showRankedFinish();
}
function nearestUnharvested(){
  var best=null,bd=1e9;
  trees.forEach(function(t){ if(!t.harvested){ var d=Math.hypot(t.x-M.pos.x,t.z-M.pos.z); if(d<bd){bd=d;best=t;} } });
  return best;
}
function alignment(tree){
  if(!tree) return {dist:0,lat:0,face:0,hub:9,ok:false};
  var dx=tree.x-M.pos.x, dz=tree.z-M.pos.z, dist=Math.hypot(dx,dz);
  var fwd=new THREE.Vector3(Math.sin(M.heading),0,Math.cos(M.heading));
  var to=new THREE.Vector3(dx,0,dz).normalize();
  var face=fwd.dot(to);
  var lat=Math.abs(dx*fwd.z-dz*fwd.x); // perpendicular distance
  // What actually matters is the UMBRELLA HUB, not the machine
  // centre: the hub is at machine-local z 5.0, so hub world =
  // machine pos + fwd*5.0, and clamping is allowed when that hub is
  // close to the trunk. The old gate was dist 4.8-5.2 m AND lat
  // <0.35 m, which together meant angle <4 deg and hub error
  // <0.40 m, while the turning radius at creep speed was 5.4 m —
  // so you had to approach on a near-perfect line, and at 5 m/s
  // you blew through the 0.4 m distance window in 0.08 s. That is
  // why it never said IN POSITION. New gate, 2026-10-26: hub
  // offset <0.60 m, facing >0.85. Head-on that is dist 4.40-5.60 m
  // (1.20 m window, 3x wider) and lat up to 0.60 m (angle ~6.9 deg),
  // still inside the umbrella's 1.4 m inner hole, so the trunk is
  // still inside the umbrella, just not perfectly centred. The
  // banner now shows hub offset live, so you can see the one
  // number that actually gates the clamp.
  var hubW=worldOfLocal(0,1.35,5.0); // true hub, tilt-aware (flat 5.0 m would be 0.10 m short in Z with the 5 deg pitch)
  var hubX=hubW.x, hubZ=hubW.z;
  var hub=Math.hypot(tree.x-hubX,tree.z-hubZ);
  return {dist:dist,lat:lat,face:face,hub:hub,ok:(hub<0.60&&face>0.85)};
}
function syncMachineTransform(){
  machine.position.copy(M.pos);
  // 5 deg forward tilt, 2026-10-26: nose (+Z) down. Euler order YXZ
  // so yaw applies first, then pitch around the machine's own X
  // axis (forward pitch, not world pitch). Wheels stay on the
  // ground via the compensated axle heights above; chassis front
  // bottom drops to 0.17 m above ground (was 0.50 m), rear rises,
  // hub world Y drops 1.35 -> 0.91 m, hub Z 5.00 -> 5.10 m — see
  // alignment(), which now uses the true hub world position.
  machine.rotation.order='YXZ'; machine.rotation.y=M.heading; machine.rotation.x=MACHINE_TILT;
  // wheels are no longer traversed boxes — see wheels[] in animate
}

// ---------- actions ----------
function toggleWings(){
  // No activation gate, 2026-10-26: tarps can be opened/closed
  // anytime, including while clamped. If they are closed while
  // shaking, most cherries are simply lost (except the static
  // centre tarp) — the effect is conditional, the control is not locked.
  M.wingsTarget=M.wingsOpen?0:1; M.wingsOpen=!M.wingsOpen;
  setMsg(M.wingsOpen?'Umbrella opening — slow hydraulics, 4.0 s: one main arm on each side rotates forward, trailing arms following on that side, the two mains meeting in front, fabric unfolding between them. Wait for it to finish before shaking.':'Umbrella closing — hydraulics retract, main arms rotate back toward the machine, trailing arms following, fabric folding between them until the bundle is back against the machine.');
  blip(M.wingsOpen?520:340);
}
function toggleGrip(){
  targetTree=nearestUnharvested();
  if(!M.gripped){
    var a=alignment(targetTree);
    M.gripped=true;
    if(targetTree&&a.ok){
      grippedTree=targetTree;
      setMsg('Clamp fixed in place — jaws closing on the trunk, nothing moves forward. Now shake (hold Space).');
    } else {
      grippedTree=null;
      setMsg('Clamp closed — no tree in the clamp (hub '+a.hub.toFixed(2)+' m off the nearest trunk), so shake will not strip anything. Release the clamp (G) to drive on, then clamp on a tree.');
    }
    blip(660);
  } else {
    M.gripped=false; grippedTree=null;
    setMsg('Clamp released. Drive on to the next tree.');
    blip(440);
  }
}
function tankAction(){
  if(tankState==='mounted'){
    // Drop STRAIGHT DOWN from the mount slot, 2026-10-27: no more
    // sideways slide to x 2.9. The tank just lowers in place, so
    // picking it back up is lining the mount up over it again.
    tankState='dropping'; M.dropT=0; setMsg('Lowering tank straight down…');
  } else if(tankState==='picking'||tankState==='dropping'){
    setMsg('Tank job in progress…');
  } else {
    // Not mounted: try to pick up ANY tank on the ground — full,
    // partial, or empty — if the left mount is lined up over it.
    // Grace: mount point within 1.2 m of the tank centre, so it
    // does not have to be exact, but it does have to be lined up.
    var mount=worldOfLocal(1.55,0,-0.6);
    var candidates=fullTanks.slice();
    if(emptyTank) candidates.push(emptyTank);
    var best=null, bestD=99;
    candidates.forEach(function(tk){
      var d=Math.hypot(mount.x-tk.position.x,mount.z-tk.position.z);
      if(d<bestD){ bestD=d; best=tk; }
    });
    if(best&&bestD<1.2){
      pickingTank=best; tankState='picking'; M.pickT=0;
      setMsg('Picking up tank onto the left flank…');
    } else if(candidates.length){
      setMsg('Line up so your left mount is over a tank — within about 1.2 m — then press T again. Or drive forward at least 6 m for the tractor swap.');
    } else {
      setMsg('No tank on the ground in range. Drop a tank first, or wait for the tractor.');
    }
  }
}
function detachCherries(tree,count){
  var alive=tree.cherries.filter(function(c){return c.alive;});
  var dummy=new THREE.Object3D();
  for(var i=0;i<count&&alive.length;i++){
    var idx=Math.floor(Math.random()*alive.length); var c=alive.splice(idx,1)[0]; c.alive=false; tree.remaining--;
    var ci=tree.cherries.indexOf(c);
    dummy.position.set(0,-10,0); dummy.scale.setScalar(0.001); dummy.updateMatrix();
    tree.cherryMesh.setMatrixAt(ci,dummy.matrix); tree.cherryMesh.instanceMatrix.needsUpdate=true;
    var wp=tree.group.localToWorld(new THREE.Vector3(c.x,c.y,c.z));
    spawnFalling(wp);
  }
}

// ---------- input ----------
var keys={}, joy={x:0,y:0,active:false}, viewMode='third';
// --- drag camera, 2026-10-26 ---
// Click/tap and drag on the 3D view (not on the joystick or buttons,
// which are separate overlay elements and never reach the canvas):
//  * third-person: orbits around the shaker — drag right moves the
//    camera to the machine's right, drag up raises it. Orbit yaw
//    and height persist until reset, so you can inspect the tarps,
//    tank, or tractor from any side while driving.
//  * first-person: looks around from the seat — drag right looks
//    right, drag up looks up. Yaw is clamped to ±1.2 rad (~69 deg)
//    and pitch to ±0.6 rad, so you can glance sideways/up/down
//    without losing the trunk in front of you entirely.
// Double-click / double-tap on the view resets both to straight
// ahead/behind. Camera position in animate still lerps, so drag
// changes are smoothed, not jumpy.
var camOrbitYaw=0, camOrbitElev=0, camLookYaw=0, camLookPitch=0, camDrag=null;
// --- FP 3D control drag, 2026-10-26 ---
// In first-person only, a pointerdown on a console control grabs
// THAT control instead of the camera. A pointerdown anywhere else
// in FP (or anywhere in third-person) is still camera drag, as
// before. Raycast is against controlHit only, never the whole
// machine, so the chassis, tarps, trees, etc. never steal a drag.
// Controls, left to right:
//  * tank lever: drag down (dy+) = lever down, drag up = lever up.
//    On release, down + tank mounted = drop, up + empty waiting =
//    pick up. Otherwise the lever snaps back to the tank state.
//  * tarps lever: same, down = close, up = open. On release,
//    down + open = close, up + closed = open.
//  * steering wheel: drag around the wheel centre (screen angle,
//    Y down, so clockwise drag = increasing angle). Wheel angle
//    is clamped to ±1.2 rad, steer = -wheelAngle/0.6 (so a
//    clockwise-to-the-driver wheel turn = steer right, matching
//    the old steerWheel.rotation.z = -steerIn*0.6). On release the
//    wheel springs back to keys/joystick steering.
//  * 2D joystick: drag in screen space, vector (right, down),
//    clamped to unit length. Directions, as drawn:
//      upper right (0.707,-0.707) = clamp release
//      lower right (0.707, 0.707) = clamp engage
//      lower left (-0.707, 0.707) = shake (hold while there)
//    Each bottom/top direction's strength is the dot product of
//    the joystick vector with that direction, so straight down
//    (0,1) gives engage 0.707 AND shake 0.707 — both bottom
//    controls proportionally, as the user specified, and a
//    down-right push gives more engage than shake, down-left
//    more shake than engage. Clamp engage/release are
//    edge-triggered once per drag (clampDone), shake is held
//    while the joystick stays in the lower-left/down region.
var controlDrag=null, dragSteer=0, dragWheelAngle=0, joyVec={x:0,y:0}, joyShake=0;
var raycaster=new THREE.Raycaster(), pointerNDC=new THREE.Vector2();
function pickControl(e){
  if(viewMode!=='first') return null;
  pointerNDC.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
  raycaster.setFromCamera(pointerNDC, camera);
  var hits=raycaster.intersectObjects(controlHit, true);
  if(!hits.length) return null;
  var o=hits[0].object;
  while(o && !o.userData.control) o=o.parent;
  return o ? o.userData.control : null;
}
function wheelCentreScreen(){
  var wp=new THREE.Vector3(); wheelGroup.getWorldPosition(wp); wp.project(camera);
  return {x:(wp.x*0.5+0.5)*innerWidth, y:(-wp.y*0.5+0.5)*innerHeight};
}
function wrapAngle(a){ while(a>Math.PI) a-=Math.PI*2; while(a<-Math.PI) a+=Math.PI*2; return a; }
renderer.domElement.style.touchAction='none';
renderer.domElement.addEventListener('pointerdown',function(e){
  var ctrl=pickControl(e);
  if(ctrl){
    var cd={control:ctrl,lastX:e.clientX,lastY:e.clientY,startX:e.clientX,startY:e.clientY,clampDone:false};
    if(ctrl==='steer'){
      var c=wheelCentreScreen(); cd.cx=c.x; cd.cy=c.y;
      cd.lastAngle=Math.atan2(e.clientY-c.y, e.clientX-c.x);
      dragWheelAngle=wheelSpin.rotation.z;
    }
    controlDrag=cd;
  } else {
    camDrag={x:e.clientX,y:e.clientY};
  }
  try{ renderer.domElement.setPointerCapture(e.pointerId); }catch(err){}
});
renderer.domElement.addEventListener('pointermove',function(e){
  if(controlDrag){
    var cd=controlDrag;
    if(cd.control==='tank'){
      tankLeverAngle=clamp(tankLeverAngle-(e.clientY-cd.lastY)*0.01,-0.5,0.5); // inverted: finger down -> theta down -> top down on screen
      cd.lastY=e.clientY;
    } else if(cd.control==='tarps'){
      tarpsLeverAngle=clamp(tarpsLeverAngle-(e.clientY-cd.lastY)*0.01,-0.5,0.5); // inverted, same reason
      cd.lastY=e.clientY;
    } else if(cd.control==='steer'){
      var c=wheelCentreScreen(); cd.cx=c.x; cd.cy=c.y;
      var na=Math.atan2(e.clientY-c.y, e.clientX-c.x);
      dragWheelAngle=clamp(dragWheelAngle+wrapAngle(na-cd.lastAngle),-1.2,1.2);
      cd.lastAngle=na; dragSteer=clamp(-dragWheelAngle/0.6,-1,1);
    } else if(cd.control==='joystick'){
      var jx=clamp((e.clientX-cd.startX)/60,-1,1), jy=clamp((e.clientY-cd.startY)/60,-1,1);
      var jm=Math.hypot(jx,jy); if(jm>1){ jx/=jm; jy/=jm; }
      joyVec={x:jx,y:jy};
      var offX=-jx*0.15, offZ=-jy*0.15;
      joyHandleGroup.rotation.x=Math.atan2(offZ,0.28); joyHandleGroup.rotation.z=Math.atan2(-offX,0.28);
      var releaseDot=jx*0.707+jy*(-0.707), engageDot=jx*0.707+jy*0.707, shakeDot=-jx*0.707+jy*0.707;
      joyShake=(shakeDot>0.3?shakeDot:0);
      if(!cd.clampDone){
        if(releaseDot>0.6&&M.gripped){ toggleGrip(); cd.clampDone=true; }
        else if(engageDot>0.6&&!M.gripped){ toggleGrip(); cd.clampDone=true; }
      }
    }
    return;
  }
  if(!camDrag) return;
  var dx=e.clientX-camDrag.x, dy=e.clientY-camDrag.y; camDrag={x:e.clientX,y:e.clientY};
  if(viewMode==='third'){
    camOrbitYaw+=dx*0.005;
    camOrbitElev=clamp(camOrbitElev-dy*0.02,-2,5);
  } else {
    camLookYaw=clamp(camLookYaw+dx*0.0035,-1.2,1.2);
    camLookPitch=clamp(camLookPitch-dy*0.0035,-0.6,0.6);
  }
});
function camDragEnd(){
  if(controlDrag){
    var cd=controlDrag;
    if(cd.control==='tank'){
      // up on screen (+angle) = tank up = pick up; down on screen (-angle) = tank down = drop
      if(tankLeverAngle>0.25&&tankState!=='mounted'&&tankState!=='picking'&&tankState!=='dropping') tankAction();
      else if(tankLeverAngle<-0.25&&tankState==='mounted') tankAction();
    } else if(cd.control==='tarps'){
      // FLIPPED 2026-10-26: down on screen (-angle) = deploy out
      // around the tree; up on screen (+angle) = stow back
      // against the machine. Drag motion itself is unchanged.
      if(tarpsLeverAngle<-0.25&&!M.wingsOpen) toggleWings();
      else if(tarpsLeverAngle>0.25&&M.wingsOpen) toggleWings();
    } else if(cd.control==='steer'){
      dragSteer=0; dragWheelAngle=0;
    } else if(cd.control==='joystick'){
      joyVec={x:0,y:0}; joyShake=0; joyHandleGroup.rotation.x=0; joyHandleGroup.rotation.z=0;
    }
    controlDrag=null;
  }
  camDrag=null;
}
renderer.domElement.addEventListener('pointerup',camDragEnd);
renderer.domElement.addEventListener('pointercancel',camDragEnd);
renderer.domElement.addEventListener('dblclick',function(){
  camOrbitYaw=0; camOrbitElev=0; camLookYaw=0; camLookPitch=0;
});
addEventListener('keydown',function(e){
  if(e.repeat) return; keys[e.code]=true;
  if(e.code==='KeyV') viewMode=(viewMode==='third')?'first':'third';
  if(e.code==='KeyE') toggleWings();
  if(e.code==='KeyG') toggleGrip();
  if(e.code==='KeyT') tankAction();
  if(e.code==='KeyH') $('help').classList.toggle('show');
});
addEventListener('keyup',function(e){ keys[e.code]=false; });
$('wingbtn').onclick=toggleWings; $('gripbtn').onclick=toggleGrip; $('tankbtn').onclick=tankAction;
$('viewbtn').onclick=function(){ viewMode=(viewMode==='third')?'first':'third'; };
$('helpbtn').onclick=function(){ $('help').classList.toggle('show'); };
$('startbtn').onclick=function(){ if(IS_RANKED){ location.href=location.pathname; } else { $('help').classList.remove('show'); } };
$('rankedbtn').onclick=function(){ if(IS_RANKED){ $('help').classList.remove('show'); rankedRunning=true; } else { location.href=location.pathname+'?ranked=1'; } };
// Ranked finish overlay: initials must be exactly 3 letters/numbers.
if($('rankedSaveBtn')) $('rankedSaveBtn').onclick=function(){
  var v=($('rankedInitials').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  $('rankedInitials').value=v;
  if(v.length!==3){ $('rankedSaveMsg').textContent='Enter exactly 3 letters or numbers.'; return; }
  if(rankedSaved) return;
  var score={name:v,final:rankedFinal,elapsed:rankedElapsed,lost:stats.lost,date:Date.now()};
  $('rankedSaveBtn').disabled=true; $('rankedSaveBtn').textContent='Saving…'; $('rankedSaveMsg').textContent='Saving to the global leaderboard…';
  fetch(FIREBASE_DB_URL+'/scores.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(score)})
    .then(function(r){ if(!r.ok) throw new Error('Firebase '+r.status); return r.json(); })
    .then(function(){
      rankedSaved=true; $('rankedSaveBtn').textContent='Saved ✓'; $('rankedSaveMsg').textContent='Saved to the global leaderboard.';
      // Local cache copy, for the offline fallback board only.
      // The global board is the source of truth when it loads.
      var a=loadRankedScores(); a.push(score); a.sort(function(x,y){ return x.final-y.final; }); a=a.slice(0,10);
      try{ localStorage.setItem('cherryRankedScores',JSON.stringify(a)); }catch(e){}
      renderRankedBoard($('rankedFinishBoard')); renderRankedBoard($('rankedBoard'));
    })
    .catch(function(){
      $('rankedSaveBtn').disabled=false; $('rankedSaveBtn').textContent='Save score →';
      $('rankedSaveMsg').textContent='Could not reach the global board — check your connection and try again. Nothing was saved, so you can retry without a duplicate.';
    });
};
if($('rankedAgainBtn')) $('rankedAgainBtn').onclick=function(){ location.href=location.pathname+'?ranked=1'; };
if($('rankedCasualBtn')) $('rankedCasualBtn').onclick=function(){ location.href=location.pathname; };
if($('rankedInitials')) $('rankedInitials').addEventListener('input',function(){ this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3); });
// Render the board on the start screen, if it exists.
renderRankedBoard($('rankedBoard'));
var shakeBtn=$('shakebtn');
function shakeOn(e){ e.preventDefault(); M.shaking=true; }
function shakeOff(e){ e.preventDefault(); M.shaking=false; }
shakeBtn.addEventListener('pointerdown',shakeOn); addEventListener('pointerup',shakeOff); shakeBtn.addEventListener('pointerleave',shakeOff);
// No text selection / long-press menu on mobile (2026-10-26):
// holding SHAKE used to select the button text. CSS in build.py
// (user-select:none, touch-action:none) is the main fix; these
// stop the context menu and selectstart as well.
shakeBtn.addEventListener('contextmenu',function(e){ e.preventDefault(); });
shakeBtn.addEventListener('selectstart',function(e){ e.preventDefault(); });
document.querySelectorAll('#btns button').forEach(function(b){ b.addEventListener('contextmenu',function(e){ e.preventDefault(); }); });
// touch joystick
var joyEl=$('joy'), knob=$('knob');
joyEl.addEventListener('pointerdown',function(e){ joy.active=true; joyEl.setPointerCapture(e.pointerId); joyMove(e); });
joyEl.addEventListener('pointermove',function(e){ if(joy.active) joyMove(e); });
joyEl.addEventListener('pointerup',function(){ joy.active=false; joy.x=0; joy.y=0; knob.style.transform='translate(0px,0px)'; });
function joyMove(e){
  var r=joyEl.getBoundingClientRect();
  var dx=(e.clientX-(r.left+r.width/2))/40, dy=(e.clientY-(r.top+r.height/2))/40;
  joy.x=clamp(dx,-1,1); joy.y=clamp(dy,-1,1);
  knob.style.transform='translate('+(joy.x*32)+'px,'+(joy.y*32)+'px)';
}
// simple audio blips
var AC=null;
function blip(f){
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    var o=AC.createOscillator(), g=AC.createGain(); o.frequency.value=f; o.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(0.12,AC.currentTime); g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+0.25);
    o.start(); o.stop(AC.currentTime+0.26);
  }catch(err){}
}

// ---------- per-frame ----------
var clock=new THREE.Clock(), dummy=new THREE.Object3D();
function updateCherries(dt){
  var beltActive=false;
  pool.forEach(function(p){
    if(p.mode==='idle') return;
    if(p.mode==='fall'){
      p.vel.y-=9.8*dt; p.mesh.position.addScaledVector(p.vel,dt); p.life+=dt;
      var loc=localOf(p.mesh.position);
      // Catch on the umbrella disc: centre is the hub at machine-local
      // (0, 5.0), outer radius 5.486 m (36 ft). Gap sector included:
      // cherries rolling to the machine side drop through the gap
      // onto the conveyors below. Require the umbrella almost fully
      // open, otherwise the fabric is not there yet.
      var du=Math.hypot(loc.x,loc.z-5.0);
      // Catch when the cherry reaches the fabric surface at its own
      // position, not a fixed height — the funnel is now deep, so
      // the surface is 2.60 m at the front rim and 1.49 m at the
      // inner machine side. Without this, cherries would fall
      // through the high outer rim before being caught.
      var ang=Math.atan2(loc.z-5.0,loc.x);
      var angDeg=((ang*180/Math.PI)%360+360)%360;
      // Static centre tarp: gap sector (240-300 deg) and inside
      // the tarp rectangle x -1.4..1.4, z 2.2..5.0. These cherries
      // land on the static tarp, NOT on umbrella fabric — the
      // fabric is missing in the gap. The static tarp is always
      // there, so it catches even with the umbrella closed.
      var onStaticTarp=(angDeg>240&&angDeg<300&&loc.x>=-1.4&&loc.x<=1.4&&loc.z>=2.2&&loc.z<=5.0);
      var surfY=onStaticTarp?staticTarpY(loc.x,loc.z):umbFabricY(Math.min(du,UMB_OUTER),ang);
      // Static tarp catches its whole rectangle, even the two
      // back corners (du up to 3.13 m) that sit just outside the
      // umbrella disc — the tarp is physically there, the disc
      // is not the tarp. Umbrella fabric still needs wings open
      // and du <= UMB_OUTER (5.486 m).
      if((onStaticTarp||(M.wings>0.85&&du<=UMB_OUTER))&&p.mesh.position.y<surfY+0.15){
        p.mode='tarp'; p.t=0; p.from.copy(p.mesh.position); p.side=(loc.x<0?-1:1);
        // Random belt journey for this cherry (2026-10-26): see note above.
        p.beltJit=rand(-0.22,0.22); p.spd=rand(0.75,1.30); p.crossJit=rand(-0.18,0.18);
        p.dropX=1.55+rand(-0.5,0.5); p.dropZ=-0.6+rand(-0.5,0.5);
        // Tarp slide ends on the HORIZONTAL belt, at the cherry's
        // own forward position, clamped to the belt's range
        // z 3.2–5.0. The horizontal belt then carries it back to
        // the side belt's bottom (z 3.2), then up the side belt.
        p.horizZ=clamp(loc.z,3.2,5.0);
        p.to.copy(worldOfLocal(p.side*1.4+p.beltJit,1.05,p.horizZ)); // beltJit target, matching the belt phases (p.to is currently unused, kept consistent)
      } else if(p.mesh.position.y<0.12){
        p.mode='ground'; p.life=0; p.mesh.position.y=0.12; stats.lost++;
      }
    } else if(p.mode==='tarp'||p.mode==='horiz'||p.mode==='side'||p.mode==='cross'||p.mode==='drop'){
      beltActive=true; p.t+=dt;
      var hz=(p.horizZ!==undefined?p.horizZ:3.2);
      var spd=(p.spd!==undefined?p.spd:1);
      var dur=(p.mode==='tarp'?0.45:(p.mode==='horiz'?0.2+(hz-3.2)*0.2:(p.mode==='side'?0.9:(p.mode==='cross'?0.6:0.35))))/spd;
      var k=clamp(p.t/dur,0,1), e=k*k*(3-2*k);
      // path is defined in machine-local space, re-evaluated each frame so the belt moves with the machine
      var a,b, sx=p.side||1;
      var bj=(p.beltJit!==undefined?p.beltJit:0), cj=(p.crossJit!==undefined?p.crossJit:0);
      var dx=(p.dropX!==undefined?p.dropX:1.55), dz=(p.dropZ!==undefined?p.dropZ:-0.6);
      if(p.mode==='tarp'){ a=localOf(p.from); b=new THREE.Vector3(sx*1.4+bj,1.05,hz); }
      else if(p.mode==='horiz'){ a=new THREE.Vector3(sx*1.4+bj,1.05,hz); b=new THREE.Vector3(sx*1.4+bj,1.0,3.2); }
      else if(p.mode==='side'){ a=new THREE.Vector3(sx*1.4+bj,1.0,3.2); b=new THREE.Vector3(sx*1.4+bj,1.95,-0.3); }
      else if(p.mode==='cross'){ a=new THREE.Vector3(-1.4+bj,1.95,-0.3+cj); b=new THREE.Vector3(1.35,1.35,-0.3+cj); }
      else { a=new THREE.Vector3(sx*1.4+bj,1.95,-0.3); if(sx<0) a=new THREE.Vector3(1.35,1.35,-0.3+cj); b=new THREE.Vector3(dx,1.85,dz); }
      var lp=new THREE.Vector3(lerp(a.x,b.x,e),lerp(a.y,b.y,e),lerp(a.z,b.z,e));
      p.mesh.position.copy(worldOfLocal(lp.x,lp.y,lp.z));
      if(k>=1){
        if(p.mode==='tarp') p.mode=(hz>3.25?'horiz':'side');
        else if(p.mode==='horiz') p.mode='side';
        else if(p.mode==='side') p.mode=(sx<0?'cross':'drop');
        else if(p.mode==='cross') p.mode='drop';
        else {
          if(tankState==='mounted'&&M.tankFill<M.tankCap){ p.mode='idle'; p.mesh.visible=false; M.tankFill++; stats.collected++; syncTankVisual(); }
          else {
            // Spill: tank full, or no tank mounted to receive it.
            p.mode='spill'; p.t=0; p.life=0; stats.lost++;
            var sdx=p.mesh.position.x-M.pos.x, sdz=p.mesh.position.z-M.pos.z, sdl=Math.hypot(sdx,sdz)||1;
            p.vel.set(sdx/sdl*rand(0.8,1.8),rand(0.5,1.5),sdz/sdl*rand(0.8,1.8));
          }
        }
        p.t=0; p.from.copy(p.mesh.position);
      }
    } else if(p.mode==='spill'){
      p.vel.y-=9.8*dt; p.mesh.position.addScaledVector(p.vel,dt);
      if(p.mesh.position.y<0.12){ p.mode='ground'; p.life=0; p.mesh.position.y=0.12; p.mesh.scale.setScalar(1); }
    } else if(p.mode==='ground'){
      p.life+=dt; p.mesh.scale.setScalar(Math.max(0.2,1-p.life/4));
      if(p.life>4){ p.mode='idle'; p.mesh.visible=false; p.mesh.scale.setScalar(1); }
    }
  });
  if(beltActive||M.shaking){ beltTex.offset.y-=dt*2.5; crossBeltTex.offset.x-=dt*2.5; }
}
function machineXZ(lx,lz){
  var c=Math.cos(M.heading), s=Math.sin(M.heading);
  return {x:M.pos.x+lx*c+lz*s, z:M.pos.z+lx*(-s)+lz*c};
}
function obbCorners(cx,cz,hx,hz,heading){
  var c=Math.cos(heading), s=Math.sin(heading), out=[];
  var pts=[[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]];
  for(var i=0;i<pts.length;i++){
    var lx=pts[i][0], lz=pts[i][1];
    out.push({x:cx+lx*c+lz*s, z:cz+lx*(-s)+lz*c});
  }
  return out;
}
function obbAxes(heading){
  var c=Math.cos(heading), s=Math.sin(heading);
  return [{x:c,z:-s},{x:s,z:c}];
}
function projRange(corners,axis){
  var mn=1e9, mx=-1e9;
  for(var i=0;i<corners.length;i++){
    var d=corners[i].x*axis.x+corners[i].z*axis.z;
    if(d<mn) mn=d;
    if(d>mx) mx=d;
  }
  return {min:mn,max:mx};
}
function obbPush(mCorners,mCentre,oCorners,oCentre,axes){
  var bestDepth=1e9, bestAxis=null;
  for(var i=0;i<axes.length;i++){
    var ax=axes[i];
    var pa=projRange(mCorners,ax), pb=projRange(oCorners,ax);
    var ov=Math.min(pa.max,pb.max)-Math.max(pa.min,pb.min);
    if(ov<=0) return null;
    if(ov<bestDepth){ bestDepth=ov; bestAxis=ax; }
  }
  var dx=mCentre.x-oCentre.x, dz=mCentre.z-oCentre.z;
  var sign=(dx*bestAxis.x+dz*bestAxis.z)>=0?1:-1;
  return {x:bestAxis.x*sign*bestDepth, z:bestAxis.z*sign*bestDepth};
}
function hubPushOut(hub,oCentre,oHx,oHz,oHeading,pad){
  var c=Math.cos(oHeading), s=Math.sin(oHeading);
  var dx=hub.x-oCentre.x, dz=hub.z-oCentre.z;
  var lx=dx*c-dz*s, lz=dx*s+dz*c;
  var hx=oHx+pad, hz=oHz+pad;
  if(Math.abs(lx)>=hx||Math.abs(lz)>=hz) return null;
  var penX=hx-Math.abs(lx), penZ=hz-Math.abs(lz);
  if(penX<penZ){
    var signX=lx>=0?1:-1;
    return {x:c*signX*penX, z:(-s)*signX*penX};
  } else {
    var signZ=lz>=0?1:-1;
    return {x:s*signZ*penZ, z:c*signZ*penZ};
  }
}
function fabricPointHits(wx,wz,topY){
  // True if a world point at height up to topY would hit the
  // fully deployed fabric. Only when M.wings is 1, i.e. the
  // umbrella is fully out (largest). Shape: annulus around the
  // hub, inner 1.4 m, outer 5.486 m, 60 deg machine-side gap
  // (240-300 deg, machine-local) excluded. Height-aware: fabric
  // height is umbFabricY at that radius/angle, so a tank top at
  // 1.3 m or a fence at 0.9 m, both below the fabric, do not hit
  // it, while a trunk (0-2.7 m) or a tractor cab (top ~2.0 m)
  // can, depending on radius.
  if(M.wings<0.999) return false;
  var hub=machineXZ(0,5.0);
  var dx=wx-hub.x, dz=wz-hub.z;
  var c=Math.cos(M.heading), s=Math.sin(M.heading);
  var lx=dx*c-dz*s, lz=dx*s+dz*c;
  var du=Math.hypot(lx,lz);
  if(du<UMB_INNER||du>UMB_OUTER) return false;
  var aDeg=((Math.atan2(lz,lx)*180/Math.PI)+360)%360;
  if(aDeg>=240&&aDeg<=300) return false;
  var fy=umbFabricY(du,Math.atan2(lz,lx));
  if(fy>topY) return false;
  return true;
}
function collide(pos){
  // Hard collision, 2026-10-27. Replaces the old centre-only push
  // (trees 1.3 m, tanks 1.8 / 1.6 m), which let the long chassis,
  // the boom, and the flank tank pass straight through things.
  // Solid machine parts, in XZ:
  //   chassis: centre (0,0), half (1.2, 3.8)
  //   mounted tank: centre (1.55,-0.6), half (0.75, 0.75)
  // The boom is NOT a solid OBB, because the clamp must reach a
  // trunk to grip it. Instead the hub is a small point (pad 0.1)
  // that cannot pass through a trunk, a tank, the tractor, or
  // the fence. Hub to trunk face is 0.35 m, still inside the
  // <0.60 m alignment window, so clamping still works, but the
  // boom cannot drive straight through a tree.
  // The umbrella fabric is solid ONLY when fully deployed,
  // 2026-10-27 (see fabric section at the end of collide()).
  // Stowed or unfolding, it is not solid at all.
  // Tanks get a mount exemption: if the left mount is within
  // 1.2 m of a tank centre, that tank does not push the machine
  // away — that is the pickup alignment, and the tank is under
  // the flank, not under the chassis centre.
  var headOn=false;
  for(var iter=0; iter<3; iter++){
    var mOBBs=[];
    mOBBs.push({cx:pos.x, cz:pos.z, hx:1.2, hz:3.8, heading:M.heading});
    if(tankState==='mounted'){
      var tc=machineXZ(1.55,-0.6);
      mOBBs.push({cx:tc.x, cz:tc.z, hx:0.75, hz:0.75, heading:M.heading});
    }
    function testMachineVsObstacle(oCentre,oHx,oHz,oHeading){
      for(var mi=0; mi<mOBBs.length; mi++){
        var m=mOBBs[mi];
        var mCorners=obbCorners(m.cx,m.cz,m.hx,m.hz,m.heading);
        var oCorners=obbCorners(oCentre.x,oCentre.z,oHx,oHz,oHeading);
        var axes=obbAxes(m.heading).concat(obbAxes(oHeading));
        var push=obbPush(mCorners,{x:m.cx,z:m.cz},oCorners,oCentre,axes);
        if(push){
          pos.x+=push.x; pos.z+=push.z;
          var fx=Math.sin(M.heading), fz=Math.cos(M.heading);
          if(push.x*fx+push.z*fz<0) headOn=true;
          return true;
        }
      }
      return false;
    }
    var mount=machineXZ(1.55,-0.6);
    function tankIsMountAligned(tk){
      return Math.hypot(mount.x-tk.position.x,mount.z-tk.position.z)<1.2;
    }
    var pushed=false;
    for(var ti=0; ti<trees.length; ti++){
      if(testMachineVsObstacle({x:trees[ti].x,z:trees[ti].z},0.4,0.4,0)){ pushed=true; break; }
    }
    if(pushed) continue;
    if(testMachineVsObstacle({x:0,z:34},46,0.2,0)) continue;
    if(testMachineVsObstacle({x:0,z:-34},46,0.2,0)) continue;
    var tankPushed=false;
    for(var fi=0; fi<fullTanks.length; fi++){
      var ft=fullTanks[fi];
      if(tankIsMountAligned(ft)) continue;
      if(testMachineVsObstacle({x:ft.position.x,z:ft.position.z},0.75,0.75,ft.rotation.y||0)){ tankPushed=true; break; }
    }
    if(tankPushed) continue;
    if(emptyTank&&tankState!=='picking'&&!tankIsMountAligned(emptyTank)){
      if(testMachineVsObstacle({x:emptyTank.position.x,z:emptyTank.position.z},0.75,0.75,emptyTank.rotation.y||0)) continue;
    }
    if(npc.phase!=='idle'&&npc.obj.group.visible){
      var tfwdX=Math.sin(npc.heading), tfwdZ=Math.cos(npc.heading);
      var tcx=npc.pos.x+tfwdX*(-1.2), tcz=npc.pos.z+tfwdZ*(-1.2);
      if(testMachineVsObstacle({x:tcx,z:tcz},0.85,2.5,npc.heading)) continue;
    }
    var hub=machineXZ(0,5.0);
    if(hub.z>33.9){ pos.z-=hub.z-33.9; continue; }
    if(hub.z<-33.9){ pos.z-=hub.z+33.9; continue; }
    var hubPushed=false;
    for(var hi=0; hi<trees.length; hi++){
      if(M.gripped&&grippedTree===trees[hi]) continue;
      var hp=hubPushOut(hub,{x:trees[hi].x,z:trees[hi].z},0.25,0.25,0,0.1);
      if(hp){ pos.x+=hp.x; pos.z+=hp.z; hubPushed=true; break; }
    }
    if(hubPushed) continue;
    for(var hj=0; hj<fullTanks.length; hj++){
      var ft2=fullTanks[hj];
      if(tankIsMountAligned(ft2)) continue;
      var hp2=hubPushOut(hub,{x:ft2.position.x,z:ft2.position.z},0.75,0.75,ft2.rotation.y||0,0.1);
      if(hp2){ pos.x+=hp2.x; pos.z+=hp2.z; hubPushed=true; break; }
    }
    if(hubPushed) continue;
    if(emptyTank&&tankState!=='picking'&&!tankIsMountAligned(emptyTank)){
      var hp3=hubPushOut(hub,{x:emptyTank.position.x,z:emptyTank.position.z},0.75,0.75,emptyTank.rotation.y||0,0.1);
      if(hp3){ pos.x+=hp3.x; pos.z+=hp3.z; continue; }
    }
    if(npc.phase!=='idle'&&npc.obj.group.visible){
      var tf2x=Math.sin(npc.heading), tf2z=Math.cos(npc.heading);
      var tc2x=npc.pos.x+tf2x*(-1.2), tc2z=npc.pos.z+tf2z*(-1.2);
      var hp4=hubPushOut(hub,{x:tc2x,z:tc2z},0.85,2.5,npc.heading,0.1);
      if(hp4){ pos.x+=hp4.x; pos.z+=hp4.z; continue; }
    }
    // --- umbrella fabric, solid ONLY when fully deployed ---
    // Gate: M.wings must be 1, not just wingsOpen (which flips
    // true the moment you press E, before the 4 s unfold).
    // Skipped while gripped, so a clamped machine is never
    // shoved off its tree by its own fabric. The clamped tree
    // itself is in the inner hole (du ~0), so it would not hit
    // anyway; neighbouring trunks are 8 m+ away, outside the
    // 5.486 m outer radius, so a correctly deployed umbrella
    // around a tree hits nothing at deployment.
    // Push rule for a trunk inside the ring: exit via the
    // nearest edge — inward to the inner hole if it is closer,
    // outward past the outer rim if that is closer. That is
    // why driving away with the tarps out is blocked: the
    // trunk you just shook moves from the hole into the ring,
    // and the nearest exit is back into the hole, so you must
    // stow before driving on.
    // Tanks and fences are NOT tested here: their tops are
    // below the fabric (tank 1.3 m, fence ~0.9 m, fabric
    // 1.43-2.40 m), so they pass under it. Trunks and the
    // tractor cab are tested, with the fabric height check.
    if(M.wings>=0.999&&!M.gripped){
      var fHub=machineXZ(0,5.0);
      var fc=Math.cos(M.heading), fs=Math.sin(M.heading);
      var fabricPushed=false;
      for(var fti=0; fti<trees.length; fti++){
        var tr=trees[fti];
        var fdx=tr.x-fHub.x, fdz=tr.z-fHub.z;
        var flx=fdx*fc-fdz*fs, flz=fdx*fs+fdz*fc;
        var fdu=Math.hypot(flx,flz);
        if(fdu<UMB_INNER-0.4||fdu>UMB_OUTER+0.4) continue;
        var faDeg=((Math.atan2(flz,flx)*180/Math.PI)+360)%360;
        if(faDeg>=240&&faDeg<=300) continue;
        if(fdu<0.01) continue;
        var innerPen=fdu-(UMB_INNER-0.4), outerPen=(UMB_OUTER+0.4)-fdu;
        var fMag, fDirX, fDirZ;
        if(innerPen<outerPen){
          fMag=innerPen; fDirX=(tr.x-fHub.x)/fdu; fDirZ=(tr.z-fHub.z)/fdu;
        } else {
          fMag=outerPen; fDirX=(fHub.x-tr.x)/fdu; fDirZ=(fHub.z-tr.z)/fdu;
        }
        pos.x+=fDirX*fMag; pos.z+=fDirZ*fMag;
        fabricPushed=true; break;
      }
      if(fabricPushed) continue;
      if(npc.phase!=='idle'&&npc.obj.group.visible){
        var tf3x=Math.sin(npc.heading), tf3z=Math.cos(npc.heading);
        var tc3x=npc.pos.x+tf3x*(-1.2), tc3z=npc.pos.z+tf3z*(-1.2);
        var tCorners=obbCorners(tc3x,tc3z,0.85,2.5,npc.heading);
        for(var ci=0; ci<tCorners.length; ci++){
          if(!fabricPointHits(tCorners[ci].x,tCorners[ci].z,2.0)) continue;
          var cdx=tCorners[ci].x-fHub.x, cdz=tCorners[ci].z-fHub.z;
          var clx=cdx*fc-cdz*fs, clz=cdx*fs+cdz*fc;
          var cdu=Math.hypot(clx,clz);
          if(cdu<0.01) continue;
          var caDeg=((Math.atan2(clz,clx)*180/Math.PI)+360)%360;
          if(caDeg>=240&&caDeg<=300) continue;
          var cInner=cdu-UMB_INNER, cOuter=UMB_OUTER-cdu;
          var cMag, cDirX, cDirZ;
          if(cInner<cOuter){
            cMag=cInner; cDirX=(tCorners[ci].x-fHub.x)/cdu; cDirZ=(tCorners[ci].z-fHub.z)/cdu;
          } else {
            cMag=cOuter; cDirX=(fHub.x-tCorners[ci].x)/cdu; cDirZ=(fHub.z-tCorners[ci].z)/cdu;
          }
          pos.x+=cDirX*cMag; pos.z+=cDirZ*cMag;
          fabricPushed=true; break;
        }
        if(fabricPushed) continue;
      }
    }
    break;
  }
  if(headOn) M.speed=0;
  pos.x=clamp(pos.x,-43,43); pos.z=clamp(pos.z,-30,30);
}

function animate(){
  requestAnimationFrame(animate);
  var dt=Math.min(0.05,clock.getDelta());
  // Ranked timer: runs only once ranked is started, and pauses
  // while the help overlay is open.
  if(IS_RANKED&&rankedRunning&&!rankedFinished&&!$('help').classList.contains('show')) rankedElapsed+=dt;
  // --- drive ---
  var fwdIn=0, steerIn=0;
  if(keys.KeyW||keys.ArrowUp) fwdIn+=1; if(keys.KeyS||keys.ArrowDown) fwdIn-=1;
  if(keys.KeyA||keys.ArrowLeft) steerIn+=1; if(keys.KeyD||keys.ArrowRight) steerIn-=1;
  if(joy.active){ fwdIn+=-joy.y; steerIn+=-joy.x; }
  if(controlDrag&&controlDrag.control==='steer') steerIn=dragSteer;
  fwdIn=clamp(fwdIn,-1,1); steerIn=clamp(steerIn,-1,1);
  var canDrive=!M.gripped&&tankState!=='picking';
  // Near the target tree, cap speed so you do not blow through the
  // alignment window, and tighten the turning radius at low speed:
  // old factor clamp(speed/3) gave a 5.4 m radius at creep speed,
  // new factor clamp(speed/2, 0.3, 1) gives ~3.6 m at creep speed.
  var nearTarget=targetTree?Math.hypot(targetTree.x-M.pos.x,targetTree.z-M.pos.z)<10:false;
  var maxFwd=nearTarget?3.0:5.0, maxRev=nearTarget?2.0:2.6;
  var targetSpeed=canDrive?(fwdIn>=0?fwdIn*maxFwd:fwdIn*maxRev):0;
  M.speed=lerp(M.speed,targetSpeed,1-Math.pow(0.001,dt));
  if(canDrive) M.heading+=steerIn*(M.speed>=0?1:-1)*0.55*dt*clamp(Math.abs(M.speed)/2,0.3,1);
  M.pos.x+=Math.sin(M.heading)*M.speed*dt; M.pos.z+=Math.cos(M.heading)*M.speed*dt;
  collide(M.pos); syncMachineTransform();
  // console controls visual: steering wheel, levers snap to state when not dragged
  if(controlDrag&&controlDrag.control==='steer') wheelSpin.rotation.z=dragWheelAngle;
  else wheelSpin.rotation.z=lerp(wheelSpin.rotation.z,-steerIn*0.6,1-Math.pow(0.001,dt));
  if(!(controlDrag&&controlDrag.control==='tank')){
    var tankTarget=(tankState==='mounted')?0.4:((tankState==='dropped'||tankState==='emptyWaiting')?-0.4:0);
    tankLeverAngle=lerp(tankLeverAngle,tankTarget,1-Math.pow(0.001,dt));
  }
  if(!(controlDrag&&controlDrag.control==='tarps')){
    var tarpsTarget=M.wingsOpen?-0.4:0.4; // flipped: deployed = down, stowed = up
    tarpsLeverAngle=lerp(tarpsLeverAngle,tarpsTarget,1-Math.pow(0.001,dt));
  }
  tankLeverGroup.rotation.x=tankLeverAngle; tarpsLeverGroup.rotation.x=tarpsLeverAngle;
  // round wheels: roll with distance, rear wheel steers (inverted, see wheels block)
  wheels.forEach(function(wh){ wh.spin.rotation.x+=M.speed*dt/wh.radius; });
  if(rearSteerGroup) rearSteerGroup.rotation.y=-steerIn*0.5;
  // --- umbrella / clamp ---
  // Clamp is fixed: no boom travel at all here, only jaw close.
  // Umbrella travel is SLOW and linear: 37.5 deg/sec, 4.0 s full
  // open or close, so individual arms and sectors are watchable.
  // M.wings is the derived open fraction, used by the catch logic.
  if(M.wingsTarget===1) M.umbTravel=Math.min(UMB_MAX_TRAVEL,M.umbTravel+UMB_SPEED*dt);
  else M.umbTravel=Math.max(0,M.umbTravel-UMB_SPEED*dt);
  M.wings=clamp(M.umbTravel/UMB_MAX_TRAVEL,0,1);
  updateUmbrella(M.umbTravel);
  M.gripClose=lerp(M.gripClose,M.gripped?1:0,1-Math.pow(0.001,dt));
  jawL.position.x=lerp(-0.55,-0.28,M.gripClose); jawR.position.x=lerp(0.55,0.28,M.gripClose);
  // --- shake ---
  M.shaking=(keys.Space||M.shaking)&&M.gripped&&grippedTree?M.shaking:((keys.Space&&M.gripped&&grippedTree)?true:false);
  // (hold-to-shake: pointer sets M.shaking, Space is read live below)
  if(keys.Space&&M.gripped&&grippedTree) M.shaking=true;
  if(joyShake>0.3&&M.gripped&&grippedTree) M.shaking=true; // 3D joystick lower-left / straight-down
  if(!keys.Space&&!shakeBtn.matches(':active')){ /* pointer flag handled by events; keep as-is */ }
  if(M.shaking&&M.gripped&&grippedTree){
    M.shakePower=Math.min(1,M.shakePower+dt*1.5);
    var t=grippedTree, tt=clock.elapsedTime;
    t.group.position.x=t.x+Math.sin(tt*28)*0.07*M.shakePower;
    t.group.position.z=t.z+Math.cos(tt*31)*0.07*M.shakePower;
    t.group.rotation.z=Math.sin(tt*26)*0.02*M.shakePower;
    shakeTimer+=dt;
    if(shakeTimer>0.06){ shakeTimer=0; detachCherries(t,Math.floor(3+M.shakePower*5)); }
    if(t.remaining<=0&&!t.harvested){
      t.harvested=true; stats.trees++; t.ring.material.color.set(0x888888);
      setMsg('Tree clean! Release the clamp (G) and drive to the next tree.');
      blip(880);
    }
  } else {
    M.shakePower=Math.max(0,M.shakePower-dt*2);
    if(grippedTree){ grippedTree.group.position.set(grippedTree.x,0,grippedTree.z); grippedTree.group.rotation.z=0; }
    if(!M.gripped&&grippedTree) grippedTree=null;
  }
  // --- tank drop / pick animations ---
  if(tankState==='dropping'){
    M.dropT+=dt; var kd=clamp(M.dropT/1.2,0,1);
    tankGroup.position.set(1.55,lerp(1.15,0.65,kd),-0.6);
    if(kd>=1) detachTankToWorld();
    else { /* tankGroup still child of machine while lowering */ }
  }
  if(tankState==='dropped'){
    var dFromDrop=M.pos.distanceTo(droppedTank.position);
    if(dFromDrop>6) startNPC();
  }
  if(tankState==='picking'){
    M.pickT+=dt; var kp=clamp(M.pickT/1.1,0,1);
    if(pickingTank){
      // move the picked tank from world toward the mounted slot, then reparent
      var slot=worldOfLocal(1.55,1.15,-0.6);
      pickingTank.position.lerp(slot,kp*0.25+0.05);
      if(kp>=1){
        var fi=fullTanks.indexOf(pickingTank); if(fi>=0) fullTanks.splice(fi,1);
        if(emptyTank===pickingTank) emptyTank=null;
        if(droppedTank===pickingTank) droppedTank=null;
        // If the tractor was still coming for this dropped tank,
        // cancel it — the swap is no longer needed. If it already
        // dropped an empty tank and is leaving, leave it alone.
        if(npc.phase==='approach'||npc.phase==='dropping'){
          npc.phase='idle'; npc.obj.group.visible=false; npc.carried=null;
        }
        machine.add(pickingTank); pickingTank.position.set(1.55,1.15,-0.6); pickingTank.rotation.set(0,0,0);
        tankGroup=pickingTank; pickingTank=null;
        tankFillMesh=tankGroup.userData.fill; tankWater=tankGroup.userData.water;
        M.tankFill=tankGroup.userData.savedFill||0;
        if(M.tankFill===0) stats.tanks++;
        tankState='mounted'; syncTankVisual();
        setMsg('Tank on board. Back to shaking!');
        blip(760);
      }
    }
  }

  npcUpdate(dt);
  updateCherries(dt);
  checkRankedFinish();
  // --- target / alignment HUD ---
  targetTree=nearestUnharvested();
  trees.forEach(function(t){
    var isT=(t===targetTree);
    t.ring.visible=!t.harvested;
    if(isT) t.ring.material.color.set(0xffd23f); else if(!t.harvested) t.ring.material.color.set(0xffffff);
    t.ring.material.opacity=isT?0.95:0.35;
  });
  var a=targetTree?alignment(targetTree):{dist:0,lat:0,face:0,hub:9,ok:false};
  if(!targetTree){ $('align').textContent='Orchard complete — every tree shaken!'; setStep('Done. Press R? No — just enjoy the full tanks.'); }
  else if(M.gripped&&grippedTree){ $('align').textContent='CLAMPED: tree '+grippedTree.id+' — hold SHAKE to strip it. Tarps '+(M.wingsOpen?'CLOSED around tree':'OPEN — most cherries will hit the ground, centre ones still go via the static tarp'); setStep('Step 4: Shake (hold Space / SHAKE button)'); }
  else if(M.gripped){ $('align').textContent='CLAMPED on air — no tree in the clamp, so shake will not strip anything. Release the clamp (G) to drive on, then clamp on a tree.'; setStep('Release clamp (G), then drive to a tree'); }
  else if(a.ok){ $('align').textContent='✓ IN POSITION — hub '+a.hub.toFixed(2)+' m off trunk (under 0.60 m). Close tarps (E), then clamp (G), then hold SHAKE.'; $('align').style.color='#b6ff9e'; setStep('Step 2: Close tarps (E)  •  Step 3: Clamp (G)  •  Step 4: Hold SHAKE'); }
  else {
    $('align').style.color='#fff';
    $('align').textContent='Target tree '+targetTree.id+' — hub '+a.hub.toFixed(2)+' m off trunk (need under 0.60 m), dist '+a.dist.toFixed(1)+' m, offset '+a.lat.toFixed(1)+' m, facing '+(a.face*100).toFixed(0)+'% — drive so the hub centres on the trunk.';
    setStep(M.wingsOpen?'Step 1: Line up (green ring = go)':'Step 1: Line up  •  Step 2: Close tarps (E)');
  }
  if(M.tankFill>=M.tankCap){
    if(tankState==='mounted') setStep('TANK FULL — stop, Drop Tank (T), drive forward for the tractor swap.');
    $('tanktxt').textContent='TANK FULL — '+Math.floor(M.tankFill)+' / '+M.tankCap;
  }
  if(msgTimer>0){ msgTimer-=dt; if(msgTimer<=0) $('msg').textContent=''; }
  updateHUD();
  // --- camera ---
  var fwd=new THREE.Vector3(Math.sin(M.heading),0,Math.cos(M.heading));
  if(viewMode==='third'){
    // orbit: behind the machine at orbit yaw 0, camera angle =
    // heading+PI+camOrbitYaw, so drag right (orbit yaw up) moves
    // the camera to the machine's right side; height = base 5.5
    // plus the dragged elevation offset.
    var camAng=M.heading+Math.PI+camOrbitYaw;
    var cp=new THREE.Vector3(M.pos.x+Math.sin(camAng)*11.5,5.5+camOrbitElev,M.pos.z+Math.cos(camAng)*11.5);
    camera.position.lerp(cp,1-Math.pow(0.001,dt));
    camera.lookAt(M.pos.x+fwd.x*4,2.2,M.pos.z+fwd.z*4);
  } else {
    // elevated operator eye, pitched DOWN into the umbrella: tree
    // centre, fabric wide around it, belts at the bottom of the
    // umbrella, controls as a thin strip at the very bottom.
    // Drag look: rotate the eye->look direction in machine-local
    // space — yaw by -camLookYaw around Y (drag right looks
    // right, i.e. toward local -X, the non-tank side), then pitch
    // by -camLookPitch around X (drag up looks up). At zero drag
    // this is exactly the old (0,0.9,6.5) look point.
    var fp=worldOfLocal(0,3.35,-0.7);
    camera.position.copy(fp);
    var dy0=0.9-3.35, dz0=6.5-(-0.7);
    var yawA=-camLookYaw, cy=Math.cos(yawA), sy=Math.sin(yawA);
    var dx1=dz0*sy, dz1=dz0*cy, dy1=dy0;
    var pitA=-camLookPitch, cp2=Math.cos(pitA), sp2=Math.sin(pitA);
    var dy2=dy1*cp2-dz1*sp2, dz2=dy1*sp2+dz1*cp2;
    var look=worldOfLocal(dx1,3.35+dy2,-0.7+dz2);
    camera.lookAt(look);
  }
  renderer.render(scene,camera);
}
addEventListener('resize',function(){ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
setMsg('Drive to the gold-ringed tree. First: line up facing its trunk.');
animate();
})();
