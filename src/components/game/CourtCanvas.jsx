import React, { useRef, useEffect, useCallback } from 'react';
import { COURT, TEAM_COLORS } from '@/lib/gameData';

const SCALE = 1; // will be adjusted by canvas size

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawCourt(ctx, w, h) {
  const sx = w / COURT.width;
  const sy = h / COURT.height;

  // Court floor
  ctx.fillStyle = '#C4843F';
  ctx.fillRect(0, 0, w, h);

  // Court lines
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;

  // Boundary
  ctx.strokeRect(2, 2, w - 4, h - 4);

  // Half court line
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, COURT.centerCircleRadius * sx, 0, Math.PI * 2);
  ctx.stroke();

  // Left key
  const keyW = COURT.keyWidth * sx;
  const keyH = COURT.keyHeight * sy;
  ctx.strokeRect(0, h / 2 - keyH / 2, keyW, keyH);

  // Right key
  ctx.strokeRect(w - keyW, h / 2 - keyH / 2, keyW, keyH);

  // Free throw circles
  ctx.beginPath();
  ctx.arc(keyW, h / 2, COURT.ftCircleRadius * sx, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w - keyW, h / 2, COURT.ftCircleRadius * sx, 0, Math.PI * 2);
  ctx.stroke();

  // Three-point arcs (simplified)
  const threeR = COURT.threePointRadius * sx;
  const rimLeft = COURT.rimX * sx;
  const rimRight = w - COURT.rimX * sx;

  // Left three-point
  ctx.beginPath();
  ctx.moveTo(0, h / 2 - threeR);
  ctx.lineTo(rimLeft * 0.6, h / 2 - threeR);
  ctx.arc(rimLeft, h / 2, threeR, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(0, h / 2 + threeR);
  ctx.stroke();

  // Right three-point
  ctx.beginPath();
  ctx.moveTo(w, h / 2 - threeR);
  ctx.lineTo(w - rimLeft * 0.6, h / 2 - threeR);
  ctx.arc(rimRight, h / 2, threeR, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(w, h / 2 + threeR);
  ctx.stroke();

  // Backboards and rims
  ctx.lineWidth = 3;
  // Left
  ctx.strokeStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(rimLeft - 5, h / 2 - 15);
  ctx.lineTo(rimLeft - 5, h / 2 + 15);
  ctx.stroke();
  ctx.strokeStyle = '#FF6600';
  ctx.beginPath();
  ctx.arc(rimLeft, h / 2, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Right
  ctx.strokeStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(w - rimLeft + 5, h / 2 - 15);
  ctx.lineTo(w - rimLeft + 5, h / 2 + 15);
  ctx.stroke();
  ctx.strokeStyle = '#FF6600';
  ctx.beginPath();
  ctx.arc(w - rimLeft, h / 2, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Court markings - paint area color (subtle)
  ctx.fillStyle = 'rgba(139, 90, 43, 0.3)';
  ctx.fillRect(0, h / 2 - keyH / 2, keyW, keyH);
  ctx.fillRect(w - keyW, h / 2 - keyH / 2, keyW, keyH);
}

function drawPlayer(ctx, player, w, h, isBallCarrier) {
  const sx = w / COURT.width;
  const sy = h / COURT.height;
  const x = player.x * sx;
  const y = player.y * sy;
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

  // Name label
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.max(11, 14 * sx)}px "Arial Black", "Helvetica Neue", sans-serif`;
  ctx.fillText(player.name.split(' ').pop(), x, y - r - 8);
}

function drawBall(ctx, ball, w, h) {
  const sx = w / COURT.width;
  const sy = h / COURT.height;
  const x = ball.x * sx;
  const y = ball.y * sy;
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
      const tx = lerp(ball.startX, ball.targetX, trailT) * sx;
      const ty = lerp(ball.startY, ball.targetY, trailT) * sy;
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

    // Motion trail — speed lines behind the ball
    for (let i = 1; i <= 5; i++) {
      const trailT = Math.max(0, t - i * 0.06);
      if (trailT <= 0) continue;
      const tx = lerp(ball.startX, ball.targetX, trailT) * sx;
      const ty = lerp(ball.startY, ball.targetY, trailT) * sy;
      const alpha = (1 - i / 5) * 0.4;
      ctx.strokeStyle = `rgba(255, 140, 0, ${alpha})`;
      ctx.lineWidth = 3 - i * 0.4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, ballY);
      ctx.stroke();
    }

    // Rim flash + impact lines as ball approaches the basket
    if (t > 0.7) {
      const flashAlpha = (t - 0.7) / 0.3;
      const rimX = ball.targetX * sx;
      const rimY = ball.targetY * sy;

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

    // "SLAM!" label
    ctx.fillStyle = 'rgba(255, 80, 0, 0.95)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SLAM!', x, ballY - 18);
  }
}

export default function CourtCanvas({ gameState }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw court
    drawCourt(ctx, w, h);

    // Draw players (defense first, then offense on top)
    const defPlayers = gameState.players.filter(p => p.team !== gameState.possession);
    const offPlayers = gameState.players.filter(p => p.team === gameState.possession);

    defPlayers.forEach(p => drawPlayer(ctx, p, w, h, false));
    offPlayers.forEach(p => drawPlayer(ctx, p, w, h, p.id === gameState.ball.carrier));

    // Draw ball
    drawBall(ctx, gameState.ball, w, h);

    // Shot result overlay
    if (gameState.shotResultDisplay) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(w / 2 - 180, 15, 360, 36);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gameState.shotResultDisplay, w / 2, 33);
    }

    // Fast break indicator
    if (gameState.fastBreak && gameState.fastBreak.active) {
      ctx.fillStyle = 'rgba(255, 200, 0, 0.85)';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ FAST BREAK', w / 2, h - 18);
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
      const aspect = COURT.width / COURT.height;
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