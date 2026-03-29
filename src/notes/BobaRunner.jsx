import { useRef, useEffect, useCallback, useState } from "react";

const CANVAS_H = 200;
const GROUND_Y = 170;
const GRAVITY = 0.6;
const JUMP_VEL = -11;
const INITIAL_SPEED = 3.5;
const SPEED_INCREMENT = 0.0008;
const SPAWN_MIN = 80;
const SPAWN_MAX = 180;

// Boba cup dimensions
const BOBA_W = 30;
const BOBA_H = 40;
const BOBA_X = 50;

const SKINS = {
  classic: {
    name: "Classic",
    lid: "#F5E6D3", lidRim: "#D4C4B0", straw: "#E85D75",
    body: "#8B5E3C", bodyDark: "#7A5030", highlight: "#A07050",
    window: "#F5E6D3", tea: "#D4A574", pearls: "#2C1810",
    eyes: "#2C1810", blush: "rgba(232, 93, 117, 0.45)",
    legs: "#8B5E3C", shoes: "#E85D75",
  },
  indigo: {
    name: "Indigo",
    lid: "#D8DCF0", lidRim: "#B0B8D8", straw: "#7B8DE0",
    body: "#5B6FC7", bodyDark: "#4A5CB0", highlight: "#6E80D4",
    window: "#E8ECF8", tea: "#C8D0F0", pearls: "#2D2854",
    eyes: "#1A1A3E", blush: "rgba(140, 120, 220, 0.4)",
    legs: "#5B6FC7", shoes: "#7B8DE0",
  },
};
const SKIN_KEYS = Object.keys(SKINS);

function drawBobaCup(ctx, x, y, legFrame, skin) {
  const s = SKINS[skin] || SKINS.indigo;
  const cupTop = y;
  const cupW = BOBA_W;
  const cupH = BOBA_H;

  // Lid — dome shape
  ctx.fillStyle = s.lid;
  ctx.fillRect(x + 2, cupTop, cupW - 4, 6);
  ctx.fillRect(x + 4, cupTop - 3, cupW - 8, 4);
  ctx.fillRect(x + 8, cupTop - 5, cupW - 16, 3);

  // Lid rim
  ctx.fillStyle = s.lidRim;
  ctx.fillRect(x, cupTop + 5, cupW, 3);

  // Straw
  ctx.fillStyle = s.straw;
  ctx.fillRect(x + 13, cupTop - 18, 4, 20);
  ctx.fillRect(x + 13, cupTop - 18, 8, 3);
  ctx.fillRect(x + 18, cupTop - 22, 3, 7);

  // Cup body
  ctx.fillStyle = s.body;
  ctx.fillRect(x + 2, cupTop + 8, cupW - 4, cupH - 14);
  // Tapered bottom
  ctx.fillStyle = s.bodyDark;
  ctx.fillRect(x + 4, cupTop + cupH - 8, cupW - 8, 4);
  ctx.fillRect(x + 3, cupTop + cupH - 12, cupW - 6, 4);

  // Highlight stripe
  ctx.fillStyle = s.highlight;
  ctx.fillRect(x + 5, cupTop + 10, 3, cupH - 18);

  // Window + tea
  ctx.fillStyle = s.window;
  ctx.fillRect(x + 8, cupTop + 14, cupW - 16, cupH - 26);
  ctx.fillStyle = s.tea;
  ctx.fillRect(x + 9, cupTop + 15, cupW - 18, cupH - 28);

  // Eyes
  ctx.fillStyle = s.eyes;
  ctx.fillRect(x + 10, cupTop + 17, 3, 3);
  ctx.fillRect(x + 18, cupTop + 17, 3, 3);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x + 10, cupTop + 17, 1, 1);
  ctx.fillRect(x + 18, cupTop + 17, 1, 1);

  // Cheek blush
  ctx.fillStyle = s.blush;
  ctx.fillRect(x + 7, cupTop + 22, 4, 2);
  ctx.fillRect(x + 20, cupTop + 22, 4, 2);

  // Mouth
  ctx.fillStyle = s.bodyDark;
  ctx.fillRect(x + 14, cupTop + 24, 3, 2);

  // Legs
  ctx.fillStyle = s.legs;
  if (legFrame === 0) {
    ctx.fillRect(x + 6, cupTop + cupH - 4, 4, 6);
    ctx.fillRect(x + 20, cupTop + cupH - 4, 4, 4);
  } else {
    ctx.fillRect(x + 6, cupTop + cupH - 4, 4, 4);
    ctx.fillRect(x + 20, cupTop + cupH - 4, 4, 6);
  }

  // Shoes
  ctx.fillStyle = s.shoes;
  const lShoe = legFrame === 0 ? 6 : 4;
  const rShoe = legFrame === 0 ? 4 : 6;
  ctx.fillRect(x + 4, cupTop + cupH - 4 + lShoe, 7, 3);
  ctx.fillRect(x + 19, cupTop + cupH - 4 + rShoe, 7, 3);
}

function drawTextbook(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  // Spine
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(x, y, 4, h);
  // Page edges
  ctx.fillStyle = "#FFF8F0";
  ctx.fillRect(x + 4, y + 3, w - 8, 2);
  ctx.fillRect(x + 4, y + h - 5, w - 8, 2);
  // Title line
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(x + 8, y + Math.floor(h / 2) - 1, w - 14, 3);
}

function drawPencil(ctx, x, y) {
  // Body (angled — we draw it straight for pixel art simplicity, rotated feel)
  ctx.fillStyle = "#F2C94C";
  ctx.fillRect(x, y, 8, 40);
  // Stripe
  ctx.fillStyle = "#27AE60";
  ctx.fillRect(x, y + 8, 8, 4);
  ctx.fillRect(x, y + 16, 8, 4);
  // Tip
  ctx.fillStyle = "#F5E6D3";
  ctx.fillRect(x + 1, y + 40, 6, 4);
  ctx.fillStyle = "#2C1810";
  ctx.fillRect(x + 2, y + 44, 4, 3);
  // Eraser
  ctx.fillStyle = "#E85D75";
  ctx.fillRect(x, y, 8, 5);
  // Metal band
  ctx.fillStyle = "#C0C0C0";
  ctx.fillRect(x, y + 5, 8, 3);
}

function drawCoffeeCup(ctx, x, y) {
  // Body
  ctx.fillStyle = "#F0F0F0";
  ctx.fillRect(x, y + 6, 22, 28);
  ctx.fillRect(x + 2, y + 34, 18, 3);
  // Lid
  ctx.fillStyle = "#8B5E3C";
  ctx.fillRect(x - 1, y, 24, 7);
  ctx.fillRect(x + 2, y - 2, 18, 3);
  // Lid sip hole
  ctx.fillStyle = "#5A3A20";
  ctx.fillRect(x + 8, y - 1, 6, 2);
  // Sleeve
  ctx.fillStyle = "#D4A574";
  ctx.fillRect(x + 1, y + 14, 20, 10);
  // Handle
  ctx.fillStyle = "#F0F0F0";
  ctx.fillRect(x + 22, y + 12, 5, 3);
  ctx.fillRect(x + 24, y + 14, 3, 10);
  ctx.fillRect(x + 22, y + 23, 5, 3);
  // Steam (small pixels)
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(x + 6, y - 6, 2, 3);
  ctx.fillRect(x + 12, y - 8, 2, 4);
  ctx.fillRect(x + 17, y - 5, 2, 2);
}

function createObstacle(canvasW, speed) {
  const type = Math.random();
  if (type < 0.4) {
    // Textbook
    const h = 30 + Math.floor(Math.random() * 20);
    const w = 18 + Math.floor(Math.random() * 10);
    const colors = ["#5B6FC7", "#E85D75", "#27AE60", "#E2A63D", "#9B59B6"];
    return {
      kind: "textbook",
      x: canvasW + 10,
      y: GROUND_Y - h,
      w,
      h,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  } else if (type < 0.7) {
    // Pencil
    return {
      kind: "pencil",
      x: canvasW + 10,
      y: GROUND_Y - 47,
      w: 8,
      h: 47,
    };
  } else {
    // Coffee cup
    return {
      kind: "coffee",
      x: canvasW + 10,
      y: GROUND_Y - 37,
      w: 27,
      h: 37,
    };
  }
}

export default function BobaRunner({ visible, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [phase, setPhase] = useState("pick"); // "pick" | "play"
  const skinRef = useRef("indigo");

  // Initialize game state
  const initState = useCallback(
    (w) => ({
      started: false,
      over: false,
      bobaY: GROUND_Y - BOBA_H,
      velY: 0,
      onGround: true,
      obstacles: [],
      speed: INITIAL_SPEED,
      score: 0,
      spawnTimer: 120,
      legFrame: 0,
      legTick: 0,
      canvasW: w,
      skin: skinRef.current,
    }),
    []
  );

  // Resize observer
  useEffect(() => {
    if (!visible || !containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setCanvasWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible]);

  // Skin picker canvas — animated
  useEffect(() => {
    if (!visible || phase !== "pick") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let legFrame = 0;
    let raf;

    // Ambient colors per skin
    const AMBIENT = {
      classic: { r: 230, g: 140, b: 50 },   // fire orange
      indigo:  { r: 91, g: 111, b: 199 },    // midnight blue
    };

    function drawPicker() {
      frame++;
      if (frame % 8 === 0) legFrame = legFrame === 0 ? 1 : 0;

      const W = canvas.width;
      ctx.clearRect(0, 0, W, CANVAS_H);
      ctx.fillStyle = "#FFF8F0";
      ctx.fillRect(0, 0, W, CANVAS_H);

      // Title
      ctx.fillStyle = "#2C1810";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CHOOSE YOUR BOBA", W / 2, 30);

      // Bobas close together, but pushed down from title
      const spacing = 60;
      const leftX = Math.floor(W / 2 - spacing - BOBA_W / 2);
      const rightX = Math.floor(W / 2 + spacing - BOBA_W / 2);
      const cupY = 80;

      // Themed ambient glow behind selected boba
      const selX = skinRef.current === "classic" ? leftX : rightX;
      const amb = AMBIENT[skinRef.current];
      const pulse = 0.35 + Math.sin(frame * 0.05) * 0.15;
      const grad = ctx.createRadialGradient(
        selX + BOBA_W / 2, cupY + BOBA_H / 2, 4,
        selX + BOBA_W / 2, cupY + BOBA_H / 2, 65
      );
      grad.addColorStop(0, `rgba(${amb.r}, ${amb.g}, ${amb.b}, ${pulse + 0.2})`);
      grad.addColorStop(0.4, `rgba(${amb.r}, ${amb.g}, ${amb.b}, ${pulse * 0.6})`);
      grad.addColorStop(0.7, `rgba(${amb.r}, ${amb.g}, ${amb.b}, ${pulse * 0.2})`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(selX - 40, cupY - 35, BOBA_W + 80, BOBA_H + 70);

      // Selected boba animates, unselected is static + faded
      const classicLeg = skinRef.current === "classic" ? legFrame : 0;
      const indigoLeg = skinRef.current === "indigo" ? legFrame : 0;

      if (skinRef.current !== "classic") ctx.globalAlpha = 0.45;
      drawBobaCup(ctx, leftX, cupY, classicLeg, "classic");
      ctx.globalAlpha = 1;

      if (skinRef.current !== "indigo") ctx.globalAlpha = 0.45;
      drawBobaCup(ctx, rightX, cupY, indigoLeg, "indigo");
      ctx.globalAlpha = 1;

      // Hint
      ctx.fillStyle = "#8B7355";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("click to pick  •  SPACE to run", W / 2, CANVAS_H - 16);

      raf = requestAnimationFrame(drawPicker);
    }

    raf = requestAnimationFrame(drawPicker);

    function onClick(e) {
      const rect = canvas.getBoundingClientRect();
      const W = canvas.width;
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const spacing = 60;
      const leftX = Math.floor(W / 2 - spacing - BOBA_W / 2);
      const rightX = Math.floor(W / 2 + spacing - BOBA_W / 2);

      if (mx > leftX - 35 && mx < leftX + BOBA_W + 35) {
        skinRef.current = "classic";
      } else if (mx > rightX - 35 && mx < rightX + BOBA_W + 35) {
        skinRef.current = "indigo";
      }
    }

    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        setPhase("play");
      }
    }
    function onDblClick() {
      setPhase("play");
    }

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("dblclick", onDblClick);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("dblclick", onDblClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, phase, canvasWidth]);

  // Main game loop
  useEffect(() => {
    if (!visible || phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    stateRef.current = initState(canvasWidth);

    function draw() {
      const s = stateRef.current;
      const W = canvas.width;

      ctx.clearRect(0, 0, W, CANVAS_H);

      // Background
      ctx.fillStyle = "#FFF8F0";
      ctx.fillRect(0, 0, W, CANVAS_H);

      // Ground — dotted line
      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = "#C4B5A5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 2);
      ctx.lineTo(W, GROUND_Y + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Small ground pebbles
      ctx.fillStyle = "#D8CCBE";
      for (let gx = 20; gx < W; gx += 47) {
        ctx.fillRect(gx + ((s.score * 2) % 47), GROUND_Y + 6, 3, 2);
      }

      // Draw obstacles
      for (const ob of s.obstacles) {
        if (ob.kind === "textbook") drawTextbook(ctx, ob.x, ob.y, ob.w, ob.h, ob.color);
        else if (ob.kind === "pencil") drawPencil(ctx, ob.x, ob.y);
        else if (ob.kind === "coffee") drawCoffeeCup(ctx, ob.x, ob.y);
      }

      // Draw boba cup
      drawBobaCup(ctx, BOBA_X, s.bobaY, s.legFrame, s.skin);

      // Score
      ctx.fillStyle = "#2C1810";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(Math.floor(s.score)).padStart(5, "0"), W - 16, 24);

      // Messages
      if (!s.started && !s.over) {
        ctx.fillStyle = "#2C1810";
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText("press SPACE or click to start", W / 2, CANVAS_H / 2);
      }
      if (s.over) {
        // Overlay
        ctx.fillStyle = "rgba(255, 248, 240, 0.75)";
        ctx.fillRect(0, 0, W, CANVAS_H);

        ctx.fillStyle = "#2C1810";
        ctx.font = "bold 22px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, CANVAS_H / 2 - 16);
        ctx.font = "16px monospace";
        ctx.fillText("score: " + Math.floor(s.score), W / 2, CANVAS_H / 2 + 10);
        ctx.font = "13px monospace";
        ctx.fillStyle = "#8B7355";
        ctx.fillText("click or press space to restart", W / 2, CANVAS_H / 2 + 34);
      }
    }

    function update() {
      const s = stateRef.current;
      if (!s.started || s.over) {
        draw();
        rafRef.current = requestAnimationFrame(update);
        return;
      }

      // Score
      s.score += 0.1;
      s.speed = INITIAL_SPEED + s.score * SPEED_INCREMENT;

      // Leg animation
      s.legTick++;
      if (s.legTick > 6) {
        s.legFrame = s.legFrame === 0 ? 1 : 0;
        s.legTick = 0;
      }

      // Gravity
      if (!s.onGround) {
        s.velY += GRAVITY;
        s.bobaY += s.velY;
        if (s.bobaY >= GROUND_Y - BOBA_H) {
          s.bobaY = GROUND_Y - BOBA_H;
          s.velY = 0;
          s.onGround = true;
        }
      }

      // Obstacles
      s.spawnTimer--;
      if (s.spawnTimer <= 0) {
        s.obstacles.push(createObstacle(s.canvasW, s.speed));
        s.spawnTimer = SPAWN_MIN + Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN));
      }
      for (const ob of s.obstacles) {
        ob.x -= s.speed;
      }
      s.obstacles = s.obstacles.filter((ob) => ob.x + ob.w > -20);

      // Collision — simple AABB with some forgiveness
      const pad = 6;
      const bx = BOBA_X + pad;
      const by = s.bobaY + pad;
      const bw = BOBA_W - pad * 2;
      const bh = BOBA_H - pad;
      for (const ob of s.obstacles) {
        const ox = ob.x + 2;
        const oy = ob.y + 2;
        const ow = ob.w - 4;
        const oh = ob.h - 4;
        if (bx < ox + ow && bx + bw > ox && by < oy + oh && by + bh > oy) {
          s.over = true;
          break;
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(update);
    }

    function handleAction() {
      const s = stateRef.current;
      if (!s.started) {
        s.started = true;
        return;
      }
      if (s.over) {
        stateRef.current = initState(canvas.width);
        stateRef.current.started = true;
        return;
      }
      if (s.onGround) {
        s.velY = JUMP_VEL;
        s.onGround = false;
      }
    }

    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        handleAction();
      }
    }
    function onClick() {
      handleAction();
    }

    canvas.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    rafRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, phase, canvasWidth, initState]);

  // Sync canvas width into game state when it changes
  useEffect(() => {
    if (stateRef.current) stateRef.current.canvasW = canvasWidth;
  }, [canvasWidth]);

  // Reset to skin picker when panel is reopened
  useEffect(() => {
    if (visible) setPhase("pick");
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        border: "3px solid var(--line)",
        borderRadius: 16,
        boxShadow: "var(--shadow)",
        background: "var(--sheet)",
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          borderBottom: "3px solid var(--line)",
          background: "var(--accent)",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: 14,
            color: "#FFF8F0",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Boba Run
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#FFF8F0",
            fontSize: 18,
            cursor: "pointer",
            fontWeight: 800,
            lineHeight: 1,
            padding: "0 2px",
          }}
        >
          &#10005;
        </button>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} style={{ padding: 0, lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={CANVAS_H}
          style={{
            display: "block",
            width: "100%",
            height: CANVAS_H,
            cursor: "pointer",
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
}

