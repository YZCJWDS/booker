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
      let animationFrame = 0;
      let activeScene = document.body.dataset.heroScene || "snow";

      const getActiveScene = () => document.body.dataset.heroScene || "snow";

      const isMeteorScene = () => activeScene === "meteor";

      const pickParticleCount = () => {
        const base = Number.parseInt(getComputedStyle(hero).getPropertyValue("--particle-count"), 10) || 34;
        const mobileRatio = window.innerWidth < 760 ? 0.44 : 1;
        const coreRatio = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? 0.68 : 1;
        const sceneRatio = isMeteorScene() ? 1.18 : 1;
        return Math.max(10, Math.round(base * mobileRatio * coreRatio * sceneRatio));
      };

      const createParticle = (insideViewport = false) => {
        if (isMeteorScene()) {
          const roll = Math.random();
          const type = roll > 0.93 ? "glint" : roll > 0.7 ? "star" : "ribbon";
          const colors = ["#83f4da", "#a9c9ff", "#ffd28f", "#f4fbff"];
          const stream = Math.random() > 0.5 ? 1 : -1;

          return {
            x: Math.random() * width,
            y: insideViewport ? Math.random() * height : height * (0.14 + Math.random() * 0.62),
            radius: type === "ribbon" ? 1.3 + Math.random() * 2.8 : 0.9 + Math.random() * 1.9,
            speedX: stream * (0.08 + Math.random() * 0.22),
            speedY: (Math.random() - 0.5) * 0.18,
            alpha: type === "ribbon" ? 0.16 + Math.random() * 0.22 : 0.28 + Math.random() * 0.4,
            drift: Math.random() * Math.PI * 2,
            phase: Math.random() * Math.PI * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            type
          };
        }

        const roll = Math.random();
        const type = roll > 0.92 ? "ember" : roll > 0.74 ? "mist" : roll > 0.42 ? "mote" : "snow";
        const slow = type === "mist";

        return {
          x: Math.random() * width,
          y: insideViewport ? Math.random() * height : -24 - Math.random() * height * 0.35,
          radius: type === "mist" ? 18 + Math.random() * 44 : 0.8 + Math.random() * 2.2,
          speedX: (Math.random() - 0.5) * (slow ? 0.16 : 0.34),
          speedY: slow ? 0.05 + Math.random() * 0.12 : 0.18 + Math.random() * 0.54,
          alpha: type === "ember" ? 0.22 + Math.random() * 0.22 : 0.18 + Math.random() * 0.42,
          drift: Math.random() * Math.PI * 2,
          type
        };
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
        particles = Array.from({ length: pickParticleCount() }, () => createParticle(true));
        meteors = [];
      };

      const drawParticle = (particle) => {
        if (isMeteorScene()) {
          const pulse = 0.74 + Math.sin(particle.drift * 1.8 + particle.phase) * 0.26;

          context.save();
          context.globalAlpha = particle.alpha * pulse;
          context.globalCompositeOperation = "lighter";
          context.strokeStyle = particle.color;
          context.fillStyle = particle.color;

          if (particle.type === "ribbon") {
            context.lineWidth = Math.max(0.8, particle.radius);
            context.beginPath();
            context.moveTo(particle.x - 16, particle.y + Math.sin(particle.drift) * 5);
            context.quadraticCurveTo(
              particle.x,
              particle.y - 10 - Math.cos(particle.drift) * 8,
              particle.x + 22,
              particle.y + Math.sin(particle.drift + 0.8) * 7
            );
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

        context.globalAlpha = particle.alpha;

        if (particle.type === "ember") {
          context.fillStyle = "#b57a55";
        } else if (particle.type === "mist") {
          context.fillStyle = "#d8e5ec";
        } else {
          context.fillStyle = "#f4fbff";
        }

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      };

      const drawMeteorSky = () => {
        if (!isMeteorScene()) return;

        const time = performance.now() * 0.00024;
        context.save();
        context.globalCompositeOperation = "source-over";

        const drawFeaturedMeteor = (x, y, length, angle, alpha, widthScale = 1) => {
          const tailX = x - Math.cos(angle) * length;
          const tailY = y - Math.sin(angle) * length;
          const glow = context.createLinearGradient(x, y, tailX, tailY);
          const core = context.createLinearGradient(x, y, tailX, tailY);

          glow.addColorStop(0, `rgba(245, 255, 255, ${0.42 * alpha})`);
          glow.addColorStop(0.2, `rgba(84, 188, 207, ${0.42 * alpha})`);
          glow.addColorStop(1, "rgba(84, 188, 207, 0)");

          core.addColorStop(0, `rgba(255, 255, 255, ${0.96 * alpha})`);
          core.addColorStop(0.18, `rgba(191, 252, 240, ${0.82 * alpha})`);
          core.addColorStop(1, "rgba(70, 142, 174, 0)");

          context.save();
          context.lineCap = "round";
          context.globalAlpha = 1;
          context.shadowBlur = 18 * widthScale;
          context.shadowColor = "rgba(68, 174, 198, 0.42)";
          context.strokeStyle = glow;
          context.lineWidth = 11 * widthScale;
          context.beginPath();
          context.moveTo(tailX, tailY);
          context.lineTo(x, y);
          context.stroke();

          context.shadowBlur = 6 * widthScale;
          context.strokeStyle = core;
          context.lineWidth = 2.8 * widthScale;
          context.beginPath();
          context.moveTo(tailX, tailY);
          context.lineTo(x, y);
          context.stroke();

          context.shadowBlur = 14 * widthScale;
          context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          context.beginPath();
          context.arc(x, y, 3.4 * widthScale, 0, Math.PI * 2);
          context.fill();

          context.shadowBlur = 0;
          context.fillStyle = `rgba(84, 188, 207, ${0.34 * alpha})`;
          context.beginPath();
          context.arc(x, y, 8 * widthScale, 0, Math.PI * 2);
          context.fill();
          context.restore();
        };

        for (let band = 0; band < 3; band += 1) {
          const yBase = height * (0.22 + band * 0.13);
          const amplitude = 24 + band * 12;
          const gradient = context.createLinearGradient(0, yBase, width, yBase + height * 0.12);

          gradient.addColorStop(0, "rgba(131, 244, 218, 0)");
          gradient.addColorStop(0.34, band === 1 ? "rgba(255, 210, 143, 0.1)" : "rgba(131, 244, 218, 0.13)");
          gradient.addColorStop(0.66, "rgba(169, 201, 255, 0.12)");
          gradient.addColorStop(1, "rgba(131, 244, 218, 0)");

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

        for (let trail = 0; trail < 4; trail += 1) {
          const progress = (time * (0.18 + trail * 0.035) + trail * 0.27) % 1;
          const x = progress * (width + 420) - 120;
          const y = height * (0.12 + trail * 0.13) + Math.sin(time * 3 + trail) * 18;
          const length = 92 + trail * 22;
          const gradient = context.createLinearGradient(x, y, x - length, y - length * 0.4);

          gradient.addColorStop(0, "rgba(250, 255, 255, 0.58)");
          gradient.addColorStop(0.42, "rgba(131, 244, 218, 0.28)");
          gradient.addColorStop(1, "rgba(131, 244, 218, 0)");

          context.globalAlpha = 0.55;
          context.strokeStyle = gradient;
          context.lineWidth = 1.2 + trail * 0.25;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x - length, y - length * 0.4);
          context.stroke();
        }

        for (let trail = 0; trail < 3; trail += 1) {
          const x = width * (0.52 + trail * 0.15) + Math.sin(time * 5 + trail) * 28;
          const y = height * (0.16 + trail * 0.14) + Math.cos(time * 4 + trail) * 14;
          const length = 150 + trail * 28;
          const gradient = context.createLinearGradient(x, y, x - length, y - length * 0.42);

          gradient.addColorStop(0, "rgba(255, 255, 255, 0.92)");
          gradient.addColorStop(0.22, "rgba(181, 245, 235, 0.72)");
          gradient.addColorStop(1, "rgba(131, 244, 218, 0)");

          context.globalAlpha = 0.88;
          context.strokeStyle = gradient;
          context.lineWidth = 2.4 + trail * 0.55;
          context.shadowBlur = 10 + trail * 2;
          context.shadowColor = "rgba(131, 244, 218, 0.5)";
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x - length, y - length * 0.42);
          context.stroke();
          context.shadowBlur = 0;

          context.globalAlpha = 0.8;
          context.fillStyle = "#f8ffff";
          context.beginPath();
          context.arc(x, y, 2.4 + trail * 0.45, 0, Math.PI * 2);
          context.fill();
        }

        const angle = Math.PI * 0.14;
        const pulse = 0.82 + Math.sin(time * 12) * 0.12;
        drawFeaturedMeteor(width * 0.58, height * 0.12, Math.min(width * 0.24, 260), angle, pulse, 1.12);
        drawFeaturedMeteor(width * 0.76, height * 0.27, Math.min(width * 0.18, 210), angle, 0.76, 0.9);
        drawFeaturedMeteor(width * 0.88, height * 0.42, Math.min(width * 0.16, 190), angle, 0.62, 0.72);

        context.restore();
      };

      const drawConstellationLinks = () => {
        if (!isMeteorScene()) return;

        const stars = particles.filter((particle) => particle.type !== "ribbon");
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
      };

      const createMeteor = () => {
        const life = 34 + Math.floor(Math.random() * 18);

        return {
          x: -80 + Math.random() * width * 0.55,
          y: height * (0.1 + Math.random() * 0.32),
          vx: 4.6 + Math.random() * 2.4,
          vy: 1.8 + Math.random() * 1.1,
          length: 78 + Math.random() * 54,
          alpha: 0.42 + Math.random() * 0.26,
          life,
          maxLife: life
        };
      };

      const drawMeteors = () => {
        if (!isMeteorScene()) return;

        if (meteors.length < 3 && Math.random() < 0.018) {
          meteors.push(createMeteor());
        }

        context.save();
        context.globalCompositeOperation = "lighter";

        for (let index = meteors.length - 1; index >= 0; index -= 1) {
          const meteor = meteors[index];
          const progress = meteor.life / meteor.maxLife;
          const gradient = context.createLinearGradient(
            meteor.x,
            meteor.y,
            meteor.x - meteor.length,
            meteor.y - meteor.length * 0.42
          );

          gradient.addColorStop(0, `rgba(244, 251, 255, ${meteor.alpha * progress})`);
          gradient.addColorStop(0.38, `rgba(131, 244, 218, ${meteor.alpha * progress * 0.58})`);
          gradient.addColorStop(1, "rgba(131, 244, 218, 0)");

          context.strokeStyle = gradient;
          context.lineWidth = 1.4 + progress * 1.8;
          context.beginPath();
          context.moveTo(meteor.x, meteor.y);
          context.lineTo(meteor.x - meteor.length, meteor.y - meteor.length * 0.42);
          context.stroke();

          meteor.x += meteor.vx;
          meteor.y += meteor.vy;
          meteor.life -= 1;

          if (meteor.life <= 0 || meteor.x > width + meteor.length || meteor.y > height + meteor.length) {
            meteors.splice(index, 1);
          }
        }

        context.restore();
      };

      const updateParticle = (particle, index) => {
        if (isMeteorScene()) {
          particle.drift += particle.type === "ribbon" ? 0.014 : 0.022;
          particle.x += particle.speedX + Math.sin(particle.drift) * 0.12;
          particle.y += particle.speedY + Math.cos(particle.drift * 0.7) * 0.08;

          if (particle.x > width + 96 || particle.x < -96 || particle.y < -72 || particle.y > height + 72) {
            particles[index] = createParticle(false);
          }

          return;
        }

        particle.drift += 0.008;
        particle.x += particle.speedX + Math.sin(particle.drift) * 0.12;
        particle.y += particle.speedY;

        if (particle.y > height + 64 || particle.x < -80 || particle.x > width + 80) {
          particles[index] = createParticle(false);
        }
      };

      const refreshParticlesForScene = () => {
        const nextScene = getActiveScene();
        if (nextScene === activeScene) return;

        activeScene = nextScene;
        particles = Array.from({ length: pickParticleCount() }, () => createParticle(true));
        meteors = [];
      };

      const tick = () => {
        refreshParticlesForScene();
        context.clearRect(0, 0, width, height);
        drawMeteorSky();

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
        let animationFrame = 0;

        const resize = () => {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          width = Math.max(1, header.offsetWidth);
          height = Math.max(1, header.offsetHeight);
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          context.setTransform(dpr, 0, 0, dpr, 0, 0);

          const mobileRatio = window.innerWidth < 760 ? 0.58 : 1;
          const coreRatio = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? 0.72 : 1;
          const particleCount = Math.max(12, Math.round((width / 36) * mobileRatio * coreRatio));
          particles = Array.from({ length: particleCount }, () => createParticle(true));
        };

        const createParticle = (insideViewport = false) => {
          const roll = Math.random();
          const type = roll > 0.85 ? "ember" : roll > 0.6 ? "mist" : "mote";

          return {
            x: Math.random() * width,
            y: insideViewport ? Math.random() * height : -24,
            radius: type === "mist" ? 20 + Math.random() * 40 : 1 + Math.random() * 2,
            speedX: (Math.random() - 0.5) * (type === "mist" ? 0.2 : 0.4),
            speedY: type === "mist" ? 0.3 + Math.random() * 0.4 : 0.8 + Math.random() * 1.2,
            opacity: type === "mist" ? 0.08 + Math.random() * 0.12 : 0.3 + Math.random() * 0.4,
            drift: Math.random() * Math.PI * 2,
            type
          };
        };

        const animate = () => {
          context.clearRect(0, 0, width, height);

          particles.forEach((p, index) => {
            p.drift += 0.01;
            p.x += p.speedX + Math.sin(p.drift) * 0.12;
            p.y += p.speedY;

            if (p.y > height + 24 || p.x < -24 || p.x > width + 24) {
              particles[index] = createParticle(false);
              return;
            }

            context.save();
            context.globalAlpha = p.opacity;

            if (p.type === "mist") {
              const gradient = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
              gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
              gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
              gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
              context.fillStyle = gradient;
              context.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
            } else {
              context.fillStyle = p.type === "ember" ? "#ffd89b" : "#ffffff";
              context.beginPath();
              context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
              context.fill();
            }

            context.restore();
          });

          animationFrame = window.requestAnimationFrame(animate);
        };

        resize();
        animate();

        window.addEventListener("resize", resize);

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
    const PREFERENCES_VERSION = 4;
    const DEFAULT_SKIN = "snow";
    const DEFAULT_SCENE = "snow";
    const VALID_SKINS = new Set(["snow", "film", "dark", "midnight", "noir"]);
    const VALID_SCENES = new Set(["snow", "meteor"]);
    const VALID_THEMES = new Set(["morning", "day", "dusk", "night"]);

    const readPreferences = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
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
      if (preferences.skin === "aurora") return "meteor";

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
            <button class="ambient-chip" type="button" data-bg-skin="film">胶片</button>
            <button class="ambient-chip" type="button" data-bg-skin="dark">深海</button>
            <button class="ambient-chip" type="button" data-bg-skin="midnight">星幕</button>
            <button class="ambient-chip" type="button" data-bg-skin="noir">黑金</button>
          </div>
        </div>
        <div class="ambient-group">
          <div class="ambient-title">场景</div>
          <div class="ambient-options">
            <button class="ambient-chip" type="button" data-hero-scene="snow">下雪</button>
            <button class="ambient-chip" type="button" data-hero-scene="meteor">流星</button>
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
      currentScene = VALID_SCENES.has(scene) ? scene : DEFAULT_SCENE;
      document.body.dataset.heroScene = currentScene;
      sceneButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.heroScene === currentScene);
      });
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
  setupPointerTrail();
  setupClickBurst();
  setupAnimeHero();
  setupPageHeaderAnimation();
})();
