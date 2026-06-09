(() => {
  const setCurrentYear = () => {
    const year = new Date().getFullYear();
    document.querySelectorAll("[data-year], #year").forEach((node) => {
      node.textContent = year;
    });
  };

  const highlightCurrentNav = () => {
    const path = window.location.pathname.replace(/\\/g, "/");
    const file = path.split("/").pop() || "index.html";
    let current = document.body.dataset.page || "home";

    if (path.includes("/posts/") || file === "posts.html") {
      current = "articles";
    }

    document.querySelectorAll("[data-nav]").forEach((link) => {
      const isActive = link.dataset.nav === current;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const DEFAULT_AMBIENT_SCENE = "snow";
  const AMBIENT_SCENES = new Set([
    "snow",
    "meteor",
    "fireflies",
    "sakura",
    "aurora",
    "ocean",
    "moonlight",
    "autumn",
    "stardust",
    "lightdust",
    "galaxy"
  ]);
  const GLOW_SCENES = new Set(["fireflies", "aurora", "ocean", "moonlight", "stardust", "lightdust", "galaxy"]);
  const LINK_SCENES = new Set(["aurora", "stardust", "galaxy"]);

  const normalizeAmbientScene = (scene) => (AMBIENT_SCENES.has(scene) ? scene : DEFAULT_AMBIENT_SCENE);
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const pickOne = (items) => items[Math.floor(Math.random() * items.length)];

  const getAmbientSceneParticleRatio = (scene, layer = "hero") => {
    const ratios = {
      snow: 1.35,
      meteor: layer === "header" ? 0.58 : 1.18,
      fireflies: 0.72,
      sakura: 0.96,
      aurora: 0.78,
      ocean: 1.18,
      moonlight: 0.92,
      autumn: 0.95,
      stardust: 1.35,
      lightdust: 1.16,
      galaxy: 1.48
    };

    return ratios[scene] || 1;
  };

  const createAmbientParticle = (scene, width, height, insideViewport = false, layer = "hero") => {
    const mobile = width < 760;
    const layerScale = layer === "hero" ? 1 : layer === "header" ? 0.82 : 0.9;
    const makeBase = (overrides) => ({
      x: Math.random() * width,
      y: insideViewport ? Math.random() * height : -32,
      radius: 1,
      size: 1,
      speedX: 0,
      speedY: 0,
      alpha: 0.4,
      opacity: 0.4,
      drift: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      spin: randomBetween(-0.018, 0.018),
      layerScale,
      age: Math.floor(Math.random() * 240),
      ...overrides
    });

    if (scene === "fireflies") {
      const color = pickOne(["#f8e986", "#d9ff9f", "#fff6b8", "#a9e891"]);
      const y = insideViewport ? randomBetween(height * 0.18, height * 0.82) : randomBetween(height * 0.48, height * 0.88);
      const radius = randomBetween(1.3, 3.1) * layerScale;
      return makeBase({
        type: "firefly",
        x: randomBetween(-width * 0.05, width * 1.05),
        y,
        radius,
        size: radius,
        speedX: randomBetween(-0.18, 0.22) * layerScale,
        speedY: randomBetween(-0.1, 0.08) * layerScale,
        alpha: randomBetween(0.52, 0.9),
        opacity: randomBetween(0.52, 0.9),
        pulseSpeed: randomBetween(0.026, 0.052),
        color
      });
    }

    if (scene === "sakura") {
      const size = randomBetween(mobile ? 7 : 8, mobile ? 13 : 16) * layerScale;
      return makeBase({
        type: "petal",
        x: insideViewport ? Math.random() * width : randomBetween(width + 18, width + Math.min(126, width * 0.12)),
        y: insideViewport ? Math.random() * height : randomBetween(-height * 0.18, height * 0.48),
        size,
        radius: size,
        speedX: randomBetween(-0.54, -0.38) * layerScale,
        speedY: randomBetween(0.22, 0.42) * layerScale,
        alpha: randomBetween(0.68, 0.94),
        opacity: randomBetween(0.68, 0.94),
        sway: randomBetween(0.04, 0.09) * layerScale,
        spin: randomBetween(-0.03, 0.034),
        windStrength: randomBetween(0.05, 0.1) * layerScale,
        windPhase: Math.random() * Math.PI * 2,
        trailAlpha: randomBetween(0.12, 0.22),
        color: pickOne(["#ffd8e7", "#fff0f6", "#f7b9cf", "#ffe6ef"])
      });
    }

    if (scene === "aurora") {
      const glint = Math.random() > 0.72;
      const radius = glint ? randomBetween(1, 2.1) * layerScale : randomBetween(0.55, 1.25) * layerScale;
      return makeBase({
        type: glint ? "glint" : "star",
        y: insideViewport ? Math.random() * height * 0.76 : randomBetween(-18, height * 0.72),
        radius,
        size: radius,
        speedX: randomBetween(-0.04, 0.08) * layerScale,
        speedY: randomBetween(-0.015, 0.045) * layerScale,
        alpha: glint ? randomBetween(0.42, 0.78) : randomBetween(0.24, 0.52),
        opacity: glint ? randomBetween(0.42, 0.78) : randomBetween(0.24, 0.52),
        pulseSpeed: randomBetween(0.01, 0.024),
        color: pickOne(["#f8ffff", "#c6fff2", "#b9d4ff", "#d7f6ff"])
      });
    }

    if (scene === "ocean") {
      const bubble = Math.random() > 0.46;
      const radius = bubble ? randomBetween(3.2, 8.4) * layerScale : randomBetween(1.2, 3.2) * layerScale;
      return makeBase({
        type: bubble ? "bubble" : "plankton",
        y: insideViewport ? Math.random() * height : randomBetween(height + 18, height * 1.18),
        radius,
        size: radius,
        speedX: randomBetween(-0.12, 0.14) * layerScale,
        speedY: bubble ? randomBetween(-0.5, -0.18) * layerScale : randomBetween(-0.18, -0.04) * layerScale,
        alpha: bubble ? randomBetween(0.32, 0.62) : randomBetween(0.52, 0.92),
        opacity: bubble ? randomBetween(0.32, 0.62) : randomBetween(0.52, 0.92),
        pulseSpeed: randomBetween(0.014, 0.032),
        color: bubble ? "#c8fbff" : pickOne(["#9ff7df", "#b8fff1", "#7edfff"])
      });
    }

    if (scene === "moonlight") {
      const mist = Math.random() > 0.58;
      const radius = mist ? randomBetween(32, 86) * layerScale : randomBetween(1, 2.4) * layerScale;
      return makeBase({
        type: mist ? "moon-mist" : "moon-star",
        y: insideViewport ? Math.random() * height * 0.78 : randomBetween(height * 0.06, height * 0.76),
        radius,
        size: radius,
        speedX: randomBetween(-0.08, 0.14) * layerScale,
        speedY: mist ? randomBetween(-0.012, 0.035) * layerScale : randomBetween(0.01, 0.04) * layerScale,
        alpha: mist ? randomBetween(0.13, 0.27) : randomBetween(0.42, 0.78),
        opacity: mist ? randomBetween(0.13, 0.27) : randomBetween(0.42, 0.78),
        pulseSpeed: randomBetween(0.008, 0.018),
        color: mist ? "#e7f3f6" : pickOne(["#ffffff", "#dff3ff", "#cde6ff"])
      });
    }

    if (scene === "autumn") {
      const size = randomBetween(mobile ? 8 : 9, mobile ? 15 : 19) * layerScale;
      return makeBase({
        type: "leaf",
        x: insideViewport ? Math.random() * width : randomBetween(width + 18, width + Math.min(136, width * 0.13)),
        y: insideViewport ? Math.random() * height : randomBetween(-height * 0.12, height * 0.52),
        size,
        radius: size,
        speedX: randomBetween(-0.66, -0.48) * layerScale,
        speedY: randomBetween(0.3, 0.54) * layerScale,
        alpha: randomBetween(0.64, 0.92),
        opacity: randomBetween(0.64, 0.92),
        sway: randomBetween(0.05, 0.11) * layerScale,
        spin: randomBetween(-0.03, 0.035),
        windStrength: randomBetween(0.06, 0.12) * layerScale,
        windPhase: Math.random() * Math.PI * 2,
        trailAlpha: randomBetween(0.12, 0.22),
        color: pickOne(["#d99a4e", "#bd7144", "#f0c76a", "#9aa267", "#e7a85a"])
      });
    }

    if (scene === "stardust") {
      const roll = Math.random();
      const type = roll > 0.84 ? "glint" : roll > 0.48 ? "star" : "dust";
      const radius = type === "dust" ? randomBetween(0.6, 1.35) * layerScale : randomBetween(1, 2.4) * layerScale;
      return makeBase({
        type,
        y: insideViewport ? Math.random() * height * 0.82 : randomBetween(-18, height * 0.72),
        radius,
        size: radius,
        speedX: type === "dust" ? randomBetween(0.16, 0.42) * layerScale : randomBetween(-0.05, 0.08) * layerScale,
        speedY: type === "dust" ? randomBetween(0.04, 0.16) * layerScale : randomBetween(-0.025, 0.05) * layerScale,
        alpha: type === "dust" ? randomBetween(0.28, 0.52) : randomBetween(0.46, 0.88),
        opacity: type === "dust" ? randomBetween(0.28, 0.52) : randomBetween(0.46, 0.88),
        pulseSpeed: randomBetween(0.012, 0.03),
        color: pickOne(["#f8fdff", "#dcefff", "#a9d8ff", "#fff0c6"])
      });
    }

    if (scene === "lightdust") {
      const roll = Math.random();
      const type = roll > 0.86 ? "glint" : "dust";
      const radius = type === "glint" ? randomBetween(1.2, 2.3) * layerScale : randomBetween(0.65, 1.55) * layerScale;
      return makeBase({
        type,
        y: insideViewport ? Math.random() * height : randomBetween(height * 0.02, height * 0.88),
        radius,
        size: radius,
        speedX: randomBetween(-0.045, 0.085) * layerScale,
        speedY: randomBetween(-0.035, 0.055) * layerScale,
        alpha: type === "glint" ? randomBetween(0.42, 0.72) : randomBetween(0.2, 0.46),
        opacity: type === "glint" ? randomBetween(0.42, 0.72) : randomBetween(0.2, 0.46),
        pulseSpeed: randomBetween(0.008, 0.022),
        color: pickOne(["#fff9dc", "#fff3bd", "#f7fbff", "#dcefff"])
      });
    }

    if (scene === "galaxy") {
      const roll = Math.random();
      const type = roll > 0.9 ? "glint" : roll > 0.56 ? "star" : roll > 0.14 ? "dust" : "comet";
      const radius = type === "dust"
        ? randomBetween(0.55, 1.3) * layerScale
        : type === "comet"
          ? randomBetween(1, 1.8) * layerScale
          : randomBetween(1.1, 2.7) * layerScale;
      return makeBase({
        type,
        y: insideViewport ? Math.random() * height * 0.86 : randomBetween(-18, height * 0.78),
        radius,
        size: radius,
        speedX: type === "comet" ? randomBetween(-0.22, -0.1) * layerScale : randomBetween(-0.035, 0.075) * layerScale,
        speedY: type === "comet" ? randomBetween(0.05, 0.14) * layerScale : randomBetween(-0.025, 0.06) * layerScale,
        alpha: type === "dust" ? randomBetween(0.24, 0.5) : randomBetween(0.48, 0.9),
        opacity: type === "dust" ? randomBetween(0.24, 0.5) : randomBetween(0.48, 0.9),
        pulseSpeed: randomBetween(0.01, 0.028),
        color: pickOne(["#f8fdff", "#cde6ff", "#b9d4ff", "#f2ddff", "#fff0c6"])
      });
    }

    const roll = Math.random();
    const type = roll > 0.82 ? "mist" : roll > 0.34 ? "flake" : "mote";
    const slow = type === "mist";
    const radius = slow ? randomBetween(22, 54) * layerScale : randomBetween(1.1, 3) * layerScale;
    return makeBase({
      type,
      y: insideViewport ? Math.random() * height : randomBetween(-height * 0.35, -24),
      radius,
      size: radius,
      speedX: randomBetween(-0.17, 0.17) * layerScale,
      speedY: slow ? randomBetween(0.06, 0.17) * layerScale : randomBetween(0.24, 0.76) * layerScale,
      alpha: slow ? randomBetween(0.12, 0.24) : randomBetween(0.34, 0.76),
      opacity: slow ? randomBetween(0.12, 0.24) : randomBetween(0.34, 0.76),
      color: type === "mist" ? "#d8e5ec" : "#f4fbff"
    });
  };

  const drawGlowCircle = (context, x, y, radius, color, alpha, blur = 0) => {
    context.save();
    context.globalAlpha = alpha;
    context.globalCompositeOperation = "lighter";
    context.shadowBlur = blur;
    context.shadowColor = color;
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const drawAmbientBackdrop = (context, scene, width, height, layer = "hero") => {
    const time = performance.now() * 0.00022;
    context.save();
    context.globalCompositeOperation = GLOW_SCENES.has(scene) ? "lighter" : "source-over";

    if (scene === "snow") {
      const glow = context.createRadialGradient(width * 0.62, height * 0.08, 0, width * 0.62, height * 0.08, Math.min(width, height) * 0.62);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.12)");
      glow.addColorStop(0.42, "rgba(225, 242, 255, 0.07)");
      glow.addColorStop(1, "rgba(225, 242, 255, 0)");
      context.globalAlpha = layer === "hero" ? 0.72 : 0.48;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    } else if (scene === "aurora") {
      for (let band = 0; band < 3; band += 1) {
        const yBase = height * (0.18 + band * 0.13);
        const gradient = context.createLinearGradient(0, yBase, width, yBase + height * 0.16);
        gradient.addColorStop(0, "rgba(92, 225, 197, 0)");
        gradient.addColorStop(0.32, band === 1 ? "rgba(166, 195, 255, 0.22)" : "rgba(92, 225, 197, 0.24)");
        gradient.addColorStop(0.68, "rgba(130, 220, 255, 0.18)");
        gradient.addColorStop(1, "rgba(92, 225, 197, 0)");
        context.globalAlpha = layer === "hero" ? 0.88 - band * 0.12 : 0.68 - band * 0.1;
        context.strokeStyle = gradient;
        context.lineWidth = (layer === "hero" ? 30 : 21) + band * 9;
        context.beginPath();
        for (let x = -80; x <= width + 100; x += 74) {
          const y = yBase + Math.sin(x * 0.006 + time * (2.4 + band) + band * 1.7) * (22 + band * 10);
          if (x === -80) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
    } else if (scene === "ocean") {
      const glow = context.createRadialGradient(width * 0.66, height * 0.22, 0, width * 0.66, height * 0.22, Math.min(width, height) * 0.72);
      glow.addColorStop(0, "rgba(139, 245, 221, 0.16)");
      glow.addColorStop(0.48, "rgba(126, 198, 255, 0.075)");
      glow.addColorStop(1, "rgba(126, 198, 255, 0)");
      context.globalAlpha = layer === "hero" ? 0.82 : 0.58;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      for (let line = 0; line < 7; line += 1) {
        const yBase = height * (0.16 + line * 0.13);
        const gradient = context.createLinearGradient(0, yBase, width, yBase);
        gradient.addColorStop(0, "rgba(139, 245, 221, 0)");
        gradient.addColorStop(0.42, "rgba(139, 245, 221, 0.2)");
        gradient.addColorStop(0.68, "rgba(126, 198, 255, 0.15)");
        gradient.addColorStop(1, "rgba(139, 245, 221, 0)");
        context.globalAlpha = layer === "hero" ? 0.78 : 0.56;
        context.strokeStyle = gradient;
        context.lineWidth = 1.35 + line * 0.22;
        context.beginPath();
        for (let x = -60; x <= width + 60; x += 36) {
          const y = yBase + Math.sin(x * 0.018 + time * 4.6 + line) * (5 + line);
          if (x === -60) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
    } else if (scene === "moonlight") {
      const cx = width * 0.74;
      const cy = height * 0.12;
      const radius = Math.min(width, height) * (layer === "hero" ? 0.56 : 0.42);
      const glow = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.28)");
      glow.addColorStop(0.34, "rgba(205, 230, 255, 0.14)");
      glow.addColorStop(1, "rgba(205, 230, 255, 0)");
      context.globalAlpha = layer === "hero" ? 0.98 : 0.76;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      for (let band = 0; band < 3; band += 1) {
        const y = height * (0.2 + band * 0.18);
        const gradient = context.createLinearGradient(0, y, width, y + 30);
        gradient.addColorStop(0, "rgba(205, 230, 255, 0)");
        gradient.addColorStop(0.45, "rgba(235, 247, 255, 0.12)");
        gradient.addColorStop(1, "rgba(205, 230, 255, 0)");
        context.globalAlpha = layer === "hero" ? 0.46 : 0.32;
        context.strokeStyle = gradient;
        context.lineWidth = 18 + band * 8;
        context.beginPath();
        for (let x = -60; x <= width + 60; x += 72) {
          const waveY = y + Math.sin(x * 0.006 + time * 2.4 + band) * (8 + band * 4);
          if (x === -60) context.moveTo(x, waveY);
          else context.lineTo(x, waveY);
        }
        context.stroke();
      }
    } else if (scene === "stardust") {
      const glow = context.createRadialGradient(width * 0.68, height * 0.18, 0, width * 0.68, height * 0.18, Math.min(width, height) * 0.58);
      glow.addColorStop(0, "rgba(126, 198, 255, 0.2)");
      glow.addColorStop(0.42, "rgba(255, 240, 198, 0.095)");
      glow.addColorStop(1, "rgba(126, 198, 255, 0)");
      context.globalAlpha = layer === "hero" ? 0.98 : 0.68;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    } else if (scene === "lightdust") {
      const glow = context.createRadialGradient(width * 0.42, height * 0.18, 0, width * 0.42, height * 0.18, Math.min(width, height) * 0.68);
      glow.addColorStop(0, "rgba(255, 246, 206, 0.22)");
      glow.addColorStop(0.45, "rgba(232, 247, 255, 0.105)");
      glow.addColorStop(1, "rgba(255, 246, 206, 0)");
      context.globalAlpha = layer === "hero" ? 0.72 : 0.5;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      for (let beam = 0; beam < 4; beam += 1) {
        const xBase = width * (0.14 + beam * 0.22);
        const gradient = context.createLinearGradient(xBase, 0, xBase + width * 0.14, height);
        gradient.addColorStop(0, "rgba(255, 249, 220, 0)");
        gradient.addColorStop(0.44, "rgba(255, 249, 220, 0.085)");
        gradient.addColorStop(1, "rgba(255, 249, 220, 0)");
        context.globalAlpha = layer === "hero" ? 0.48 : 0.32;
        context.strokeStyle = gradient;
        context.lineWidth = 22 + beam * 6;
        context.beginPath();
        context.moveTo(xBase + Math.sin(time * 2 + beam) * 18, -40);
        context.lineTo(xBase + width * 0.1 + Math.sin(time * 2.3 + beam) * 18, height + 40);
        context.stroke();
      }
    } else if (scene === "galaxy") {
      const glow = context.createRadialGradient(width * 0.68, height * 0.18, 0, width * 0.68, height * 0.18, Math.min(width, height) * 0.74);
      glow.addColorStop(0, "rgba(205, 230, 255, 0.24)");
      glow.addColorStop(0.34, "rgba(181, 146, 255, 0.16)");
      glow.addColorStop(0.72, "rgba(126, 198, 255, 0.08)");
      glow.addColorStop(1, "rgba(126, 198, 255, 0)");
      context.globalAlpha = layer === "hero" ? 0.96 : 0.7;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      for (let band = 0; band < 3; band += 1) {
        const yBase = height * (0.2 + band * 0.09);
        const gradient = context.createLinearGradient(0, yBase, width, yBase + height * 0.22);
        gradient.addColorStop(0, "rgba(169, 201, 255, 0)");
        gradient.addColorStop(0.28, band === 1 ? "rgba(242, 221, 255, 0.2)" : "rgba(126, 198, 255, 0.16)");
        gradient.addColorStop(0.62, "rgba(255, 240, 198, 0.11)");
        gradient.addColorStop(1, "rgba(169, 201, 255, 0)");
        context.globalAlpha = layer === "hero" ? 0.8 - band * 0.14 : 0.55 - band * 0.1;
        context.strokeStyle = gradient;
        context.lineWidth = (layer === "hero" ? 24 : 18) + band * 10;
        context.beginPath();
        for (let x = -80; x <= width + 100; x += 68) {
          const y = yBase + Math.sin(x * 0.005 + time * (2.2 + band) + band * 1.4) * (18 + band * 7);
          if (x === -80) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
    }

    context.restore();
  };

  const drawAmbientParticle = (context, particle, scene, layer = "hero") => {
    const alpha = particle.alpha ?? particle.opacity ?? 0.4;
    const pulse = 0.72 + Math.sin(particle.drift + particle.phase) * 0.28;

    if (scene === "fireflies") {
      drawGlowCircle(context, particle.x, particle.y, particle.radius * (1.1 + pulse * 0.42), particle.color, alpha * pulse, 14 * particle.layerScale);
      return;
    }

    if (scene === "sakura") {
      const trailX = particle.trailX ?? particle.x - (particle.speedX || 0) * 26;
      const trailY = particle.trailY ?? particle.y - particle.size * 3.2;
      const controlX = particle.x - (particle.windX || 0) * particle.size * 10;
      const controlY = particle.y - particle.size * 2.2;
      const trail = context.createLinearGradient(particle.x, particle.y, trailX, trailY);
      trail.addColorStop(0, `rgba(255, 240, 246, ${alpha * (particle.trailAlpha || 0.2)})`);
      trail.addColorStop(0.45, `rgba(247, 185, 207, ${alpha * 0.1})`);
      trail.addColorStop(1, "rgba(247, 185, 207, 0)");
      context.save();
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = trail;
      context.lineWidth = Math.max(1, particle.size * 0.16);
      context.beginPath();
      context.moveTo(trailX, trailY);
      context.quadraticCurveTo(controlX, controlY, particle.x, particle.y);
      context.stroke();
      context.restore();

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = alpha;
      context.fillStyle = particle.color;
      context.strokeStyle = "rgba(255, 255, 255, 0.42)";
      context.lineWidth = 0.6;
      context.beginPath();
      context.ellipse(0, 0, particle.size * 0.46, particle.size, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
      return;
    }

    if (scene === "autumn") {
      const trailX = particle.trailX ?? particle.x - (particle.speedX || 0) * 28;
      const trailY = particle.trailY ?? particle.y - particle.size * 3.6;
      const controlX = particle.x - (particle.windX || 0) * particle.size * 8;
      const controlY = particle.y - particle.size * 2.4;
      const trail = context.createLinearGradient(particle.x, particle.y, trailX, trailY);
      trail.addColorStop(0, `rgba(240, 199, 106, ${alpha * (particle.trailAlpha || 0.22)})`);
      trail.addColorStop(0.45, `rgba(217, 154, 78, ${alpha * 0.12})`);
      trail.addColorStop(1, "rgba(217, 154, 78, 0)");
      context.save();
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = trail;
      context.lineWidth = Math.max(1.1, particle.size * 0.15);
      context.beginPath();
      context.moveTo(trailX, trailY);
      context.quadraticCurveTo(controlX, controlY, particle.x, particle.y);
      context.stroke();
      context.restore();

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = alpha;
      context.fillStyle = particle.color;
      context.strokeStyle = "rgba(85, 55, 28, 0.22)";
      context.lineWidth = 0.7;
      context.beginPath();
      context.moveTo(0, -particle.size);
      context.bezierCurveTo(particle.size * 0.9, -particle.size * 0.45, particle.size * 0.72, particle.size * 0.52, 0, particle.size);
      context.bezierCurveTo(-particle.size * 0.72, particle.size * 0.52, -particle.size * 0.9, -particle.size * 0.45, 0, -particle.size);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(0, -particle.size * 0.72);
      context.lineTo(0, particle.size * 0.72);
      context.stroke();
      context.restore();
      return;
    }

    if (scene === "ocean") {
      if (particle.type === "bubble") {
        context.save();
        context.globalAlpha = alpha * (0.76 + pulse * 0.24);
        context.strokeStyle = "rgba(200, 251, 255, 0.86)";
        context.lineWidth = Math.max(0.7, particle.radius * 0.18);
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      } else {
        drawGlowCircle(context, particle.x, particle.y, particle.radius * (1 + pulse * 0.35), particle.color, alpha * pulse, 10 * particle.layerScale);
      }
      return;
    }

    if (scene === "moonlight") {
      if (particle.type === "moon-mist") {
        context.save();
        context.globalAlpha = alpha;
        const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius);
        gradient.addColorStop(0, "rgba(235, 247, 255, 0.34)");
        gradient.addColorStop(0.55, "rgba(205, 230, 255, 0.12)");
        gradient.addColorStop(1, "rgba(205, 230, 255, 0)");
        context.fillStyle = gradient;
        context.fillRect(particle.x - particle.radius, particle.y - particle.radius, particle.radius * 2, particle.radius * 2);
        context.restore();
      } else {
        drawGlowCircle(context, particle.x, particle.y, particle.radius * pulse, particle.color, alpha * pulse, 6 * particle.layerScale);
      }
      return;
    }

    if (scene === "aurora" || scene === "stardust" || scene === "lightdust" || scene === "galaxy") {
      context.save();
      context.globalCompositeOperation = "lighter";
      context.globalAlpha = alpha * pulse;
      context.strokeStyle = particle.color;
      context.fillStyle = particle.color;

      if (particle.type === "dust" || particle.type === "comet") {
        const isGalaxy = scene === "galaxy";
        const isLightDust = scene === "lightdust";
        const tail = particle.type === "comet"
          ? 36 + particle.radius * 24
          : (isGalaxy ? 20 : isLightDust ? 10 : scene === "stardust" ? 18 : 12) + particle.radius * (isGalaxy ? 16 : isLightDust ? 7 : scene === "stardust" ? 14 : 9);
        const gradient = context.createLinearGradient(particle.x, particle.y, particle.x - tail, particle.y - tail * 0.35);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, isLightDust ? "rgba(255, 246, 206, 0)" : "rgba(126, 198, 255, 0)");
        context.strokeStyle = gradient;
        context.lineWidth = Math.max(isGalaxy ? 1.05 : isLightDust ? 0.58 : scene === "stardust" ? 0.95 : 0.65, particle.radius * (isGalaxy ? 1.22 : isLightDust ? 0.82 : scene === "stardust" ? 1.18 : 1));
        context.beginPath();
        context.moveTo(particle.x - tail, particle.y - tail * 0.35);
        context.lineTo(particle.x, particle.y);
        context.stroke();
      } else {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * pulse, 0, Math.PI * 2);
        context.fill();
        if (particle.type === "glint") {
          context.globalAlpha *= 0.7;
          context.lineWidth = scene === "galaxy" || scene === "stardust" ? 0.85 : 0.65;
          context.beginPath();
          context.moveTo(particle.x - particle.radius * (scene === "galaxy" || scene === "stardust" ? 7 : 5), particle.y);
          context.lineTo(particle.x + particle.radius * (scene === "galaxy" || scene === "stardust" ? 7 : 5), particle.y);
          context.moveTo(particle.x, particle.y - particle.radius * (scene === "galaxy" || scene === "stardust" ? 7 : 5));
          context.lineTo(particle.x, particle.y + particle.radius * (scene === "galaxy" || scene === "stardust" ? 7 : 5));
          context.stroke();
        }
      }

      context.restore();
      return;
    }

    context.save();
    context.globalAlpha = alpha;
    if (scene === "snow") {
      if (particle.type === "mist") {
        const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.32)");
        gradient.addColorStop(0.52, "rgba(225, 242, 255, 0.12)");
        gradient.addColorStop(1, "rgba(225, 242, 255, 0)");
        context.fillStyle = gradient;
        context.fillRect(particle.x - particle.radius, particle.y - particle.radius, particle.radius * 2, particle.radius * 2);
      } else {
        context.globalCompositeOperation = "lighter";
        context.shadowBlur = particle.type === "flake" ? 7 * particle.layerScale : 3 * particle.layerScale;
        context.shadowColor = "rgba(225, 242, 255, 0.72)";
        context.fillStyle = particle.color || "#f4fbff";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
        if (particle.type === "flake" && particle.radius > 1.6) {
          context.globalAlpha = alpha * 0.54;
          context.strokeStyle = "rgba(255, 255, 255, 0.78)";
          context.lineWidth = 0.55;
          context.beginPath();
          context.moveTo(particle.x - particle.radius * 2.1, particle.y);
          context.lineTo(particle.x + particle.radius * 2.1, particle.y);
          context.moveTo(particle.x, particle.y - particle.radius * 2.1);
          context.lineTo(particle.x, particle.y + particle.radius * 2.1);
          context.stroke();
        }
      }
      context.restore();
      return;
    }

    if (particle.type === "mist") {
      const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.28)");
      gradient.addColorStop(0.52, "rgba(255, 255, 255, 0.1)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = gradient;
      context.fillRect(particle.x - particle.radius, particle.y - particle.radius, particle.radius * 2, particle.radius * 2);
    } else {
      context.fillStyle = particle.color || "#f4fbff";
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  };

  const updateAmbientParticle = (particle, scene, width, height, createParticle) => {
    particle.age += 1;
    particle.drift += particle.pulseSpeed || 0.012;
    particle.rotation += particle.spin || 0;

    if (scene === "fireflies") {
      particle.x += particle.speedX + Math.sin(particle.drift * 0.9) * 0.16;
      particle.y += particle.speedY + Math.cos(particle.drift * 0.7) * 0.1;
      if (particle.x < -80 || particle.x > width + 80 || particle.y < -80 || particle.y > height + 80) return createParticle(false);
      return particle;
    }

    if (scene === "sakura" || scene === "autumn") {
      const previousX = particle.x;
      const previousY = particle.y;
      const elapsed = typeof performance === "undefined" ? particle.age * 16.67 : performance.now();
      const isAutumn = scene === "autumn";
      const globalWind = Math.sin(elapsed * 0.0011 + (isAutumn ? 0.65 : 0)) * (isAutumn ? 0.038 : 0.032);
      const localFlutter = Math.sin(particle.age * (isAutumn ? 0.035 : 0.03) + particle.phase) * (particle.sway || 0.06);
      const verticalDrift = Math.cos(particle.age * 0.012 + particle.phase) * (isAutumn ? 0.026 : 0.02);
      const dx = Math.min(isAutumn ? -0.34 : -0.28, particle.speedX - (particle.windStrength || 0.07) + globalWind + localFlutter);
      const dy = Math.max(isAutumn ? 0.24 : 0.18, particle.speedY + verticalDrift);

      particle.x += dx;
      particle.y += dy;
      particle.windX = dx;
      particle.rotation += dx * (scene === "autumn" ? 0.012 : 0.009);

      if (particle.trailX === undefined || particle.trailY === undefined) {
        particle.trailX = previousX - dx * 18;
        particle.trailY = previousY - dy * 18;
      } else {
        particle.trailX += (previousX - particle.trailX) * 0.1;
        particle.trailY += (previousY - particle.trailY) * 0.1;
      }

      if (particle.y > height + particle.size * 3 || particle.x < -150 || particle.x > width + 150) return createParticle(false);
      return particle;
    }

    if (scene === "ocean") {
      particle.x += particle.speedX + Math.sin(particle.drift) * 0.08;
      particle.y += particle.speedY;
      if (particle.y < -80 || particle.x < -80 || particle.x > width + 80) return createParticle(false);
      return particle;
    }

    if (scene === "aurora" || scene === "moonlight" || scene === "stardust" || scene === "lightdust" || scene === "galaxy") {
      particle.x += particle.speedX + Math.sin(particle.drift * 0.7) * 0.04;
      particle.y += particle.speedY + Math.cos(particle.drift * 0.5) * 0.025;
      if (particle.x > width + 90 || particle.x < -90 || particle.y < -90 || particle.y > height + 90) return createParticle(false);
      return particle;
    }

    particle.x += particle.speedX + Math.sin(particle.drift) * 0.12;
    particle.y += particle.speedY;
    if (particle.y > height + 64 || particle.x < -80 || particle.x > width + 80) return createParticle(false);
    return particle;
  };

  const drawAmbientLinks = (context, particles, scene, layer = "hero") => {
    if (!LINK_SCENES.has(scene)) return;

    const points = particles.filter((particle) => particle.type === "star" || particle.type === "glint");
    const maxDistance = scene === "galaxy" ? (layer === "hero" ? 152 : 116) : scene === "stardust" ? (layer === "hero" ? 132 : 104) : (layer === "hero" ? 112 : 86);
    context.save();
    context.globalCompositeOperation = "lighter";
    context.strokeStyle = scene === "aurora" ? "#c6fff2" : scene === "galaxy" ? "#f2ddff" : "#dcefff";
    context.lineWidth = 0.65;

    for (let outer = 0; outer < points.length; outer += 1) {
      for (let inner = outer + 1; inner < points.length; inner += 1) {
        const first = points[outer];
        const second = points[inner];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        if (distance > maxDistance) continue;

        context.globalAlpha = (1 - distance / maxDistance) * (scene === "galaxy" ? (layer === "hero" ? 0.18 : 0.12) : scene === "stardust" ? (layer === "hero" ? 0.15 : 0.1) : (layer === "hero" ? 0.1 : 0.07));
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.stroke();
      }
    }

    context.restore();
  };

  const setupBackToTop = () => {
    const button = document.querySelector("[data-back-to-top]");
    if (!button) return;

    const toggleButton = () => {
      button.classList.toggle("is-visible", window.scrollY > 420);
    };

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", toggleButton, { passive: true });
    toggleButton();
  };

  const setupPostSearch = () => {
    const input = document.querySelector("[data-post-search]");
    const cards = Array.from(document.querySelectorAll("[data-post-card]"));
    const count = document.querySelector("[data-post-count]");
    const empty = document.querySelector("[data-empty-state]");

    if (!input || cards.length === 0) return;

    const normalize = (value) => value.toLowerCase().trim();

    const update = () => {
      const query = normalize(input.value);
      let visibleCount = 0;

      cards.forEach((card) => {
        const haystack = normalize([
          card.dataset.title,
          card.dataset.tags,
          card.dataset.summary,
          card.textContent
        ].join(" "));
        const isVisible = query === "" || haystack.includes(query);
        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      if (count) count.textContent = `${visibleCount} 篇文章`;
      if (empty) empty.hidden = visibleCount !== 0;
    };

    input.addEventListener("input", update);
    update();
  };

  const setupReadingProgress = () => {
    const article = document.querySelector(".article-content");
    if (!article) return;

    const progressBar = document.createElement("div");
    progressBar.className = "reading-progress";
    document.body.appendChild(progressBar);

    const updateProgress = () => {
      const rect = article.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const articleHeight = Math.max(article.scrollHeight, rect.height);
      const denominator = Math.max(1, articleHeight - viewportHeight);
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(1, scrolled / denominator);
      progressBar.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  };

  const setupCodeCopy = () => {
    document.querySelectorAll(".article-content pre").forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-block-wrapper")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const button = document.createElement("button");
      button.className = "copy-code-btn";
      button.textContent = "Copy";
      button.type = "button";
      wrapper.appendChild(button);

      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.textContent);
          button.textContent = "Copied";
          button.classList.add("copied");
        } catch (error) {
          button.textContent = "Failed";
        }

        window.setTimeout(() => {
          button.textContent = "Copy";
          button.classList.remove("copied");
        }, 1800);
      });
    });
  };

  const setupTOC = () => {
    const headings = Array.from(document.querySelectorAll(".article-content h2"));
    const tocContainer = document.querySelector("[data-toc]");
    if (!tocContainer || headings.length === 0) return;

    const list = document.createElement("ul");
    list.className = "toc-list";

    headings.forEach((heading, index) => {
      const id = `section-${index + 1}`;
      heading.id = id;

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = heading.textContent;
      li.appendChild(a);
      list.appendChild(li);
    });

    tocContainer.appendChild(list);

    const updateActiveTOC = () => {
      let current = headings[0]?.id || "";

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top < 180) current = heading.id;
      });

      list.querySelectorAll("a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
      });
    };

    window.addEventListener("scroll", updateActiveTOC, { passive: true });
    updateActiveTOC();
  };

  const setupTagFilter = () => {
    const buttons = Array.from(document.querySelectorAll("[data-tag-filter]"));
    const cards = Array.from(document.querySelectorAll("[data-post-card]"));
    const count = document.querySelector("[data-post-count]");
    const empty = document.querySelector("[data-empty-state]");

    if (buttons.length === 0 || cards.length === 0) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const isActive = btn.classList.contains("active");
        buttons.forEach((button) => button.classList.remove("active"));
        if (!isActive) btn.classList.add("active");

        const activeTag = isActive ? "" : btn.dataset.tagFilter.toLowerCase();
        let visibleCount = 0;

        cards.forEach((card) => {
          const tags = (card.dataset.tags || "").toLowerCase();
          const isVisible = activeTag === "" || tags.includes(activeTag);
          card.hidden = !isVisible;
          if (isVisible) visibleCount += 1;
        });

        if (count) count.textContent = `${visibleCount} 篇文章`;
        if (empty) empty.hidden = visibleCount !== 0;
      });
    });
  };

  const animateStats = () => {
    const stats = document.querySelectorAll("[data-stat]");
    if (stats.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const stat = entry.target;
        const target = Number.parseInt(stat.dataset.stat, 10);
        let current = 0;
        const increment = Math.max(1, target / 48);
        const timer = window.setInterval(() => {
          current += increment;
          if (current >= target) {
            stat.textContent = target;
            window.clearInterval(timer);
          } else {
            stat.textContent = Math.floor(current);
          }
        }, 20);
        observer.unobserve(stat);
      });
    });

    stats.forEach((stat) => observer.observe(stat));
  };

  const setupLocalTime = () => {
    const timeNode = document.querySelector("[data-local-time]");
    const dateNode = document.querySelector("[data-local-date]");
    if (!timeNode && !dateNode) return;

    const update = () => {
      const now = new Date();
      if (timeNode) {
        timeNode.textContent = now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      if (dateNode) {
        dateNode.textContent = now.toLocaleDateString("zh-CN", {
          month: "short",
          day: "numeric",
          weekday: "short"
        });
      }
    };

    update();
    window.setInterval(update, 30000);
  };

  const setupMoodPicker = () => {
    const group = document.querySelector("[data-mood-group]");
    const output = document.querySelector("[data-mood-output]");
    if (!group || !output) return;

    const copy = {
      清醒: "清醒地记录一点，不急着把所有问题一次解决。",
      松弛: "松弛一点也很好，慢慢写出来的东西更耐看。",
      专注: "把注意力收回来，先完成眼前这一小段。"
    };

    group.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mood]");
      if (!button) return;

      group.querySelectorAll("[data-mood]").forEach((node) => {
        node.classList.toggle("is-active", node === button);
      });
      output.textContent = copy[button.dataset.mood] || copy.清醒;
    });
  };

  const setupAnimeHero = () => {
    const hero = document.querySelector("[data-anime-hero]");
    if (!hero) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const character = hero.querySelector("[data-hero-character]");
    const dialogue = hero.querySelector("[data-hero-dialogue]");
    const canvas = hero.querySelector("[data-hero-particles]");
    const strength = Number.parseFloat(getComputedStyle(hero).getPropertyValue("--mouse-strength")) || 1;

    let pointerFrame = 0;
    let scrollFrame = 0;
    let dialogueTimer = 0;
    let lastDialogueIndex = -1;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const mobileCharacterQuery = window.matchMedia("(max-width: 760px)");

    const setHeroMotion = () => {
      pointerFrame = 0;
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;

      hero.style.setProperty("--hero-shift-x", `${(current.x * 13 * strength).toFixed(2)}px`);
      hero.style.setProperty("--hero-shift-y", `${(current.y * 9 * strength).toFixed(2)}px`);
      hero.style.setProperty("--hero-tilt-x", `${(current.x * 2.1 * strength).toFixed(2)}deg`);
      hero.style.setProperty("--hero-tilt-y", `${(current.y * -1.4 * strength).toFixed(2)}deg`);
    };

    const queuePointerFrame = () => {
      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(setHeroMotion);
      }
    };

    const resetPointerMotion = () => {
      target.x = 0;
      target.y = 0;
      hero.classList.remove("is-character-near");
      queuePointerFrame();
    };

    const updatePointerMotion = (event) => {
      if (reduceMotionQuery.matches) return;

      const rect = hero.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      target.y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      target.x = Math.max(-1, Math.min(1, target.x));
      target.y = Math.max(-1, Math.min(1, target.y));

      if (character) {
        const charRect = character.getBoundingClientRect();
        const near =
          event.clientX > charRect.left - 72 &&
          event.clientX < charRect.right + 72 &&
          event.clientY > charRect.top - 72 &&
          event.clientY < charRect.bottom + 72;
        hero.classList.toggle("is-character-near", near);
      }

      queuePointerFrame();
    };

    const updateScrollParallax = () => {
      scrollFrame = 0;
      if (reduceMotionQuery.matches) return;

      const rect = hero.getBoundingClientRect();
      const progress = Math.max(-0.25, Math.min(1, -rect.top / Math.max(1, rect.height)));
      hero.style.setProperty("--hero-bg-parallax", `${(progress * 26).toFixed(2)}px`);
      hero.style.setProperty("--hero-character-parallax", `${(progress * -18).toFixed(2)}px`);
    };

    const queueScrollParallax = () => {
      if (!scrollFrame) {
        scrollFrame = window.requestAnimationFrame(updateScrollParallax);
      }
    };

    const showDialogue = () => {
      if (!character || !dialogue) return;

      const lines = (character.dataset.dialogues || "")
        .split("|")
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) return;

      let index = Math.floor(Math.random() * lines.length);
      if (lines.length > 1 && index === lastDialogueIndex) {
        index = (index + 1) % lines.length;
      }

      lastDialogueIndex = index;
      dialogue.textContent = lines[index];
      dialogue.classList.add("is-visible");

      window.clearTimeout(dialogueTimer);
      dialogueTimer = window.setTimeout(() => {
        dialogue.classList.remove("is-visible");
      }, 4200);
    };

    const syncCharacterAccessibility = () => {
      if (!character) return;

      const decorative = mobileCharacterQuery.matches;
      character.disabled = decorative;
      character.tabIndex = decorative ? -1 : 0;

      if (decorative) {
        character.setAttribute("aria-hidden", "true");
      } else {
        character.removeAttribute("aria-hidden");
      }
    };

    const setupParticles = () => {
      if (!canvas || reduceMotionQuery.matches) {
        if (canvas) canvas.hidden = true;
        return;
      }

      const context = canvas.getContext("2d", { alpha: true });
      if (!context) return;

      let width = 0;
      let height = 0;
      let dpr = 1;
      let particles = [];
      let meteors = [];
      let meteorTrails = [];
      let meteorFrame = 0;
      let animationFrame = 0;

      const HERO_SCENE_CHANGE_EVENT = "odile:hero-scene-change";
      let activeScene = normalizeAmbientScene(document.body.dataset.heroScene);

      const getActiveScene = () => normalizeAmbientScene(document.body.dataset.heroScene);
      const isMeteorScene = () => activeScene === "meteor";

      const pickParticleCount = () => {
        const base = Number.parseInt(getComputedStyle(hero).getPropertyValue("--particle-count"), 10) || 34;
        const mobileRatio = window.innerWidth < 760 ? 0.44 : 1;
        const coreRatio = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? 0.68 : 1;
        const sceneRatio = getAmbientSceneParticleRatio(activeScene, "hero");
        return Math.max(10, Math.round(base * mobileRatio * coreRatio * sceneRatio));
      };

      const createParticle = (insideViewport = false) => {
        if (isMeteorScene()) {
          const roll = Math.random();
          const type = roll > 0.9 ? "glint" : roll > 0.58 ? "star" : "dust";
          const colors = ["#f8fdff", "#cfeaff", "#9fd4ff", "#7fc6ff", "#eaf6ff"];

          return {
            x: Math.random() * width,
            y: insideViewport ? Math.random() * height * 0.68 : height * (0.06 + Math.random() * 0.58),
            radius: type === "dust" ? 0.7 + Math.random() * 1.2 : 0.9 + Math.random() * 2,
            speedX: type === "dust" ? 0.22 + Math.random() * 0.38 : (Math.random() - 0.5) * 0.05,
            speedY: type === "dust" ? 0.08 + Math.random() * 0.16 : (Math.random() - 0.5) * 0.04,
            alpha: type === "dust" ? 0.2 + Math.random() * 0.28 : 0.36 + Math.random() * 0.44,
            drift: Math.random() * Math.PI * 2,
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.9 + Math.random() * 1.8,
            color: colors[Math.floor(Math.random() * colors.length)],
            type
          };
        }

        return createAmbientParticle(activeScene, width, height, insideViewport, "hero");
      };

      const resizeCanvas = () => {
        const rect = hero.getBoundingClientRect();
        width = Math.max(1, Math.floor(rect.width));
        height = Math.max(1, Math.floor(rect.height));
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.hidden = false;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        activeScene = getActiveScene();
        resetSceneParticles();
      };

      const drawParticle = (particle) => {
        if (isMeteorScene()) {
          const pulse = 0.72 + Math.sin(particle.drift * particle.twinkleSpeed + particle.phase) * 0.28;

          context.save();
          context.globalAlpha = particle.alpha * pulse;
          context.globalCompositeOperation = "lighter";
          context.strokeStyle = particle.color;
          context.fillStyle = particle.color;

          if (particle.type === "dust") {
            const tail = 14 + particle.radius * 9;
            const gradient = context.createLinearGradient(particle.x, particle.y, particle.x - tail, particle.y - tail * 0.38);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, "rgba(126, 198, 255, 0)");
            context.strokeStyle = gradient;
            context.lineWidth = Math.max(0.7, particle.radius);
            context.beginPath();
            context.moveTo(particle.x - tail, particle.y - tail * 0.38);
            context.lineTo(particle.x, particle.y);
            context.stroke();
          } else {
            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius * pulse, 0, Math.PI * 2);
            context.fill();

            if (particle.type === "glint") {
              context.globalAlpha *= 0.72;
              context.lineWidth = 0.7;
              context.beginPath();
              context.moveTo(particle.x - particle.radius * 5, particle.y);
              context.lineTo(particle.x + particle.radius * 5, particle.y);
              context.moveTo(particle.x, particle.y - particle.radius * 5);
              context.lineTo(particle.x, particle.y + particle.radius * 5);
              context.stroke();
            }
          }

          context.restore();
          return;
        }

        drawAmbientParticle(context, particle, activeScene, "hero");
      };

      const drawMeteorSky = () => {
        if (!isMeteorScene()) return;

        const time = performance.now() * 0.00024;
        context.save();
        context.globalCompositeOperation = "source-over";

        for (let band = 0; band < 3; band += 1) {
          const yBase = height * (0.22 + band * 0.13);
          const amplitude = 24 + band * 12;
          const gradient = context.createLinearGradient(0, yBase, width, yBase + height * 0.12);

          gradient.addColorStop(0, "rgba(126, 198, 255, 0)");
          gradient.addColorStop(0.34, band === 1 ? "rgba(196, 226, 255, 0.12)" : "rgba(126, 198, 255, 0.16)");
          gradient.addColorStop(0.66, "rgba(184, 213, 255, 0.14)");
          gradient.addColorStop(1, "rgba(126, 198, 255, 0)");

          context.globalAlpha = 0.72 - band * 0.12;
          context.strokeStyle = gradient;
          context.lineWidth = 24 + band * 8;
          context.beginPath();

          for (let x = -60; x <= width + 80; x += 72) {
            const y = yBase + Math.sin(x * 0.006 + time * (2.1 + band) + band * 1.9) * amplitude;
            if (x === -60) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          }

          context.stroke();
        }

        context.restore();
      };

      const drawConstellationLinks = () => {
        if (isMeteorScene()) {
          const stars = particles.filter((particle) => particle.type !== "dust");
          context.save();
          context.globalCompositeOperation = "lighter";
          context.strokeStyle = "#bff7ee";
          context.lineWidth = 0.7;

          for (let outer = 0; outer < stars.length; outer += 1) {
            for (let inner = outer + 1; inner < stars.length; inner += 1) {
              const first = stars[outer];
              const second = stars[inner];
              const distance = Math.hypot(first.x - second.x, first.y - second.y);

              if (distance > 108) continue;

              context.globalAlpha = (1 - distance / 108) * 0.12;
              context.beginPath();
              context.moveTo(first.x, first.y);
              context.lineTo(second.x, second.y);
              context.stroke();
            }
          }

          context.restore();
          return;
        }

        drawAmbientLinks(context, particles, activeScene, "hero");
      };

      const createMeteor = (insideViewport = false) => {
        const mobile = width < 760;
        const lane = Math.random();
        const angle = Math.PI - (0.28 + Math.random() * 0.13);
        const speed = mobile ? 2.9 + Math.random() * 1.25 : 3.8 + Math.random() * 1.7;
        const length = Math.min(width * (mobile ? 0.34 : 0.28), mobile ? 100 + Math.random() * 58 : 140 + Math.random() * 92);
        const pathStartX = width + 14 + Math.random() * width * 0.1;
        const pathStartY = height * (0.02 + lane * 0.5);
        const endX = width * (mobile ? 0.16 : 0.28);
        const pathLife = Math.round((pathStartX - endX) / Math.max(1, -Math.cos(angle) * speed));
        const maxLife = Math.max(mobile ? 100 : 160, Math.min(mobile ? 172 : 420, pathLife));
        const startAge = insideViewport ? Math.floor(maxLife * (0.08 + Math.random() * 0.68)) : 0;

        return {
          x: pathStartX + Math.cos(angle) * speed * startAge,
          y: pathStartY + Math.sin(angle) * speed * startAge,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          dirX: Math.cos(angle),
          dirY: Math.sin(angle),
          length,
          alpha: 0.82 + Math.random() * 0.16,
          width: mobile ? 1.55 + Math.random() * 0.65 : 1.85 + Math.random() * 0.95,
          age: startAge,
          life: maxLife - startAge,
          maxLife,
          flare: Math.random() > 0.88
        };
      };

      const drawMeteorTrail = (trail) => {
        const progress = trail.life / trail.maxLife;
        const tailX = trail.x - trail.dirX * trail.length;
        const tailY = trail.y - trail.dirY * trail.length;
        const gradient = context.createLinearGradient(trail.x, trail.y, tailX, tailY);

        gradient.addColorStop(0, `rgba(255, 255, 255, ${trail.alpha * progress * 0.66})`);
        gradient.addColorStop(0.22, `rgba(126, 198, 255, ${trail.alpha * progress * 0.48})`);
        gradient.addColorStop(0.58, `rgba(190, 222, 255, ${trail.alpha * progress * 0.18})`);
        gradient.addColorStop(1, "rgba(126, 198, 255, 0)");

        context.strokeStyle = gradient;
        context.lineWidth = Math.max(1.45, trail.width * progress * 1.18);
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(trail.x, trail.y);
        context.stroke();
      };

      const drawMeteorHead = (meteor) => {
        const fadeIn = Math.min(1, meteor.age / 14);
        const fadeOut = Math.min(1, meteor.life / (meteor.maxLife * 0.3));
        const alpha = meteor.alpha * fadeIn * fadeOut;
        const length = meteor.length * (0.82 + Math.sin(meteor.age * 0.08) * 0.05);
        const tailX = meteor.x - meteor.dirX * length;
        const tailY = meteor.y - meteor.dirY * length;
        const glow = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        const core = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);

        glow.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.64})`);
        glow.addColorStop(0.2, `rgba(126, 198, 255, ${alpha * 0.58})`);
        glow.addColorStop(0.58, `rgba(190, 222, 255, ${alpha * 0.28})`);
        glow.addColorStop(1, "rgba(126, 198, 255, 0)");

        core.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        core.addColorStop(0.16, `rgba(235, 248, 255, ${alpha * 0.96})`);
        core.addColorStop(0.46, `rgba(126, 198, 255, ${alpha * 0.78})`);
        core.addColorStop(1, "rgba(126, 198, 255, 0)");

        context.shadowBlur = meteor.flare ? 24 : 16;
        context.shadowColor = "rgba(126, 198, 255, 0.72)";
        context.strokeStyle = glow;
        context.lineWidth = meteor.width * 4.8;
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(meteor.x, meteor.y);
        context.stroke();

        context.shadowBlur = meteor.flare ? 14 : 9;
        context.strokeStyle = core;
        context.lineWidth = meteor.width * 1.2;
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(meteor.x, meteor.y);
        context.stroke();

        context.shadowBlur = meteor.flare ? 22 : 14;
        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.beginPath();
        context.arc(meteor.x, meteor.y, meteor.width * (meteor.flare ? 1.6 : 1.24), 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      };

      const drawMeteors = () => {
        if (!isMeteorScene()) return;

        meteorFrame += 1;
        const maxMeteors = width < 760 ? 4 : 6;
        const spawnEvery = width < 760 ? 34 : 24;
        if (meteors.length < maxMeteors && meteorFrame % spawnEvery === 0) {
          meteors.push(createMeteor());
        }

        context.save();
        context.lineCap = "round";
        context.lineJoin = "round";
        context.globalCompositeOperation = "lighter";

        for (let index = meteorTrails.length - 1; index >= 0; index -= 1) {
          const trail = meteorTrails[index];
          drawMeteorTrail(trail);
          trail.life -= 1;

          if (trail.life <= 0) {
            meteorTrails.splice(index, 1);
          }
        }

        for (let index = meteors.length - 1; index >= 0; index -= 1) {
          const meteor = meteors[index];
          drawMeteorHead(meteor);

          meteorTrails.push({
            x: meteor.x,
            y: meteor.y,
            dirX: meteor.dirX,
            dirY: meteor.dirY,
            length: meteor.length * 0.9,
            width: meteor.width * 0.84,
            alpha: meteor.alpha,
            life: 16,
            maxLife: 16
          });

          meteor.x += meteor.vx;
          meteor.y += meteor.vy;
          meteor.age += 1;
          meteor.life -= 1;

          if (meteor.life <= 0 || meteor.x < -meteor.length || meteor.y > height * 0.9 || meteor.y < -meteor.length) {
            meteors.splice(index, 1);
          }
        }

        context.restore();
      };

      const resetSceneParticles = () => {
        particles = Array.from({ length: pickParticleCount() }, () => createParticle(true));
        meteors = isMeteorScene()
          ? Array.from({ length: width < 760 ? 3 : 4 }, () => createMeteor(true))
          : [];
        meteorTrails = [];
        meteorFrame = 0;
        canvas.dataset.particleScene = activeScene;
      };

      const updateParticle = (particle, index) => {
        if (isMeteorScene()) {
          particle.drift += particle.type === "dust" ? 0.018 : 0.026;
          particle.x += particle.speedX + Math.sin(particle.drift) * 0.04;
          particle.y += particle.speedY + Math.cos(particle.drift * 0.7) * 0.035;

          if (particle.x > width + 96 || particle.x < -96 || particle.y < -72 || particle.y > height + 72) {
            particles[index] = createParticle(false);
          }

          return;
        }

        particles[index] = updateAmbientParticle(particle, activeScene, width, height, createParticle);
      };

      const refreshParticlesForScene = () => {
        const nextScene = getActiveScene();
        if (nextScene === activeScene) return;

        activeScene = nextScene;
        resetSceneParticles();
      };

      const tick = () => {
        refreshParticlesForScene();
        context.clearRect(0, 0, width, height);
        if (isMeteorScene()) {
          drawMeteorSky();
        } else {
          drawAmbientBackdrop(context, activeScene, width, height, "hero");
        }

        particles.forEach((particle, index) => {
          updateParticle(particle, index);
        });

        drawConstellationLinks();

        particles.forEach((particle) => {
          drawParticle(particle);
        });

        drawMeteors();
        context.globalAlpha = 1;
        context.globalCompositeOperation = "source-over";
        animationFrame = window.requestAnimationFrame(tick);
      };

      resizeCanvas();
      tick();
      window.addEventListener("resize", resizeCanvas);
      document.addEventListener(HERO_SCENE_CHANGE_EVENT, (event) => {
        activeScene = normalizeAmbientScene(event.detail?.scene || getActiveScene());
        resetSceneParticles();
      });

      reduceMotionQuery.addEventListener("change", () => {
        if (reduceMotionQuery.matches) {
          window.cancelAnimationFrame(animationFrame);
          canvas.hidden = true;
        } else {
          resizeCanvas();
          tick();
        }
      });
    };

    hero.addEventListener("pointermove", updatePointerMotion, { passive: true });
    hero.addEventListener("pointerleave", resetPointerMotion);
    window.addEventListener("scroll", queueScrollParallax, { passive: true });
    window.addEventListener("resize", queueScrollParallax);

    if (character) {
      character.addEventListener("click", showDialogue);
      character.addEventListener("pointerenter", () => hero.classList.add("is-character-near"));
      character.addEventListener("pointerleave", () => hero.classList.remove("is-character-near"));
    }

    syncCharacterAccessibility();
    mobileCharacterQuery.addEventListener("change", syncCharacterAccessibility);
    setupParticles();
    queueScrollParallax();
  };

  const setupPageHeaderAnimation = () => {
    const headers = document.querySelectorAll(".page-header-with-bg");
    if (headers.length === 0) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    headers.forEach((header) => {
      const bgImage = header.querySelector(".page-header-bg-image");
      if (!bgImage) return;

      const canvas = document.createElement("canvas");
      canvas.className = "page-header-particles";
      header.insertBefore(canvas, header.firstChild);

      let pointerFrame = 0;
      let scrollFrame = 0;
      const target = { x: 0, y: 0 };
      const current = { x: 0, y: 0 };

      const applyPointerMotion = () => {
        header.style.setProperty("--header-pointer-x", `${(current.x * 12).toFixed(2)}px`);
        header.style.setProperty("--header-pointer-y", `${(current.y * 8).toFixed(2)}px`);
        header.style.setProperty("--header-content-x", `${(current.x * 7).toFixed(2)}px`);
        header.style.setProperty("--header-content-y", `${(current.y * 6).toFixed(2)}px`);
      };

      const updatePointerFrame = () => {
        pointerFrame = 0;
        current.x += (target.x - current.x) * 0.16;
        current.y += (target.y - current.y) * 0.16;
        applyPointerMotion();

        if (Math.abs(target.x - current.x) > 0.004 || Math.abs(target.y - current.y) > 0.004) {
          queuePointerFrame();
        }
      };

      const queuePointerFrame = () => {
        if (!pointerFrame) {
          pointerFrame = window.requestAnimationFrame(updatePointerFrame);
        }
      };

      const updatePointerMotion = (event) => {
        if (reduceMotionQuery.matches) return;

        const rect = header.getBoundingClientRect();
        target.x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
        target.y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
        target.x = Math.max(-1, Math.min(1, target.x));
        target.y = Math.max(-1, Math.min(1, target.y));
        queuePointerFrame();
      };

      const resetPointerMotion = () => {
        target.x = 0;
        target.y = 0;
        queuePointerFrame();
      };

      const updateScrollParallax = () => {
        scrollFrame = 0;
        if (reduceMotionQuery.matches) return;

        const rect = header.getBoundingClientRect();
        const progress = Math.max(-0.2, Math.min(1, -rect.top / Math.max(1, rect.height)));
        header.style.setProperty("--header-scroll-y", `${(progress * 34).toFixed(2)}px`);
      };

      const queueScrollParallax = () => {
        if (!scrollFrame) {
          scrollFrame = window.requestAnimationFrame(updateScrollParallax);
        }
      };

      // Particle system
      const setupParticles = () => {
        if (reduceMotionQuery.matches) {
          canvas.hidden = true;
          return;
        }

        const context = canvas.getContext("2d", { alpha: true });
        if (!context) return;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let particles = [];
        let meteors = [];
        let meteorTrails = [];
        let meteorFrame = 0;
        let animationFrame = 0;
        const HERO_SCENE_CHANGE_EVENT = "odile:hero-scene-change";
        let activeScene = normalizeAmbientScene(document.body.dataset.heroScene);
        const getActiveScene = () => normalizeAmbientScene(document.body.dataset.heroScene);
        const isMeteorScene = () => activeScene === "meteor";

        const resize = () => {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          width = Math.max(1, header.offsetWidth);
          height = Math.max(1, header.offsetHeight);
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          context.setTransform(dpr, 0, 0, dpr, 0, 0);

          activeScene = getActiveScene();
          resetSceneParticles();
        };

        const pickParticleCount = () => {
          const mobileRatio = window.innerWidth < 760 ? 0.58 : 1;
          const coreRatio = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? 0.72 : 1;
          const sceneRatio = getAmbientSceneParticleRatio(activeScene, "header");
          return Math.max(12, Math.round((width / 36) * mobileRatio * coreRatio * sceneRatio));
        };

        const createParticle = (insideViewport = false) => {
          if (isMeteorScene()) {
            const roll = Math.random();
            const type = roll > 0.82 ? "glint" : "star";

            return {
              x: Math.random() * width,
              y: Math.random() * height * 0.76,
              radius: type === "glint" ? 1 + Math.random() * 1.2 : 0.62 + Math.random() * 1,
              opacity: type === "glint" ? 0.34 + Math.random() * 0.28 : 0.18 + Math.random() * 0.25,
              drift: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.012 + Math.random() * 0.018,
              type
            };
          }

          return createAmbientParticle(activeScene, width, height, insideViewport, "header");
        };

        const createHeaderMeteor = (insideViewport = false) => {
          const mobile = width < 760;
          const lane = Math.random();
          const angle = Math.PI - (0.22 + Math.random() * 0.09);
          const speed = mobile ? 2.55 + Math.random() * 1.05 : 3.3 + Math.random() * 1.35;
          const length = Math.min(width * (mobile ? 0.34 : 0.27), mobile ? 94 + Math.random() * 52 : 128 + Math.random() * 84);
          const dirX = Math.cos(angle);
          const dirY = Math.sin(angle);
          const pathStartX = width + 16 + Math.random() * width * 0.1;
          const pathStartY = height * (-0.05 + lane * 0.26);
          const endX = width * (mobile ? 0.13 : 0.27);
          const pathLife = Math.round((pathStartX - endX) / Math.max(1, -dirX * speed));
          const maxLife = Math.max(mobile ? 86 : 140, Math.min(mobile ? 168 : 360, pathLife));
          const startAge = insideViewport ? Math.floor(maxLife * (0.08 + Math.random() * 0.68)) : 0;

          return {
            x: pathStartX + dirX * speed * startAge,
            y: pathStartY + dirY * speed * startAge,
            vx: dirX * speed,
            vy: dirY * speed,
            dirX,
            dirY,
            length,
            width: mobile ? 1.44 + Math.random() * 0.58 : 1.72 + Math.random() * 0.86,
            alpha: 0.82 + Math.random() * 0.16,
            age: startAge,
            life: maxLife - startAge,
            maxLife,
            flare: Math.random() > 0.9
          };
        };

        const drawHeaderMeteorTrail = (trail) => {
          const progress = trail.life / trail.maxLife;
          const tailX = trail.x - trail.dirX * trail.length;
          const tailY = trail.y - trail.dirY * trail.length;
          const gradient = context.createLinearGradient(trail.x, trail.y, tailX, tailY);

          gradient.addColorStop(0, `rgba(255, 255, 255, ${trail.alpha * progress * 0.64})`);
          gradient.addColorStop(0.28, `rgba(126, 198, 255, ${trail.alpha * progress * 0.48})`);
          gradient.addColorStop(0.62, `rgba(196, 226, 255, ${trail.alpha * progress * 0.18})`);
          gradient.addColorStop(1, "rgba(126, 198, 255, 0)");

          context.strokeStyle = gradient;
          context.lineWidth = Math.max(1.34, trail.width * progress * 1.16);
          context.beginPath();
          context.moveTo(tailX, tailY);
          context.lineTo(trail.x, trail.y);
          context.stroke();
        };

        const drawHeaderMeteor = (meteor) => {
          const fadeIn = Math.min(1, meteor.age / 14);
          const fadeOut = Math.min(1, meteor.life / (meteor.maxLife * 0.3));
          const alpha = meteor.alpha * fadeIn * fadeOut;
          const tailX = meteor.x - meteor.dirX * meteor.length;
          const tailY = meteor.y - meteor.dirY * meteor.length;
          const glow = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
          const core = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);

          glow.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.62})`);
          glow.addColorStop(0.26, `rgba(126, 198, 255, ${alpha * 0.56})`);
          glow.addColorStop(0.62, `rgba(196, 226, 255, ${alpha * 0.26})`);
          glow.addColorStop(1, "rgba(126, 198, 255, 0)");
          core.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          core.addColorStop(0.22, `rgba(232, 247, 255, ${alpha * 0.94})`);
          core.addColorStop(0.48, `rgba(126, 198, 255, ${alpha * 0.74})`);
          core.addColorStop(1, "rgba(126, 198, 255, 0)");

          context.shadowBlur = meteor.flare ? 23 : 17;
          context.shadowColor = "rgba(126, 198, 255, 0.72)";
          context.strokeStyle = glow;
          context.lineWidth = meteor.width * 4.65;
          context.beginPath();
          context.moveTo(tailX, tailY);
          context.lineTo(meteor.x, meteor.y);
          context.stroke();

          context.shadowBlur = meteor.flare ? 13 : 9;
          context.strokeStyle = core;
          context.lineWidth = meteor.width * 1.18;
          context.beginPath();
          context.moveTo(tailX, tailY);
          context.lineTo(meteor.x, meteor.y);
          context.stroke();

          context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          context.beginPath();
          context.arc(meteor.x, meteor.y, meteor.width * (meteor.flare ? 1.52 : 1.22), 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0;
        };

        const drawHeaderMeteorScene = () => {
          meteorFrame += 1;
          const maxMeteors = width < 760 ? 4 : 6;
          const spawnEvery = width < 760 ? 34 : 26;

          if (meteors.length < maxMeteors && meteorFrame % spawnEvery === 0) {
            meteors.push(createHeaderMeteor());
          }

          context.save();
          context.lineCap = "round";
          context.lineJoin = "round";
          context.globalCompositeOperation = "lighter";

          particles.forEach((p) => {
            p.drift += p.twinkleSpeed;
            const pulse = 0.68 + Math.sin(p.drift) * 0.32;
            context.globalAlpha = p.opacity * pulse;
            context.fillStyle = p.type === "glint" ? "#f8fdff" : "#cfeaff";
            context.beginPath();
            context.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
            context.fill();
          });

          for (let index = meteorTrails.length - 1; index >= 0; index -= 1) {
            const trail = meteorTrails[index];
            drawHeaderMeteorTrail(trail);
            trail.life -= 1;

            if (trail.life <= 0) {
              meteorTrails.splice(index, 1);
            }
          }

          for (let index = meteors.length - 1; index >= 0; index -= 1) {
            const meteor = meteors[index];
            drawHeaderMeteor(meteor);

            meteorTrails.push({
              x: meteor.x,
              y: meteor.y,
              dirX: meteor.dirX,
              dirY: meteor.dirY,
              length: meteor.length * 0.86,
              width: meteor.width * 0.82,
              alpha: meteor.alpha,
              life: 14,
              maxLife: 14
            });

            meteor.x += meteor.vx;
            meteor.y += meteor.vy;
            meteor.age += 1;
            meteor.life -= 1;

            if (meteor.life <= 0 || meteor.x < -meteor.length || meteor.y > height + meteor.length * 0.25 || meteor.y < -meteor.length) {
              meteors.splice(index, 1);
            }
          }

          context.restore();
        };

        const resetSceneParticles = () => {
          particles = Array.from({ length: pickParticleCount() }, () => createParticle(true));
          meteors = isMeteorScene()
            ? Array.from({ length: width < 760 ? 3 : 4 }, () => createHeaderMeteor(true))
            : [];
          meteorTrails = [];
          meteorFrame = 0;
          canvas.dataset.particleScene = activeScene;
        };

        const animate = () => {
          context.clearRect(0, 0, width, height);

          const nextScene = getActiveScene();
          if (nextScene !== activeScene) {
            activeScene = nextScene;
            resetSceneParticles();
          }

          if (isMeteorScene()) {
            drawHeaderMeteorScene();
            animationFrame = window.requestAnimationFrame(animate);
            return;
          }

          particles.forEach((p, index) => {
            particles[index] = updateAmbientParticle(p, activeScene, width, height, createParticle);
          });

          drawAmbientBackdrop(context, activeScene, width, height, "header");
          drawAmbientLinks(context, particles, activeScene, "header");

          particles.forEach((p) => {
            drawAmbientParticle(context, p, activeScene, "header");
          });

          animationFrame = window.requestAnimationFrame(animate);
        };

        resize();
        animate();

        window.addEventListener("resize", resize);
        document.addEventListener(HERO_SCENE_CHANGE_EVENT, () => {
          activeScene = getActiveScene();
          resetSceneParticles();
        });

        return () => {
          window.cancelAnimationFrame(animationFrame);
          window.removeEventListener("resize", resize);
        };
      };

      // Event listeners
      header.addEventListener("pointermove", updatePointerMotion, { passive: true });
      header.addEventListener("pointerleave", resetPointerMotion);
      window.addEventListener("scroll", queueScrollParallax, { passive: true });
      window.addEventListener("resize", queueScrollParallax);

      setupParticles();
      queueScrollParallax();
    });
  };

  const setupPointerTrail = () => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotionQuery.matches || document.querySelector(".pointer-trail-layer")) return;

    const canvas = document.createElement("canvas");
    canvas.className = "pointer-trail-layer";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let moveFrame = 0;
    let latestPoint = null;
    let lastPoint = null;
    const particles = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const getTrailColor = () => (
      getComputedStyle(document.body).getPropertyValue("--burst-color").trim() || "#d9f0e4"
    );

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        const progress = particle.life / particle.maxLife;
        context.globalAlpha = progress * particle.alpha;
        context.strokeStyle = particle.color;
        context.lineWidth = Math.max(0.4, particle.width * progress);
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x - particle.vx * 8, particle.y - particle.vy * 8);
        context.stroke();

        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * (0.7 + progress * 0.4), 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      if (particles.length > 0) {
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        animationFrame = 0;
      }
    };

    const spawnTrail = (x, y, distance) => {
      const color = getTrailColor();
      const count = distance > 28 ? 5 : 3;

      for (let index = 0; index < count; index += 1) {
        const drift = (Math.random() - 0.5) * 0.78;
        const lift = -0.12 - Math.random() * 0.36;
        const speed = Math.min(1.05, 0.2 + distance / 110);
        const life = 24 + Math.floor(Math.random() * 20);

        particles.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y + (Math.random() - 0.5) * 4,
          vx: drift * speed,
          vy: lift * speed,
          radius: 1.2 + Math.random() * 2.4,
          width: 1.2 + Math.random() * 2.2,
          alpha: 0.32 + Math.random() * 0.26,
          life,
          maxLife: life,
          color
        });
      }

      if (particles.length > 260) {
        particles.splice(0, particles.length - 260);
      }

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const queueTrail = (event) => {
      if (reduceMotionQuery.matches || event.pointerType === "touch") return;

      latestPoint = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now()
      };

      if (moveFrame) return;

      moveFrame = window.requestAnimationFrame(() => {
        moveFrame = 0;
        if (!latestPoint) return;

        const distance = lastPoint
          ? Math.hypot(latestPoint.x - lastPoint.x, latestPoint.y - lastPoint.y)
          : 12;
        const elapsed = lastPoint ? latestPoint.time - lastPoint.time : 100;

        if (distance >= 3 || elapsed > 56) {
          spawnTrail(latestPoint.x, latestPoint.y, distance);
          lastPoint = latestPoint;
        }
      });
    };

    const resetTrail = () => {
      lastPoint = null;
      latestPoint = null;
    };

    document.addEventListener("pointermove", queueTrail, { passive: true });
    document.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) resetTrail();
    }, { passive: true });
    window.addEventListener("blur", resetTrail);
    window.addEventListener("resize", resize);
    reduceMotionQuery.addEventListener("change", () => {
      canvas.hidden = reduceMotionQuery.matches;
      if (reduceMotionQuery.matches) {
        particles.length = 0;
        context.clearRect(0, 0, width, height);
      }
    });

    resize();
  };

  const setupAmbientSceneLayer = () => {
    if (document.querySelector("[data-anime-hero], .page-header-with-bg, .ambient-scene-layer")) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = document.createElement("canvas");
    canvas.className = "ambient-scene-layer";
    canvas.setAttribute("aria-hidden", "true");
    canvas.hidden = true;
    document.body.appendChild(canvas);

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const HERO_SCENE_CHANGE_EVENT = "odile:hero-scene-change";
    let activeScene = normalizeAmbientScene(document.body.dataset.heroScene);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let meteorFrame = 0;
    let particles = [];
    let meteors = [];
    let trails = [];

    const isMeteorScene = () => activeScene === "meteor";

    const resize = () => {
      width = window.innerWidth;
      height = Math.max(320, Math.min(window.innerHeight * 0.68, 660));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const pickParticleCount = () => {
      const mobileRatio = window.innerWidth < 760 ? 0.64 : 1;
      const coreRatio = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? 0.72 : 1;
      const sceneRatio = getAmbientSceneParticleRatio(activeScene, "ambient");
      return Math.max(14, Math.round((width / 38) * mobileRatio * coreRatio * sceneRatio));
    };

    const createParticle = (insideViewport = false) => {
      return createAmbientParticle(activeScene, width, height, insideViewport, "ambient");
    };

    const createMeteor = (insideViewport = false) => {
      const mobile = width < 760;
      const lane = Math.random();
      const angle = Math.PI - (0.22 + Math.random() * 0.09);
      const speed = mobile ? 2.5 + Math.random() * 1.05 : 3.25 + Math.random() * 1.35;
      const length = Math.min(width * (mobile ? 0.33 : 0.26), mobile ? 92 + Math.random() * 52 : 124 + Math.random() * 82);
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const pathStartX = width + 18 + Math.random() * width * 0.1;
      const pathStartY = height * (-0.05 + lane * 0.28);
      const endX = width * (mobile ? 0.13 : 0.27);
      const pathLife = Math.round((pathStartX - endX) / Math.max(1, -dirX * speed));
      const maxLife = Math.max(mobile ? 84 : 138, Math.min(mobile ? 166 : 360, pathLife));
      const startAge = insideViewport ? Math.floor(maxLife * (0.08 + Math.random() * 0.68)) : 0;

      return {
        x: pathStartX + dirX * speed * startAge,
        y: pathStartY + dirY * speed * startAge,
        vx: dirX * speed,
        vy: dirY * speed,
        dirX,
        dirY,
        length,
        width: mobile ? 1.38 + Math.random() * 0.56 : 1.64 + Math.random() * 0.82,
        alpha: 0.8 + Math.random() * 0.18,
        age: startAge,
        life: maxLife - startAge,
        maxLife,
        flare: Math.random() > 0.91
      };
    };

    const reset = () => {
      particles = isMeteorScene()
        ? []
        : Array.from({ length: pickParticleCount() }, () => createParticle(true));
      meteors = isMeteorScene()
        ? Array.from({ length: width < 760 ? 2 : 3 }, () => createMeteor(true))
        : [];
      trails = [];
      meteorFrame = 0;
      canvas.dataset.particleScene = activeScene;
    };

    const drawTrail = (trail) => {
      const progress = trail.life / trail.maxLife;
      const tailX = trail.x - trail.dirX * trail.length;
      const tailY = trail.y - trail.dirY * trail.length;
      const gradient = context.createLinearGradient(trail.x, trail.y, tailX, tailY);

      gradient.addColorStop(0, `rgba(255, 255, 255, ${trail.alpha * progress * 0.6})`);
      gradient.addColorStop(0.32, `rgba(126, 198, 255, ${trail.alpha * progress * 0.44})`);
      gradient.addColorStop(0.64, `rgba(196, 226, 255, ${trail.alpha * progress * 0.17})`);
      gradient.addColorStop(1, "rgba(126, 198, 255, 0)");
      context.strokeStyle = gradient;
      context.lineWidth = Math.max(1.24, trail.width * progress * 1.14);
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(trail.x, trail.y);
      context.stroke();
    };

    const drawMeteor = (meteor) => {
      const fadeIn = Math.min(1, meteor.age / 14);
      const fadeOut = Math.min(1, meteor.life / (meteor.maxLife * 0.3));
      const alpha = meteor.alpha * fadeIn * fadeOut;
      const tailX = meteor.x - meteor.dirX * meteor.length;
      const tailY = meteor.y - meteor.dirY * meteor.length;
      const glow = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
      const core = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);

      glow.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.58})`);
      glow.addColorStop(0.28, `rgba(126, 198, 255, ${alpha * 0.52})`);
      glow.addColorStop(0.64, `rgba(196, 226, 255, ${alpha * 0.24})`);
      glow.addColorStop(1, "rgba(126, 198, 255, 0)");
      core.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      core.addColorStop(0.24, `rgba(232, 247, 255, ${alpha * 0.92})`);
      core.addColorStop(0.5, `rgba(126, 198, 255, ${alpha * 0.7})`);
      core.addColorStop(1, "rgba(126, 198, 255, 0)");

      context.shadowBlur = meteor.flare ? 22 : 16;
      context.shadowColor = "rgba(126, 198, 255, 0.7)";
      context.strokeStyle = glow;
      context.lineWidth = meteor.width * 4.45;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(meteor.x, meteor.y);
      context.stroke();

      context.shadowBlur = meteor.flare ? 12 : 9;
      context.strokeStyle = core;
      context.lineWidth = meteor.width * 1.17;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(meteor.x, meteor.y);
      context.stroke();

      context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      context.beginPath();
      context.arc(meteor.x, meteor.y, meteor.width * (meteor.flare ? 1.48 : 1.2), 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    };

    const tick = () => {
      animationFrame = 0;

      if (reduceMotionQuery.matches) {
        canvas.hidden = true;
        context.clearRect(0, 0, width, height);
        return;
      }

      canvas.hidden = false;
      context.clearRect(0, 0, width, height);

      if (!isMeteorScene()) {
        drawAmbientBackdrop(context, activeScene, width, height, "ambient");

        particles.forEach((particle, index) => {
          particles[index] = updateAmbientParticle(particle, activeScene, width, height, createParticle);
        });

        drawAmbientLinks(context, particles, activeScene, "ambient");

        particles.forEach((particle) => {
          drawAmbientParticle(context, particle, activeScene, "ambient");
        });

        animationFrame = window.requestAnimationFrame(tick);
        return;
      }

      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalCompositeOperation = "lighter";

      meteorFrame += 1;
      const maxMeteors = width < 760 ? 4 : 5;
      const spawnEvery = width < 760 ? 38 : 28;
      if (meteors.length < maxMeteors && meteorFrame % spawnEvery === 0) {
        meteors.push(createMeteor());
      }

      for (let index = trails.length - 1; index >= 0; index -= 1) {
        const trail = trails[index];
        drawTrail(trail);
        trail.life -= 1;
        if (trail.life <= 0) trails.splice(index, 1);
      }

      for (let index = meteors.length - 1; index >= 0; index -= 1) {
        const meteor = meteors[index];
        drawMeteor(meteor);
        trails.push({
          x: meteor.x,
          y: meteor.y,
          dirX: meteor.dirX,
          dirY: meteor.dirY,
          length: meteor.length * 0.84,
          width: meteor.width * 0.8,
          alpha: meteor.alpha,
          life: 14,
          maxLife: 14
        });

        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.age += 1;
        meteor.life -= 1;

        if (meteor.life <= 0 || meteor.x < -meteor.length || meteor.y > height + meteor.length * 0.25 || meteor.y < -meteor.length) {
          meteors.splice(index, 1);
        }
      }

      context.restore();
      animationFrame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    resize();
    reset();
    start();

    window.addEventListener("resize", () => {
      resize();
      reset();
      start();
    });

    document.addEventListener(HERO_SCENE_CHANGE_EVENT, (event) => {
      activeScene = normalizeAmbientScene(event.detail?.scene || document.body.dataset.heroScene);
      reset();
      start();
    });

    reduceMotionQuery.addEventListener("change", () => {
      reset();
      start();
    });
  };

  const setupClickBurst = () => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotionQuery.matches || document.querySelector(".click-burst-layer")) return;

    const canvas = document.createElement("canvas");
    canvas.className = "click-burst-layer";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    const particles = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.015;
        particle.life -= 1;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        const progress = particle.life / particle.maxLife;
        context.globalAlpha = progress * particle.alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * (1.2 - progress * 0.2), 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      if (particles.length > 0) {
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        animationFrame = 0;
      }
    };

    const burst = (x, y) => {
      const color = getComputedStyle(document.body).getPropertyValue("--burst-color").trim() || "#d9f0e4";
      const count = window.innerWidth < 760 ? 12 : 18;

      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.42;
        const speed = 1.2 + Math.random() * 2.4;
        const life = 28 + Math.floor(Math.random() * 18);

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.6 + Math.random() * 2.8,
          alpha: 0.42 + Math.random() * 0.3,
          life,
          maxLife: life,
          color
        });
      }

      if (particles.length > 220) {
        particles.splice(0, particles.length - 220);
      }

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    document.addEventListener("pointerdown", (event) => {
      if (event.button && event.button !== 0) return;

      const target = event.target.closest("a, button, .glass-card, .gallery-tile, .topic-item");
      if (!target) return;

      burst(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("resize", resize);
    resize();
  };

  const setupAmbientControls = () => {
    if (document.querySelector("[data-ambient-panel]")) return;

    const STORAGE_KEY = "odile-bg-preferences";
    const PREFERENCES_VERSION = 5;
    const HERO_SCENE_CHANGE_EVENT = "odile:hero-scene-change";
    const DEFAULT_SKIN = "snow";
    const DEFAULT_SCENE = "snow";
    const VALID_SKINS = new Set(["snow", "frost-dark", "film", "dark", "midnight", "noir", "fog-blue", "dusk-purple", "warm-night", "morning-mist", "sea-salt", "deep-forest", "carbon", "rain-night"]);
    const VALID_SCENES = AMBIENT_SCENES;
    const VALID_THEMES = new Set(["morning", "day", "dusk", "night"]);

    const readPreferences = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};

        const preferences = JSON.parse(raw);
        if (!preferences || typeof preferences !== "object") return {};

        if (preferences.version !== PREFERENCES_VERSION) {
          return {
            ...preferences,
            version: PREFERENCES_VERSION,
            scene: DEFAULT_SCENE
          };
        }

        return preferences;
      } catch {
        return {};
      }
    };

    const writePreferences = (preferences) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch {
        // Theme still works for the current page if storage is unavailable.
      }
    };

    const getTimeTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 10) return "morning";
      if (hour >= 10 && hour < 17) return "day";
      if (hour >= 17 && hour < 20) return "dusk";
      return "night";
    };

    const normalizeSkinPreference = (preferences = {}) => {
      return VALID_SKINS.has(preferences.skin) ? preferences.skin : DEFAULT_SKIN;
    };

    const normalizeScenePreference = (preferences = {}) => {
      return VALID_SCENES.has(preferences.scene) ? preferences.scene : DEFAULT_SCENE;
    };

    const panel = document.createElement("div");
    panel.className = "ambient-panel";
    panel.dataset.ambientPanel = "";
    panel.innerHTML = `
      <button class="ambient-toggle" type="button" aria-label="背景设置" aria-expanded="false">◐</button>
      <div class="ambient-popover" hidden>
        <div class="ambient-heading">
          <div>
            <strong>背景设置</strong>
            <span>全站同步</span>
          </div>
          <button class="ambient-close" type="button" aria-label="关闭背景设置">×</button>
        </div>
        <div class="ambient-group">
          <div class="ambient-title">时段</div>
          <div class="ambient-options">
            <button class="ambient-chip" type="button" data-ambient-auto>自动</button>
            <button class="ambient-chip" type="button" data-ambient-theme="morning">晨间</button>
            <button class="ambient-chip" type="button" data-ambient-theme="day">白昼</button>
            <button class="ambient-chip" type="button" data-ambient-theme="dusk">傍晚</button>
            <button class="ambient-chip" type="button" data-ambient-theme="night">夜色</button>
          </div>
        </div>
        <div class="ambient-group">
          <div class="ambient-title">风格</div>
          <div class="ambient-options">
            <button class="ambient-chip" type="button" data-bg-skin="snow">霜色</button>
            <button class="ambient-chip" type="button" data-bg-skin="frost-dark">暗霜</button>
            <button class="ambient-chip" type="button" data-bg-skin="film">胶片</button>
            <button class="ambient-chip" type="button" data-bg-skin="dark">深海</button>
            <button class="ambient-chip" type="button" data-bg-skin="midnight">星幕</button>
            <button class="ambient-chip" type="button" data-bg-skin="noir">黑金</button>
            <button class="ambient-chip" type="button" data-bg-skin="fog-blue">雾蓝</button>
            <button class="ambient-chip" type="button" data-bg-skin="dusk-purple">暮紫</button>
            <button class="ambient-chip" type="button" data-bg-skin="warm-night">暖夜</button>
            <button class="ambient-chip" type="button" data-bg-skin="morning-mist">晨雾</button>
            <button class="ambient-chip" type="button" data-bg-skin="sea-salt">海盐</button>
            <button class="ambient-chip" type="button" data-bg-skin="deep-forest">深林</button>
            <button class="ambient-chip" type="button" data-bg-skin="carbon">碳灰</button>
            <button class="ambient-chip" type="button" data-bg-skin="rain-night">雨夜</button>
          </div>
        </div>
        <div class="ambient-group">
          <div class="ambient-title">场景</div>
          <div class="ambient-options">
            <button class="ambient-chip" type="button" data-hero-scene="snow">下雪</button>
            <button class="ambient-chip" type="button" data-hero-scene="meteor">流星</button>
            <button class="ambient-chip" type="button" data-hero-scene="fireflies">萤火</button>
            <button class="ambient-chip" type="button" data-hero-scene="sakura">樱花</button>
            <button class="ambient-chip" type="button" data-hero-scene="aurora">极光</button>
            <button class="ambient-chip" type="button" data-hero-scene="ocean">海光</button>
            <button class="ambient-chip" type="button" data-hero-scene="moonlight">月雾</button>
            <button class="ambient-chip" type="button" data-hero-scene="autumn">秋叶</button>
            <button class="ambient-chip" type="button" data-hero-scene="stardust">星尘</button>
            <button class="ambient-chip" type="button" data-hero-scene="lightdust">光尘</button>
            <button class="ambient-chip" type="button" data-hero-scene="galaxy">银河</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    const toggle = panel.querySelector(".ambient-toggle");
    const popover = panel.querySelector(".ambient-popover");
    const close = panel.querySelector(".ambient-close");
    const autoButton = panel.querySelector("[data-ambient-auto]");
    const themeButtons = Array.from(panel.querySelectorAll("[data-ambient-theme]"));
    const skinButtons = Array.from(panel.querySelectorAll("[data-bg-skin]"));
    const sceneButtons = Array.from(panel.querySelectorAll("[data-hero-scene]"));
    const initialPreferences = readPreferences();
    let autoMode = initialPreferences.autoMode !== false;
    let currentTheme = VALID_THEMES.has(initialPreferences.theme) ? initialPreferences.theme : getTimeTheme();
    let currentSkin = normalizeSkinPreference(initialPreferences);
    let currentScene = normalizeScenePreference(initialPreferences);

    const setOpen = (open) => {
      panel.classList.toggle("is-open", open);
      popover.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };

    const pulsePreview = () => {
      document.body.classList.remove("is-bg-previewing");
      window.requestAnimationFrame(() => {
        document.body.classList.add("is-bg-previewing");
        window.setTimeout(() => document.body.classList.remove("is-bg-previewing"), 520);
      });
    };

    const applyTheme = (theme, preview = true) => {
      currentTheme = VALID_THEMES.has(theme) ? theme : getTimeTheme();
      document.body.dataset.ambientTheme = currentTheme;
      themeButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.ambientTheme === currentTheme);
      });
      autoButton.classList.toggle("is-active", autoMode);
      if (preview) pulsePreview();
    };

    const applySkin = (skin, preview = true) => {
      currentSkin = VALID_SKINS.has(skin) ? skin : DEFAULT_SKIN;
      document.body.dataset.bgSkin = currentSkin;
      skinButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.bgSkin === currentSkin);
      });
      if (preview) pulsePreview();
    };

    const applyScene = (scene, preview = true) => {
      const previousScene = currentScene;
      currentScene = VALID_SCENES.has(scene) ? scene : DEFAULT_SCENE;
      document.body.dataset.heroScene = currentScene;
      sceneButtons.forEach((button) => {
        const isActive = button.dataset.heroScene === currentScene;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      document.dispatchEvent(new CustomEvent(HERO_SCENE_CHANGE_EVENT, {
        detail: {
          scene: currentScene,
          previousScene,
          changed: previousScene !== currentScene
        }
      }));
      if (preview) pulsePreview();
    };

    const applyPreferences = (preferences, preview = true) => {
      autoMode = preferences.autoMode !== false;
      currentTheme = VALID_THEMES.has(preferences.theme) ? preferences.theme : getTimeTheme();
      currentSkin = normalizeSkinPreference(preferences);
      currentScene = normalizeScenePreference(preferences);
      applyTheme(autoMode ? getTimeTheme() : currentTheme, preview);
      applySkin(currentSkin, preview);
      applyScene(currentScene, preview);
    };

    const saveCurrentPreferences = () => {
      writePreferences({
        version: PREFERENCES_VERSION,
        autoMode,
        theme: currentTheme,
        skin: currentSkin,
        scene: currentScene
      });
    };

    toggle.addEventListener("click", () => setOpen(popover.hidden));
    close.addEventListener("click", () => setOpen(false));

    autoButton.addEventListener("click", () => {
      autoMode = true;
      applyTheme(getTimeTheme());
      saveCurrentPreferences();
    });

    themeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        autoMode = false;
        applyTheme(button.dataset.ambientTheme);
        saveCurrentPreferences();
      });
    });

    skinButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applySkin(button.dataset.bgSkin);
        saveCurrentPreferences();
      });
    });

    sceneButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyScene(button.dataset.heroScene);
        saveCurrentPreferences();
      });
    });

    document.addEventListener("pointerdown", (event) => {
      if (!panel.contains(event.target)) {
        setOpen(false);
      }
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.key && event.key !== STORAGE_KEY) return;
      applyPreferences(readPreferences());
    });

    window.setInterval(() => {
      if (autoMode) {
        applyTheme(getTimeTheme());
        saveCurrentPreferences();
      }
    }, 300000);

    applyPreferences(initialPreferences, false);
    saveCurrentPreferences();
  };

  setCurrentYear();
  highlightCurrentNav();
  setupBackToTop();
  setupPostSearch();
  setupReadingProgress();
  setupCodeCopy();
  setupTOC();
  setupTagFilter();
  animateStats();
  setupLocalTime();
  setupMoodPicker();
  setupAmbientControls();
  setupAmbientSceneLayer();
  setupPointerTrail();
  setupClickBurst();
  setupAnimeHero();
  setupPageHeaderAnimation();
})();
