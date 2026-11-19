(() => {
  "use strict";

  // The canvas artwork is always rendered at 1080 x 1350 pixels.
  const W = 1080, H = 1350;
  const canvas = document.getElementById("flyerCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const nameInput = document.getElementById("supporterName");
  const photoInput = document.getElementById("supporterPhoto");
  const zoomInput = document.getElementById("photoZoom");
  const zoomValue = document.getElementById("zoomValue");
  const downloadBtn = document.getElementById("downloadBtn");
  const statusEl = document.getElementById("status");

  const RED = "#e60000", BLACK = "#080808", WHITE = "#ffffff", PAPER = "#f8f9fa";
  const governor = new Image();
  const deputy = new Image();
  const prpLogo = new Image();
  let supporterPhoto = null;
  let supporterZoom = 1;
  let supporterPan = { x: 0, y: 0 };
  let dragState = null;

  // These are local repository assets. If the logo is absent, a vector fallback is drawn.
  governor.src = "./assets/governor.jpg";
  deputy.src = "./assets/deputy.jpg";
  prpLogo.src = "./assets/prp-logo.png";
  [governor, deputy, prpLogo].forEach(img => img.addEventListener("load", draw));
  [governor, deputy, prpLogo].forEach(img => img.addEventListener("error", draw));

  // The supporter portrait is deliberately placed in the final endorsement section
  // and clipped to a circular frame. The deputy portrait occupies the upper-right card.
  const supporterFrame = { cx: 850, cy: 1055, r: 112 };
  const candidateFrames = {
    governor: { x: 54, y: 166, w: 590, h: 690 },
    deputy: { x: 700, y: 360, w: 326, h: 420 }
  };

  function setFont(size, weight = 700, family = 'Arial, Helvetica, sans-serif') {
    ctx.font = `${weight} ${size}px ${family}`;
  }
  function fitText(text, maxWidth, startSize, minSize = 18, weight = 800, family = '"Arial Narrow", Arial, sans-serif') {
    let size = startSize;
    while (size > minSize) {
      setFont(size, weight, family);
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    setFont(size, weight, family);
  }
  function text(str, x, y, size, color = BLACK, weight = 700, align = "left", family = 'Arial, Helvetica, sans-serif') {
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
    setFont(size, weight, family); ctx.fillText(str, x, y);
  }
  function fittedText(str, x, y, maxWidth, startSize, minSize, color = BLACK, weight = 800, family = 'Arial, Helvetica, sans-serif') {
    let size = startSize;
    while (size > minSize) {
      setFont(size, weight, family);
      if (ctx.measureText(str).width <= maxWidth) break;
      size -= 1;
    }
    text(str, x, y, size, color, weight, "left", family);
  }
  function roundedRect(x, y, w, h, r, fill, stroke = null, lineWidth = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function placeholder(x, y, w, h, title, subtitle = "Add image to assets folder") {
    ctx.fillStyle = "#e8e8e8"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#999"; ctx.lineWidth = 3; ctx.setLineDash([12, 8]);
    ctx.strokeRect(x + 8, y + 8, w - 16, h - 16); ctx.setLineDash([]);
    text(title, x + w / 2, y + h / 2 - 5, 27, "#555", 800, "center");
    text(subtitle, x + w / 2, y + h / 2 + 31, 15, "#777", 500, "center");
  }
  function drawCover(img, x, y, w, h, zoom = 1, panX = 0, panY = 0) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    const cx = x + w / 2 + panX, cy = y + h / 2 + panY;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
    return true;
  }
  function drawRoundedCover(img, box, radius, label) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(box.x, box.y, box.w, box.h, radius); ctx.clip();
    if (!drawCover(img, box.x, box.y, box.w, box.h, 1, 0, 0)) {
      ctx.restore(); placeholder(box.x, box.y, box.w, box.h, label); return false;
    }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(box.x, box.y, box.w, box.h, radius);
    ctx.lineWidth = 5; ctx.strokeStyle = WHITE; ctx.stroke(); ctx.restore();
    return true;
  }
  function drawCircularSupporter() {
    const { cx, cy, r } = supporterFrame;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    if (supporterPhoto && supporterPhoto.complete && supporterPhoto.naturalWidth) {
      drawCover(supporterPhoto, cx-r, cy-r, 2*r, 2*r, supporterZoom, supporterPan.x, supporterPan.y);
    } else {
      ctx.fillStyle = "#e9e5df"; ctx.fillRect(cx-r, cy-r, 2*r, 2*r);
      text("YOUR PHOTO", cx, cy-2, 23, "#666666", 800, "center");
      text("UPLOAD A PORTRAIT", cx, cy+28, 13, "#888888", 600, "center");
    }
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r+9, 0, Math.PI*2);
    ctx.strokeStyle = RED; ctx.lineWidth = 9; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r+19, 0, Math.PI*2);
    ctx.strokeStyle = WHITE; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }

  function drawImageFrame(img, box, label, zoom = 1, panX = 0, panY = 0) {
    if (!drawCover(img, box.x, box.y, box.w, box.h, zoom, panX, panY)) {
      placeholder(box.x, box.y, box.w, box.h, label);
    }
    ctx.strokeStyle = BLACK; ctx.lineWidth = 4; ctx.strokeRect(box.x, box.y, box.w, box.h);
  }
  function drawPrpFlag(x, y, w, h) {
    if (prpLogo.complete && prpLogo.naturalWidth) {
      // Contain the supplied flag/logo without stretching its proportions.
      const scale = Math.min(w / prpLogo.naturalWidth, h / prpLogo.naturalHeight);
      const dw = prpLogo.naturalWidth * scale;
      const dh = prpLogo.naturalHeight * scale;
      ctx.fillStyle = WHITE;
      ctx.fillRect(x, y, w, h);
      ctx.drawImage(prpLogo, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      return;
    }
    ctx.fillStyle = RED; ctx.fillRect(x, y, w, h / 3);
    ctx.fillStyle = WHITE; ctx.fillRect(x, y + h / 3, w, h / 3);
    ctx.fillStyle = BLACK; ctx.fillRect(x, y + 2 * h / 3, w, h / 3);
    // Simple key motif in the white band as a logo fallback.
    const cy = y + h / 2;
    ctx.strokeStyle = BLACK; ctx.lineWidth = Math.max(3, h * .045);
    ctx.beginPath(); ctx.arc(x + w * .30, cy, h * .105, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w * .405, cy); ctx.lineTo(x + w * .67, cy);
    ctx.lineTo(x + w * .67, cy + h * .07); ctx.moveTo(x + w * .58, cy);
    ctx.lineTo(x + w * .58, cy - h * .07); ctx.stroke();
    text("PRP", x + w * .83, cy + h * .09, h * .23, RED, 900, "center");
  }
  function drawThumbprint(x, y, w, h) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x + w/2, y + h/2, w*.30, h*.40, -.22, 0, Math.PI*2); ctx.clip();
    ctx.strokeStyle = "#151515"; ctx.lineWidth = 3.2;
    for (let i = 0; i < 18; i++) {
      const rx = w * (.055 + i * .014), ry = h * (.08 + i * .018);
      ctx.beginPath();
      ctx.ellipse(x + w*.5, y + h*.5, rx, ry, -.22, .18, Math.PI*1.86);
      ctx.stroke();
    }
    // Small ridge breaks and natural-looking short marks.
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const yy = y + h*(.20 + i*.065);
      ctx.beginPath(); ctx.moveTo(x+w*.28, yy); ctx.quadraticCurveTo(x+w*.5, yy-8, x+w*.72, yy+3); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x+w*.82, y+h*.80, 26, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = WHITE; ctx.lineWidth = 5; ctx.beginPath();
    ctx.moveTo(x+w*.82-11, y+h*.80); ctx.lineTo(x+w*.82-2, y+h*.80+9);
    ctx.lineTo(x+w*.82+14, y+h*.80-11); ctx.stroke();
  }
  function drawBallot(x, y, w, h) {
    ctx.fillStyle = BLACK; ctx.fillRect(x, y, w, 42);
    text("BALLOT PAPER", x+w/2, y+29, 23, WHITE, 900, "center");
    ctx.fillStyle = WHITE; ctx.fillRect(x, y+42, w, h-42);
    ctx.strokeStyle = BLACK; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x+w/2, y+42); ctx.lineTo(x+w/2, y+h); ctx.stroke();
    drawPrpFlag(x+12, y+58, w/2-24, h-74);
    drawThumbprint(x+w/2+8, y+52, w/2-16, h-60);
  }
  function drawStamp(cx, cy) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.16);
    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.beginPath(); ctx.arc(0,0,106,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = RED; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0,0,101,0,Math.PI*2); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0,0,88,0,Math.PI*2); ctx.stroke();
    text("MY VOTE IS", 0, -47, 20, RED, 900, "center");
    text("PRP", 0, 19, 58, RED, 900, "center", '"Arial Black", Arial, sans-serif');
    text("6 - 2 - 2027", 0, 57, 19, RED, 900, "center");
    ctx.restore();
  }
  function draw() {
    // Refined editorial poster: governor as the hero, deputy in a dedicated
    // portrait card, and the supporter's circular portrait at the very end.
    const CREAM = "#f3f0e9", INK = "#111318", MUTED = "#686b70", GOLD = "#d7b77a";
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);

    // PRP tricolour and campaign masthead.
    ctx.fillStyle = RED; ctx.fillRect(0, 0, W/3, 14);
    ctx.fillStyle = WHITE; ctx.fillRect(W/3, 0, W/3, 14);
    ctx.fillStyle = BLACK; ctx.fillRect(2*W/3, 0, W/3, 14);
    ctx.fillStyle = INK; ctx.fillRect(0, 14, W, 122);
    text("PEOPLE'S REDEMPTION PARTY", 54, 66, 20, WHITE, 800);
    text("BAUCHI STATE  /  GOVERNORSHIP ELECTION 2027", 54, 101, 16, "#c9c9c9", 600);
    drawPrpFlag(824, 28, 202, 94);

    // Main candidate portrait: large, clean and visually dominant.
    const hero = candidateFrames.governor;
    ctx.save(); ctx.beginPath(); ctx.roundRect(hero.x, hero.y, hero.w, hero.h, 22); ctx.clip();
    if (!drawCover(governor, hero.x, hero.y, hero.w, hero.h, 1, 0, 0)) {
      placeholder(hero.x, hero.y, hero.w, hero.h, "GOVERNOR PORTRAIT");
    }
    const heroFade = ctx.createLinearGradient(0, 570, 0, 856);
    heroFade.addColorStop(0, "rgba(8,10,14,0)");
    heroFade.addColorStop(.38, "rgba(8,10,14,.72)");
    heroFade.addColorStop(1, "rgba(8,10,14,.97)");
    ctx.fillStyle = heroFade; ctx.fillRect(hero.x, 560, hero.w, 296);
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(hero.x, hero.y, hero.w, hero.h, 22);
    ctx.lineWidth = 7; ctx.strokeStyle = WHITE; ctx.stroke(); ctx.restore();
    ctx.fillStyle = RED; ctx.fillRect(54, 166, 12, 690);
    text("OUR GOVERNORSHIP CANDIDATE", 91, 735, 17, "#f2d6d6", 800);
    fittedText("SEN. SHEHU BUBA UMAR", 91, 795, 510, 42, 31, WHITE, 900, '"Arial Black", Arial, sans-serif');
    text("A NEW CHAPTER FOR BAUCHI", 91, 833, 18, WHITE, 700);

    // Endorsement message and deputy governor portrait at upper right.
    text("THE TEAM FOR BAUCHI", 700, 190, 17, RED, 900);
    text("ONE TEAM.", 700, 246, 43, INK, 900, "left", '"Arial Black", Arial, sans-serif');
    text("ONE FUTURE.", 700, 296, 43, RED, 900, "left", '"Arial Black", Arial, sans-serif');
    ctx.fillStyle = INK; ctx.fillRect(700, 316, 326, 5);
    const dep = candidateFrames.deputy;
    drawRoundedCover(deputy, dep, 20, "DEPUTY PORTRAIT");
    // Subtle dark caption plate overlaps the base of the deputy portrait.
    ctx.save(); ctx.beginPath(); ctx.roundRect(700, 704, 326, 76, [0, 0, 20, 20]); ctx.clip();
    ctx.fillStyle = INK; ctx.fillRect(700, 704, 326, 76); ctx.restore();
    text("DEPUTY GOVERNOR", 722, 733, 14, "#f0b7b7", 800);
    fittedText("HON. TIJJANI MUHAMMED ALIYU", 722, 762, 284, 23, 17, WHITE, 900);

    // Party identity and election date anchor the right column.
    ctx.fillStyle = WHITE; ctx.fillRect(700, 808, 326, 88);
    ctx.strokeStyle = "#ded8cf"; ctx.lineWidth = 2; ctx.strokeRect(700, 808, 326, 88);
    drawPrpFlag(713, 820, 168, 64);
    text("ELECTION DAY", 900, 839, 12, MUTED, 800);
    text("06 FEB", 900, 866, 27, RED, 900);
    text("2027", 900, 885, 15, INK, 800);

    // Supporter endorsement is the final portrait section: circular photo,
    // strong name hierarchy and a clear personal statement.
    ctx.fillStyle = WHITE; ctx.fillRect(0, 925, W, 265);
    ctx.fillStyle = RED; ctx.fillRect(0, 925, W, 8);
    text("YOUR SUPPORT MAKES THE MESSAGE PERSONAL", 66, 985, 17, RED, 900);
    text("I STAND WITH", 66, 1037, 25, MUTED, 800);
    text("SHEHU BUBA", 66, 1090, 47, INK, 900, "left", '"Arial Black", Arial, sans-serif');
    ctx.fillStyle = RED; ctx.fillRect(66, 1110, 90, 6);
    text("MY NAME IS", 66, 1150, 15, MUTED, 800);
    const supporterName = (nameInput.value.trim() || "YOUR NAME HERE").toLocaleUpperCase();
    fittedText(supporterName, 66, 1180, 620, 31, 19, INK, 900, '"Arial Black", Arial, sans-serif');
    drawCircularSupporter();

    // Confident campaign footer with clear call to action and attribution.
    ctx.fillStyle = RED; ctx.fillRect(0, 1200, W, 150);
    text("WHAT ABOUT YOU?", 54, 1265, 62, WHITE, 900, "left", '"Arial Black", Arial, sans-serif');
    text("VOTE PRP  •  6 FEBRUARY 2027  •  #SHEHU_TIJJANI2027", 57, 1310, 21, WHITE, 800);
    text("Created by Sani Ahmad Tijjani", 1026, 1337, 14, "#ffe4e4", 500, "right");
  }

  function updateZoom() {
    supporterZoom = Number(zoomInput.value);
    zoomValue.value = `${supporterZoom.toFixed(1)}×`;
    zoomValue.textContent = zoomValue.value;
    draw();
  }

  nameInput.addEventListener("input", draw);
  zoomInput.addEventListener("input", updateZoom);
  photoInput.addEventListener("change", event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      statusEl.textContent = "Please choose an image file.";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        supporterPhoto = img;
        supporterZoom = 1;
        supporterPan = { x: 0, y: 0 };
        zoomInput.value = "1";
        updateZoom();
        statusEl.textContent = "Photo loaded. Drag it in the preview to reposition.";
      };
      img.onerror = () => statusEl.textContent = "That image could not be opened. Try another photo.";
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }
  function insideSupporterFrame(p) {
    const b = supporterFrame;
    return Math.hypot(p.x - b.cx, p.y - b.cy) <= b.r + 10;
  }
  canvas.addEventListener("pointerdown", event => {
    const p = pointerPosition(event);
    if (!supporterPhoto || !insideSupporterFrame(p)) return;
    dragState = { pointerId: event.pointerId, last: p };
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  canvas.addEventListener("pointermove", event => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const p = pointerPosition(event);
    supporterPan.x += p.x - dragState.last.x;
    supporterPan.y += p.y - dragState.last.y;
    dragState.last = p;
    draw();
  });
  function endDrag(event) {
    if (dragState && (!event || dragState.pointerId === event.pointerId)) dragState = null;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);

  downloadBtn.addEventListener("click", () => {
    draw();
    statusEl.textContent = "Preparing your high-resolution flyer…";
    downloadBtn.disabled = true;

    canvas.toBlob(blob => {
      downloadBtn.disabled = false;

      if (!blob) {
        statusEl.textContent = "The flyer could not be exported. Please refresh the page and try again.";
        return;
      }

      const url = URL.createObjectURL(blob);
      const safeName = (nameInput.value.trim() || "supporter")
        .replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
      const filename = `PRP-flyer-${safeName || "supporter"}.png`;

      // Standard download for desktop browsers and mobile Chrome.
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Some in-app Android browsers ignore the download attribute.
      // Keep an explicit open-image fallback so the user can save it manually.
      statusEl.replaceChildren();
      const message = document.createElement("span");
      message.textContent = "If the download did not start, ";
      const fallback = document.createElement("a");
      fallback.href = url;
      fallback.target = "_blank";
      fallback.rel = "noopener";
      fallback.textContent = "tap here to open your flyer";
      fallback.style.color = "#e60000";
      fallback.style.fontWeight = "800";
      fallback.style.textDecoration = "underline";
      statusEl.append(message, fallback, document.createTextNode(". Then use your browser menu or press and hold the image to save it."));

      // Do not revoke immediately: the fallback link needs the blob URL to remain valid.
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    }, "image/png");
  });

  draw();
})();
