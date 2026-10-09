/* Atlas Weather Station — "Share my planet" (2026-10-09).
   Draws today's weather as a No Man's Sky planet scan card (1080x1350, the size Reddit,
   Instagram, X and Discord all show well) and hands it to the phone's share sheet.
   Where a browser can't share files it downloads the PNG instead. Reads what's on screen,
   so it always matches the app. */
(function () {
  function $(id) { return document.getElementById(id); }
  function txt(id) { var e = $(id); return e ? e.textContent.trim() : ''; }
  function toast(m) { var t = $('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function loadImg(src) { return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
  function wrap(ctx, s, x, y, maxW, lh, maxLines) {
    var words = s.split(/\s+/), line = '', n = 0;
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && line) {
        if (++n === maxLines) { ctx.fillText(line.replace(/[,.;:]?$/, '…'), x, y); return y + lh; }
        ctx.fillText(line, x, y); y += lh; line = words[i];
      } else line = t;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }

  async function draw() {
    var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    try { await Promise.all(['900 120px Orbitron', '700 40px Orbitron', '28px "Share Tech Mono"', '600 34px Rajdhani'].map(function (f) { return document.fonts.load(f); })); } catch (e) {}
    var orb = $('orb'), m = orb && orb.style.backgroundImage.match(/url\(["']?([^"')]+)/);
    var img = m ? await loadImg(m[1]) : null, logo = await loadImg('/icon-mark.png');

    // background: space + soft cyan glow
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05090f'); g.addColorStop(1, '#0a1220'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var rg = x.createRadialGradient(W / 2, 560, 60, W / 2, 560, 620); rg.addColorStop(0, 'rgba(0,229,255,.16)'); rg.addColorStop(1, 'rgba(0,229,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    for (var i = 0; i < 140; i++) { x.fillStyle = 'rgba(207,224,240,' + (Math.random() * .6 + .1).toFixed(2) + ')'; x.fillRect(Math.random() * W, Math.random() * H, Math.random() < .1 ? 3 : 2, Math.random() < .1 ? 3 : 2); }

    // header
    x.textAlign = 'left'; x.fillStyle = '#00e5ff'; x.font = '700 30px Orbitron'; x.fillText('ATLAS WEATHER STATION', 140, 104);
    if (logo) x.drawImage(logo, 64, 58, 60, 60);
    x.fillStyle = 'rgba(207,224,240,.7)'; x.font = '26px "Share Tech Mono"'; var tid = ''; try { var tm = document.cookie.match(/(?:^|; )nmsTraveller=([^;]*)/); tid = tm ? (JSON.parse(decodeURIComponent(tm[1])).n || '') : ''; } catch (e) {}
    x.fillText((tid ? 'TRAVELLER ' + tid.toUpperCase().slice(0, 24) + ' · ' : 'PLANETARY SCAN · ') + new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(), 140, 140);

    // the planet: biome image clipped to a circle, with day ring
    var cx = W / 2, cy = 560, r = 300;
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
    if (img) { var sc = (2 * r) / img.height, w = img.width * sc; x.drawImage(img, cx - w / 2, cy - r, w, 2 * r); } else { x.fillStyle = '#123'; x.fill(); }
    var sh = x.createRadialGradient(cx - 90, cy - 110, 40, cx, cy, r); sh.addColorStop(0, 'rgba(255,255,255,.14)'); sh.addColorStop(.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = sh; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    x.restore();
    x.lineWidth = 6; x.strokeStyle = 'rgba(110,140,220,.6)'; x.beginPath(); x.arc(cx, cy, r + 26, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#f0a500'; x.shadowColor = '#f0a500'; x.shadowBlur = 18; x.beginPath(); x.arc(cx, cy, r + 26, Math.PI * .95, Math.PI * 2.05); x.stroke(); x.shadowBlur = 0;

    // reading
    x.textAlign = 'center';
    x.fillStyle = '#00e5ff'; x.font = '700 34px Orbitron'; x.fillText((txt('locLabel').replace(/^LIVE\s*·\s*/i, '') || 'UNKNOWN WORLD').toUpperCase().slice(0, 40), cx, 960);
    x.fillStyle = '#eaf6ff'; x.font = '900 150px Orbitron'; x.fillText(txt('tempNow') + txt('tempUnit'), cx, 1110);
    x.font = '600 40px Rajdhani'; x.fillText(txt('condLabel') + (txt('hiLo') ? '  ·  ' + txt('hiLo') : ''), cx, 1165);
    var biome = txt('biomeTitle');
    if (biome && biome !== '—') { x.fillStyle = '#f0a500'; x.font = '700 30px Orbitron'; x.fillText('BIOME MATCH · ' + biome.toUpperCase(), cx, 1222); }
    x.fillStyle = 'rgba(207,224,240,.75)'; x.font = '28px "Share Tech Mono"'; wrap(x, '◈ ' + txt('atlasLine'), cx, 1266, W - 160, 34, 1);

    // footer
    x.fillStyle = 'rgba(0,229,255,.5)'; x.fillRect(80, H - 52, W - 160, 2);
    x.fillStyle = '#00e5ff'; x.font = '26px "Share Tech Mono"'; x.fillText('WEATHER.NOMANSSKYHUB.APP · YOUR WEATHER AS AN NMS PLANET', cx, H - 18);
    return new Promise(function (res) { c.toBlob(res, 'image/png'); });
  }

  async function share() {
    var btn = $('sharePlanet'); if (btn) btn.disabled = true;
    try {
      var blob = await draw(); if (!blob) throw new Error('no image');
      var file = new File([blob], 'my-nms-planet.png', { type: 'image/png' });
      var data = { files: [file], title: 'My planet today', text: 'My weather as a No Man\'s Sky planet scan ◈ ' + location.origin + '/' };
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share(data); }
      else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-nms-planet.png'; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
        toast('✓ Planet card saved. Post it anywhere, Traveller');
      }
    } catch (e) { if (e && e.name !== 'AbortError') toast('Could not make the card. Try again'); }
    if (btn) btn.disabled = false;
  }

  function run() {
    var cap = document.querySelector('.hero-r .ringcap'); if (!cap) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'sharePlanet'; b.className = 'btn btn-ghost share-planet';
    b.innerHTML = '◈ SHARE MY PLANET'; b.addEventListener('click', share);
    cap.parentNode.insertBefore(b, cap.nextSibling);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
