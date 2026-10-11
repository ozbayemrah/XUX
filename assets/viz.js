/* HUD-style 3D viewers for work-system.html.
   Every <figure class="viz" data-model="…glb"> gets a slowly rotating
   grey wireframe + point-cloud render of a NASA 3D Resources model
   (public domain — credited in each viewer's label, no NASA logos).
   Needs three r128 + GLTFLoader + DRACOLoader loaded first. Only the
   viewer on the active slide renders (the deck fires "deck:change"). */
(function () {
  if (!window.THREE || !THREE.GLTFLoader) return;

  var DRACO_PATH = "assets/vendor/draco/";   // self-hosted decoder, works offline
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var draco = new THREE.DRACOLoader();
  draco.setDecoderPath(DRACO_PATH);
  var loader = new THREE.GLTFLoader();
  loader.setDRACOLoader(draco);

  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var active = Math.max(0, slides.findIndex(function (s) { return s.classList.contains("is-active"); }));
  var transitionUntil = 0;

  // colours come from each viewer's CSS (--viz-line / --viz-point /
  // --viz-point-opacity), so the light and dark themes are tuned in CSS
  function palette(el) {
    var cs = getComputedStyle(el);
    function v(name, fallback) { return cs.getPropertyValue(name).trim() || fallback; }
    return {
      line: new THREE.Color(v("--viz-line", "#b9bdc2")),
      point: new THREE.Color(v("--viz-point", "#8a8f93")),
      pointOpacity: parseFloat(v("--viz-point-opacity", "0.5"))
    };
  }
  function applyPalette(it) {
    var p = palette(it.el);
    it.lineMats.forEach(function (m) { m.color.copy(p.line); });
    it.pointMats.forEach(function (m) { m.color.copy(p.point); m.opacity = p.pointOpacity; });
    it.dirty = true;
  }

  var items = Array.prototype.slice.call(document.querySelectorAll(".viz[data-model]")).map(function (el) {
    var canvas = document.createElement("canvas");
    el.insertBefore(canvas, el.firstChild);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    var pivot = new THREE.Group();
    scene.add(pivot);

    var it = {
      el: el,
      renderer: renderer,
      scene: scene,
      camera: camera,
      pivot: pivot,
      slide: slides.indexOf(el.closest(".slide")),
      angle: parseFloat(el.dataset.start || "0.6"),
      speed: parseFloat(el.dataset.speed || "0.22"),   // rad/s
      tilt: parseFloat(el.dataset.tilt || "0.22"),
      pointMats: [],
      lineMats: [],
      ready: false,
      dragging: false,
      lastX: 0,
      rotEl: el.querySelector("[data-rot]"),
      lastReadout: 0
    };

    function size() {
      var w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // keep the unit-radius model framed in both orientations
      var dist = 1.25 / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
      if (camera.aspect < 1) dist /= camera.aspect;
      camera.position.set(0, dist * 0.08, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      it.dirty = true;
    }
    size();
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(el);
    else window.addEventListener("resize", size);

    // drag to spin; keep touch drags from also swiping the deck
    canvas.addEventListener("pointerdown", function (e) {
      it.dragging = true;
      it.lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!it.dragging) return;
      it.angle += (e.clientX - it.lastX) * 0.012;
      it.lastX = e.clientX;
      it.dirty = true;
    });
    function end() { it.dragging = false; }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    ["touchstart", "touchend"].forEach(function (t) {
      canvas.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true });
    });

    loader.load(el.dataset.model, function (gltf) {
      build(it, gltf.scene);
      el.classList.add("is-ready");
    }, undefined, function () {
      el.classList.add("is-error");
    });

    return it;
  });

  function build(it, root) {
    root.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(root);
    var center = box.getCenter(new THREE.Vector3());
    var dims = box.getSize(new THREE.Vector3());
    // data-zoom > 1 for models whose thin parts (antennas, masts) inflate the box
    var s = 2 * parseFloat(it.el.dataset.zoom || "1") / Math.max(dims.x, dims.y, dims.z);

    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      var g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      g.translate(-center.x, -center.y, -center.z);
      g.scale(s, s, s);

      // invisible depth-only shell: hides edges/points behind the surface
      var occluder = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
        colorWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide
      }));
      it.pivot.add(occluder);

      var lm = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
      it.lineMats.push(lm);
      it.pivot.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 28), lm));

      var pm = new THREE.PointsMaterial({ size: 0.011, transparent: true, depthWrite: false });
      it.pointMats.push(pm);
      it.pivot.add(new THREE.Points(g, pm));
    });

    applyPalette(it);
    it.ready = true;
  }

  // follow the light/dark toggle
  new MutationObserver(function () {
    items.forEach(applyPalette);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  document.addEventListener("deck:change", function (e) {
    active = e.detail.index;
    transitionUntil = performance.now() + 800;   // keep neighbours drawing while sliding
    items.forEach(function (it) { it.dirty = true; });
  });

  var last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var sliding = now < transitionUntil;

    items.forEach(function (it) {
      if (!it.ready) return;
      var onScreen = it.slide === active || (sliding && Math.abs(it.slide - active) <= 1);
      if (!onScreen) return;
      var spinning = !reduceMotion && !it.dragging;
      if (spinning) it.angle += it.speed * dt;
      if (!spinning && !it.dirty && !sliding) return;

      it.pivot.rotation.set(it.tilt, it.angle, 0);
      it.renderer.render(it.scene, it.camera);
      it.dirty = false;

      if (it.rotEl && now - it.lastReadout > 120) {
        var deg = Math.round(((it.angle * 180 / Math.PI) % 360 + 360) % 360);
        it.rotEl.textContent = "ROT " + ("00" + deg).slice(-3) + "°";
        it.lastReadout = now;
      }
    });
  }
  requestAnimationFrame(frame);
})();
