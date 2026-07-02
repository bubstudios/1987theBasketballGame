import React, { useRef, useEffect, useCallback } from 'react';
import { COURT, TEAM_COLORS } from '@/lib/gameData';

const SCALE = 1; // will be adjusted by canvas size

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
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${Math.max(8, 10 * sx)}px sans-serif`;
  ctx.fillText(player.name.split(' ').pop(), x, y - r - 6);
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

  // Ball
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.arc(x, y - arcOffset, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ball lines
  ctx.beginPath();
  ctx.moveTo(x - 5, y - arcOffset);
  ctx.lineTo(x + 5, y - arcOffset);
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 0.8;
  ctx.stroke();
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