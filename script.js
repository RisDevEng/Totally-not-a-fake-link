
    /* =========================
       Screen switching
       ========================= */
    function show(next) {
      document.querySelectorAll('.screen').forEach(s => {
        if (s.id === next) {
          s.style.display = 'flex';
          requestAnimationFrame(() => {
            s.style.opacity = '1';
            s.style.pointerEvents = 'auto';
            if (next === "screen2") {
  preloadMemories(); // fire-and-forget
}
          });
        } else {
          s.style.opacity = '0';
          s.style.pointerEvents = 'none';
          setTimeout(() => s.style.display = 'none', 800);
        }
      });

      if (next === 'screen3') radioEnter();
      else radioExit();

      if (next === 'screen4') startStarfield();
      else stopStarfield();

      if (next !== 'screen3') {
        try { if (currentAudio) currentAudio.pause(); } catch (e) {}
        isPlaying = false;
      }

      if (next === 'screen5') resetNoBtnToCenter();
    }

    document.getElementById('startBtn').onclick = () => show('screen2');

    /* =========================
       Screen 2: Vinyl
       ========================= */
    const vinyl = document.getElementById('vinyl');
    const memoryPopup = document.getElementById('memoryPopup');
    const memoryNextBtn = document.getElementById('memoryNextBtn');

    const memories = [
      { type: 'img', src: 'images/selfie1.jpg', alt: 'selfie' },
      { type: 'img', src: 'images/cuteClip.jpeg', alt: 'cute clip' },
      { type: 'img', src: 'images/emojiLove.png', alt: 'emoji' }
    ];


    // Preload memory assets to avoid popup lag
const memoryReady = new Map(); // src -> true/false

function preloadOne(mem) {
  return new Promise((resolve) => {
    if (!mem || !mem.src) return resolve(true);

    // Already attempted
    if (memoryReady.has(mem.src)) return resolve(memoryReady.get(mem.src));

    if (mem.type === "img") {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.onload = () => { memoryReady.set(mem.src, true); resolve(true); };
      img.onerror = () => { memoryReady.set(mem.src, false); resolve(false); };
      img.src = mem.src;
    } else {
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.onloadeddata = () => { memoryReady.set(mem.src, true); resolve(true); };
      v.onerror = () => { memoryReady.set(mem.src, false); resolve(false); };
      v.src = mem.src;
    }
  });
}

async function preloadMemories() {
  // Load all in parallel (fastest overall)
  await Promise.all(memories.map(preloadOne));
}


    let scratches = 0;
    let showingMemory = false;

function showMemoryInVinyl(mem) {
  if (mem.type === 'img') {
    memoryPopup.innerHTML = `<img class="memMedia" src="${mem.src}" alt="${mem.alt || ''}">`;
  } else {
    memoryPopup.innerHTML = `<video class="memMedia" src="${mem.src}" autoplay muted loop playsinline></video>`;
  }
}


    async function openMemory() {
      if (showingMemory) return;

      // after the last memory: go to starfield screen
      if (scratches >= memories.length) {
        show('screen3');
        return;
      }

      showingMemory = true;
      vinyl.style.animationPlayState = 'paused';
     const mem = memories[scratches];

      // If not ready yet, preload this one before showing
      await preloadOne(mem);

      showMemoryInVinyl(mem);


      memoryPopup.style.display = 'block';
      memoryPopup.style.transition = 'opacity 220ms ease, transform 220ms ease';
      requestAnimationFrame(() => {
        memoryPopup.style.opacity = '1';
        memoryPopup.style.transform = 'translate(-50%, -50%) scale(1)';
      });

      const isLast = (scratches === memories.length - 1);
      memoryNextBtn.textContent = isLast ? "Continue ➜" : "Next ➜";
      memoryNextBtn.style.display = 'inline-flex';
      memoryPopup.setAttribute('aria-hidden', 'false');
    }

    function closeMemoryAndAdvance() {
      if (!showingMemory) return;

      memoryPopup.style.opacity = '0';
      memoryPopup.style.transform = 'translate(-50%, -50%) scale(0.96)';
      setTimeout(() => {
        memoryPopup.style.display = 'none';
        memoryPopup.setAttribute('aria-hidden','true');
      }, 180);

      memoryNextBtn.style.display = 'none';
      vinyl.style.animationPlayState = 'running';

      scratches++;
      showingMemory = false;

      if (scratches >= memories.length) show('screen3');
    }

    memoryNextBtn.addEventListener('click', closeMemoryAndAdvance);

    // scratch interaction (throttled)
    let scratching = false;
    let lastX = 0;
    const scratchThreshold = 28;
    let pendingMove = false;

    function handlePointerMove(e) {
      if (!scratching) return;
      if (pendingMove) return;
      pendingMove = true;
      requestAnimationFrame(() => {
        const dx = Math.abs(e.clientX - lastX);
        if (dx > scratchThreshold) {
          openMemory();
          lastX = e.clientX;
        }
        pendingMove = false;
      });
    }

    vinyl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      scratching = true;
      lastX = e.clientX;
      try { vinyl.setPointerCapture(e.pointerId); } catch {}
      vinyl.addEventListener('pointermove', handlePointerMove);
    });

    vinyl.addEventListener('pointerup', (e) => {
      scratching = false;
      try { vinyl.releasePointerCapture(e.pointerId); } catch {}
      vinyl.removeEventListener('pointermove', handlePointerMove);
    });

    vinyl.addEventListener('pointercancel', () => {
      scratching = false;
      vinyl.removeEventListener('pointermove', handlePointerMove);
    });

    vinyl.addEventListener('click', () => openMemory());

    /* =========================
       Screen 3: Radio
       ========================= */
    const stationNameEl = document.getElementById("stationName");
    const freqBigEl = document.getElementById("freqBig");
    const radioText = document.getElementById("radioText");
    const range = document.getElementById("tunerRange");
    const needleEl = document.getElementById("needle");

    const bandFM = document.getElementById("bandFM");
    const bandAM = document.getElementById("bandAM");

    const playBtn = document.getElementById("playBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    const continueHint = document.getElementById("continueHint");

    const stations = [
      { name: "Nkalaa Radio", title: "❤️ You mean so much to me", subtitle: "Tune 1/4", clip: "songs/joke.mp3" },
      { name: "Nkalaa Radio", title: "🎶 Remember our promise?", subtitle: "Tune 2/4", clip: "songs/confession.mp3" },
      { name: "Nkalaa Radio", title: "😍 I love you", subtitle: "Tune 3/4", clip: "songs/songSnippet.mp3" },
      { name: "Nkalaa Radio", title: "💖 You're amazing", subtitle: "Tune 4/4", clip: "songs/loveNote.mp3" }
    ];

    range.min = 0;
    range.max = String(stations.length - 1);
    range.step = 1;
    range.value = 0;

const stationAudio = stations.map((s, i) => {
  const a = new Audio();
  a.preload = "auto";
  a.loop = false;

  // ✅ handles spaces / emojis in filenames (if you insist on them)
  a.src = encodeURI(s.clip);

  // ✅ if a file fails, you’ll KNOW and it won’t silently ruin UX
  a.addEventListener("error", () => {
    console.warn("Audio failed to load:", s.clip, a.error);
    if (i === currentIdx) {
      radioText.textContent = "This track can't load 😅 Check filename/path.";
      isPlaying = false;
    }
  });

  return a;
});


    let currentIdx = 0;
    let currentAudio = stationAudio[0];
    let isPlaying = false;

    // ✅ Volume (starts muted)
    const volBtn = document.getElementById("volBtn");
    const volWrap = document.getElementById("volWrap");
    const volRange = document.getElementById("volRange");

    let isMuted = true;
    let userVol = 0.95; // default once unmuted

    function applyVolume() {
      const v = isMuted ? 0 : Number(volRange.value);
      stationAudio.forEach(a => { a.volume = v; });
      volBtn.textContent = (v === 0) ? "🔇" : (v < 0.35 ? "🔈" : (v < 0.75 ? "🔉" : "🔊"));
    }

    function setNeedleByIndex(idx){
      const t = idx / Math.max(1, stations.length - 1);
      const deg = -52 + t * 104; // -52deg to +52deg
      needleEl.style.setProperty("--needle-deg", `${deg}deg`);
    }

    function setUI(idx) {
      const s = stations[idx];
      stationNameEl.textContent = s.name;
      freqBigEl.textContent = s.title;
      radioText.textContent = s.subtitle || "";
      setNeedleByIndex(idx);
    }

    function stopAllRadioAudio(reset = true) {
      stationAudio.forEach(a => {
        try { a.pause(); if (reset) a.currentTime = 0; } catch {}
      });
      isPlaying = false;
    }

    function stopCurrent(reset = true) {
      if (!currentAudio) return;
      try { currentAudio.pause(); if (reset) currentAudio.currentTime = 0; } catch {}
      isPlaying = false;
    }

async function tryPlay() {
  if (!currentAudio) return;
  try {
    await currentAudio.play();
    isPlaying = true;
  } catch (err) {
    console.warn("Play failed:", err);
    isPlaying = false;
    radioText.textContent = isMuted
      ? "Turn up volume to listen 🔊"
      : "Can't play this file — check path/format.";
  }
}

    function tuneTo(idx, autoplay = true) {
      idx = Math.max(0, Math.min(stations.length - 1, idx));
      stopCurrent(true);
      currentIdx = idx;
      currentAudio = stationAudio[currentIdx];
      stationAudio.forEach(a => { if (a !== currentAudio) { try { a.pause(); } catch {} } });
      setUI(currentIdx);

      if (continueHint) continueHint.style.display = "none";
      if (autoplay) { currentAudio.currentTime = 0; tryPlay(); }
    }

    stationAudio.forEach((a) => {
      a.addEventListener("ended", () => {
        isPlaying = false;
        if (continueHint) continueHint.style.display = "inline-flex";

        radioText.textContent = (currentIdx >= stations.length - 1)
          ? "Done ✅ Tap ⏭ to continue 💖"
          : "Done ✅ Tap ⏭ for next station or drag the dial.";
      });
    });

    range.addEventListener("input", (e) => {
      const idx = parseInt(e.target.value, 10);
      tuneTo(idx, true);
    });

    prevBtn.addEventListener("click", () => {
      const idx = Math.max(0, currentIdx - 1);
      range.value = idx;
      tuneTo(idx, true);
    });

nextBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  // ✅ hard sync to what the dial says (single source of truth)
  const dialIdx = parseInt(range.value, 10);
  if (!Number.isNaN(dialIdx)) {
    currentIdx = dialIdx;
    currentAudio = stationAudio[currentIdx];
    setNeedleByIndex(currentIdx); // optional but keeps visuals honest
  }

  const atLast = currentIdx >= stations.length - 1;

  if (atLast) {
    stopCurrent(true);
    show("screen4");
    return;
  }

  const idx = Math.min(stations.length - 1, currentIdx + 1);
  range.value = String(idx);
  tuneTo(idx, true);
});


playBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  // ✅ Always sync audio to what the UI says is current
  const shouldBe = stationAudio[currentIdx];
  if (currentAudio !== shouldBe) currentAudio = shouldBe;

  // ✅ Ensure no other track is playing
  stationAudio.forEach((a) => {
    if (a !== currentAudio) {
      try { a.pause(); } catch {}
    }
  });

  // ✅ If the track already ended, restart the SAME track (not “next”)
  const d = currentAudio.duration;
  const endedOrAtEnd =
    currentAudio.ended || (Number.isFinite(d) && currentAudio.currentTime >= d - 0.05);

  if (endedOrAtEnd) currentAudio.currentTime = 0;

  // ✅ Toggle play/pause using the real audio state (more reliable than isPlaying)
  try {
    if (currentAudio.paused) {
      await currentAudio.play();
      isPlaying = true;
    } else {
      currentAudio.pause();
      isPlaying = false;
    }
  } catch (err) {
    console.warn("Play failed:", err);
    isPlaying = false;
    radioText.textContent = isMuted
      ? "Turn up volume to listen 🔊"
      : "Can't play this file — check path/format.";
  }
});


    bandFM.addEventListener("click", () => {
      bandFM.classList.add("isActive");
      bandAM.classList.remove("isActive");
    });
    bandAM.addEventListener("click", () => {
      bandAM.classList.add("isActive");
      bandFM.classList.remove("isActive");
    });

    // ✅ Volume UI behavior
    volBtn.addEventListener("click", () => {
      volWrap.classList.toggle("isOpen");
      if (isMuted) {
        isMuted = false;
        volRange.value = String(userVol);
      } else if (!volWrap.classList.contains("isOpen")) {
        // if they closed the slider, keep current level
        userVol = Number(volRange.value);
      }
      applyVolume();
      if (isMuted) radioText.textContent = "Turn up volume to listen 🔊";
    });

    volRange.addEventListener("input", () => {
      const v = Number(volRange.value);
      userVol = v;
      isMuted = (v === 0);
      applyVolume();
    });

    function radioEnter() {
      // starts muted + prompt
      isMuted = true;
      volRange.value = "0";
      applyVolume();

      range.value = 0;
      tuneTo(0, false); // don't autoplay silently by default
      radioText.textContent = "Turn up volume to listen 🔊";
    }
    function radioExit() {
      stopAllRadioAudio(true);
      isPlaying = false;
    }

    setUI(0);

    /* =========================
       Screen 4: Starfield
       ========================= */
    const VAL_NAME = "Tlotlego";
    const canvas = document.getElementById("starfield");
    const context = canvas.getContext("2d");

    let stars = 500;
    const colorrange = [0, 60, 240];
    let starArray = [];

    let frameNumber = 0;
    let opacity = 0;
    let secondOpacity = 0;
    let thirdOpacity = 0;

    let baseFrame = null;
    let rafId = null;
    let runningStarfield = false;

    function getRandom(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function resizeStarfield() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      baseFrame = context.getImageData(0, 0, canvas.width, canvas.height);
    }

    function initStars() {
      starArray = [];
      for (let i = 0; i < stars; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.2;
        const hue = colorrange[getRandom(0, colorrange.length - 1)];
        const sat = getRandom(50, 100);
        const op = Math.random();
        starArray.push({ x, y, radius, hue, sat, opacity: op });
      }
    }

    function drawStars() {
      for (let i = 0; i < stars; i++) {
        const star = starArray[i];
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `hsla(${star.hue}, ${star.sat}%, 88%, ${star.opacity})`;
        context.fill();
      }
    }

    function updateStars() {
      for (let i = 0; i < stars; i++) {
        if (Math.random() > 0.99) starArray[i].opacity = Math.random();
      }
    }

    function drawTextWithLineBreaks(lines, x, y, fontSize, lineHeight) {
      lines.forEach((line, index) => {
        context.fillText(line, x, y + index * (fontSize + lineHeight));
      });
    }

    const button = document.getElementById("valentinesButton");
    button.addEventListener("click", () => show('screen5'));

    function drawText() {
      const fontSize = Math.min(30, window.innerWidth / 24);
      const lineHeight = 8;

      context.font = fontSize + "px Comic Sans MS";
      context.textAlign = "center";

      context.shadowColor = "rgba(255, 79, 129, 0.5";
      context.shadowBlur = 8;

      if (frameNumber < 250) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        context.fillText("everyday day I cannot believe how lucky I am", canvas.width / 2, canvas.height / 2);
        opacity += 0.02;
      }

      if (frameNumber >= 250 && frameNumber < 500) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        context.fillText("everyday day I cannot believe how lucky I am", canvas.width / 2, canvas.height / 2);
        opacity -= 0.02;
      }

      if (frameNumber === 500) opacity = 0;

      if (frameNumber > 500 && frameNumber < 750) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        if (window.innerWidth < 600) {
          drawTextWithLineBreaks(["Amongst trillions and trillions of stars,", "over billions of years"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
          context.fillText("Amongst trillions and trillions of stars, over billions of years", canvas.width / 2, canvas.height / 2);
        }
        opacity += 0.02;
      }

      if (frameNumber >= 750 && frameNumber < 1000) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        if (window.innerWidth < 600) {
          drawTextWithLineBreaks(["Amongst trillions and trillions of stars,", "over billions of years"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
          context.fillText("Amongst trillions and trillions of stars, over billions of years", canvas.width / 2, canvas.height / 2);
        }
        opacity -= 0.02;
      }

      if (frameNumber === 1000) opacity = 0;

      if (frameNumber > 1000 && frameNumber < 1250) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        context.fillText("to be alive, and to get to spend this life with you", canvas.width / 2, canvas.height / 2);
        opacity += 0.02;
      }

      if (frameNumber >= 1250 && frameNumber < 1500) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        context.fillText("to be alive, and to get to spend this life with you", canvas.width / 2, canvas.height / 2);
        opacity -= 0.01;
      }

      if (frameNumber === 1500) opacity = 0;

      if (frameNumber > 1500 && frameNumber < 1750) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        context.fillText("is so incredibly, unfathomably unlikely", canvas.width / 2, canvas.height / 2);
        opacity += 0.02;
      }

      if (frameNumber >= 1750 && frameNumber < 2000) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        context.fillText("is so incredibly, unfathomably unlikely", canvas.width / 2, canvas.height / 2);
        opacity -= 0.02;
      }

      if (frameNumber === 2000) opacity = 0;

      if (frameNumber > 2000 && frameNumber < 2250) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        if (window.innerWidth < 600) {
          drawTextWithLineBreaks(["and yet here I am to get the impossible", "chance to get to know you"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
          context.fillText("and yet here I am to get the impossible chance to get to know you", canvas.width / 2, canvas.height / 2);
        }
        opacity += 0.02;
      }

      if (frameNumber >= 2250 && frameNumber < 2500) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        if (window.innerWidth < 600) {
          drawTextWithLineBreaks(["and yet here I am to get the impossible", "chance to get to know you"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
          context.fillText("and yet here I am to get the impossible chance to get to know you", canvas.width / 2, canvas.height / 2);
        }
        opacity -= 0.01;
      }

      if (frameNumber === 2500) opacity = 0;

      if (frameNumber > 2500) {
        context.fillStyle = `rgba(203, 67, 171, ${opacity})`;
        if (window.innerWidth < 600) {
          drawTextWithLineBreaks([`I love you so much ${VAL_NAME}, more than`, "all the tiffs and moments we've had"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
          context.fillText(`I love you so much ${VAL_NAME}, more than all the tiffs and moments we've had`, canvas.width / 2, canvas.height / 2);
        }
        opacity += 0.02;
      }

      if (frameNumber >= 2750) {
        context.fillStyle = `rgba(203, 67, 171, ${secondOpacity})`;
        if (window.innerWidth < 600) {
          drawTextWithLineBreaks(["and I can't wait to spend all the time in", "the world to share that love with you!"], canvas.width / 2, (canvas.height / 2 + 60), fontSize, lineHeight);
        } else {
          context.fillText("and I can't wait to spend all the time in the world to share that love with you!", canvas.width / 2, (canvas.height / 2 + 50));
        }
        secondOpacity += 0.02;
      }

      if (frameNumber >= 3000) {
        context.fillStyle = `rgba(203, 67, 171, ${thirdOpacity})`;
        context.fillText("So with all that said, Will you be My valentine? 💖<3", canvas.width / 2, (canvas.height / 2 + 120));
        thirdOpacity += 0.02;
        button.style.display = "block";
      }

      context.shadowColor = "transparent";
      context.shadowBlur = 0;
    }

    function starfieldDraw() {
      context.putImageData(baseFrame, 0, 0);
      drawStars();
      updateStars();
      drawText();
      frameNumber += 2;
      rafId = window.requestAnimationFrame(starfieldDraw);
    }

    function startStarfield() {
      if (runningStarfield) return;
      runningStarfield = true;

      frameNumber = 0;
      opacity = 0;
      secondOpacity = 0;
      thirdOpacity = 0;
      button.style.display = "none";

      resizeStarfield();
      initStars();
      rafId = window.requestAnimationFrame(starfieldDraw);
    }

    function stopStarfield() {
      runningStarfield = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    window.addEventListener("resize", function () {
      if (!runningStarfield) return;
      resizeStarfield();
      initStars();
    });

    /* =========================
       SCREEN 5 + Google Form tracking (CLEAN + STABLE)
       ========================= */
    const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf7r-edoCrf2v3B8-8tNT2FuepuC0XnbDykSDDDWi7vGZLEpw/formResponse";
    const ENTRY_ANSWER = "entry.1477061304";
    const ENTRY_NOCOUNT = "entry.1335156761";

    let noClicks = 0;
    let submitted = false;

    function sendToGoogleForm(answer){
      if (submitted) return;
      submitted = true;
      const url = `${GOOGLE_FORM_URL}?${ENTRY_ANSWER}=${encodeURIComponent(answer)}&${ENTRY_NOCOUNT}=${noClicks}`;
      fetch(url, { method: "POST", mode: "no-cors" });
    }

    const _yesBtn = document.getElementById("yesBtn");
    const _noBtn = document.getElementById("noBtn");
    const _screen5 = document.getElementById("screen5");
    const _proposalPanel = document.getElementById("proposalPanel");
    const _proposalHint = document.getElementById("proposalHint");
    const _noLane = document.getElementById("noLane");

    let _noPos = { x: 0, y: 0 };

    function _ensureNoIsFloatingParent(){
      if (!_noBtn || !_screen5 || !_noLane) return;
      const cs = getComputedStyle(_screen5);
      if (cs.position === "static") _screen5.style.position = "relative";
      _noLane.style.overflow = "visible";

      if (_noBtn.parentElement !== _screen5) {
        _screen5.appendChild(_noBtn);
        _noBtn.style.display = "inline-flex";
        _noBtn.style.alignItems = "center";
        _noBtn.style.justifyContent = "center";
      }

      _noBtn.style.position = "absolute";
      _noBtn.style.left = "0px";
      _noBtn.style.top = "0px";
      _noBtn.style.zIndex = "999";
      _noBtn.style.willChange = "transform";
      _noBtn.style.transition = "transform 380ms cubic-bezier(.2,.85,.2,1)";
    }

    function _placeNoOnLaneCenter(){
      if (!_noBtn || !_screen5 || !_noLane) return;
      const s = _screen5.getBoundingClientRect();
      const lane = _noLane.getBoundingClientRect();
      const b = _noBtn.getBoundingClientRect();

      const x = (lane.left - s.left) + (lane.width / 2) - (b.width / 2);
      const y = (lane.top - s.top) + (lane.height / 2) - (b.height / 2);

      _noPos.x = x;
      _noPos.y = y;
      _noBtn.style.transform = `translate3d(${_noPos.x}px, ${_noPos.y}px, 0)`;
    }

    function _getSafeScreen5Position(){
      const padding = 12;
      const sRect = _screen5.getBoundingClientRect();
      const bRect = _noBtn.getBoundingClientRect();
      const yesRect = _yesBtn.getBoundingClientRect();
      const panelRect = _proposalPanel ? _proposalPanel.getBoundingClientRect() : null;

      const maxX = Math.max(padding, sRect.width - bRect.width - padding);
      const maxY = Math.max(padding, sRect.height - bRect.height - padding);

      const overlaps = (a, b) =>
        !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

      for (let i = 0; i < 100; i++) {
        const x = padding + Math.random() * (maxX - padding);
        const y = padding + Math.random() * (maxY - padding);

        const proposed = {
          left: sRect.left + x,
          right: sRect.left + x + bRect.width,
          top: sRect.top + y,
          bottom: sRect.top + y + bRect.height
        };

        if (overlaps(proposed, yesRect)) continue;
        if (panelRect && overlaps(proposed, panelRect)) continue;

        return { x, y };
      }

      return { x: maxX - 10, y: padding + 10 };
    }

    function _dodgeNo(){
      if (!_noBtn || !_screen5) return;
      const { x, y } = _getSafeScreen5Position();
      _noPos.x = x;
      _noPos.y = y;
      _noBtn.style.transform = `translate3d(${_noPos.x}px, ${_noPos.y}px, 0)`;
    }

    _noBtn.addEventListener("mouseenter", _dodgeNo);
    _noBtn.addEventListener("pointerdown", _dodgeNo);

    _noBtn.addEventListener("click", () => {
      noClicks++;
      if (_proposalHint) _proposalHint.textContent = `Try again 😅 (No tries: ${noClicks})`;
      _dodgeNo();
    });

    function resetNoBtnToCenter(){
      _ensureNoIsFloatingParent();
      _placeNoOnLaneCenter();
    }

    window.addEventListener("resize", () => {
      if (_screen5 && getComputedStyle(_screen5).display !== "none") {
        _placeNoOnLaneCenter();
      }
    });

    function fireConfettiBurst() {
      if (typeof window.confetti !== 'function') return;
      const duration = 2200;
      const end = Date.now() + duration;

      (function frame() {
        window.confetti({ particleCount: 12, angle: 60, spread: 55, origin: { x: 0 } });
        window.confetti({ particleCount: 12, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }

    _yesBtn.addEventListener("click", () => {
      sendToGoogleForm("YES");
      show('screen6');
      setTimeout(fireConfettiBurst, 120);
    });

 
