/* FOLD website — the playable sheet in the hero.
   Four real opening levels of the game, with the same rules as the game's engine:
   a fold moves everything on one side of a crease over to the other side, the sheet may not
   leave the frame, and lights of the same colour that land on each other join.
   No cookies, no storage, no network requests. Nothing is remembered after the page closes. */
(function () {
  'use strict';

  var root = document.querySelector('[data-play]');
  if (!root) { return; }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var COLOUR = { b: 'blue', p: 'pink', y: 'gold', g: 'green', v: 'violet' };

  var LEVELS = [
    { name: 'First Light', rows: ['....', 'b..b', '....'], par: 1,
      tip: 'Drag one side of the paper over the other so the two lights touch.',
      art: 'crane', artName: 'Paper Crane', blurb: 'The first shape every Weaver learns.',
      landmark: 'bridge', landmarkName: 'Ancient Bridge' },
    { name: 'Bending Down', rows: ['.p.', '...', '...', '.p.'], par: 1,
      tip: 'Paper bends this way too. Pull from the top or the bottom.',
      art: 'butterfly', artName: 'Butterfly', blurb: 'Wherever it lands, a little colour returns.',
      landmark: 'tree', landmarkName: 'Sakura Tree' },
    { name: 'Petal Chain', rows: ['......', 'byppyb', '......'], par: 1,
      tip: 'One fold can wake many lights at once. Watch!',
      art: 'lotus', artName: 'Lotus', blurb: 'Opens only where the Weave is calm.',
      landmark: 'lanterns', landmarkName: 'Floating Lanterns' },
    { name: 'Four Corners', rows: ['g..g', '.p..', '..p.', 'g..g'], par: 2,
      tip: 'Lights of the same colour connect even through many layers.',
      art: 'star', artName: 'Fallen Star', blurb: 'A piece of a sky that drifted too far.',
      landmark: 'temple', landmarkName: 'Hidden Temple' }
  ];

  /* ------------------------------------------------------------------ engine */

  function parse(level) {
    var h = level.rows.length, w = level.rows[0].length;
    var stacks = [], active = {};
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var ch = level.rows[y].charAt(x), id = y * w + x;
        if (ch === '_') { stacks.push([]); continue; }
        stacks.push([id]);
        if (COLOUR[ch]) { active[id] = ch; }
      }
    }
    return { w: w, h: h, stacks: stacks, active: active, folds: 0 };
  }

  function copy(s) {
    var active = {};
    Object.keys(s.active).forEach(function (k) { active[k] = s.active[k]; });
    return { w: s.w, h: s.h, stacks: s.stacks.map(function (a) { return a.slice(); }), active: active, folds: s.folds };
  }

  function along(s, move, index) { return move.axis === 'v' ? index % s.w : Math.floor(index / s.w); }

  /* Which positions a fold would move, and whether the fold is allowed. */
  function inspect(s, move) {
    var size = move.axis === 'v' ? s.w : s.h;
    if (move.line < 1 || move.line > size - 1) { return { ok: false, reason: 'frame' }; }
    var moving = [], staying = 0;
    for (var i = 0; i < s.stacks.length; i++) {
      if (!s.stacks[i].length) { continue; }
      var c = along(s, move, i);
      if (move.side === 'low' ? c < move.line : c >= move.line) { moving.push(i); } else { staying++; }
    }
    if (!moving.length || !staying) { return { ok: false, reason: 'empty' }; }
    for (var j = 0; j < moving.length; j++) {
      var m = 2 * move.line - 1 - along(s, move, moving[j]);
      if (m < 0 || m >= size) { return { ok: false, reason: 'frame' }; }
    }
    return { ok: true, moving: moving };
  }

  function mirror(s, move, index) {
    var x = index % s.w, y = Math.floor(index / s.w);
    if (move.axis === 'v') { x = 2 * move.line - 1 - x; } else { y = 2 * move.line - 1 - y; }
    return y * s.w + x;
  }

  function legalMoves(s) {
    var out = [];
    ['v', 'h'].forEach(function (axis) {
      var size = axis === 'v' ? s.w : s.h;
      for (var line = 1; line < size; line++) {
        ['low', 'high'].forEach(function (side) {
          var move = { axis: axis, line: line, side: side };
          if (inspect(s, move).ok) { out.push(move); }
        });
      }
    });
    return out;
  }

  function fold(s, move) {
    var info = inspect(s, move);
    var next = copy(s), landed = [];
    info.moving.forEach(function (i) {
      var j = mirror(s, move, i);
      next.stacks[j] = next.stacks[j].concat(s.stacks[i].slice().reverse());
      next.stacks[i] = [];
      landed.push(j);
    });
    var matches = [];
    landed.forEach(function (j) {
      var groups = {};
      next.stacks[j].forEach(function (id) {
        var c = next.active[id];
        if (c) { (groups[c] = groups[c] || []).push(id); }
      });
      Object.keys(groups).forEach(function (c) {
        if (groups[c].length < 2) { return; }
        groups[c].forEach(function (id) { delete next.active[id]; });
        var d = along(next, move, j);
        matches.push({ index: j, colour: c, distance: move.side === 'low' ? d - move.line : move.line - 1 - d });
      });
    });
    matches.sort(function (a, b) { return a.distance - b.distance || a.index - b.index; });
    next.folds = s.folds + 1;
    return { state: next, matches: matches };
  }

  function isSolved(s) { return Object.keys(s.active).length === 0; }

  function stateKey(s) {
    return s.stacks.map(function (a) { return a.join('.'); }).join('|') + '#' + Object.keys(s.active).sort().join('.');
  }

  /* Shortest solution from a state (breadth-first), or null when there is none. */
  function solve(start) {
    if (isSolved(start)) { return []; }
    var seen = {}, queue = [{ state: start, path: [] }], guard = 0;
    seen[stateKey(start)] = true;
    while (queue.length && guard++ < 40000) {
      var node = queue.shift(), moves = legalMoves(node.state);
      for (var i = 0; i < moves.length; i++) {
        var next = fold(node.state, moves[i]).state, path = node.path.concat([moves[i]]);
        if (isSolved(next)) { return path; }
        var key = stateKey(next);
        if (!seen[key]) { seen[key] = true; queue.push({ state: next, path: path }); }
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------ view */

  var $ = function (name) { return root.querySelector('[data-play-' + name + ']'); };
  var board = $('board'), stage = $('stage'), tipText = $('tip'), statusText = $('status');
  var nameText = $('name'), countText = $('count'), stepsList = $('steps'), descText = $('describe');
  var undoButton = $('undo'), restartButton = $('restart'), hintButton = $('hint'), movesList = $('moves');
  var reveal = $('reveal'), nextButton = $('next');
  var world = document.querySelector('[data-world]');

  var levelIndex = 0, level = LEVELS[0], state = parse(level), history = [];
  var solvedLevels = {}, busy = false, drag = null, preview = null, hinted = null;
  var sheetLayer, fxLayer, creaseLine, shadowBox;

  function el(className, tag) {
    var node = document.createElement(tag || 'div');
    node.className = className;
    return node;
  }

  function pct(n, of) { return (n / of * 100) + '%'; }

  function orb(colour) {
    var node = el('pz-orb', 'span');
    node.setAttribute('data-c', colour);
    node.innerHTML = '<svg viewBox="-20 -20 40 40" aria-hidden="true"><use href="#gl-' + colour + '" x="-20" y="-20" width="40" height="40"/></svg>';
    return node;
  }

  /* One square of paper. `stack` is the list of cell ids lying there, bottom to top. */
  function tile(stack, left, top, width, height) {
    var node = el('pz-tile');
    node.style.left = left; node.style.top = top; node.style.width = width; node.style.height = height;
    node.setAttribute('data-layers', Math.min(stack.length, 4));
    var lights = stack.filter(function (id) { return state.active[id]; });
    if (lights.length) {
      var group = el('pz-orbs');
      group.setAttribute('data-n', Math.min(lights.length, 4));
      lights.slice(0, 4).forEach(function (id) { group.appendChild(orb(state.active[id])); });
      node.appendChild(group);
    }
    return node;
  }

  function render() {
    board.textContent = '';
    board.style.aspectRatio = state.w + ' / ' + state.h;
    board.style.width = state.w >= state.h ? '100%' : pct(state.w, state.h);
    board.style.setProperty('--cols', state.w);
    board.style.setProperty('--rows', state.h);

    board.appendChild(el('pz-frame'));
    shadowBox = el('pz-shadow');
    board.appendChild(shadowBox);
    sheetLayer = el('pz-sheet');
    for (var i = 0; i < state.stacks.length; i++) {
      if (!state.stacks[i].length) { continue; }
      var t = tile(state.stacks[i], pct(i % state.w, state.w), pct(Math.floor(i / state.w), state.h), pct(1, state.w), pct(1, state.h));
      t.setAttribute('data-i', i);
      sheetLayer.appendChild(t);
    }
    board.appendChild(sheetLayer);
    creaseLine = el('pz-crease');
    board.appendChild(creaseLine);
    fxLayer = el('pz-fx');
    board.appendChild(fxLayer);
    preview = null;
    hinted = null;
  }

  function moveLabel(move, s) {
    var info = inspect(s, move), coords = info.moving.map(function (i) { return along(s, move, i); });
    var n = move.side === 'low' ? move.line - Math.min.apply(null, coords) : Math.max.apply(null, coords) + 1 - move.line;
    var unit = move.axis === 'v' ? (n === 1 ? 'column' : 'columns') : (n === 1 ? 'row' : 'rows');
    if (move.axis === 'v') {
      return move.side === 'low' ? 'Fold the left ' + n + ' ' + unit + ' over to the right' : 'Fold the right ' + n + ' ' + unit + ' over to the left';
    }
    return move.side === 'low' ? 'Fold the top ' + n + ' ' + unit + ' down' : 'Fold the bottom ' + n + ' ' + unit + ' up';
  }

  function describe() {
    var lights = [];
    for (var i = 0; i < state.stacks.length; i++) {
      var here = state.stacks[i].filter(function (id) { return state.active[id]; }).map(function (id) { return COLOUR[state.active[id]]; });
      if (here.length) { lights.push(here.join(' and ') + ' at column ' + (i % state.w + 1) + ', row ' + (Math.floor(i / state.w) + 1)); }
    }
    return 'Puzzle ' + (levelIndex + 1) + ' of ' + LEVELS.length + ', ' + level.name + '. The frame is ' + state.w + ' columns by ' + state.h +
      ' rows. ' + (lights.length ? 'Lights: ' + lights.join('; ') + '.' : 'Every light is connected.');
  }

  function refresh() {
    nameText.textContent = level.name;
    countText.textContent = state.folds + (state.folds === 1 ? ' fold' : ' folds') + ' · par ' + level.par;
    descText.textContent = describe();
    undoButton.disabled = !history.length || busy;
    restartButton.disabled = !history.length || busy;
    undoButton.classList.remove('is-nudge');

    stepsList.textContent = '';
    LEVELS.forEach(function (l, i) {
      var dot = el('', 'li');
      if (solvedLevels[i]) { dot.className = 'is-done'; }
      if (i === levelIndex) { dot.setAttribute('aria-current', 'step'); }
      stepsList.appendChild(dot);
    });
    stepsList.setAttribute('aria-label', 'Puzzle ' + (levelIndex + 1) + ' of ' + LEVELS.length);

    movesList.textContent = '';
    legalMoves(state).forEach(function (move) {
      var item = el('', 'li'), button = el('pz-move', 'button');
      button.type = 'button';
      button.textContent = moveLabel(move, state);
      button.addEventListener('click', function () { if (!busy) { animateFold(move, 0); } });
      item.appendChild(button);
      movesList.appendChild(item);
    });
  }

  function say(text) { tipText.textContent = text; }
  function announce(text) { statusText.textContent = text; }

  /* ---------- the flap: the part of the sheet that lifts and turns over ---------- */

  function buildFlap(move) {
    var info = inspect(state, move);
    var coords = info.moving.map(function (i) { return along(state, move, i); });
    var start = move.side === 'low' ? Math.min.apply(null, coords) : move.line;
    var end = move.side === 'low' ? move.line : Math.max.apply(null, coords) + 1;
    var span = end - start, landing = move.side === 'low' ? move.line : move.line - span;
    var vertical = move.axis === 'v';

    var flap = el('pz-flap pz-' + move.axis + ' pz-' + move.side);
    var front = el('pz-face pz-front'), back = el('pz-face pz-back'), shade = el('pz-shade');
    if (vertical) {
      flap.style.left = pct(start, state.w); flap.style.width = pct(span, state.w);
      flap.style.top = '0'; flap.style.height = '100%';
    } else {
      flap.style.top = pct(start, state.h); flap.style.height = pct(span, state.h);
      flap.style.left = '0'; flap.style.width = '100%';
    }

    info.moving.forEach(function (i) {
      var x = i % state.w, y = Math.floor(i / state.w), c = vertical ? x : y;
      var local = c - start, landed = (2 * move.line - 1 - c) - landing;
      var stack = state.stacks[i];
      if (vertical) {
        front.appendChild(tile(stack, pct(local, span), pct(y, state.h), pct(1, span), pct(1, state.h)));
        back.appendChild(tile(stack.slice().reverse(), pct(landed, span), pct(y, state.h), pct(1, span), pct(1, state.h)));
      } else {
        front.appendChild(tile(stack, pct(x, state.w), pct(local, span), pct(1, state.w), pct(1, span)));
        back.appendChild(tile(stack.slice().reverse(), pct(x, state.w), pct(landed, span), pct(1, state.w), pct(1, span)));
      }
      var still = sheetLayer.querySelector('[data-i="' + i + '"]');
      if (still) { still.classList.add('is-lifted'); }
    });
    front.appendChild(shade);
    flap.appendChild(front);
    flap.appendChild(back);
    board.appendChild(flap);

    if (vertical) {
      creaseLine.style.cssText = 'left:' + pct(move.line, state.w) + ';top:-5%;height:110%;width:0;';
      shadowBox.style.cssText = 'left:' + pct(landing, state.w) + ';width:' + pct(span, state.w) + ';' + acrossBox(move, info.moving);
    } else {
      creaseLine.style.cssText = 'top:' + pct(move.line, state.h) + ';left:-5%;width:110%;height:0;';
      shadowBox.style.cssText = 'top:' + pct(landing, state.h) + ';height:' + pct(span, state.h) + ';' + acrossBox(move, info.moving);
    }
    creaseLine.className = 'pz-crease is-on pz-' + move.axis;
    return { move: move, flap: flap, shade: shade, angle: 0 };
  }

  function setAngle(p, degrees) {
    p.angle = degrees;
    var sign = (p.move.axis === 'v') === (p.move.side === 'low') ? 1 : -1;
    p.flap.style.transform = (p.move.axis === 'v' ? 'rotateY(' : 'rotateX(') + (sign * degrees) + 'deg)';
    var lift = Math.sin(degrees * Math.PI / 180);
    p.shade.style.opacity = (lift * 0.22).toFixed(3);
    shadowBox.style.opacity = (lift * 0.2).toFixed(3);
  }

  function clearPreview() {
    if (preview) { preview.flap.remove(); }
    preview = null;
    creaseLine.className = 'pz-crease';
    shadowBox.style.opacity = '0';
    var lifted = sheetLayer.querySelectorAll('.is-lifted');
    for (var i = 0; i < lifted.length; i++) { lifted[i].classList.remove('is-lifted'); }
  }

  /* Extent of the moving squares along the crease, as CSS for a box (so shadows and hints only
     cover paper, not the empty part of the frame). */
  function acrossBox(move, indices) {
    var vertical = move.axis === 'v', size = vertical ? state.h : state.w;
    var values = indices.map(function (i) { return vertical ? Math.floor(i / state.w) : i % state.w; });
    var from = Math.min.apply(null, values), to = Math.max.apply(null, values) + 1;
    return vertical ? 'top:' + pct(from, size) + ';height:' + pct(to - from, size) + ';'
      : 'left:' + pct(from, size) + ';width:' + pct(to - from, size) + ';';
  }

  function sameMove(a, b) { return a && b && a.axis === b.axis && a.line === b.line && a.side === b.side; }

  function clearHint() {
    if (!hinted) { return; }
    hinted.remove();
    hinted = null;
    if (!preview) { creaseLine.className = 'pz-crease'; }
  }

  /* ---------- folding ---------- */

  function turn(p, to, ms, done) {
    if (reduceMotion.matches || ms <= 0) { setAngle(p, to); done(); return; }
    var finished = false;
    var finish = function () {
      if (finished) { return; }
      finished = true;
      p.flap.style.transition = p.shade.style.transition = shadowBox.style.transition = '';
      done();
    };
    p.flap.style.transition = 'transform ' + ms + 'ms cubic-bezier(0.3, 0.6, 0.25, 1)';
    p.shade.style.transition = shadowBox.style.transition = 'opacity ' + ms + 'ms linear';
    p.flap.getBoundingClientRect();
    setAngle(p, to);
    p.flap.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, ms + 120);
  }

  function animateFold(move, fromAngle) {
    busy = true;
    clearHint();
    if (!preview || !sameMove(preview.move, move)) { clearPreview(); preview = buildFlap(move); setAngle(preview, fromAngle || 0); }
    refreshButtons();
    var remaining = 180 - preview.angle;
    turn(preview, 180, Math.max(160, Math.round(remaining * 3.6)), function () { commit(move); });
  }

  function refreshButtons() {
    undoButton.disabled = !history.length || busy;
    restartButton.disabled = !history.length || busy;
  }

  function commit(move) {
    history.push(copy(state));
    var result = fold(state, move);
    state = result.state;
    render();
    result.matches.forEach(function (match, order) { bloom(match, order); });

    var left = Object.keys(state.active).length;
    var joined = result.matches.length;
    announce('Folded. ' + (joined ? joined + (joined === 1 ? ' pair' : ' pairs') + ' of lights joined. ' : 'No lights met. ') +
      (left ? left + ' lights left.' : 'Every light is connected.'));
    if (joined > 1) { say('A chain of ' + joined + '!'); }

    if (isSolved(state)) {
      refresh();
      busy = true;
      refreshButtons();
      window.setTimeout(showReveal, reduceMotion.matches ? 250 : 900 + joined * 110);
      return;
    }
    busy = false;
    refresh();
    if (!solve(state)) {
      say('This sheet can no longer be finished. Unfold a step and try another crease.');
      undoButton.classList.add('is-nudge');
    }
  }

  function bloom(match, order) {
    var node = el('pz-bloom');
    node.setAttribute('data-c', match.colour);
    node.style.left = pct(match.index % state.w + 0.5, state.w);
    node.style.top = pct(Math.floor(match.index / state.w) + 0.5, state.h);
    node.style.width = pct(0.56, state.w);
    node.style.animationDelay = (order * 0.11) + 's';
    node.appendChild(orb(match.colour));
    node.appendChild(el('pz-ring', 'span'));
    fxLayer.appendChild(node);
    window.setTimeout(function () { node.remove(); }, 1500 + order * 110);
  }

  /* ---------- dragging ---------- */

  function point(event) {
    var box = board.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width * state.w, y: (event.clientY - box.top) / box.height * state.h };
  }

  /* From where the paper was grabbed and where the finger is now, choose the crease and the
     angle of the flap. The crease sits halfway between the two points, snapped to the grid. */
  function choose(grab, now) {
    var dx = now.x - grab.x, dy = now.y - grab.y, travel = Math.sqrt(dx * dx + dy * dy);
    if (travel < 0.12) { return null; }
    if (!drag.axis || travel < 0.7) { drag.axis = Math.abs(dx) >= Math.abs(dy) ? 'v' : 'h'; }
    var axis = drag.axis, g = axis === 'v' ? grab.x : grab.y, f = axis === 'v' ? now.x : now.y;
    if (Math.abs(f - g) < 0.08) { return null; }
    var side = f > g ? 'low' : 'high', middle = (g + f) / 2, best = null;
    legalMoves(state).forEach(function (move) {
      if (move.axis !== axis || move.side !== side) { return; }
      if (side === 'low' ? move.line <= Math.floor(g) : move.line > Math.floor(g)) { return; }
      if (!best || Math.abs(move.line - middle) < Math.abs(best.line - middle)) { best = move; }
    });
    if (!best) {
      var nearest = { axis: axis, side: side, line: side === 'low' ? Math.floor(g) + 1 : Math.floor(g) };
      return { blocked: inspect(state, nearest).reason || 'frame' };
    }
    var reach = g - best.line;
    if (Math.abs(reach) < 0.3) { reach = reach < 0 ? -0.3 : 0.3; }
    var cosine = Math.max(-1, Math.min(1, (f - best.line) / reach));
    return { move: best, angle: Math.acos(cosine) * 180 / Math.PI };
  }

  function onDown(event) {
    if (busy || (event.pointerType === 'mouse' && event.button !== 0)) { return; }
    var at = point(event), x = Math.floor(at.x), y = Math.floor(at.y);
    if (x < 0 || y < 0 || x >= state.w || y >= state.h || !state.stacks[y * state.w + x].length) { return; }
    event.preventDefault();
    clearHint();
    drag = { grab: at, id: event.pointerId, axis: null, blocked: false };
    board.classList.add('is-dragging');
    if (board.setPointerCapture) { try { board.setPointerCapture(event.pointerId); } catch (error) { /* older browsers */ } }
  }

  function onMove(event) {
    if (!drag || event.pointerId !== drag.id) { return; }
    var choice = choose(drag.grab, point(event));
    if (!choice || choice.blocked) {
      clearPreview();
      if (choice && choice.blocked && !drag.blocked) {
        drag.blocked = true;
        board.classList.remove('is-resisting');
        board.getBoundingClientRect();
        board.classList.add('is-resisting');
        say(choice.blocked === 'frame' ? 'The paper cannot leave the frame. Try a crease closer to the middle.' : 'There is no paper on the other side of that crease.');
      }
      return;
    }
    drag.blocked = false;
    if (!preview || !sameMove(preview.move, choice.move)) {
      clearPreview();
      preview = buildFlap(choice.move);
      if (navigator.vibrate) { try { navigator.vibrate(6); } catch (error) { /* not allowed */ } }
    }
    setAngle(preview, choice.angle);
  }

  function onUp(event) {
    if (!drag || event.pointerId !== drag.id) { return; }
    drag = null;
    board.classList.remove('is-dragging');
    if (!preview) { return; }
    if (event.type === 'pointerup' && preview.angle >= 90) {
      animateFold(preview.move, preview.angle);
      return;
    }
    busy = true;
    var p = preview;
    turn(p, 0, Math.max(120, Math.round(p.angle * 2.4)), function () { clearPreview(); busy = false; refreshButtons(); });
  }

  /* ---------- hint, undo, restart ---------- */

  function showHint() {
    if (busy) { return; }
    clearHint();
    clearPreview();
    var path = solve(state);
    if (!path) {
      say('This sheet can no longer be finished. Unfold a step and try another crease.');
      undoButton.classList.add('is-nudge');
      return;
    }
    if (!path.length) { return; }
    var move = path[0], info = inspect(state, move);
    var coords = info.moving.map(function (i) { return along(state, move, i); });
    var start = move.side === 'low' ? Math.min.apply(null, coords) : move.line;
    var end = move.side === 'low' ? move.line : Math.max.apply(null, coords) + 1;
    hinted = el('pz-hint pz-' + move.axis + ' pz-' + move.side);
    if (move.axis === 'v') {
      hinted.style.cssText = 'left:' + pct(start, state.w) + ';width:' + pct(end - start, state.w) + ';' + acrossBox(move, info.moving);
      creaseLine.style.cssText = 'left:' + pct(move.line, state.w) + ';top:-5%;height:110%;width:0;';
    } else {
      hinted.style.cssText = 'top:' + pct(start, state.h) + ';height:' + pct(end - start, state.h) + ';' + acrossBox(move, info.moving);
      creaseLine.style.cssText = 'top:' + pct(move.line, state.h) + ';left:-5%;width:110%;height:0;';
    }
    creaseLine.className = 'pz-crease is-on is-hint pz-' + move.axis;
    board.insertBefore(hinted, creaseLine);
    say('Hint: ' + moveLabel(move, state).toLowerCase() + '.');
  }

  function undo() {
    if (busy || !history.length) { return; }
    state = history.pop();
    render();
    refresh();
    say(level.tip);
    announce('Unfolded one step.');
  }

  function restart() {
    if (busy || !history.length) { return; }
    load(levelIndex);
    announce('The sheet is flat again.');
  }

  /* ---------- levels and the reveal ---------- */

  function load(index) {
    levelIndex = index;
    level = LEVELS[index];
    state = parse(level);
    history = [];
    busy = false;
    reveal.hidden = true;
    stage.classList.remove('is-revealed');
    render();
    refresh();
    say(level.tip);
  }

  function showReveal() {
    var first = !solvedLevels[levelIndex];
    solvedLevels[levelIndex] = true;
    var last = levelIndex === LEVELS.length - 1;
    $('art').setAttribute('href', '#o-' + level.art);
    $('art-name').textContent = level.artName;
    $('art-blurb').textContent = level.blurb;
    $('landmark').textContent = level.landmarkName + ' restored';
    $('folds').textContent = state.folds + ' / ' + level.par + (level.par === 1 ? ' fold' : ' folds');
    $('perfect').hidden = state.folds > level.par;
    $('finale').hidden = !last;
    nextButton.textContent = last ? 'Play again' : 'Next';
    reveal.hidden = false;
    stage.classList.add('is-revealed');
    refresh();
    announce(level.artName + ' joins The Forgotten Garden. ' + level.landmarkName + ' restored.');
    restoreWorld(first);
    if (document.activeElement && root.contains(document.activeElement) && document.activeElement !== document.body) {
      nextButton.focus({ preventScroll: true });
    }
  }

  function nextLevel() {
    load(levelIndex === LEVELS.length - 1 ? 0 : levelIndex + 1);
    announce(describe());
  }

  /* ---------- the island further down the page wakes up as sheets are solved ---------- */

  function restoreWorld(animate) {
    if (!world) { return; }
    var done = 0;
    LEVELS.forEach(function (l, i) {
      var on = !!solvedLevels[i];
      if (on) { done++; }
      var parts = world.querySelectorAll('[data-landmark="' + l.landmark + '"], [data-origami="' + l.art + '"]');
      for (var k = 0; k < parts.length; k++) {
        var was = parts[k].classList.contains('is-ghost');
        parts[k].classList.toggle('is-ghost', !on);
        if (on && was && animate) { parts[k].classList.add('is-waking'); }
      }
    });
    var counter = document.querySelector('[data-world-count]');
    if (counter) {
      counter.textContent = done === 0 ? 'Nothing restored yet. Fold the sheet at the top of the page to wake this island.'
        : done === LEVELS.length ? 'All four landmarks restored. The garden is awake.'
        : done + ' of ' + LEVELS.length + ' landmarks restored.';
    }
    world.setAttribute('data-restored', done);
  }

  /* ---------- start ---------- */

  board.addEventListener('pointerdown', onDown);
  board.addEventListener('pointermove', onMove);
  board.addEventListener('pointerup', onUp);
  board.addEventListener('pointercancel', onUp);
  board.addEventListener('animationend', function (event) {
    if (event.target === board) { board.classList.remove('is-resisting'); }
  });
  undoButton.addEventListener('click', undo);
  restartButton.addEventListener('click', restart);
  hintButton.addEventListener('click', showHint);
  nextButton.addEventListener('click', nextLevel);

  root.classList.add('is-ready');
  if (world) { world.classList.add('is-live'); }
  load(0);
  restoreWorld(false);

  /* A small handle for automated checks; it exposes nothing beyond what the page shows. */
  root.foldTest = {
    state: function () { return { level: levelIndex, folds: state.folds, lights: Object.keys(state.active).length, busy: busy, solved: isSolved(state) }; },
    moves: function () { return legalMoves(state); },
    solution: function () { return solve(state); },
    levels: function () { return LEVELS.map(function (l) { var s = solve(parse(l)); return { name: l.name, par: l.par, best: s ? s.length : null }; }); }
  };
})();
