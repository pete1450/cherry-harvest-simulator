import pathlib
base = pathlib.Path(__file__).parent
three = (base/"three147.min.js").read_text()
game = (base/"game.js").read_text()
html = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Cherry Shaker Simulator — OMC One-Man Shaker</title>
<style>
*{box-sizing:border-box} html,body{margin:0;height:100%;overflow:hidden;background:#87b5e0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff}
#game{position:fixed;inset:0} canvas{display:block}
.hud{position:fixed;z-index:5;pointer-events:none}
#top{top:10px;left:10px;right:10px;display:flex;justify-content:space-between;gap:8px}
.panel{background:rgba(10,20,10,.72);border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:8px 12px}
#top h1{margin:0;font-size:16px} #top p{margin:2px 0 0;font-size:12px;opacity:.9}
#tankwrap{width:210px;height:14px;background:#222;border-radius:8px;overflow:hidden;margin-top:5px}
#tankbar{height:100%;width:0%;background:linear-gradient(90deg,#ff5a5a,#d21f2e)}
#align{top:86px;left:50%;transform:translateX(-50%);text-align:center;font-size:14px;font-weight:600;text-shadow:0 1px 3px #000;max-width:92vw}
#steps{bottom:118px;left:50%;transform:translateX(-50%);font-size:13px;text-align:center}
#msg{bottom:92px;left:50%;transform:translateX(-50%);font-size:13px;color:#ffe27a;text-align:center;max-width:92vw}
button{pointer-events:auto;cursor:pointer;border:0;border-radius:12px;padding:10px 12px;font-weight:700;font-size:13px;background:#ffd23f;color:#222}
button:active{transform:scale(.96)}
#controls{bottom:12px;left:10px;right:10px;display:flex;justify-content:space-between;align-items:flex-end;gap:8px}
#joy{pointer-events:auto;width:110px;height:110px;border-radius:50%;background:rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.4);position:relative;touch-action:none}
#knob{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px;border-radius:50%;background:#ffd23f;box-shadow:0 2px 8px #000}
#btns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:62vw}
#btns button{background:rgba(20,30,20,.85);color:#fff;border:1px solid rgba(255,255,255,.35)}
#shakebtn{background:#d21f2e!important;color:#fff!important;padding:14px 16px}
#levers{top:130px;right:10px;display:flex;gap:10px}
.lever{text-align:center;font-size:11px}
.lever .stick{width:8px;height:52px;background:#ddd;margin:4px auto 2px;border-radius:4px;transform-origin:bottom center;transition:transform .25s}
.lever .base{width:26px;height:10px;background:#333;border-radius:5px;margin:0 auto}
#help{position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.78);display:none;overflow:auto;padding:18px}
#help.show{display:block}
#help .card{max-width:640px;margin:20px auto;background:#14251a;border-radius:16px;padding:20px;line-height:1.55}
#help h2{margin-top:0} #help li{margin:4px 0} code{background:#0005;padding:1px 5px;border-radius:5px}
@media(max-width:640px){#levers{display:none} #top h1{font-size:14px} #steps{bottom:132px}}
</style></head><body>
<div id="game"></div>
<div class="hud" id="top"><div class="panel"><h1>🍒 Cherry Shaker — OMC One-Man</h1><p id="stat"></p><div id="tankwrap"><div id="tankbar"></div></div><p id="tanktxt"></p></div>
<div class="panel" style="text-align:right"><p>View: <b id="viewtxt">Third-person (V)</b></p><p>Gold ring = next tree</p></div></div>
<div class="hud panel" id="align"></div>
<div class="hud" id="levers">
<div class="lever"><div class="stick" id="levWing"></div><div class="base"></div>Tarps</div>
<div class="lever"><div class="stick" id="levGrip"></div><div class="base"></div>Clamp</div>
<div class="lever"><div class="stick" id="levShake"></div><div class="base"></div>Shake</div>
<div class="lever"><div class="stick" id="levTank"></div><div class="base"></div>Tank</div>
</div>
<div class="hud" id="steps"></div><div class="hud" id="msg"></div>
<div class="hud" id="controls">
<div id="joy"><div id="knob"></div></div>
<div id="btns">
<button id="wingbtn">Tarps (E)</button><button id="gripbtn">Clamp (G)</button>
<button id="shakebtn">HOLD TO SHAKE</button><button id="tankbtn">Drop Tank (T)</button>
<button id="viewbtn">View (V)</button><button id="helpbtn">Help (H)</button>
</div></div>
<div id="help" class="show"><div class="card">
<h2>🍒 Cherry Shaker Simulator — how to run it</h2>
<p><b>The job:</b> drive the long OMC shaker down the orchard — <b>5 rows × 8 trees = 40 mature trees</b> — line up so the front umbrella can surround a mature cherry tree (about twice as tall as the operator's seat), open the radial umbrella around the trunk, clamp the trunk, and shake it. Cherries fall onto the umbrella fabric, roll toward the machine, and cherries falling in the umbrella's machine-side gap land on a <b>static centre tarp</b> — a fixed ridge-roof tarp over the middle of the machine (x -1.4 to +1.4, z 2.2 to 5.0, peak in the middle, sloping down sideways to each conveyor, so centre cherries roll out to the belts, even with the umbrella closed) — then onto a <b>flat horizontal belt on each side of the clamp</b> — starting at the bottom of the sloped side belts and running forward to the same forward position as the clamp (z 5.0) — which carries them back to the sloped side belts, and are drawn up toward the operator. The right belt drops into a cross conveyor under the controls, and both drop into the <b>square tank</b> on the <b>left</b> side of the machine — 1.5 m × 1.5 m, open top, transparent walls, so you can watch the red cherry level rise inside it as it fills to 520.</p>
<ol>
<li><b>Drive</b> — <code>W/S</code> drive, <code>A/D</code> steer, or the on-screen joystick. Gold ring = next tree. Drag the view (not the joystick) to orbit / look around.</li>
<li><b>Line up</b> — drive so the umbrella hub (5 m ahead of the machine centre) centres on the trunk: hub offset under 0.60 m, facing it square. Head-on that is 4.40–5.60 m from the machine centre. The banner shows hub offset live and turns green: “IN POSITION”. Creep in with light joystick pressure; speed is capped near the target tree and low-speed turning is tighter, so you can actually line up.</li>
<li><b>Umbrella</b> — <code>E</code> <i>opens</i> it around the tree. A large circular fabric umbrella, about <b>36 ft in diameter</b>, on radial arms pivoting at the clamp hub, with a central opening for the trunk and a <b>60° opening on the machine side</b> where the machine enters. Stowed, each side's arms start together at <b>that side</b> of the machine — left bundle tip at the left gap edge, right bundle tip at the right gap edge, not both met in the middle. Opening drives them out <b>slowly (4.0 s)</b>: <b>one main arm on each side rotates forward, trailing arms following on that side, and the two main arms meet in the middle in front</b>, the flexible fabric unfolding <b>only</b> between its two bounding arms on each side — it never slides as a solid sheet, and no arm rotates all the way from one side to the other. The fabric is a deep funnel — outer rim 2.75 m at the front, 2.40 m at the sides, 2.05 m at the machine side, dropping to 1.52 / 1.43 / 1.34 m at the inner ring — so cherries roll inward and backward to the middle of the machine, out through the gap to the conveyors. Pressing <code>E</code> again retracts the hydraulics and folds the arms back, sector by sector, into the bundle against the machine.</li>
<li><b>Clamp</b> — <code>G</code>. The clamp is <b>fixed</b> — it does not move forward, it only opens and closes — and the red jaws close on the trunk. Controls are never locked: you can clamp any time, and open/close the tarps any time (even while clamped), and drop the tank any time. If you clamp when no tree is in the clamp, the jaws still close, but <b>shake simply will not strip anything</b> — release the clamp and drive to a tree. You can't drive while clamped, so release to drive on.</li>
<li><b>Shake</b> — hold <code>Space</code> or HOLD TO SHAKE. Watch the red voxels strip off. Shake with the tarps closed and cherries hit the ground and count as lost.</li>
<li><b>First-person console controls</b> — in first-person (<code>V</code>), click/tap and <b>drag the 3D controls themselves</b> on the yellow console box in front of the driver (dragging a control moves that control, dragging anywhere else moves the camera). Levers follow your finger on screen: drag down and the lever top moves down on screen, drag up and it moves up. Left to right: <b>tank lever</b> (drag down = tank down / drop, drag up = tank up / pick up), <b>steering wheel</b> with a silver one-hand ball on the rim (drag around the wheel to turn it — clockwise = steer right, release to centre), <b>2D joystick</b> (black ball on a stem): push to <b>upper right = clamp release</b>, <b>lower right = clamp engage</b>, <b>lower left = shake</b> (hold there to shake), <b>straight down = both lower controls proportionally</b> (engage + shake together, down-right gives more engage, down-left more shake), and <b>tarps lever</b> (drag down = umbrella out around the tree, drag up = umbrella back against the machine). The DOM buttons (<code>E/G/T</code> etc.) still work the same way.</li>
<li><b>Tank full (520)</b> — stop, <code>T</code> to lower the left-side tank to the ground, drive forward 6 m. An NPC tractor comes <i>from behind</i>, drives <i>around</i> the dropped tank on its left side, and drops an empty tank <i>in front of</i> the dropped tank (3.5 m ahead, same line, 1.1 m gap between tanks). <b>Back up</b> to the new tank — get your left mount within about a metre of it — and <code>T</code> to pick it up. The tractor then leaves forward, clear of you.</li>
</ol>
<p><b>Views:</b> <code>V</code> toggles third-person chase / first-person from the elevated operator seat, pitched down into the cone so you see the tree, the tarp, and the belts at the bottom of the cone, with the yellow console and its controls at the bottom edge. <b>Drag the 3D view</b> (click/tap and drag, not on the on-screen joystick or buttons) to move the camera: in third-person it <b>orbits around the shaker</b> — drag right to swing to the machine's right, drag up to raise it — and in first-person it <b>just looks around</b> from the seat, drag right to look right, drag up to look up, <i>unless</i> you start the drag on a console control, in which case that control moves instead (see First-person console controls above). Double-click / double-tap the view to reset the camera straight ahead/behind. Machine notes: front wheels moved back 0.3 m (z 1.9), whole machine tilted 5° forward (nose down, wheels stay on the ground), tarp ribs are now thin poles 70% smaller than the old blocks. <b>Machine:</b> OMC one-man Shock Wave unit, modelled from the side-view photo — later versions can swap to other makes. Trees are small-voxel canopies, so the detail stays high without slowing the game down.</p>
<p><i>Model note:</i> v7 cone backed up in <code>cherry-shaker/backup-v7/</code>, single-fan umbrella backed up in <code>cherry-shaker/backup-umbrella-single-fan/</code>. This version rebuilds the tarps from your full umbrella description — long chassis, <b>tricycle: one centre rear wheel, two front wheels</b>, elevated operator (voxel figure on the seat, steering wheel and levers in front), <b>36 ft circular umbrella</b> on 14 radial arms (7 per side) pivoting at the clamp hub, central trunk opening, 60° machine-side opening, fabric as a deep funnel (outer rim 2.75 m front / 2.40 m side, inner ring 1.34–1.52 m, lowest at the inner machine side on the centreline), struts driving the arms, slow 4.0 s open/close, <b>one thicker main arm per side rotating forward and meeting in front</b>, sectors unfolding one at a time through arm motion only. Twin side conveyors at x ±1.4 m (moved out by their 0.7 m width, centre area 2.10 m wide between belt inner edges), flat horizontal extension belts at x ±1.4 m from the side belts' bottom forward to the clamp tip (z 5.0), cross conveyor under the controls, square open-top tank on the left flank with transparent walls and a rising red cherry fill, clamp fixed and only opens/closes. First-person view is from the elevated seat pitched down into the umbrella, controls as a low strip at the bottom edge.</p>
<button id="startbtn" style="font-size:16px;padding:12px 20px">Start shaking →</button>
</div></div>
<script>__THREE__</script>
<script>__GAME__</script>
</body></html>
"""
html = html.replace("__THREE__", three).replace("__GAME__", game)
out = pathlib.Path.home()/"workspace/your_files/cherry-shaker/index.html"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html)
print(out, len(html))
