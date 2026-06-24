(() => {
  const setCurrentYear = () => {
    const year = new Date().getFullYear();
    document.querySelectorAll("[data-year], #year").forEach((node) => {
      node.textContent = year;
    });
  };

  const ensureVisitorNavLink = () => {
    document.querySelectorAll(".nav-links").forEach((nav) => {
      if (nav.querySelector('[data-nav="visitor"]')) return;

      const link = document.createElement("a");
      const inPost = window.location.pathname.replace(/\\/g, "/").includes("/posts/");
      link.href = inPost ? "../visitor.html" : "./visitor.html";
      link.dataset.nav = "visitor";
      link.textContent = "访客";

      const githubLink = Array.from(nav.querySelectorAll("a")).find((item) => /github/i.test(item.textContent || item.href));
      nav.insertBefore(link, githubLink || null);
    });
  };

  const highlightCurrentNav = () => {
    const path = window.location.pathname.replace(/\\/g, "/");
    const file = path.split("/").pop() || "index.html";
    let current = document.body.dataset.page || "home";

    if (path.includes("/posts/") || file === "posts.html") {
      current = "articles";
    } else if (file === "visitor.html" || file === "visitor-records.html") {
      current = "visitor";
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

  const setupVisitorTracking = () => {
    if (document.body.dataset.page === "visitor" || document.body.dataset.page === "visitor-records") return;
    if (!window.fetch) return;

    const getSessionId = () => {
      const key = "bookerVisitorSessionId";
      try {
        let value = window.localStorage.getItem(key);
        if (!value) {
          value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
          window.localStorage.setItem(key, value);
        }
        return value;
      } catch {
        return "";
      }
    };

    const payload = {
      path: `${window.location.pathname}${window.location.search}`,
      title: document.title,
      referrer: document.referrer,
      language: navigator.language,
      screen: window.screen ? `${window.screen.width}x${window.screen.height}` : "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionId: getSessionId()
    };

    window.fetch("/api/visit", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Static previews can run without the visitor API.
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
        if (!Number.isFinite(target)) {
          observer.unobserve(stat);
          return;
        }
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

  const setupAssistant = () => {
    const inPost = window.location.pathname.replace(/\\/g, "/").includes("/posts/");
    const prefix = inPost ? "../" : "./";
    const STORE_KEY = "bookerAssistantRoundCard";

    const getHour = () => new Date().getHours();

    const TIME_GREETINGS = {
      morning: [
        "早安~ 新的一天从这里开始吧！",
        "清晨的阳光很好，适合读点东西。",
        "早起的你真棒，来杯咖啡吧~"
      ],
      afternoon: [
        "下午好~ 午后适合慢慢浏览。",
        "阳光正暖，随便逛逛吧。",
        "下午茶时间，歇一歇~"
      ],
      evening: [
        "晚上好~ 夜晚适合安静地阅读。",
        "忙了一天辛苦啦，放松一下吧。",
        "夜色很美，陪你待一会儿~"
      ],
      night: [
        "夜深了，还没休息吗？",
        "熬夜伤身体哦，看完这篇就早点睡吧~",
        "深夜的灵感格外珍贵，记下来~"
      ]
    };

    const getTimeGreeting = () => {
      const h = getHour();
      if (h >= 6 && h < 12) return pickRandom(TIME_GREETINGS.morning);
      if (h >= 12 && h < 18) return pickRandom(TIME_GREETINGS.afternoon);
      if (h >= 18 && h < 23) return pickRandom(TIME_GREETINGS.evening);
      return pickRandom(TIME_GREETINGS.night);
    };

    const PAGE_CONTEXT = {
      home: [
        "这里是首页，可以看看最新文章~",
        "试试点击角色，会有彩蛋哦！",
        "右下角可以切换主题氛围~"
      ],
      articles: [
        "文章列表在这里，可以按标签筛选~",
        "搜索功能很方便，试试关键词~",
        "每篇文章都有目录导航哦~"
      ],
      gallery: [
        "相册记录了日常的美好瞬间~",
        "点击图片可以放大查看~",
        "这些照片都是生活里的小确幸。"
      ],
      projects: [
        "这里是项目展示区~",
        "每个项目都是认真做的成果！",
        "感兴趣可以去 GitHub 看看源码~"
      ],
      about: [
        "这是关于站长的介绍页~",
        "想了解更多可以看看这里。",
        "有合作想法欢迎联系~"
      ]
    };

    const IDLE_LINES = [
      "霜色正好，适合写一点长久的东西。",
      "新的灵感来了，要不要先记下来？",
      "火光很小也够暖，雪夜里尤其如此。",
      "别急，先把今天这一页写漂亮。",
      "抬头看看天空，或许会有流星哦。",
      "代码和诗都需要耐心~",
      "今天的你也很努力呢！",
      "偶尔偷懒也是可以的啦~",
      "喝口水吧，保持好状态~",
      "窗外的风景也很不错哦。"
    ];

    const TIPS = [
      "试试右下角的主题切换面板，可以换肤哦~",
      "首页的角色点击可以触发台词！",
      "切换不同的氛围场景，体验不同的视觉效果~",
      "文章页面有阅读进度条和目录导航~",
      "相册页面可以浏览日常照片记录~",
      "你可以拖动我到任何位置哦~",
      "双击我的头像可以切换表情！"
    ];

    const EXPRESSIONS = ["default", "happy", "thinking", "sleeping"];

    const currentPage = document.body.dataset.page || "home";

    const ACTIONS = [
      { label: "最新文章", icon: "📖", href: `${prefix}posts/computer-vision-gaze.html` },
      { label: "看看项目", icon: "🔬", href: `${prefix}projects.html` },
      { label: "逛逛相册", icon: "📷", href: `${prefix}gallery.html` },
      { label: "小贴士", icon: "💡", action: "tip" },
      { label: "换个话题", icon: "💬", action: "chat" },
      { label: "页面导航", icon: "🧭", action: "context" },
      { label: "戳一戳", icon: "👆", action: "poke" }
    ];

    const readStore = () => {
      try {
        return JSON.parse(window.localStorage.getItem(STORE_KEY)) || {};
      } catch { return {}; }
    };

    const writeStore = (patch) => {
      try {
        const data = Object.assign(readStore(), patch);
        window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
      } catch {}
    };

    const widget = document.createElement("div");
    widget.className = "assistant-widget";
    widget.innerHTML = `
      <div class="assistant-bubble" data-assistant-bubble></div>
      <div class="assistant-panel" data-assistant-panel>
        <div class="assistant-panel-header">
          <img src="${prefix}pictures/character-guqinghan-hutao.webp" alt="">
          <div class="assistant-panel-header-info">
            <strong>清寒 & 胡桃</strong>
            <span data-assistant-status-text>小助手在线中~</span>
          </div>
          <button class="assistant-panel-close" data-assistant-close aria-label="关闭面板">&times;</button>
        </div>
        <div class="assistant-panel-messages" data-assistant-messages></div>
        <div class="assistant-panel-actions" data-assistant-actions></div>
      </div>
      <button class="assistant-avatar" data-assistant-toggle aria-label="打开小助手">
        <img src="${prefix}pictures/character-guqinghan-hutao.webp" alt="小助手">
        <span class="assistant-expression" data-assistant-expr></span>
        <span class="assistant-status"></span>
      </button>
    `;

    document.body.appendChild(widget);

    const bubble = widget.querySelector("[data-assistant-bubble]");
    const panel = widget.querySelector("[data-assistant-panel]");
    const messages = widget.querySelector("[data-assistant-messages]");
    const actionsContainer = widget.querySelector("[data-assistant-actions]");
    const toggleBtn = widget.querySelector("[data-assistant-toggle]");
    const closeBtn = widget.querySelector("[data-assistant-close]");
    const exprEl = widget.querySelector("[data-assistant-expr]");
    const statusText = widget.querySelector("[data-assistant-status-text]");

    let panelOpen = false;
    let bubbleTimer = 0;
    let idleTimer = 0;
    let pokeCount = 0;
    let currentExpr = "default";
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragThreshold = false;

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const setExpression = (expr) => {
      currentExpr = expr;
      exprEl.dataset.expr = expr;
      widget.dataset.expr = expr;
    };

    const showBubble = (text, duration = 5000) => {
      if (panelOpen) return;
      bubble.textContent = text;
      bubble.classList.add("is-visible");
      window.clearTimeout(bubbleTimer);
      bubbleTimer = window.setTimeout(() => {
        bubble.classList.remove("is-visible");
      }, duration);
    };

    const hideBubble = () => {
      bubble.classList.remove("is-visible");
      window.clearTimeout(bubbleTimer);
    };

    const showTyping = () => {
      const indicator = document.createElement("div");
      indicator.className = "assistant-msg assistant-msg-bot assistant-typing";
      indicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
      messages.appendChild(indicator);
      messages.scrollTop = messages.scrollHeight;
      return indicator;
    };

    const addMessage = (text, type = "bot", delay = 0) => {
      if (type === "bot" && delay > 0) {
        setExpression("thinking");
        const typing = showTyping();
        window.setTimeout(() => {
          typing.remove();
          const msg = document.createElement("div");
          msg.className = `assistant-msg assistant-msg-${type}`;
          msg.textContent = text;
          messages.appendChild(msg);
          messages.scrollTop = messages.scrollHeight;
          setExpression("happy");
          window.setTimeout(() => setExpression("default"), 2000);
        }, delay);
      } else {
        const msg = document.createElement("div");
        msg.className = `assistant-msg assistant-msg-${type}`;
        msg.textContent = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
      }
    };

    const openPanel = () => {
      panelOpen = true;
      hideBubble();
      panel.classList.add("is-open");
      setExpression("happy");

      if (messages.children.length === 0) {
        addMessage(getTimeGreeting());
      }

      window.setTimeout(() => setExpression("default"), 2500);
    };

    const closePanel = () => {
      panelOpen = false;
      panel.classList.remove("is-open");
    };

    const renderActions = () => {
      actionsContainer.innerHTML = "";
      ACTIONS.forEach((item) => {
        const btn = document.createElement("button");
        btn.className = "assistant-action-btn";
        btn.innerHTML = `<span class="action-icon">${item.icon}</span>${item.label}`;

        if (item.href) {
          btn.addEventListener("click", () => {
            window.location.href = item.href;
          });
        } else if (item.action === "tip") {
          btn.addEventListener("click", () => {
            addMessage(item.label, "user");
            addMessage(pickRandom(TIPS), "bot", 600);
          });
        } else if (item.action === "chat") {
          btn.addEventListener("click", () => {
            addMessage(item.label, "user");
            addMessage(pickRandom(IDLE_LINES), "bot", 800);
          });
        } else if (item.action === "context") {
          btn.addEventListener("click", () => {
            addMessage(item.label, "user");
            const lines = PAGE_CONTEXT[currentPage] || PAGE_CONTEXT.home;
            addMessage(pickRandom(lines), "bot", 600);
          });
        } else if (item.action === "poke") {
          btn.addEventListener("click", () => {
            pokeCount++;
            addMessage("戳一戳~", "user");
            let response;
            if (pokeCount <= 2) {
              response = "哎呀~ 你戳我干嘛！";
            } else if (pokeCount <= 5) {
              response = "又戳！别闹啦~";
            } else if (pokeCount <= 8) {
              response = "你再戳我就……就生气了哦！";
            } else {
              response = "哼！不理你了！……好吧还是理你一下。";
              pokeCount = 0;
            }
            setExpression("happy");
            addMessage(response, "bot", 400);
            toggleBtn.classList.add("assistant-poked");
            window.setTimeout(() => {
              toggleBtn.classList.remove("assistant-poked");
            }, 600);
          });
        }

        actionsContainer.appendChild(btn);
      });
    };

    const startIdleBubbles = () => {
      window.clearInterval(idleTimer);
      idleTimer = window.setInterval(() => {
        if (!panelOpen && Math.random() > 0.5) {
          const h = getHour();
          if (h >= 0 && h < 6) {
            setExpression("sleeping");
            showBubble("zzZ... 我也困了...", 6000);
          } else {
            showBubble(pickRandom(IDLE_LINES), 6000);
          }
        }
      }, 30000);
    };

    const setupDrag = () => {
      let startRight = 0;
      let startBottom = 0;

      toggleBtn.addEventListener("pointerdown", (e) => {
        isDragging = true;
        dragThreshold = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        const rect = widget.getBoundingClientRect();
        startRight = window.innerWidth - rect.right;
        startBottom = window.innerHeight - rect.bottom;
        toggleBtn.setPointerCapture(e.pointerId);
      });

      toggleBtn.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          dragThreshold = true;
        }
        if (!dragThreshold) return;

        const newRight = Math.max(8, Math.min(window.innerWidth - 80, startRight - dx));
        const newBottom = Math.max(8, Math.min(window.innerHeight - 80, startBottom - dy));
        widget.style.right = newRight + "px";
        widget.style.bottom = newBottom + "px";
      });

      toggleBtn.addEventListener("pointerup", (e) => {
        if (isDragging && dragThreshold) {
          writeStore({
            right: widget.style.right,
            bottom: widget.style.bottom
          });
        }
        isDragging = false;
        toggleBtn.releasePointerCapture(e.pointerId);
      });
    };

    const restorePosition = () => {
      const saved = readStore();
      if (saved.right) widget.style.right = saved.right;
      if (saved.bottom) widget.style.bottom = saved.bottom;
    };

    toggleBtn.addEventListener("click", (e) => {
      if (dragThreshold) {
        e.preventDefault();
        return;
      }
      if (panelOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    toggleBtn.addEventListener("dblclick", () => {
      const idx = (EXPRESSIONS.indexOf(currentExpr) + 1) % EXPRESSIONS.length;
      setExpression(EXPRESSIONS[idx]);
      showBubble(
        currentExpr === "happy" ? "开心！" :
        currentExpr === "thinking" ? "让我想想..." :
        currentExpr === "sleeping" ? "困了zzZ..." : "嗯嗯~",
        3000
      );
    });

    closeBtn.addEventListener("click", closePanel);

    document.addEventListener("pointerdown", (event) => {
      if (panelOpen && !panel.contains(event.target) && !toggleBtn.contains(event.target)) {
        closePanel();
      }
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panelOpen) {
        closePanel();
      }
    });

    const updateStatusByTime = () => {
      const h = getHour();
      if (h >= 0 && h < 6) {
        statusText.textContent = "深夜陪伴中...";
      } else if (h >= 6 && h < 12) {
        statusText.textContent = "早安~ 在线中";
      } else if (h >= 12 && h < 18) {
        statusText.textContent = "下午好~ 在线中";
      } else {
        statusText.textContent = "晚上好~ 在线中";
      }
    };

    renderActions();
    restorePosition();
    setupDrag();
    updateStatusByTime();

    window.setTimeout(() => {
      showBubble(getTimeGreeting(), 6000);
    }, 3000);

    startIdleBubbles();
  };

  const setupLive2DChar = () => {
    const inPost = window.location.pathname.replace(/\\/g, "/").includes("/posts/");
    const prefix = inPost ? "../" : "./";
    const encodeAssetName = (file) => file.split("/").map((part) => encodeURIComponent(part)).join("/");
    const assetVersion = "kanban-20260624";
    const versionedAsset = (url) => `${url}?v=${assetVersion}`;
    const mascotAsset = (baseDir, file, transparent = true) => versionedAsset(`${prefix}assets/mascot/${baseDir}/${transparent ? "transparent/" : ""}${encodeAssetName(file)}`);
    const kbnAsset = (file) => versionedAsset(`${prefix}assets/mascot/kbn/${encodeAssetName(file)}`);
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const getHour = () => new Date().getHours();
    const registry = new Map();
    let frostTimer = 0;
    let charmTimer = 0;
    let duoTimer = 0;
    let hutaoLinkTimer = 0;

    // ─────────────────────────────────────────────────────────────
    // Four-phase Gu Qinghan full-screen freeze ultimate:
    //  ① cast flash + central shockwave + bloom burst      (~0–1.5s)
    //  ② ice sheet / frozen pane / cold wash spread outward (~0.5–3s)
    // ③ frozen hold: edge frost, vignette, frame, glass lock solid (~2–5s)
    //  ④ shatter fade: cracks, shards, snowflakes, dust dissolve (~5–6.9s)
    // The frost core is anchored to Qinghan's feet (--freeze-origin-x/y);
    // small scattered accents (snowflakes, frost flowers, ice dust, branch
    // cracks, shards) are spread across the rest of the screen for texture.
    // Effect layer z-index 96 sits above mascots (95/94); all layers are
    // semi-transparent so the character silhouette stays readable.
    // ─────────────────────────────────────────────────────────────
    const castFreezeScreen = (originApi) => {
      const existing = document.querySelector(".freeze-screen-effect");
      if (existing) existing.remove();
      window.clearTimeout(frostTimer);

      // Main frost core origin = Qinghan's feet. Falls back to her default spot.
      const rect = originApi?.container?.getBoundingClientRect();
      const originX = rect ? rect.left + rect.width * 0.5 : Math.min(window.innerWidth * 0.11, 150);
      const originY = rect ? rect.bottom - rect.height * 0.08 : window.innerHeight - 90;

      // Branching ice cracks — thin fractures spreading inward from every edge.
      const branchCracks = [
        [0, 14, 42, 158, 0.0],
        [100, 22, 38, 202, 0.12],
        [0, 40, 36, 172, 0.22],
        [100, 48, 34, 196, 0.34],
        [0, 68, 40, 164, 0.46],
        [100, 76, 36, 208, 0.58],
        [22, 0, 30, 86, 0.30],
        [62, 0, 28, 94, 0.42],
        [28, 100, 32, 264, 0.50],
        [66, 100, 30, 256, 0.62]
      ].map(([x, y, w, rot, delay]) => (
        `<span class="freeze-branch-crack" style="--branch-x:${x}%;--branch-y:${y}%;--branch-width:${w}%;--branch-rotate:${rot}deg;--branch-delay:${delay}s;"></span>`
      )).join("");

      // Scattered snowflakes drifting down across the whole screen.
      const snowflakes = Array.from({ length: 16 }, (_, i) => {
        const x = 5 + ((i * 67) % 91);
        const y = 6 + ((i * 41) % 82);
        const start = 0.3 + ((i * 7) % 10) / 22;
        const size = 0.55 + ((i * 11) % 9) / 15;
        const spin = ((i * 53) % 360) - 180;
        const endSpin = spin + ((i % 2 ? 1 : -1) * (120 + ((i * 13) % 180)));
        const delay = ((i * 17) % 90) / 100;
        return `<span class="freeze-snowflake" style="--flake-x:${x}%;--flake-y:${y}%;--flake-start:${start};--flake-size:${size};--flake-spin:${spin}deg;--flake-end-spin:${endSpin}deg;--flake-delay:${delay}s;"></span>`;
      }).join("");

      // Frost flowers — elegant crystalline motifs blooming at scattered spots.
      const frostFlowers = [
        [12, 30, 0.7, -14, 0.10],
        [84, 22, 0.58, 22, 0.26],
        [22, 72, 0.64, 8, 0.38],
        [72, 64, 0.52, -28, 0.50],
        [48, 16, 0.46, 16, 0.62],
        [38, 88, 0.6, -10, 0.74],
        [90, 80, 0.5, 30, 0.86],
        [8, 56, 0.56, -20, 0.96]
      ].map(([x, y, size, rot, delay]) => (
        `<span class="freeze-frost-flower" style="--flower-x:${x}%;--flower-y:${y}%;--flower-size:${size};--flower-rotate:${rot}deg;--flower-delay:${delay}s;"></span>`
      )).join("");

      // Tiny ice dust motes — the smallest scattered sparkle layer.
      const dust = Array.from({ length: 32 }, (_, i) => {
        const x = 3 + ((i * 97) % 95);
        const y = 4 + ((i * 61) % 92);
        const start = 0.2 + ((i * 5) % 8) / 12;
        const size = 0.4 + ((i * 9) % 10) / 14;
        const drift = (i % 2 ? 1 : -1) * (8 + ((i * 7) % 36));
        const lift = -(14 + ((i * 13) % 48));
        const delay = ((i * 23) % 110) / 100;
        return `<span class="freeze-dust" style="--dust-x:${x}%;--dust-y:${y}%;--dust-start:${start};--dust-size:${size};--dust-drift:${drift}px;--dust-lift:${lift}px;--dust-delay:${delay}s;"></span>`;
      }).join("");

      const layer = document.createElement("div");
      layer.className = "freeze-screen-effect";
      layer.setAttribute("aria-hidden", "true");
      layer.style.setProperty("--freeze-origin-x", `${Math.round(originX)}px`);
      layer.style.setProperty("--freeze-origin-y", `${Math.round(originY)}px`);
      layer.innerHTML = `
        <span class="freeze-flash"></span>
        <span class="freeze-cold-wash"></span>
        <span class="freeze-bloom"></span>
        <span class="freeze-impact-wave"></span>
        <span class="freeze-wave"></span>
        <span class="freeze-sigil"></span>
        <span class="freeze-ice-sheet"></span>
        <span class="freeze-ice-sheet freeze-ice-sheet-deep"></span>
        <span class="freeze-ice-veil"></span>
        <span class="freeze-frozen-pane"></span>
        <span class="freeze-mist"></span>
        <span class="freeze-snowfield"></span>
        <span class="freeze-glass"></span>
        <span class="freeze-rime"></span>
        <span class="freeze-vignette"></span>
        <span class="freeze-frost-frame"></span>
        <span class="freeze-frost-frame freeze-frost-frame-deep"></span>
        <span class="freeze-frost-bloom freeze-frost-bloom-left"></span>
        <span class="freeze-frost-bloom freeze-frost-bloom-right"></span>
        <span class="freeze-frost-bloom freeze-frost-bloom-bottom"></span>
        ${branchCracks}
        <span class="freeze-crack freeze-crack-one"></span>
        <span class="freeze-crack freeze-crack-two"></span>
        <span class="freeze-crack freeze-crack-three"></span>
        <span class="freeze-crack freeze-crack-four"></span>
        <span class="freeze-crack freeze-crack-five"></span>
        <span class="freeze-crack freeze-crack-six"></span>
        <span class="freeze-crack freeze-crack-seven"></span>
        <span class="freeze-crack freeze-crack-eight"></span>
        <span class="freeze-crack freeze-crack-nine"></span>
        <span class="freeze-crack freeze-crack-ten"></span>
        <span class="freeze-shard freeze-shard-one"></span>
        <span class="freeze-shard freeze-shard-two"></span>
        <span class="freeze-shard freeze-shard-three"></span>
        <span class="freeze-shard freeze-shard-four"></span>
        <span class="freeze-shard freeze-shard-five"></span>
        <span class="freeze-shard freeze-shard-six"></span>
        <span class="freeze-shard freeze-shard-seven"></span>
        <span class="freeze-shard freeze-shard-eight"></span>
        ${snowflakes}
        ${frostFlowers}
        ${dust}
      `;
      document.body.appendChild(layer);

      // AI-generated full-screen VFX image layers (black-bg PNGs, screen-blended).
      // These provide the high-fidelity frost / crack / shatter texture that pure
      // CSS gradients cannot match; the CSS layers above add dynamic light & sigil.
      const vfxLayer = document.createElement("div");
      vfxLayer.className = "freeze-vfx-effect";
      vfxLayer.setAttribute("aria-hidden", "true");
      vfxLayer.innerHTML = `
        <span class="freeze-vfx-layer freeze-vfx-wave" style="background-image:url('${kbnAsset("freeze-vfx-wave.png")}')"></span>
        <span class="freeze-vfx-layer freeze-vfx-locked" style="background-image:url('${kbnAsset("freeze-vfx-locked.png")}')"></span>
        <span class="freeze-vfx-layer freeze-vfx-shatter" style="background-image:url('${kbnAsset("freeze-vfx-shatter.png")}')"></span>
      `;
      document.body.appendChild(vfxLayer);

      document.body.classList.add("is-screen-freezing");
      window.requestAnimationFrame(() => layer.classList.add("is-casting"));
      frostTimer = window.setTimeout(() => {
        layer.classList.add("is-fading");
        vfxLayer.classList.add("is-fading");
        document.body.classList.remove("is-screen-freezing");
        window.setTimeout(() => {
          layer.remove();
          vfxLayer.remove();
        }, 1500);
      }, 5400);
    };

    const castFreezeScreenVfx = (originApi) => {
      document.querySelectorAll(".freeze-screen-effect, .freeze-vfx-effect").forEach((effect) => effect.remove());
      window.clearTimeout(frostTimer);

      const rect = originApi?.container?.getBoundingClientRect();
      const originX = rect ? rect.left + rect.width * 0.5 : Math.min(window.innerWidth * 0.11, 150);
      const originY = rect ? rect.bottom - rect.height * 0.08 : window.innerHeight - 90;
      const layer = document.createElement("div");
      layer.className = "freeze-screen-effect freeze-screen-effect-vfx";
      layer.setAttribute("aria-hidden", "true");
      layer.style.setProperty("--freeze-origin-x", `${Math.round(originX)}px`);
      layer.style.setProperty("--freeze-origin-y", `${Math.round(originY)}px`);
      layer.innerHTML = `
        <span class="freeze-vfx-cold-tint"></span>
        <span class="freeze-vfx-layer freeze-vfx-wave" style="background-image:url('${kbnAsset("freeze-vfx-wave-clean.png")}')"></span>
        <span class="freeze-vfx-layer freeze-vfx-locked" style="background-image:url('${kbnAsset("freeze-vfx-locked-clean.png")}')"></span>
        <span class="freeze-vfx-layer freeze-vfx-shatter" style="background-image:url('${kbnAsset("freeze-vfx-shatter-clean.png")}')"></span>
      `;
      document.body.appendChild(layer);

      document.body.classList.add("is-screen-freezing");
      window.requestAnimationFrame(() => layer.classList.add("is-casting"));
      frostTimer = window.setTimeout(() => {
        layer.classList.add("is-fading");
        document.body.classList.remove("is-screen-freezing");
        window.setTimeout(() => layer.remove(), 1500);
      }, 6800);
    };

    const castHutaoCharmEffect = (originApi) => {
      const existing = document.querySelector(".hutao-charm-effect");
      if (existing) existing.remove();
      window.clearTimeout(charmTimer);
      document.body.classList.remove("is-hutao-blessing");

      const rect = originApi?.container?.getBoundingClientRect();
      const originX = rect ? rect.left + rect.width * 0.52 : Math.min(window.innerWidth * 0.24, 360);
      const originY = rect ? rect.top + rect.height * 0.62 : window.innerHeight - 132;
      const petals = [
        [6, -8, 0.62, 0.05, 34, 92],
        [12, 16, 0.42, 0.24, -26, 78],
        [18, -16, 0.7, 0.12, 48, 112],
        [24, 24, 0.52, 0.36, -42, 88],
        [31, 4, 0.58, 0.18, 18, 126],
        [38, -18, 0.48, 0.44, -54, 96],
        [45, 18, 0.66, 0.28, 62, 118],
        [52, -10, 0.44, 0.52, -18, 82],
        [59, 22, 0.72, 0.2, 38, 132],
        [66, 0, 0.5, 0.4, -36, 92],
        [73, -20, 0.64, 0.08, 54, 124],
        [80, 14, 0.46, 0.48, -48, 86],
        [87, -6, 0.68, 0.3, 24, 112],
        [94, 20, 0.54, 0.58, -32, 96],
        [9, 42, 0.46, 0.62, 28, 76],
        [21, 58, 0.7, 0.72, -54, 108],
        [34, 48, 0.5, 0.68, 44, 84],
        [48, 64, 0.62, 0.78, -28, 116],
        [62, 46, 0.42, 0.66, 36, 78],
        [77, 60, 0.74, 0.74, -46, 124],
        [91, 50, 0.56, 0.7, 18, 92],
        [98, 72, 0.44, 0.86, -34, 82]
      ].map(([x, y, size, delay, spin, drift]) => (
        `<span class="hutao-domain-petal" style="--petal-left:${x}vw; --petal-top:${y}vh; --petal-width:${Math.round(18 * size)}px; --petal-height:${Math.round(27 * size)}px; --petal-delay:${delay}s; --petal-spin:${spin}deg; --petal-end-spin:${spin + 190}deg; --petal-fall-x:${Math.round(drift * -0.42)}px;"></span>`
      )).join("");
      const talismans = [
        [12, 24, 0.86, 0.12, -18, 24, -46],
        [22, 64, 0.68, 0.38, 28, -30, -58],
        [35, 18, 0.78, 0.2, 14, 36, -40],
        [48, 72, 0.62, 0.58, -32, -24, -52],
        [61, 30, 0.82, 0.28, 36, 32, -62],
        [74, 66, 0.7, 0.48, -22, -38, -48],
        [86, 22, 0.74, 0.34, 18, 28, -54],
        [93, 52, 0.58, 0.66, -36, -24, -44],
        [8, 76, 0.56, 0.76, 32, 18, -38],
        [57, 10, 0.52, 0.52, -24, -20, -42]
      ].map(([x, y, scale, delay, rotate, drift, lift]) => (
        `<span class="hutao-domain-talisman" style="--talisman-left:${x}vw; --talisman-top:${y}vh; --talisman-scale:${scale}; --talisman-delay:${delay}s; --talisman-rotate:${rotate}deg; --talisman-drift:${drift}px; --talisman-lift:${lift}px;"></span>`
      )).join("");
      const sparks = Array.from({ length: 34 }, (_, index) => {
        const x = 4 + ((index * 29) % 94);
        const y = 18 + ((index * 17) % 74);
        const size = 0.42 + ((index * 7) % 10) / 18;
        const delay = ((index * 11) % 70) / 100;
        const lift = 28 + ((index * 13) % 62);
        const drift = ((index % 2 ? -1 : 1) * (10 + ((index * 5) % 30)));
        return `<span class="hutao-domain-spark" style="--spark-left:${x}vw; --spark-top:${y}vh; --spark-width:${Math.round(7 * size)}px; --spark-delay:${delay.toFixed(2)}s; --spark-rise:${-lift}px; --spark-drift:${drift}px;"></span>`;
      }).join("");
      const bells = [
        [14, 18, 0.18],
        [28, 12, 0.36],
        [43, 9, 0.24],
        [58, 10, 0.44],
        [73, 13, 0.3],
        [88, 20, 0.52]
      ].map(([x, y, delay]) => (
        `<span class="hutao-domain-bell" style="--bell-left:${x}vw; --bell-top:${y}vh; --bell-delay:${delay}s;"></span>`
      )).join("");

      const layer = document.createElement("div");
      layer.className = "hutao-charm-effect hutao-blessing-domain";
      layer.setAttribute("aria-hidden", "true");
      layer.style.setProperty("--hutao-origin-x", `${Math.round(originX)}px`);
      layer.style.setProperty("--hutao-origin-y", `${Math.round(originY)}px`);
      layer.innerHTML = `
        <span class="hutao-domain-warmth"></span>
        <span class="hutao-domain-flash"></span>
        <span class="hutao-domain-floor"></span>
        <span class="hutao-domain-circle"></span>
        <span class="hutao-domain-wave"></span>
        <span class="hutao-domain-canopy"></span>
        <span class="hutao-domain-ribs"></span>
        <span class="hutao-domain-trim"></span>
        <span class="hutao-domain-cameo"></span>
        <span class="hutao-domain-ripple hutao-domain-ripple-one"></span>
        <span class="hutao-domain-ripple hutao-domain-ripple-two"></span>
        <span class="hutao-domain-ripple hutao-domain-ripple-three"></span>
        ${talismans}
        ${petals}
        ${bells}
        ${sparks}
      `;
      document.body.appendChild(layer);
      document.body.classList.add("is-hutao-blessing");
      window.requestAnimationFrame(() => layer.classList.add("is-casting"));
      charmTimer = window.setTimeout(() => {
        layer.classList.add("is-fading");
        document.body.classList.remove("is-hutao-blessing");
        window.setTimeout(() => layer.remove(), 1000);
      }, 6100);
    };

    const castHutaoLinkEffect = (originApi, targetApi) => {
      const existing = document.querySelector(".hutao-link-effect");
      if (existing) existing.remove();
      window.clearTimeout(hutaoLinkTimer);

      const originRect = originApi?.container?.getBoundingClientRect();
      const targetRect = targetApi?.container?.getBoundingClientRect();
      if (!originRect || !targetRect) return;

      const sparks = Array.from({ length: 10 }, (_, i) => {
        return `<span class="hutao-link-spark" style="--spark-x:0px;--spark-y:0px;--spark-delay:${(0.08 + i * 0.12).toFixed(3)}s;"></span>`;
      }).join("");

      const layer = document.createElement("div");
      layer.className = "hutao-link-effect";
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML = `
        <span class="hutao-link-glow"></span>
        <span class="hutao-link-beam"></span>
        ${sparks}
      `;
      document.body.appendChild(layer);
      const sparkEls = Array.from(layer.querySelectorAll(".hutao-link-spark"));
      let active = true;
      let rafId = 0;
      const updateBeam = () => {
        if (!active || !document.body.contains(layer)) return;
        const nextOriginRect = originApi?.container?.getBoundingClientRect();
        const nextTargetRect = targetApi?.container?.getBoundingClientRect();
        if (!nextOriginRect || !nextTargetRect) return;

        const x1 = nextOriginRect.left + nextOriginRect.width * 0.5;
        const y1 = nextOriginRect.top + nextOriginRect.height * 0.48;
        const x2 = nextTargetRect.left + nextTargetRect.width * 0.54;
        const y2 = nextTargetRect.top + nextTargetRect.height * 0.46;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.max(1, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const normal = (angle + 90) * Math.PI / 180;

        layer.style.setProperty("--beam-x", `${x1}px`);
        layer.style.setProperty("--beam-y", `${y1}px`);
        layer.style.setProperty("--beam-length", `${length}px`);
        layer.style.setProperty("--beam-angle", `${angle}deg`);
        sparkEls.forEach((spark, i) => {
          const t = (i + 1) / (sparkEls.length + 1);
          const wiggle = Math.sin(i * 1.7 + Date.now() / 320) * 10;
          spark.style.setProperty("--spark-x", `${x1 + dx * t + Math.cos(normal) * wiggle}px`);
          spark.style.setProperty("--spark-y", `${y1 + dy * t + Math.sin(normal) * wiggle}px`);
        });

        rafId = window.requestAnimationFrame(updateBeam);
      };
      updateBeam();
      window.requestAnimationFrame(() => layer.classList.add("is-casting"));
      hutaoLinkTimer = window.setTimeout(() => {
        active = false;
        window.cancelAnimationFrame(rafId);
        layer.classList.add("is-fading");
        window.setTimeout(() => layer.remove(), 650);
      }, 10000);
    };

    const castDuoEffect = () => {
      const existing = document.querySelector(".mascot-duo-effect");
      if (existing) existing.remove();
      window.clearTimeout(duoTimer);

      const layer = document.createElement("div");
      layer.className = "mascot-duo-effect";
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML = `
        <span class="mascot-duo-arc"></span>
        <span class="mascot-duo-spark mascot-duo-spark-one"></span>
        <span class="mascot-duo-spark mascot-duo-spark-two"></span>
        <span class="mascot-duo-spark mascot-duo-spark-three"></span>
        <span class="mascot-duo-spark mascot-duo-spark-four"></span>
      `;
      document.body.appendChild(layer);
      document.body.classList.add("mascot-duo-active");
      window.requestAnimationFrame(() => layer.classList.add("is-casting"));
      duoTimer = window.setTimeout(() => {
        layer.classList.add("is-fading");
        document.body.classList.remove("mascot-duo-active");
        window.setTimeout(() => layer.remove(), 700);
      }, 3200);
    };

    const duoScenes = [
      {
        qinghan: { pose: "skill", line: "寒意先行。", duration: 3400 },
        hutao: { pose: "skill", line: "护符跟上~", duration: 3400 }
      },
      {
        qinghan: { pose: "talk", line: "胡桃，别把符贴到伞上。", duration: 3600 },
        hutao: { pose: "thinking", line: "哎？我刚想试试。", duration: 3600 }
      },
      {
        qinghan: { pose: "happy", line: "今日也要利落些。", duration: 3400 },
        hutao: { pose: "idle", line: "放心交给本堂主！", duration: 3400 }
      },
      {
        qinghan: { pose: "sleep", line: "她睡着了，我守一会儿。", duration: 3800 },
        hutao: { pose: "sleep", line: "呼...花灯也困啦。", duration: 3800 }
      }
    ];

    const triggerDuoInteraction = (sourceId) => {
      const qinghan = registry.get("qinghan");
      const hutao = registry.get("hutao");
      const source = registry.get(sourceId);
      if (!qinghan || !hutao) {
        if (source) source.showSpeech("另一位搭档还没出来呢~", 2800, null);
        return;
      }

      const scene = pickRandom(duoScenes);
      qinghan.wake();
      hutao.wake();
      qinghan.container.classList.add("is-duo-casting");
      hutao.container.classList.add("is-duo-casting");
      qinghan.setPose(scene.qinghan.pose, { temporary: true, duration: scene.qinghan.duration });
      hutao.setPose(scene.hutao.pose, { temporary: true, duration: scene.hutao.duration });
      qinghan.showSpeech(scene.qinghan.line, scene.qinghan.duration, null);
      window.setTimeout(() => hutao.showSpeech(scene.hutao.line, scene.hutao.duration, null), 360);
      castDuoEffect();
      window.setTimeout(() => {
        qinghan.container.classList.remove("is-duo-casting");
        hutao.container.classList.remove("is-duo-casting");
      }, Math.max(scene.qinghan.duration, scene.hutao.duration));
    };

    const characters = [
      {
        id: "qinghan",
        name: "顾清寒",
        baseDir: "kbn",
        storeKey: "bookerLive2d",
        supportSkill: { label: "\u987e\u6e05\u5bd2F\u6280\u80fd", icon: "F" },
        restoreIcon: "❄️",
        skillIcon: "❄",
        skillLabel: "冰霜技能",
        initialPose: () => (getHour() >= 0 && getHour() < 6 ? "sleep" : "idle"),
        hoverPose: "greet",
        talkPose: "talk",
        clickPose: "happy",
        idleActionPose: "blink",
        idleActionDuration: 700,
        sleepPose: "sleep",
        draggedPose: "dragged",
        introLine: "你好呀~ 我是看板娘！",
        sleepLine: "好困...先睡一会儿...",
        poses: [
          { key: "idle", file: "idle standing.png", label: "待机" },
          { key: "blink", file: "blink.png", label: "眨眼" },
          { key: "greet", file: "Greeting.png", label: "打招呼" },
          { key: "happy", file: "happy laugh.png", label: "开心" },
          { key: "talk", file: "talking open mouth.png", label: "说话" },
          { key: "skill", file: "skill cast.png", label: "冰霜技能" },
          { key: "frozen", file: "Frozen.png", label: "\u51b0\u51bb" },
          { key: "sleep", file: "sleeping curled up.png", label: "睡觉" },
          { key: "dragged", file: "dragged sideways reaction.png", label: "拖动反应" }
        ],
        poseCycle: ["idle", "greet", "happy", "blink", "talk", "skill", "sleep", "dragged"],
        speechLines: [
          "鼠标移过来看看我嘛~",
          "点我试试？会有惊喜哦！",
          "你好呀，今天过得怎么样？",
          "别光看着我，去读文章啦~",
          "好无聊...陪我玩一会儿？",
          "嘿嘿，被你发现了~",
          "我是看板娘，请多关照！",
          "今天也要元气满满哦~"
        ],
        clickLines: [
          "哎呀！被戳到了~",
          "干嘛戳我！",
          "嘻嘻~好痒！",
          "你好奇心很旺盛嘛~",
          "再戳就生气了哦！",
          "呀！轻点啦~"
        ],
        poseLines: {
          greet: "嗨嗨~",
          happy: "开心！",
          blink: "眨眼一下~",
          skill: "冰霜技能，启动。",
          sleep: "困了，稍微休息一下...",
          dragged: "不要把我拎太远啦~"
        },
        castSkill(api) {
          api.wake();
          api.setPose("skill", { temporary: true, duration: 4300 });
          castFreezeScreenVfx(api);
          api.showSpeech("冰封领域，展开。", 3600, null);
          const hutao = registry.get("hutao");
          if (hutao) {
            window.setTimeout(() => hutao.react("thinking", "哇，伞沿都结霜啦！", 3000), 520);
          }
        },
        castSupportSkill(api) {
          const hutao = registry.get("hutao");
          if (!hutao) {
            api.showSpeech("\u80e1\u6843\u8fd8\u6ca1\u51fa\u6765\u5462\u3002", 2600, null);
            return;
          }
          api.wake();
          hutao.wake();
          api.freeze(5000);
          hutao.freeze(5000);
        }
      },
      {
        id: "hutao",
        name: "胡桃",
        baseDir: "kbnht",
        storeKey: "bookerLive2dHutao",
        restoreIcon: "🌸",
        defaultLeft: "clamp(150px, 19vw, 262px)",
        defaultBottom: "12px",
        skillIcon: "✿",
        skillLabel: "灵伞祝域",
        supportSkill: { label: "\u80e1\u6843F\u6280\u80fd", icon: "F" },
        initialPose: () => (getHour() >= 0 && getHour() < 6 ? "sleep" : "idle"),
        hoverPose: "thinking",
        talkPose: "thinking",
        clickPose: "thinking",
        idleActionPose: "thinking",
        idleActionDuration: 1500,
        sleepPose: "sleep",
        draggedPose: "dragged",
        introLine: "锵锵，胡桃也来值班啦！",
        sleepLine: "困啦...让花灯陪我睡一会儿...",
        poses: [
          { key: "idle", file: "idle.png", label: "待机" },
          { key: "thinking", file: "thinking.png", label: "思考" },
          { key: "skill", file: "skill cast.png", label: "灵伞祝域" },
          { key: "frozen", file: "Frozen.png", label: "\u51b0\u51bb" },
          { key: "sleep", file: "sleeping.png", label: "睡觉" },
          { key: "dragged", file: "dragged sideways reaction.png", label: "拖动反应" }
        ],
        poseCycle: ["idle", "thinking", "skill", "sleep", "dragged"],
        speechLines: [
          "本堂主上线，气氛立刻热闹起来！",
          "要不要听个小故事？保证不吓人。",
          "清寒负责降温，我负责把场子暖回来~",
          "别一直盯着我嘛，文章也要看哦。",
          "今日宜写作、宜摸鱼、宜喝热茶。",
          "这把伞可是很可靠的！"
        ],
        clickLines: [
          "哎呀，戳到花花了！",
          "嘿嘿，被你发现啦~",
          "再戳我就给你贴符哦。",
          "这位客官，有何贵干？",
          "轻点轻点，头饰会歪的！"
        ],
        poseLines: {
          thinking: "嗯...让我想想。",
          skill: "灵伞祝域，开！",
          sleep: "困啦，先趴一小会儿...",
          dragged: "哎哎哎，伞要飞走啦！"
        },
        castSkill(api) {
          api.wake();
          api.setPose("skill", { temporary: true, duration: 5600 });
          castHutaoCharmEffect(api);
          api.showSpeech("灵伞祝域，展开！", 4200, null);
          const qinghan = registry.get("qinghan");
          if (qinghan) {
            window.setTimeout(() => qinghan.react("greet", "符光很暖，寒气都被安抚了。", 3200), 620);
          }
        },
        castSupportSkill(api) {
          const qinghan = registry.get("qinghan");
          if (!qinghan) {
            api.showSpeech("\u987e\u6e05\u5bd2\u8fd8\u6ca1\u51fa\u6765\u5462\u3002", 2600, null);
            return;
          }
          api.wake();
          qinghan.wake();
          api.setPose("skill", { temporary: true, duration: 10000 });
          castHutaoLinkEffect(api, qinghan);
          api.showSpeech("\u8fde\u7ebf\u7ed9\u4f60\uff01", 2200, null);
          window.setTimeout(() => qinghan.react("greet", "\u6536\u5230\uff0c\u5bd2\u610f\u4f1a\u987a\u7740\u8fd9\u9053\u5149\u56de\u5e94\u3002", 2600), 360);
        }
      }
    ];

    const mountRestoreTab = (config, writeStore) => {
      if (document.querySelector(`.live2d-restore[data-character="${config.id}"]`)) return;
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "live2d-restore";
      tab.dataset.character = config.id;
      if (config.defaultLeft) tab.style.left = config.defaultLeft;
      if (config.defaultBottom) tab.style.bottom = config.defaultBottom;
      tab.title = `唤回${config.name}`;
      tab.setAttribute("aria-label", `唤回${config.name}`);
      tab.innerHTML = `<span class="live2d-restore-icon" aria-hidden="true">${config.restoreIcon}</span><span class="live2d-restore-label">${config.name}</span>`;
      document.body.appendChild(tab);
      window.requestAnimationFrame(() => tab.classList.add("is-in"));
      tab.addEventListener("click", () => {
        writeStore({ hidden: false });
        tab.classList.remove("is-in");
        window.setTimeout(() => window.location.reload(), 200);
      });
    };

    const mountCharacter = (config) => {
      const poseMap = config.poses.reduce((map, pose) => {
        map[pose.key] = pose;
        return map;
      }, {});
      const poseCycle = config.poseCycle || config.poses.map((pose) => pose.key);

      const readStore = () => {
        try { return JSON.parse(window.localStorage.getItem(config.storeKey)) || {}; }
        catch { return {}; }
      };
      const writeStore = (patch) => {
        try {
          window.localStorage.setItem(config.storeKey, JSON.stringify(Object.assign(readStore(), patch)));
        } catch {}
      };

      const saved = readStore();
      if (saved.hidden) {
        mountRestoreTab(config, writeStore);
        return null;
      }

      const container = document.createElement("div");
      container.className = "live2d-widget";
      container.dataset.character = config.id;
      if (config.defaultLeft) container.style.left = config.defaultLeft;
      if (config.defaultBottom) container.style.bottom = config.defaultBottom;

      const toolbarButtons = [
        { action: "chat", label: "说话", icon: "💬" },
        { action: "skill", label: config.skillLabel, icon: config.skillIcon },
        ...(config.supportSkill ? [{ action: "support", label: config.supportSkill.label, icon: config.supportSkill.icon }] : []),
        { action: "duo", label: "双人互动", icon: "♡" },
        { action: "pose", label: "换动作", icon: "🎭" },
        { action: "hide", label: "隐藏", icon: "✕" }
      ];
      container.innerHTML = `
        <div class="live2d-toolbar">
          ${toolbarButtons.map((item) => `<button class="live2d-btn" data-l2d-action="${item.action}" type="button" title="${item.label}" aria-label="${item.label}">${item.icon}</button>`).join("")}
        </div>
        <div class="live2d-char" data-live2d-char>
          <div class="live2d-body">
            <img class="live2d-img" src="${mascotAsset(config.baseDir, poseMap.idle.file)}" alt="${config.name}：待机" draggable="false">
            <div class="live2d-shadow"></div>
          </div>
          <div class="live2d-speech" data-live2d-speech></div>
        </div>
      `;
      document.body.appendChild(container);

      const char = container.querySelector("[data-live2d-char]");
      const body = container.querySelector(".live2d-body");
      const img = container.querySelector(".live2d-img");
      const speech = container.querySelector("[data-live2d-speech]");
      const toolbar = container.querySelector(".live2d-toolbar");

      let mouseX = 0.5;
      let mouseY = 0.5;
      let targetX = 0.5;
      let targetY = 0.5;
      let idlePhase = 0;
      let isIdle = true;
      let idleTimeout = 0;
      let speechTimer = 0;
      let poseTimer = 0;
      let poseIndex = 0;
      let currentPose = "idle";
      let steadyPose = "idle";
      let pointerDown = false;
      let dragMoved = false;
      let suppressClick = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let dragStartLeft = 0;
      let dragStartBottom = 0;
      let sleepTimeout = 0;
      let autoSleeping = false;
      let poseBeforeSleep = "idle";
      let frozenTimeout = 0;
      let frozenUntil = 0;

      const isFrozen = () => frozenUntil > Date.now();

      const setPose = (key, options = {}) => {
        if (isFrozen() && key !== "frozen" && !options.allowDuringFrozen) {
          return;
        }
        const pose = poseMap[key] || poseMap.idle;
        window.clearTimeout(poseTimer);

        currentPose = pose.key;
        if (!options.temporary && options.remember !== false) {
          steadyPose = pose.key;
          poseIndex = Math.max(0, poseCycle.indexOf(pose.key));
          if (autoSleeping && !options.keepAutoSleep) {
            autoSleeping = false;
            poseBeforeSleep = "idle";
            window.clearTimeout(sleepTimeout);
          }
        }

        container.dataset.pose = pose.key;
        img.dataset.pose = pose.key;
        img.dataset.fallbackSrc = mascotAsset(config.baseDir, pose.file, false);
        img.src = mascotAsset(config.baseDir, pose.file);
        img.alt = `${config.name}：${pose.label}`;

        if (options.duration) {
          poseTimer = window.setTimeout(() => {
            setPose(steadyPose, { remember: false });
          }, options.duration);
        }
      };

      const showSpeech = (text, duration = 4000, pose = config.talkPose) => {
        speech.textContent = text;
        speech.classList.add("is-visible");
        if (pose) {
          setPose(pose, { temporary: true, duration: Math.min(duration, 3600) });
        }
        window.clearTimeout(speechTimer);
        speechTimer = window.setTimeout(() => {
          speech.classList.remove("is-visible");
        }, duration);
      };

      const clampCurrentPosition = () => {
        const rect = container.getBoundingClientRect();
        const gap = 12;
        const nextLeft = clamp(rect.left, gap, Math.max(gap, window.innerWidth - rect.width - gap));
        const nextBottom = clamp(window.innerHeight - rect.bottom, gap, Math.max(gap, window.innerHeight - rect.height - gap));
        container.style.left = `${nextLeft}px`;
        container.style.bottom = `${nextBottom}px`;
      };

      const restorePosition = () => {
        if (saved.left) container.style.left = saved.left;
        if (saved.bottom) container.style.bottom = saved.bottom;
        window.requestAnimationFrame(clampCurrentPosition);
      };

      const scheduleSleep = () => {
        window.clearTimeout(sleepTimeout);
        sleepTimeout = window.setTimeout(() => {
          if (currentPose !== config.sleepPose) {
            autoSleeping = true;
            poseBeforeSleep = currentPose;
            setPose(config.sleepPose, { keepAutoSleep: true, remember: false });
            showSpeech(config.sleepLine, 4000, null);
          }
        }, 120000);
      };

      const wakeFromAutoSleep = () => {
        if (isFrozen()) return;
        window.clearTimeout(sleepTimeout);
        if (!autoSleeping) {
          scheduleSleep();
          return;
        }
        const wakePose = poseBeforeSleep || "idle";
        autoSleeping = false;
        poseBeforeSleep = "idle";
        setPose(wakePose, { remember: false });
        isIdle = false;
        window.clearTimeout(idleTimeout);
        idleTimeout = window.setTimeout(() => { isIdle = true; }, 3000);
        scheduleSleep();
      };

      const unfreeze = () => {
        window.clearTimeout(frozenTimeout);
        frozenUntil = 0;
        container.classList.remove("is-frozen");
        setPose(steadyPose, { remember: false, allowDuringFrozen: true });
        scheduleSleep();
      };

      const freeze = (duration = 5000) => {
        window.clearTimeout(poseTimer);
        window.clearTimeout(speechTimer);
        window.clearTimeout(idleTimeout);
        window.clearTimeout(sleepTimeout);
        speech.classList.remove("is-visible");
        body.classList.remove("live2d-bounce");
        container.classList.remove("is-dragging", "is-hovered");
        pointerDown = false;
        dragMoved = false;
        suppressClick = false;
        autoSleeping = false;
        poseBeforeSleep = "idle";
        isIdle = false;
        frozenUntil = Date.now() + duration;
        container.classList.add("is-frozen");
        setPose("frozen", { remember: false, allowDuringFrozen: true });
        frozenTimeout = window.setTimeout(unfreeze, duration);
      };

      const api = {
        id: config.id,
        name: config.name,
        container,
        setPose,
        showSpeech,
        freeze,
        wake: wakeFromAutoSleep,
        react(pose, line, duration = 3000) {
          if (isFrozen()) return;
          wakeFromAutoSleep();
          setPose(pose, { temporary: true, duration });
          showSpeech(line, duration, null);
        }
      };
      registry.set(config.id, api);

      img.addEventListener("error", () => {
        const fallback = img.dataset.fallbackSrc;
        if (!fallback) return;
        img.dataset.fallbackSrc = "";
        img.src = fallback;
      });

      config.poses.forEach((pose) => {
        const preload = new Image();
        preload.src = mascotAsset(config.baseDir, pose.file);
      });

      document.addEventListener("mousemove", (e) => {
        targetX = e.clientX / window.innerWidth;
        targetY = e.clientY / window.innerHeight;
        if (isFrozen()) return;
        isIdle = false;
        window.clearTimeout(idleTimeout);
        idleTimeout = window.setTimeout(() => { isIdle = true; }, 3000);
        wakeFromAutoSleep();
      });

      const animate = () => {
        mouseX += (targetX - mouseX) * 0.04;
        mouseY += (targetY - mouseY) * 0.04;

        const rotateY = (mouseX - 0.5) * 20;
        const rotateX = (mouseY - 0.5) * -8;
        const translateX = (mouseX - 0.5) * 12;

        let idleRotate = 0;
        let idleBob = 0;
        if (isIdle) {
          idlePhase += 0.015;
          idleRotate = Math.sin(idlePhase) * 2;
          idleBob = Math.sin(idlePhase * 0.7) * 3;
        }

        img.style.transform = `perspective(800px) rotateY(${rotateY + idleRotate}deg) rotateX(${rotateX}deg) translateX(${translateX}px) translateY(${idleBob}px)`;
        requestAnimationFrame(animate);
      };
      animate();

      char.addEventListener("click", (e) => {
        if (e.target.closest(".live2d-toolbar")) return;
        if (suppressClick) {
          suppressClick = false;
          e.preventDefault();
          return;
        }
        if (isFrozen()) {
          e.preventDefault();
          return;
        }
        wakeFromAutoSleep();
        body.classList.add("live2d-bounce");
        showSpeech(pickRandom(config.clickLines), 3000, config.clickPose);
        window.setTimeout(() => body.classList.remove("live2d-bounce"), 600);
      });

      char.addEventListener("mouseenter", () => {
        container.classList.add("is-hovered");
        if (isFrozen()) return;
        if (currentPose === "idle" && config.hoverPose) {
          setPose(config.hoverPose, { temporary: true, duration: 1300 });
        }
      });
      char.addEventListener("mouseleave", () => {
        container.classList.remove("is-hovered");
      });

      char.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".live2d-toolbar")) return;
        if (isFrozen()) return;
        pointerDown = true;
        wakeFromAutoSleep();
        dragMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        const rect = container.getBoundingClientRect();
        dragStartLeft = rect.left;
        dragStartBottom = window.innerHeight - rect.bottom;
        char.setPointerCapture(e.pointerId);
      });

      char.addEventListener("pointermove", (e) => {
        if (!pointerDown) return;
        if (isFrozen()) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (!dragMoved && Math.hypot(dx, dy) < 8) return;

        dragMoved = true;
        container.classList.add("is-dragging");
        setPose(config.draggedPose, { temporary: true });

        const rect = container.getBoundingClientRect();
        const gap = 12;
        const left = clamp(dragStartLeft + dx, gap, Math.max(gap, window.innerWidth - rect.width - gap));
        const bottom = clamp(dragStartBottom - dy, gap, Math.max(gap, window.innerHeight - rect.height - gap));
        container.style.left = `${left}px`;
        container.style.bottom = `${bottom}px`;
      });

      char.addEventListener("pointerup", (e) => {
        if (!pointerDown) return;
        pointerDown = false;
        if (isFrozen()) {
          container.classList.remove("is-dragging");
          if (char.hasPointerCapture(e.pointerId)) {
            char.releasePointerCapture(e.pointerId);
          }
          return;
        }
        if (dragMoved) {
          suppressClick = true;
          writeStore({
            left: container.style.left,
            bottom: container.style.bottom
          });
          setPose(steadyPose, { remember: false });
        }
        container.classList.remove("is-dragging");
        if (char.hasPointerCapture(e.pointerId)) {
          char.releasePointerCapture(e.pointerId);
        }
      });

      toolbar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-l2d-action]");
        if (!btn) return;
        const action = btn.dataset.l2dAction;
        if (isFrozen() && action !== "hide") return;
        wakeFromAutoSleep();

        if (action === "chat") {
          showSpeech(pickRandom(config.speechLines), 5000, config.talkPose);
        } else if (action === "skill") {
          config.castSkill(api);
        } else if (action === "support" && config.castSupportSkill) {
          config.castSupportSkill(api);
        } else if (action === "duo") {
          triggerDuoInteraction(config.id);
        } else if (action === "pose") {
          poseIndex = (poseIndex + 1) % poseCycle.length;
          const pose = poseCycle[poseIndex];
          setPose(pose);
          if (config.poseLines[pose]) showSpeech(config.poseLines[pose], 2400, null);
        } else if (action === "hide") {
          window.clearTimeout(sleepTimeout);
          registry.delete(config.id);
          container.classList.add("live2d-hiding");
          writeStore({ hidden: true });
          window.setTimeout(() => {
            container.remove();
            mountRestoreTab(config, writeStore);
          }, 400);
        }
      });

      window.setInterval(() => {
        if (!isFrozen() && isIdle && currentPose === "idle" && Math.random() > 0.72) {
          showSpeech(pickRandom(config.speechLines), 5000, config.talkPose);
        }
      }, 22000);

      window.setInterval(() => {
        if (!isFrozen() && isIdle && currentPose === "idle" && config.idleActionPose && Math.random() > 0.48) {
          setPose(config.idleActionPose, { temporary: true, duration: config.idleActionDuration || 900 });
        }
      }, 6500);

      window.addEventListener("resize", clampCurrentPosition);

      setPose(config.initialPose(), { remember: false });
      restorePosition();
      scheduleSleep();

      window.setTimeout(() => {
        showSpeech(config.introLine, 5000, config.hoverPose || config.talkPose);
      }, config.id === "hutao" ? 5200 : 4000);

      return api;
    };

    characters.forEach(mountCharacter);
  };

  setCurrentYear();
  ensureVisitorNavLink();
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
  setupVisitorTracking();
  setupAnimeHero();
  setupPageHeaderAnimation();
  setupAssistant();
  setupLive2DChar();
})();
