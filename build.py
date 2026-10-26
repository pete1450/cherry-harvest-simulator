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
button{pointer-events:auto;cursor:pointer;border:0;border-radius:12px;padding:10px 12px;font-weight:700;font-size:13px;background:#ffd23f;color:#222;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-touch-callout:none;touch-action:none}
button:active{transform:scale(.96)}
#controls{bottom:12px;left:10px;right:10px;display:flex;justify-content:space-between;align-items:flex-end;gap:8px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
#joy{pointer-events:auto;width:110px;height:110px;border-radius:50%;background:rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.4);position:relative;touch-action:none}
#knob{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px;border-radius:50%;background:#ffd23f;box-shadow:0 2px 8px #000}
#btns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:62vw}
#btns button{background:rgba(20,30,20,.85);color:#fff;border:1px solid rgba(255,255,255,.35)}
#shakebtn{background:#d21f2e!important;color:#fff!important;padding:14px 16px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none}
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
<h2>🍒 Cherry Shaker Simulator</h2>
<p><b>The job:</b> Drive to a tree, line the clamp up on the trunk, put the tarps around it, clamp, and shake. Cherries fall onto the tarps and conveyors and into the tank. When the tank is full (520), drop it — the tractor brings an empty one to back up to.</p>
<ul>
<li><b>Drive</b> — <code>W/S</code>, <code>A/D</code>, or the on-screen joystick</li>
<li><b>Line up</b> — get the hub under 0.60 m from the trunk, facing it square (banner turns green)</li>
<li><b>Tarps</b> — <code>E</code>, or the tarps lever in first-person (down = out around the tree, up = back)</li>
<li><b>Clamp</b> — <code>G</code>, or the 2D joystick (lower-right = engage, upper-right = release)</li>
<li><b>Shake</b> — hold <code>Space</code> / HOLD TO SHAKE, or the 2D joystick lower-left (straight down = engage + shake)</li>
<li><b>Tank</b> — <code>T</code>, or the tank lever in first-person (down = drop, up = pick up)</li>
<li><b>View</b> — <code>V</code>; drag the view to orbit / look around, double-click / double-tap to reset</li>
<li><b>Steering wheel</b> — in first-person, drag around the wheel (clockwise = steer right)</li>
</ul>
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
