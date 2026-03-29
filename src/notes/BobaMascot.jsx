import { useRef, useEffect } from "react";

const W = 120;
const H = 150;
const BASE_SCALE = 1.6;

function drawBoba(ctx, cx, cy, awake, frame) {
  const x = cx - 15;
  const y = cy;

  // Lid dome
  ctx.fillStyle = "#F5E6D3";
  ctx.fillRect(x + 2, y, 26, 6);
  ctx.fillRect(x + 4, y - 3, 22, 4);
  ctx.fillRect(x + 8, y - 5, 14, 3);
  // Lid rim
  ctx.fillStyle = "#D4C4B0";
  ctx.fillRect(x, y + 5, 30, 3);
  // Straw
  ctx.fillStyle = "#E85D75";
  ctx.fillRect(x + 13, y - 18, 4, 20);
  ctx.fillRect(x + 13, y - 18, 8, 3);
  ctx.fillRect(x + 18, y - 22, 3, 7);

  // Cup body
  ctx.fillStyle = "#8B5E3C";
  ctx.fillRect(x + 2, y + 8, 26, 26);
  ctx.fillStyle = "#7A5030";
  ctx.fillRect(x + 4, y + 30, 22, 4);
  ctx.fillRect(x + 3, y + 26, 24, 4);
  // Highlight
  ctx.fillStyle = "#A07050";
  ctx.fillRect(x + 5, y + 10, 3, 22);

  // Window + tea
  ctx.fillStyle = "#F5E6D3";
  ctx.fillRect(x + 8, y + 14, 14, 14);
  ctx.fillStyle = "#D4A574";
  ctx.fillRect(x + 9, y + 15, 12, 12);

  // Eyes
  if (awake) {
    ctx.fillStyle = "#2C1810";
    ctx.fillRect(x + 10, y + 17, 3, 3);
    ctx.fillRect(x + 18, y + 17, 3, 3);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 10, y + 17, 1, 1);
    ctx.fillRect(x + 18, y + 17, 1, 1);
  } else {
    // Sleeping — horizontal line eyes
    ctx.fillStyle = "#2C1810";
    ctx.fillRect(x + 9, y + 18, 5, 2);
    ctx.fillRect(x + 17, y + 18, 5, 2);
  }

  // Blush
  const blushAlpha = awake ? 0.55 : 0.3;
  ctx.fillStyle = `rgba(232, 93, 117, ${blushAlpha})`;
  ctx.fillRect(x + 7, y + 22, 4, 2);
  ctx.fillRect(x + 20, y + 22, 4, 2);

  // Mouth
  ctx.fillStyle = "#5A3A20";
  ctx.fillRect(x + 14, y + 24, 3, 2);

  // Legs (still)
  ctx.fillStyle = "#8B5E3C";
  ctx.fillRect(x + 6, y + 34, 4, 5);
  ctx.fillRect(x + 20, y + 34, 4, 5);
  ctx.fillStyle = "#E85D75";
  ctx.fillRect(x + 4, y + 38, 7, 3);
  ctx.fillRect(x + 19, y + 38, 7, 3);
}

export default function BobaMascot({ awake, onClick }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const prevAwakeRef = useRef(false);
  const popRef = useRef(0); // pop animation progress

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let sparkles = [];

    function loop() {
      frame++;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;

      // Pop effect on wake
      if (awake && !prevAwakeRef.current) {
        popRef.current = 1;
        prevAwakeRef.current = true;
      } else if (!awake && prevAwakeRef.current) {
        prevAwakeRef.current = false;
        popRef.current = 0;
        sparkles = [];
      }

      // Pop animation decay
      let scale = 1;
      if (popRef.current > 0) {
        scale = 1 + popRef.current * 0.15;
        popRef.current *= 0.9;
        if (popRef.current < 0.01) popRef.current = 0;
      }

      // Bob animation
      const bobAmp = awake ? 4 : 2.5;
      const bobSpeed = awake ? 0.07 : 0.035;
      const bobY = Math.sin(frame * bobSpeed) * bobAmp;
      const totalScale = BASE_SCALE * scale;
      const drawCx = W / 2;
      const drawCy = H / 2 - 5;

      ctx.save();
      ctx.translate(drawCx, drawCy + bobY);
      ctx.scale(totalScale, totalScale);
      ctx.translate(-drawCx / totalScale, -drawCy / totalScale);

      drawBoba(ctx, drawCx / totalScale, drawCy / totalScale - 8, awake, frame);

      ctx.restore();

      // Sleeping: draw zzz
      if (!awake) {
        const zPhase = (frame * 0.02) % 1;
        const zzes = [
          { x: cx + 18, startY: 28, size: 8, delay: 0 },
          { x: cx + 24, startY: 20, size: 7, delay: 0.33 },
          { x: cx + 30, startY: 12, size: 6, delay: 0.66 },
        ];
        ctx.font = "bold 9px monospace";
        for (const z of zzes) {
          const t = (zPhase + z.delay) % 1;
          const zy = z.startY - t * 18;
          const alpha = t < 0.7 ? 0.6 : 0.6 * (1 - (t - 0.7) / 0.3);
          ctx.fillStyle = `rgba(140, 123, 85, ${Math.max(0, alpha)})`;
          ctx.fillText("z", z.x, zy + bobY);
        }
      }

      // Awake: sparkles
      if (awake) {
        // Spawn new sparkles
        if (frame % 12 === 0) {
          sparkles.push({
            x: cx + (Math.random() - 0.5) * 50,
            y: 25 + Math.random() * 50,
            life: 1,
            size: 2 + Math.random() * 2,
          });
        }
        // Draw + update sparkles
        for (let i = sparkles.length - 1; i >= 0; i--) {
          const sp = sparkles[i];
          sp.life -= 0.02;
          sp.y -= 0.3;
          if (sp.life <= 0) { sparkles.splice(i, 1); continue; }
          const a = sp.life * 0.7;
          ctx.fillStyle = `rgba(255, 240, 200, ${a})`;
          // 4-pointed sparkle: cross shape
          const s = sp.size;
          ctx.fillRect(sp.x - s, sp.y - 0.5, s * 2, 1);
          ctx.fillRect(sp.x - 0.5, sp.y - s, 1, s * 2);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [awake]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onClick={onClick}
      style={{ display: "block", margin: "0 auto", cursor: "pointer" }}
    />
  );
}
