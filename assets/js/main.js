// Dhurta — shared site behavior: theme toggle, scroll reveal, 3D tilt, grid backdrop.
(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var stored = null;
  try { stored = localStorage.getItem('dhurta-theme'); } catch (e) {}
  if (stored) root.setAttribute('data-theme', stored);

  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('dhurta-theme', next); } catch (e) {}
    });
  }
})();

// Scroll reveal for cards/sections
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.tilt-card, .reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () { entry.target.classList.add('in'); }, (i % 6) * 70);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();

// 3D pointer tilt for .tilt-card elements
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  document.querySelectorAll('.tilt-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg');
    });
    card.addEventListener('mouseleave', function () {
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  });
})();

// Grid-floor neon backdrop, canvas-drawn, used on hero sections with #gridFloor
(function () {
  var canvas = document.getElementById('gridFloor');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw(t) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    var horizon = h * 0.42;
    var vanishX = w / 2;

    // horizontal lines receding toward horizon
    ctx.lineWidth = 1;
    var rows = 22;
    for (var i = 0; i < rows; i++) {
      var f = i / rows;
      var offset = reduced ? 0 : (t * 0.02) % (1 / rows);
      var ff = f + offset;
      if (ff > 1) ff -= 1;
      var y = horizon + ff * ff * (h - horizon) * 1.4;
      if (y > h) continue;
      var alpha = 0.35 * (1 - ff);
      ctx.strokeStyle = 'rgba(0, 240, 255, ' + Math.max(alpha, 0) + ')';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // vertical converging lines
    var cols = 14;
    for (var j = 0; j <= cols; j++) {
      var fx = j / cols;
      var xTop = vanishX + (fx - 0.5) * w * 0.15;
      var xBottom = vanishX + (fx - 0.5) * w * 2.2;
      ctx.strokeStyle = 'rgba(255, 46, 224, 0.18)';
      ctx.beginPath();
      ctx.moveTo(xTop, horizon);
      ctx.lineTo(xBottom, h);
      ctx.stroke();
    }
  }

  if (reduced) {
    draw(0);
  } else {
    var start = performance.now();
    (function loop(now) {
      draw((now - start) / 1000);
      requestAnimationFrame(loop);
    })(start);
  }
})();

// Hero "pro user" cursor choreography — animates a synthetic cursor across
// the mockup browser performing a short, looping sequence of actions.
(function () {
  var stage = document.getElementById('cursorStage');
  if (!stage) return;
  var cursor = document.getElementById('demoCursor');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !cursor) return;

  var targets = Array.prototype.slice.call(stage.querySelectorAll('[data-cursor-stop]'));
  if (!targets.length) return;

  var i = 0;
  function moveNext() {
    var el = targets[i % targets.length];
    var stageRect = stage.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var x = r.left - stageRect.left + r.width / 2;
    var y = r.top - stageRect.top + r.height / 2;
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    el.classList.add('cursor-hit');
    setTimeout(function () { el.classList.remove('cursor-hit'); }, 500);
    i++;
    setTimeout(moveNext, 1600);
  }
  setTimeout(moveNext, 800);
})();
