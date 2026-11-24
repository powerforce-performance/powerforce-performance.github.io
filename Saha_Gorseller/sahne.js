/* Saha çalışması sahne çizici (kuşbakışı) – SAHA DİZAYN · Dr. İsmail Çiçek · Instagram: @powerforce_athletic
   Sahne verisi: {W,H,p(pitch),z(zones),st(static),n(notes),pl(players),ev(events),b0(ball holder),T,nm,code} */
(function (G) {
  const TEAM = { R: ['#d7263d', '#8c1424', '#fff'], B: ['#1b65c9', '#0e3c82', '#fff'], Y: ['#f5c800', '#aa8700', '#1e1e1e'], W: ['#f5f5f5', '#969696', '#1e1e1e'],
    G: ['#ff8214', '#b45505', '#1e1e1e'], K: ['#28282e', '#0a0a0c', '#fff'], P: ['#8c46be', '#5a2882', '#fff'], N: ['#3cc878', '#1e8246', '#1e1e1e'] };
  const CONE = { o: '#ff7814', y: '#fad71e', b: '#2878e6', r: '#dc2832', w: '#f5f5f5' };
  const AC = { pass: '#ffe128', shot: '#ff463c', move: '#ffffff', dribble: '#ffffff', sprint: '#ff9628' };
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const rgb = c => Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : c;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a / 255})`;

  function prep(sc) {
    if (sc._p) return sc;
    const P = {}; sc.pl.forEach(p => P[p[0]] = { team: p[1], pos: [p[2], p[3]], lab: p[4] || null });
    const mv = {}; Object.keys(P).forEach(k => mv[k] = []);
    const ev = sc.ev.map(e => ({ k: e[0], t0: e[1], t1: e[2], a: e[3], b: e[4], o: e[5] || {} })).sort((x, y) => x.t0 - y.t0 || x.t1 - y.t1);
    ev.forEach(e => { if (e.k === 'move' || e.k === 'dribble') mv[e.a] && mv[e.a].push(e) });
    Object.keys(mv).forEach(k => { let cur = P[k].pos; mv[k].forEach(e => { e.frm = cur; cur = e.b }) });
    sc._P = P; sc._mv = mv; sc._ev = ev; sc._p = 1;
    const pp = (pid, t) => ppos(sc, pid, t);
    sc._bev = ev.filter(e => e.k === 'pass' || e.k === 'shot' || e.k === 'dribble');
    sc._bev.forEach(e => { if (e.k !== 'dribble') { e.pa = typeof e.a === 'string' ? pp(e.a, e.t0) : e.a; e.pb = typeof e.b === 'string' ? pp(e.b, e.t1) : e.b } });
    return sc;
  }
  function ppos(sc, pid, t) {
    let cur = sc._P[pid].pos;
    for (const e of sc._mv[pid]) {
      if (t >= e.t1) cur = e.b;
      else if (t >= e.t0) {
        const u = ease((t - e.t0) / Math.max(1e-6, e.t1 - e.t0));
        if (e.o.via) { const a = e.frm, c = e.o.via, b = e.b; return [(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]] }
        return lerp(e.frm, e.b, u);
      } else break;
    }
    return cur;
  }
  function bpos(sc, t) {
    let last = null;
    for (const e of sc._bev) { if (t >= e.t0) last = e; else break }
    if (!last) { const h = sc.b0; if (h == null) return null; const p = typeof h === 'string' ? ppos(sc, h, t) : h; return [p[0] + 0.5, p[1] - 0.25, 0] }
    if (last.k === 'dribble') { const p = ppos(sc, last.a, t); return [p[0] + 0.5 + 0.25 * Math.sin(t * 9), p[1] - 0.25, 0] }
    if (t < last.t1) { const u = (t - last.t0) / Math.max(1e-6, last.t1 - last.t0); const q = lerp(last.pa, last.pb, u); const d = Math.hypot(last.pb[0] - last.pa[0], last.pb[1] - last.pa[1]); return [q[0], q[1], last.o.loft ? 4 * u * (1 - u) * 0.18 * d : 0] }
    if (last.k === 'shot') return [last.pb[0], last.pb[1], 0];
    const p = typeof last.b === 'string' ? ppos(sc, last.b, t) : last.b; return [p[0] + 0.5, p[1] - 0.25, 0];
  }

  function draw(ctx, sc, t, o) {
    prep(sc); o = o || {};
    const cw = ctx.canvas.width, ch = ctx.canvas.height, hd = o.header === false ? 0 : Math.round(ch * 0.075);
    const W = sc.W, H = sc.H, m = Math.max(2, 0.06 * Math.max(W, H));
    const s = Math.min(cw / (W + 2 * m), (ch - hd) / (H + 2 * m));
    const ox = (cw - W * s) / 2, oy = hd + (ch - hd - H * s) / 2;
    const X = x => ox + x * s, Y = y => oy + (H - y) * s;
    const u = Math.max(cw * 0.013, Math.min(s * 0.95, cw * 0.028)) * (o.fig || 1);  // figür ölçeği (px)
    // çim
    ctx.fillStyle = '#368034'; ctx.fillRect(0, 0, cw, ch);
    const sw = Math.max(5, W / 10) * s; ctx.fillStyle = '#3c8a3a';
    for (let x = ox - sw * 20, i = 0; x < cw; x += sw, i++) if (i % 2) ctx.fillRect(x, 0, sw, ch);
    // bölgeler
    (sc.z || []).forEach(z => { const [x0, y0, x1, y1, col, a, dash] = z; ctx.fillStyle = rgba(col, a); ctx.fillRect(X(Math.min(x0, x1)), Y(Math.max(y0, y1)), Math.abs(x1 - x0) * s, Math.abs(y1 - y0) * s);
      if (dash) { ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = rgb(col); ctx.lineWidth = 1.2; ctx.strokeRect(X(Math.min(x0, x1)), Y(Math.max(y0, y1)), Math.abs(x1 - x0) * s, Math.abs(y1 - y0) * s); ctx.restore() } });
    // saha çizgileri
    if (sc.p !== 'open') {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, s * 0.12); ctx.strokeRect(X(0), Y(H), W * s, H * s); ctx.lineWidth = Math.max(1, s * 0.09);
      const cy = H / 2;
      const pen = (x0, sg) => { [[16.5, 20.16], [5.5, 9.16]].forEach(([dx, hw]) => { ctx.beginPath(); ctx.moveTo(X(x0), Y(cy - hw)); ctx.lineTo(X(x0 + sg * dx), Y(cy - hw)); ctx.lineTo(X(x0 + sg * dx), Y(cy + hw)); ctx.lineTo(X(x0), Y(cy + hw)); ctx.stroke() });
        const a0 = Math.acos(5.5 / 9.15); ctx.beginPath(); if (sg > 0) ctx.arc(X(x0 + 11), Y(cy), 9.15 * s, -a0, a0); else ctx.arc(X(x0 - 11), Y(cy), 9.15 * s, Math.PI - a0, Math.PI + a0); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(x0 + sg * 11), Y(cy), Math.max(1.2, s * 0.15), 0, 7); ctx.fill() };
      if (sc.p === 'full') { pen(0, 1); pen(W, -1); ctx.beginPath(); ctx.moveTo(X(W / 2), Y(0)); ctx.lineTo(X(W / 2), Y(H)); ctx.stroke(); ctx.beginPath(); ctx.arc(X(W / 2), Y(cy), 9.15 * s, 0, 7); ctx.stroke() }
      else if (sc.p === 'half') { pen(W, -1); ctx.beginPath(); ctx.arc(X(0), Y(cy), 9.15 * s, -Math.PI / 2, Math.PI / 2); ctx.stroke() }
      else if (sc.p === 'halfL') { pen(0, 1); ctx.beginPath(); ctx.arc(X(W), Y(cy), 9.15 * s, Math.PI / 2, 3 * Math.PI / 2); ctx.stroke() }
      else if (sc.p === 'third') pen(W, -1);
    }
    // statik
    const items = [];
    (sc.st || []).forEach(a => {
      const k = a[0];
      if (k === 'line') { const [, x0, y0, x1, y1, col, dash] = a; ctx.save(); if (dash) ctx.setLineDash([6, 5]); ctx.strokeStyle = rgb(col); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke(); ctx.restore() }
      else if (k === 'ladder') { const [, x, y, L, hz] = a; ctx.strokeStyle = '#fad71e'; ctx.lineWidth = 1.4; const n = Math.round(L / 0.5);
        for (let i = 0; i <= n; i++) { ctx.beginPath(); if (hz) { ctx.moveTo(X(x + i * .5), Y(y - .25)); ctx.lineTo(X(x + i * .5), Y(y + .25)) } else { ctx.moveTo(X(x - .25), Y(y + i * .5)); ctx.lineTo(X(x + .25), Y(y + i * .5)) } ctx.stroke() } }
      else if (k === 'goal') { const [, x, y, face, gw] = a; const big = gw > 3, dp = big ? 2 : 1, k2 = big ? 1 : Math.max(1, u / s * 1.1), hw = gw * k2 / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(Math.min(X(x), X(x - face * dp)), Y(y + hw), dp * s, 2 * hw * s);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = big ? 3 : 2.2; ctx.beginPath(); ctx.moveTo(X(x), Y(y - hw)); ctx.lineTo(X(x - face * dp), Y(y - hw)); ctx.lineTo(X(x - face * dp), Y(y + hw)); ctx.lineTo(X(x), Y(y + hw)); ctx.stroke();
        ctx.lineWidth = big ? 4 : 3; ctx.beginPath(); ctx.moveTo(X(x), Y(y - hw)); ctx.lineTo(X(x), Y(y + hw)); ctx.stroke() }
      else items.push([a[2], 0, a]);
    });
    // oklar
    if (o.arrows) {
      let n = 0; const placed = [];
      sc._ev.forEach(e => {
        if (e.o.show === false) return;
        if (e.k === 'pass' || e.k === 'shot') { n++; arrow(ctx, X, Y, s, e.pa, e.pb, e.k, n, null, false, placed) }
        else if (e.frm && (e.frm[0] !== e.b[0] || e.frm[1] !== e.b[1])) arrow(ctx, X, Y, s, e.frm, e.b, e.k, null, e.o.via, e.o.sprint, placed);
      });
    }
    Object.keys(sc._P).forEach(pid => { const p = ppos(sc, pid, t); items.push([p[1], 1, pid, p]) });
    const b = bpos(sc, t); if (b) items.push([b[1] - 0.01, 2, b]);
    items.sort((a, c) => c[0] - a[0] || a[1] - c[1]);
    items.forEach(it => {
      if (it[1] === 0) { const a = it[2], k = a[0], gx = X(a[1]), gy = Y(a[2]);
        if (k === 'cone') { ctx.fillStyle = CONE[a[3]] || CONE.o; ctx.beginPath(); ctx.moveTo(gx - u * .38, gy + u * .15); ctx.lineTo(gx + u * .38, gy + u * .15); ctx.lineTo(gx, gy - u * .45); ctx.closePath(); ctx.fill() }
        else if (k === 'pole') { ctx.fillStyle = CONE[a[3]] || CONE.y; ctx.beginPath(); ctx.arc(gx, gy, u * .2, 0, 7); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke() }
        else if (k === 'mann') { ctx.fillStyle = '#1e3c96'; ctx.fillRect(gx - u * .45, gy - u * .18, u * .9, u * .36) }
        else if (k === 'hurdle') { ctx.strokeStyle = '#fad71e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(gx, gy - u * .45); ctx.lineTo(gx, gy + u * .45); ctx.stroke() } }
      else if (it[1] === 1) { const P = sc._P[it[2]], c = TEAM[P.team] || TEAM.R, gx = X(it[3][0]), gy = Y(it[3][1]);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(gx + u * .12, gy + u * .18, u * .55, u * .3, 0, 0, 7); ctx.fill();
        ctx.fillStyle = c[0]; ctx.strokeStyle = c[1]; ctx.lineWidth = Math.max(1.2, u * .13); ctx.beginPath(); ctx.arc(gx, gy, u * .52, 0, 7); ctx.fill(); ctx.stroke();
        if (P.lab) { ctx.fillStyle = c[2]; ctx.font = `bold ${Math.round(u * .62)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(P.lab, gx, gy + 0.5) } }
      else { const [x, y, z] = it[2], gx = X(x), gy = Y(y) - z * s * 0.6, r = Math.max(2.5, u * .26);
        if (z > 0.1) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(X(x), Y(y), r * .8, 0, 7); ctx.fill() }
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#141414'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(gx, gy, r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(gx, gy, r * .38, 0, 7); ctx.fill() }
    });
    // notlar
    ctx.font = `bold ${Math.max(9, Math.round(ch * 0.026))}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    (sc.n || []).forEach(([x, y, tx]) => { if (tx.length > 24) return; const w = ctx.measureText(tx).width + 8; ctx.fillStyle = 'rgba(22,30,44,0.9)'; ctx.fillRect(X(x) - w / 2, Y(y) - 8, w, 16); ctx.fillStyle = '#ffeb96'; ctx.fillText(tx, X(x), Y(y)) });
    // ölçüler
    ctx.font = `bold ${Math.max(9, Math.round(ch * 0.024))}px sans-serif`;
    const dim = (tx, x, y) => { const w = ctx.measureText(tx).width + 8; ctx.fillStyle = 'rgba(22,30,44,0.92)'; ctx.fillRect(x - w / 2, y - 8, w, 16); ctx.fillStyle = '#fff'; ctx.fillText(tx, x, y) };
    if (!sc.hd) { dim(`${+W.toFixed(1)} m`, X(W / 2), Math.min(ch - 9, Y(0) + m * s * 0.5)); dim(`${+H.toFixed(1)} m`, Math.max(24, X(0) - m * s * 0.5), Y(H * 0.15)) }
    if (hd) { ctx.fillStyle = '#16202c'; ctx.fillRect(0, 0, cw, hd); ctx.fillStyle = '#f3a712'; const fs = Math.round(hd * 0.5); ctx.font = `bold ${fs}px sans-serif`; ctx.textAlign = 'left';
      const cwid = ctx.measureText(sc.code).width + 12; ctx.fillRect(6, hd * .15, cwid, hd * .7); ctx.fillStyle = '#16202c'; ctx.fillText(sc.code, 12, hd / 2);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(hd * 0.42)}px sans-serif`; let nm = sc.nm || ''; while (nm.length > 10 && ctx.measureText(nm).width > cw - cwid - 24) nm = nm.slice(0, -2); ctx.fillText(nm === (sc.nm || '') ? nm : nm + '…', cwid + 14, hd / 2) }
  }

  function arrow(ctx, X, Y, s, a, b, kind, n, via, sprint, placed) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.6) return;
    const N = Math.max(8, Math.round(L * 3)), pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N; pts.push(via ? [(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * via[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * via[1] + u * u * b[1]] : lerp(a, b, u)) }
    const cut = Math.min(0.12, 0.9 / L); let P = pts.slice(Math.floor(N * cut), Math.max(Math.floor(N * cut) + 2, Math.floor(N * (1 - cut * 1.3))));
    if (kind === 'dribble') P = P.map((p, i) => { const q = P[Math.min(i + 1, P.length - 1)], q0 = P[Math.max(i - 1, 0)], dx = q[0] - q0[0], dy = q[1] - q0[1], nn = Math.hypot(dx, dy) || 1, off = 0.35 * Math.sin(i * 1.5) * (i > P.length - 4 ? 0 : 1); return [p[0] - dy / nn * off, p[1] + dx / nn * off] });
    const sp = P.map(p => [X(p[0]), Y(p[1])]), col = sprint ? AC.sprint : AC[kind];
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = kind === 'pass' || kind === 'shot' ? 2.2 : 1.8; if (kind === 'pass') ctx.setLineDash([6, 5]);
    ctx.beginPath(); sp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.setLineDash([]);
    const [x1, y1] = sp[sp.length - 1], [x0, y0] = sp[Math.max(0, sp.length - 3)], ang = Math.atan2(y1 - y0, x1 - x0), hl = 8;
    ctx.beginPath(); ctx.moveTo(x1 + hl * .6 * Math.cos(ang), y1 + hl * .6 * Math.sin(ang)); ctx.lineTo(x1 - hl * Math.cos(ang - .45), y1 - hl * Math.sin(ang - .45)); ctx.lineTo(x1 - hl * Math.cos(ang + .45), y1 - hl * Math.sin(ang + .45)); ctx.fill();
    if (n != null) { let [mx, my] = sp[Math.floor(sp.length / 2)];
      for (const fr of [0.5, 0.35, 0.65, 0.25, 0.75]) { const q = sp[Math.min(sp.length - 1, Math.floor(sp.length * fr))]; if (placed.every(z => Math.hypot(q[0] - z[0], q[1] - z[1]) > 15)) { [mx, my] = q; break } }
      placed.push([mx, my]); ctx.fillStyle = '#141820'; ctx.beginPath(); ctx.arc(mx, my, 7, 0, 7); ctx.fill(); ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n, mx, my + .5) }
    ctx.restore();
  }

  function thumb(sc, w, h) { const c = document.createElement('canvas'); c.width = w || 360; c.height = h || 225; draw(c.getContext('2d'), sc, 0, { arrows: true, header: false }); return c }

  function player(el, sc) {
    const c = document.createElement('canvas'), ctx = c.getContext('2d'); el.innerHTML = ''; el.appendChild(c);
    const bar = document.createElement('div'); bar.className = 'sahne-bar'; bar.innerHTML = '<button data-k="p">❚❚</button><input type="range" min="0" max="1000" value="0"><button data-k="a">Oklar</button>'; el.appendChild(bar);
    const rng = bar.querySelector('input'); let t = 0, play = true, arrows = false, last = null;
    const fit = () => { const w = el.clientWidth || 720, dpr = window.devicePixelRatio || 1; c.style.width = w + 'px'; c.style.height = Math.round(w * 0.625) + 'px'; c.width = Math.round(w * dpr); c.height = Math.round(w * 0.625 * dpr) };
    fit(); window.addEventListener('resize', fit);
    bar.onclick = e => { const k = e.target.dataset.k; if (k === 'p') { play = !play; e.target.textContent = play ? '❚❚' : '▶' } if (k === 'a') { arrows = !arrows; e.target.classList.toggle('on', arrows) } };
    rng.oninput = () => { t = rng.value / 1000 * sc.T; play = false; bar.querySelector('[data-k=p]').textContent = '▶' };
    const loop = ts => { if (last != null && play) { t += (ts - last) / 1000; if (t > sc.T + 0.8) t = 0 } last = ts; draw(ctx, sc, Math.min(t, sc.T), { arrows: arrows || t === 0 }); rng.value = Math.round(Math.min(1, t / sc.T) * 1000); requestAnimationFrame(loop) };
    requestAnimationFrame(loop);
  }
  G.SAHNE = { draw, thumb, player, prep };
})(window);
