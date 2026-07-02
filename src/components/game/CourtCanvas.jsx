import React, { useRef, useEffect, useCallback } from 'react';
import { COURT, TEAM_COLORS } from '@/lib/gameData';

// 2x zoom: only half the court width is visible at a time.
// The camera smoothly pans horizontally to follow the ball.
const ZOOM = 2;
const VISIBLE_WIDTH = COURT.width / ZOOM; // half-court width visible
const PAN_SMOOTH = 0.12; // camera follow easing per frame

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Shared court→screen transform: screen = court * scale + offset
function buildTransform(w, h, cameraX) {
  const sx = w / VISIBLE_WIDTH;
  const sy = h / COURT.height;
  // camera center (cameraX) maps to canvas center (w/2)
  const ox = (w / 2) - cameraX * sx;
  const oy = 0;
  return { sx, sy, ox, oy };
}

function sx_of(tf, courtX) { return courtX * tf.sx + tf.ox; }
function sy_of(tf, courtY) { return courtY * tf.sy + tf.oy; }

function drawCourt(ctx, tf) {
  const { sx, sy, ox, oy } = tf;
  const courtW = COURT.width * sx;
  const courtH = COURT.height * sy;
  const midY = (COURT.height / 2) * sy + oy;

  // Court floor
  ctx.fillStyle = '#C4843F';
  ctx.fillRect(ox, oy, courtW, courtH);

  // Court lines
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;

  // Boundary
  ctx.strokeRect(ox + 2, oy + 2, courtW - 4, courtH - 4);

  // Half court line
  const halfX = sx_of(tf, COURT.width / 2);
  ctx.beginPath();
  ctx.moveTo(halfX, oy);
  ctx.lineTo(halfX, oy + courtH);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(halfX, midY, COURT.centerCircleRadius * sx, 0, Math.PI * 2);
  ctx.stroke();

  // Keys
  const keyW = COURT.keyWidth * sx;
  const keyH = COURT.keyHeight * sy;
  ctx.strokeRect(ox, midY - keyH / 2, keyW, keyH);
  ctx.strokeRect(ox + courtW - keyW, midY - keyH / 2, keyW, keyH);

  // Free throw circles
  ctx.beginPath();
  ctx.arc(sx_of(tf, COURT.keyWidth), midY, COURT.ftCircleRadius * sx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(sx_of(tf, COURT.width - COURT.keyWidth), midY, COURT.ftCircleRadius * sx, 0, Math.PI * 2);
  ctx.stroke();

  // Three-point arcs
  const threeR = COURT.threePointRadius * sx;
  const rimLeftX = sx_of(tf, COURT.rimX);
  const rimRightX = sx_of(tf, COURT.width - COURT.rimX);

  ctx.beginPath();
  ctx.moveTo(ox, midY - threeR);
  ctx.lineTo(sx_of(tf, COURT.rimX * 0.6), midY - threeR);
  ctx.arc(rimLeftX, midY, threeR, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(ox, midY + threeR);
  ctx.stroke();

  ctx.beginPath();
  const rightEdge = ox + courtW;
  ctx.moveTo(rightEdge, midY - threeR);
  ctx.lineTo(sx_of(tf, COURT.width - COURT.rimX * 0.6), midY - threeR);
  ctx.arc(rimRightX, midY, threeR, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(rightEdge, midY + threeR);
  ctx.stroke();

  // Backboards and rims
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(rimLeftX - 5, midY - 15);
  ctx.lineTo(rimLeftX - 5, midY + 15);
  ctx.stroke();
  ctx.strokeStyle = '#FF6600';
  ctx.beginPath();
  ctx.arc(rimLeftX, midY, 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(rimRightX + 5, midY - 15);
  ctx.lineTo(rimRightX + 5, midY + 15);
  ctx.stroke();
  ctx.strokeStyle = '#FF6600';
  ctx.beginPath();
  ctx.arc(rimRightX, midY, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Paint area tint
  ctx.fillStyle = 'rgba(139, 90, 43, 0.3)';
  ctx.fillRect(ox, midY - keyH / 2, keyW, keyH);
  ctx.fillRect(ox + courtW - keyW, midY - keyH / 2, keyW, keyH);
}

function drawBenchPlayer(ctx, player, tf) {
  const { sx } = tf;
  const x = sx_of(tf, player.x);
  const y = sy_of(tf, player.y);
  const r = 8 * sx;
  const colors = TEAM_COLORS[player.team];

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = colors.text;
  ctx.font = `bold ${Math.max(7, r * 0.8)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.number, x, y);
  ctx.globalAlpha = 1;
}

function drawPlayer(ctx, player, tf, isBallCarrier) {
  const { sx } = tf;
  const x = sx_of(tf, player.x);
  const y = sy_of(tf, player.y);
  const r = player.radius * sx;

  const colors = TEAM_COLORS[player.team];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 2, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Player circle
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = isBallCarrier ? 3 : 1.5;
  ctx.stroke();

  // Ball carrier glow
  if (isBallCarrier) {
    ctx.shadowColor = colors.secondary;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Jersey number
  ctx.fillStyle = colors.text;
  ctx.font = `bold ${Math.max(10, r * 0.85)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.number, x, y);

  // Fatigue ring — visible when a player is getting tired
  if (player.fatigue > 45) {
    ctx.strokeStyle = player.fatigue > 75 ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Name label
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.max(11, 14 * sx)}px "Arial Black", "Helvetica Neue", sans-serif`;
  ctx.fillText(player.name.split(' ').pop(), x, y - r - 8);
}

function drawBall(ctx, ball, tf) {
  const { sx, sy } = tf;
  const x = sx_of(tf, ball.x);
  const y = sy_of(tf, ball.y);
  const arcOffset = ball.arcHeight ? ball.arcHeight * sy : 0;

  if (ball.carrier) return; // ball drawn with player

  // Ball shadow when in air
  if (arcOffset > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Magical pass trail — sparkle particles behind the ball
  if (ball.isMagicPass && ball.inFlight) {
    const elapsed = Date.now() - ball.flightStart;
    const t = Math.min(elapsed / ball.flightDuration, 1);
    for (let i = 1; i <= 8; i++) {
      const trailT = Math.max(0, t - i * 0.05);
      if (trailT <= 0) continue;
      const tx = sx_of(tf, lerp(ball.startX, ball.targetX, trailT));
      const ty = sy_of(tf, lerp(ball.startY, ball.targetY, trailT));
      const alpha = (1 - i / 8) * 0.5;
      ctx.fillStyle = `rgba(180, 140, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5 - i * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 210, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = '#b48cff';
    ctx.shadowBlur = 16;
  }

  // Ball
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.arc(x, y - arcOffset, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Ball lines
  ctx.beginPath();
  ctx.moveTo(x - 5, y - arcOffset);
  ctx.lineTo(x + 5, y - arcOffset);
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Skyhook effect — golden sparkles orbiting the ball + label
  if (ball.isSkyhook && ball.inFlight) {
    const ballY = y - arcOffset;
    const time = Date.now() * 0.004;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time;
      const sr = 14 + Math.sin(time + i) * 4;
      const px = x + Math.cos(angle) * sr;
      const py = ballY + Math.sin(angle) * sr;
      const alpha = 0.4 + Math.sin(time * 1.5 + i) * 0.3;
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SKYHOOK!', x, ballY - 18);
  }

  // Dunk effect — motion trail + rim flash on impact
  if (ball.isDunk && ball.inFlight) {
    const elapsed = Date.now() - ball.flightStart;
    const t = Math.min(elapsed / ball.flightDuration, 1);
    const ballY = y - arcOffset;

    for (let i = 1; i <= 5; i++) {
      const trailT = Math.max(0, t - i * 0.06);
      if (trailT <= 0) continue;
      const tx = sx_of(tf, lerp(ball.startX, ball.targetX, trailT));
      const ty = sy_of(tf, lerp(ball.startY, ball.targetY, trailT));
      const alpha = (1 - i / 5) * 0.4;
      ctx.strokeStyle = `rgba(255, 140, 0, ${alpha})`;
      ctx.lineWidth = 3 - i * 0.4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, ballY);
      ctx.stroke();
    }

    if (t > 0.7) {
      const flashAlpha = (t - 0.7) / 0.3;
      const rimX = sx_of(tf, ball.targetX);
      const rimY = sy_of(tf, ball.targetY);

      ctx.fillStyle = `rgba(255, 255, 200, ${flashAlpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(rimX, rimY, 20, 0, Math.PI * 2);
      ctx.fill();

      const time = Date.now() * 0.01;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time;
        const r1 = 12;
        const r2 = 20 + flashAlpha * 8;
        ctx.strokeStyle = `rgba(255, 220, 100, ${flashAlpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rimX + Math.cos(angle) * r1, rimY + Math.sin(angle) * r1);
        ctx.lineTo(rimX + Math.cos(angle) * r2, rimY + Math.sin(angle) * r2);
        ctx.stroke();
      }
    }

    ctx.fillStyle = 'rgba(255, 80, 0, 0.95)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SLAM!', x, ballY - 18);
  }
}

export default function CourtCanvas({ gameState }) {
  const canvasRef = useRef(null);
  const cameraRef = useRef(COURT.width / 2); // start centered

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Smoothly pan the camera toward the ball
    const ballX = gameState.ball.x;
    const half = VISIBLE_WIDTH / 2;
    const target = clamp(ballX, half, COURT.width - half);
    cameraRef.current = lerp(cameraRef.current, target, PAN_SMOOTH);

    const tf = buildTransform(w, h, cameraRef.current);

    // Draw court
    drawCourt(ctx, tf);

    // Draw bench players (faded, along sideline)
    gameState.players.filter(p => !p.onCourt).forEach(p => drawBenchPlayer(ctx, p, tf));

    // Draw on-court players (defense first, then offense on top)
    const defPlayers = gameState.players.filter(p => p.team !== gameState.possession && p.onCourt);
    const offPlayers = gameState.players.filter(p => p.team === gameState.possession && p.onCourt);

    defPlayers.forEach(p => drawPlayer(ctx, p, tf, false));
    offPlayers.forEach(p => drawPlayer(ctx, p, tf, p.id === gameState.ball.carrier));

    // Draw ball
    drawBall(ctx, gameState.ball, tf);

    // --- Overlays (screen space, not panned) ---
    if (gameState.shotResultDisplay) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(w / 2 - 180, 15, 360, 36);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gameState.shotResultDisplay, w / 2, 33);
    }

    if (gameState.fastBreak && gameState.fastBreak.active) {
      ctx.fillStyle = 'rgba(255, 200, 0, 0.85)';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ FAST BREAK', w / 2, h - 18);
    }

    if (gameState.timeoutState) {
      const t = gameState.timeoutState;
      const progress = 1 - (t.timer / t.duration);
      const colors = TEAM_COLORS[t.team] || { primary: '#888', secondary: '#fff' };
      const accent = colors.secondary === '#FFFFFF' ? colors.primary : colors.secondary;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, w, h);

      const px = w / 2;
      const py = h / 2;
      ctx.fillStyle = 'rgba(18, 18, 26, 0.94)';
      ctx.fillRect(px - 210, py - 55, 420, 110);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(px - 210, py - 55, 420, 110);

      ctx.fillStyle = accent;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸ TIMEOUT', px, py - 25);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      const msg = t.message.length > 62 ? t.message.slice(0, 59) + '…' : t.message;
      ctx.fillText(msg, px, py + 2);

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(px - 150, py + 28, 300, 6);
      ctx.fillStyle = accent;
      ctx.fillRect(px - 150, py + 28, 300 * Math.min(progress, 1), 6);
    }

    // End-of-quarter intermission overlay
    if (gameState.quarterBreak) {
      const px2 = w / 2;
      const py2 = h / 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(18, 18, 26, 0.94)';
      ctx.fillRect(px2 - 200, py2 - 45, 400, 90);
      ctx.strokeStyle = '#FDB927';
      ctx.lineWidth = 3;
      ctx.strokeRect(px2 - 200, py2 - 45, 400, 90);
      ctx.fillStyle = '#FDB927';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`END OF QUARTER ${gameState.quarter}`, px2, py2 - 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Next quarter starting…', px2, py2 + 18);
    }
  }, [gameState]);

  useEffect(() => {
    draw();
  }, [draw, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      const maxW = container.clientWidth;
      // Half-court aspect: (width/2) : height  →  uniform 2x zoom, full height visible
      const aspect = VISIBLE_WIDTH / COURT.height;
      canvas.width = Math.min(maxW, 940);
      canvas.height = canvas.width / aspect;
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg shadow-2xl border-2 border-neutral-800"
      style={{ imageRendering: 'auto' }}
    />
  );
}