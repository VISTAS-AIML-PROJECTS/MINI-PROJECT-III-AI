import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

const API = "http://127.0.0.1:8000";

const starter = {
  width: 10,
  depth: 8,
  walls: [
    { id: "wall1", x1: 0, z1: 0, x2: 10, z2: 0, height: 3, thickness: 0.18, floorId: "f1" },
    { id: "wall2", x1: 10, z1: 0, x2: 10, z2: 8, height: 3, thickness: 0.18, floorId: "f1" },
    { id: "wall3", x1: 10, z1: 8, x2: 0, z2: 8, height: 3, thickness: 0.18, floorId: "f1" },
    { id: "wall4", x1: 0, z1: 8, x2: 0, z2: 0, height: 3, thickness: 0.18, floorId: "f1" },
    { id: "wall5", x1: 5.5, z1: 0, x2: 5.5, z2: 8, height: 3, thickness: 0.14, floorId: "f1" },
    { id: "wall6", x1: 0, z1: 4.2, x2: 5.5, z2: 4.2, height: 3, thickness: 0.14, floorId: "f1" },
    { id: "wall7", x1: 5.5, z1: 3.8, x2: 10, z2: 3.8, height: 3, thickness: 0.14, floorId: "f1" },
    { id: "wall8", x1: 3.8, z1: 4.2, x2: 3.8, z2: 8, height: 3, thickness: 0.14, floorId: "f1" },
    { id: "wall9", x1: 3.8, z1: 6.2, x2: 5.5, z2: 6.2, height: 3, thickness: 0.14, floorId: "f1" },
  ],
  doors: [
    { id: "door1", wallId: "wall1", position: 0.25, width: 1.0, height: 2.1, floorId: "f1" },
    { id: "door2", wallId: "wall5", position: 0.22, width: 0.9, height: 2.1, floorId: "f1" },
    { id: "door3", wallId: "wall6", position: 0.35, width: 0.9, height: 2.1, floorId: "f1" },
    { id: "door4", wallId: "wall5", position: 0.60, width: 0.9, height: 2.1, floorId: "f1" },
    { id: "door5", wallId: "wall8", position: 0.25, width: 0.75, height: 2.1, floorId: "f1" },
    { id: "door6", wallId: "wall5", position: 0.88, width: 0.75, height: 2.1, floorId: "f1" },
  ],
  windows: [
    { id: "win1", wallId: "wall1", position: 0.45, width: 1.5, height: 1.2, sill: 1.0, floorId: "f1" },
    { id: "win2", wallId: "wall4", position: 0.25, width: 1.4, height: 1.2, sill: 1.0, floorId: "f1" },
    { id: "win3", wallId: "wall1", position: 0.80, width: 1.2, height: 1.2, sill: 1.0, floorId: "f1" },
    { id: "win4", wallId: "wall2", position: 0.22, width: 1.2, height: 1.2, sill: 1.0, floorId: "f1" },
    { id: "win5", wallId: "wall4", position: 0.75, width: 1.5, height: 1.2, sill: 1.0, floorId: "f1" },
    { id: "win6", wallId: "wall3", position: 0.80, width: 1.4, height: 1.2, sill: 1.0, floorId: "f1" },
    { id: "win7", wallId: "wall2", position: 0.75, width: 1.5, height: 1.2, sill: 1.0, floorId: "f1" },
    { id: "win8", wallId: "wall3", position: 0.22, width: 1.4, height: 1.2, sill: 1.0, floorId: "f1" },
    { id: "win9", wallId: "wall3", position: 0.54, width: 0.6, height: 0.6, sill: 1.8, floorId: "f1" },
  ],
  rooms: [
    { id: "r1", name: "Living Room", x: 2.75, z: 2.1, width: 5.5, depth: 4.2, floorId: "f1", color: "#fef3c7" },
    { id: "r2", name: "Kitchen", x: 7.75, z: 1.9, width: 4.5, depth: 3.8, floorId: "f1", color: "#f1f5f9" },
    { id: "r3", name: "Master Bedroom", x: 1.9, z: 6.1, width: 3.8, depth: 3.8, floorId: "f1", color: "#e0f2fe" },
    { id: "r4", name: "Bedroom 2", x: 7.75, z: 5.9, width: 4.5, depth: 4.2, floorId: "f1", color: "#ede9fe" },
    { id: "r5", name: "Bath 1 (Attached)", x: 4.65, z: 5.2, width: 1.7, depth: 2.0, floorId: "f1", color: "#ccfbf1" },
    { id: "r6", name: "Bath 2 (Common)", x: 4.65, z: 7.1, width: 1.7, depth: 1.8, floorId: "f1", color: "#ccfbf1" },
  ],
  floors: [{ id: "f1", name: "Ground Floor", height: 3, elevation: 0 }],
  electrical: [
    { id: "el1", type: "Light", x: 2.75, z: 2.1, floorId: "f1" },
    { id: "el2", type: "Fan", x: 2.75, z: 2.6, floorId: "f1" },
    { id: "el3", type: "Light", x: 7.75, z: 1.9, floorId: "f1" },
    { id: "el4", type: "Light", x: 1.9, z: 6.1, floorId: "f1" },
    { id: "el5", type: "Fan", x: 1.9, z: 6.6, floorId: "f1" },
    { id: "el6", type: "Light", x: 7.75, z: 5.9, floorId: "f1" },
    { id: "el7", type: "Fan", x: 7.75, z: 6.4, floorId: "f1" },
    { id: "el8", type: "Light", x: 4.65, z: 5.2, floorId: "f1" },
    { id: "el9", type: "Light", x: 4.65, z: 7.1, floorId: "f1" },
  ],
  plumbing: [
    { id: "pl1", type: "Sink", x: 9.4, z: 1.0, floorId: "f1" },
    { id: "pl2", type: "Toilet", x: 4.2, z: 5.6, floorId: "f1" },
    { id: "pl3", type: "Shower", x: 5.0, z: 4.8, floorId: "f1" },
    { id: "pl4", type: "Toilet", x: 4.2, z: 7.5, floorId: "f1" },
    { id: "pl5", type: "Shower", x: 5.0, z: 6.7, floorId: "f1" },
  ],
};

const uid = (prefix) => prefix + Math.random().toString(36).slice(2, 9);

function normalizeHouse(raw) {
  if (!raw || typeof raw !== "object") throw Error("Invalid house data");
  const first = "f1";
  const floors = [{ id: first, name: "Ground Floor", height: 3, elevation: 0 }];
  const walls = (Array.isArray(raw.walls) ? raw.walls : []).map((w) => ({
    ...w,
    id: String(w.id || uid("wall")),
    floorId: first,
    height: Number(w.height) || 3,
    thickness: Number(w.thickness) || 0.14,
  }));
  const wallIds = new Set(walls.map((w) => w.id));
  const openings = (key, defW, defH) =>
    (Array.isArray(raw[key]) ? raw[key] : [])
      .filter((o) => wallIds.has(o.wallId))
      .map((o) => ({
        ...o,
        id: String(o.id || uid(key)),
        floorId: first,
        position: Math.max(0.05, Math.min(0.95, Number(o.position) || 0.5)),
        width: Number(o.width) || defW,
        height: Number(o.height) || defH,
        sill: o.sill !== undefined ? Number(o.sill) : key === "windows" ? 1.0 : 0,
      }));

  const roomColors = ["#fef3c7", "#f1f5f9", "#e0f2fe", "#ede9fe", "#ccfbf1", "#fee2e2"];
  return {
    ...raw,
    width: Math.max(1, Number(raw.width) || 10),
    depth: Math.max(1, Number(raw.depth) || 8),
    floors,
    walls,
    doors: openings("doors", 0.9, 2.1),
    windows: openings("windows", 1.4, 1.2),
    rooms: (Array.isArray(raw.rooms) ? raw.rooms : []).map((r, i) => ({
      ...r,
      floorId: first,
      color: r.color || roomColors[i % roomColors.length],
    })),
    electrical: (Array.isArray(raw.electrical) ? raw.electrical : []).map((o) => ({ ...o, floorId: first })),
    plumbing: (Array.isArray(raw.plumbing) ? raw.plumbing : []).map((o) => ({ ...o, floorId: first })),
  };
}

function validateHouse(h) {
  const issues = [];
  const ids = new Set();
  for (const w of h.walls) {
    if (ids.has(w.id)) issues.push(`Duplicate wall ID ${w.id}`);
    ids.add(w.id);
    if (Math.hypot(w.x2 - w.x1, w.z2 - w.z1) < 0.1) issues.push(`${w.id}: wall too short`);
    if (w.height <= 0 || w.thickness <= 0) issues.push(`${w.id}: invalid wall dimensions`);
  }
  for (const o of [...h.doors, ...h.windows]) {
    const w = h.walls.find((x) => x.id === o.wallId);
    if (!w) {
      issues.push(`${o.id}: missing wall`);
      continue;
    }
    const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1);
    if (o.width > len || o.position * len - o.width / 2 < 0 || (1 - o.position) * len - o.width / 2 < 0) {
      issues.push(`${o.id}: opening exceeds wall ends`);
    }
  }
  return issues;
}

function downloadDXF(h) {
  const out = ["0", "SECTION", "2", "ENTITIES"];
  const line = (layer, x1, y1, x2, y2) =>
    out.push("0", "LINE", "8", layer, "10", String(x1), "20", String(y1), "30", "0", "11", String(x2), "21", String(y2), "31", "0");
  for (const w of h.walls) line(`WALL_${w.floorId}`, w.x1 * 1000, w.z1 * 1000, w.x2 * 1000, w.z2 * 1000);
  for (const [type, items] of [["DOOR", h.doors], ["WINDOW", h.windows]])
    for (const o of items) {
      const w = h.walls.find((x) => x.id === o.wallId);
      if (!w) continue;
      const dx = w.x2 - w.x1,
        dz = w.z2 - w.z1,
        l = Math.hypot(dx, dz) || 1,
        x = w.x1 + dx * o.position,
        z = w.z1 + dz * o.position;
      line(`${type}_${w.floorId}`, (x - (dx / l) * (o.width / 2)) * 1000, (z - (dz / l) * (o.width / 2)) * 1000, (x + (dx / l) * (o.width / 2)) * 1000, (z + (dz / l) * (o.width / 2)) * 1000);
    }
  out.push("0", "ENDSEC", "0", "EOF");
  download("house_plan_mm.dxf", out.join("\n"), "application/dxf");
}

/* 2D Interactive Blueprint Plan with Mouse Drag-and-Drop Handles */
function Plan2D({
  house,
  floorId,
  onPlaceService,
  onWallClick2D,
  onCanvasClick2D,
  onUpdateHouse,
  selected,
  setSelected,
  tool,
  setTool,
  wallDraftStart,
  setWallDraftStart,
}) {
  const scale = 32,
    pad = 40,
    w = house.width * scale,
    h = house.depth * scale;

  const [dragging, setDragging] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);

  const getMeterCoords = (e) => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * (w + pad * 2);
    const clickZ = ((e.clientY - rect.top) / rect.height) * (h + pad * 2);
    const mX = Number(Math.max(0, Math.min(house.width, (clickX - pad) / scale)).toFixed(2));
    const mZ = Number(Math.max(0, Math.min(house.depth, (clickZ - pad) / scale)).toFixed(2));
    return { mX, mZ };
  };

  const handleSvgMouseMove = (e) => {
    const { mX, mZ } = getMeterCoords(e);
    setHoverPos({ x: mX, z: mZ });

    if (!dragging) return;

    let updated = JSON.parse(JSON.stringify(house));
    const snap = (v) => Number((Math.round(v * 10) / 10).toFixed(2));

    if (dragging.type === "start") {
      let wall = updated.walls.find((x) => x.id === dragging.wallId);
      if (wall) {
        wall.x1 = snap(mX);
        wall.z1 = snap(mZ);
        onUpdateHouse(updated);
      }
    } else if (dragging.type === "end") {
      let wall = updated.walls.find((x) => x.id === dragging.wallId);
      if (wall) {
        wall.x2 = snap(mX);
        wall.z2 = snap(mZ);
        onUpdateHouse(updated);
      }
    } else if (dragging.type === "move") {
      let wall = updated.walls.find((x) => x.id === dragging.wallId);
      if (wall) {
        const dx = mX - dragging.grabX;
        const dz = mZ - dragging.grabZ;
        wall.x1 = snap(dragging.origX1 + dx);
        wall.z1 = snap(dragging.origZ1 + dz);
        wall.x2 = snap(dragging.origX2 + dx);
        wall.z2 = snap(dragging.origZ2 + dz);
        onUpdateHouse(updated);
      }
    } else if (dragging.type === "door" || dragging.type === "window") {
      const arr = dragging.type === "door" ? updated.doors : updated.windows;
      let obj = arr.find((x) => x.id === dragging.objId);
      let wall = updated.walls.find((x) => x.id === obj?.wallId);
      if (obj && wall) {
        const dx = wall.x2 - wall.x1;
        const dz = wall.z2 - wall.z1;
        const lenSq = dx * dx + dz * dz;
        if (lenSq > 0.01) {
          const proj = ((mX - wall.x1) * dx + (mZ - wall.z1) * dz) / lenSq;
          obj.position = Math.max(0.05, Math.min(0.95, Number(proj.toFixed(2))));
          onUpdateHouse(updated);
        }
      }
    }
  };

  const handleSvgMouseUp = () => {
    if (dragging) setDragging(null);
  };

  const selectedWall = selected?.type === "wall" ? house.walls.find((w) => w.id === selected.id) : null;
  const selectedWallMid = selectedWall
    ? { x: (selectedWall.x1 + selectedWall.x2) / 2, z: (selectedWall.z1 + selectedWall.z2) / 2 }
    : null;
  const selectedWallLen = selectedWall
    ? Math.hypot(selectedWall.x2 - selectedWall.x1, selectedWall.z2 - selectedWall.z1).toFixed(2)
    : null;

  return (
    <div style={{ overflow: "auto", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "16px", userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${w + pad * 2} ${h + pad * 2}`}
        style={{
          width: "100%",
          maxWidth: "880px",
          background: "#ffffff",
          borderRadius: 14,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          border: "1px solid #e2e8f0",
          cursor: tool === "wall" ? "crosshair" : dragging ? "grabbing" : "default",
        }}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseUp}
        onClick={(e) => {
          if (dragging) return;
          const { mX, mZ } = getMeterCoords(e);
          if (tool === "wall") {
            onCanvasClick2D(mX, mZ);
          } else if (tool === "Electrical" || tool === "Plumbing") {
            onPlaceService(mX, mZ);
          }
        }}
      >
        <defs>
          {/* Subtle architectural grid pattern */}
          <pattern id="cadGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#f1f5f9" strokeWidth="1" />
          </pattern>
          <pattern id="cadMajorGrid" width="160" height="160" patternUnits="userSpaceOnUse">
            <rect width="160" height="160" fill="url(#cadGrid)" />
            <path d="M 160 0 L 0 0 0 160" fill="none" stroke="#e2e8f0" strokeWidth="1.2" />
          </pattern>
        </defs>

        <g transform={`translate(${pad},${pad})`}>
          {/* Background Grid */}
          <rect width={w} height={h} fill="url(#cadMajorGrid)" stroke="#cbd5e1" strokeWidth="2" rx="4" />

          {/* Exterior Dimension Arrows */}
          <g stroke="#64748b" strokeWidth="1" fill="#64748b" fontSize="10" fontWeight="700">
            {/* Top dimension: Width */}
            <line x1="0" y1="-16" x2={w} y2="-16" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <line x1="0" y1="-22" x2="0" y2="-10" />
            <line x1={w} y1="-22" x2={w} y2="-10" />
            <text x={w / 2} y="-20" textAnchor="middle" fill="#0f172a">
              {house.width.toFixed(2)} m (WIDTH)
            </text>

            {/* Left dimension: Depth */}
            <line x1="-16" y1="0" x2="-16" y2={h} />
            <line x1="-22" y1="0" x2="-10" y2="0" />
            <line x1="-22" y1={h} x2="-10" y2={h} />
            <text x="-20" y={h / 2} textAnchor="middle" transform={`rotate(-90, -20, ${h / 2})`} fill="#0f172a">
              {house.depth.toFixed(2)} m (DEPTH)
            </text>
          </g>

          {/* Room Fills & Labels */}
          {house.rooms
            .filter((r) => r.floorId === floorId)
            .map((r) => {
              const rw = r.width * scale,
                rd = r.depth * scale;
              const rx = (r.x - r.width / 2) * scale,
                rz = (r.z - r.depth / 2) * scale;
              const area = (r.width * r.depth).toFixed(1);
              return (
                <g key={r.id}>
                  <rect x={rx} y={rz} width={rw} height={rd} fill={r.color || "#f8fafc"} opacity="0.45" rx="4" />
                  <text
                    x={r.x * scale}
                    y={r.z * scale - 4}
                    fontSize="12"
                    fontWeight="700"
                    fill="#1e293b"
                    textAnchor="middle"
                    style={{ pointerEvents: "none" }}
                  >
                    {r.name}
                  </text>
                  <text
                    x={r.x * scale}
                    y={r.z * scale + 12}
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#64748b"
                    textAnchor="middle"
                    style={{ pointerEvents: "none" }}
                  >
                    {area} m² · ({r.width}m × {r.depth}m)
                  </text>
                </g>
              );
            })}

          {/* Walls */}
          {house.walls
            .filter((w) => w.floorId === floorId)
            .map((wall) => {
              const isSel = selected?.type === "wall" && selected?.id === wall.id;
              return (
                <g key={wall.id}>
                  {/* Invisible thick hit-area */}
                  <line
                    x1={wall.x1 * scale}
                    y1={wall.z1 * scale}
                    x2={wall.x2 * scale}
                    y2={wall.z2 * scale}
                    stroke="transparent"
                    strokeWidth="20"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const { mX, mZ } = getMeterCoords(e);
                      const dx = wall.x2 - wall.x1,
                        dz = wall.z2 - wall.z1;
                      const lenSq = dx * dx + dz * dz;
                      const pos = lenSq > 0 ? Math.max(0.08, Math.min(0.92, ((mX - wall.x1) * dx + (mZ - wall.z1) * dz) / lenSq)) : 0.5;
                      onWallClick2D(wall, pos);
                    }}
                  />
                  {/* Outer Wall Body */}
                  <line
                    x1={wall.x1 * scale}
                    y1={wall.z1 * scale}
                    x2={wall.x2 * scale}
                    y2={wall.z2 * scale}
                    stroke={isSel ? "#2563eb" : "#1e293b"}
                    strokeWidth={Math.max(4, wall.thickness * scale * 1.5)}
                    strokeLinecap="round"
                    style={{ cursor: "pointer", transition: "stroke 0.15s" }}
                  />
                </g>
              );
            })}

          {/* Selected Wall Interactive Drag Handles */}
          {selectedWall && (
            <g>
              {/* Highlight Glow Halo */}
              <line
                x1={selectedWall.x1 * scale}
                y1={selectedWall.z1 * scale}
                x2={selectedWall.x2 * scale}
                y2={selectedWall.z2 * scale}
                stroke="#60a5fa"
                strokeWidth="14"
                opacity="0.35"
                strokeLinecap="round"
              />

              {/* Length pill badge in center */}
              {selectedWallMid && (
                <g transform={`translate(${selectedWallMid.x * scale},${selectedWallMid.z * scale - 16})`}>
                  <rect x="-28" y="-11" width="56" height="20" rx="5" fill="#0f172a" opacity="0.95" />
                  <text x="0" y="3" fontSize="10.5" fontWeight="800" fill="#38bdf8" textAnchor="middle">
                    {selectedWallLen}m
                  </text>
                </g>
              )}

              {/* Start Handle (Drag to stretch start) */}
              <circle
                cx={selectedWall.x1 * scale}
                cy={selectedWall.z1 * scale}
                r="9"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2.5"
                style={{ cursor: "crosshair", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDragging({ type: "start", wallId: selectedWall.id });
                }}
              />

              {/* End Handle (Drag to stretch end) */}
              <circle
                cx={selectedWall.x2 * scale}
                cy={selectedWall.z2 * scale}
                r="9"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2.5"
                style={{ cursor: "crosshair", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))" }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDragging({ type: "end", wallId: selectedWall.id });
                }}
              />

              {/* Center Move Handle (Drag to move entire wall) */}
              {selectedWallMid && (
                <circle
                  cx={selectedWallMid.x * scale}
                  cy={selectedWallMid.z * scale}
                  r="8"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  style={{ cursor: "move", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const { mX, mZ } = getMeterCoords(e);
                    setDragging({
                      type: "move",
                      wallId: selectedWall.id,
                      origX1: selectedWall.x1,
                      origZ1: selectedWall.z1,
                      origX2: selectedWall.x2,
                      origZ2: selectedWall.z2,
                      grabX: mX,
                      grabZ: mZ,
                    });
                  }}
                />
              )}
            </g>
          )}

          {/* Doors & Windows */}
          {[
            ["doors", "#d97706", "door"],
            ["windows", "#0284c7", "window"],
          ].map(([key, color, type]) =>
            house[key].map((o) => {
              const wall = house.walls.find((w) => w.id === o.wallId && w.floorId === floorId);
              if (!wall) return null;
              const isSel = selected?.type === type && selected?.id === o.id;
              const dx = wall.x2 - wall.x1,
                dz = wall.z2 - wall.z1,
                len = Math.hypot(dx, dz) || 1,
                x = wall.x1 + dx * o.position,
                z = wall.z1 + dz * o.position;

              return (
                <g key={o.id}>
                  {/* Opening line on wall */}
                  <line
                    x1={(x - (dx / len) * (o.width / 2)) * scale}
                    y1={(z - (dz / len) * (o.width / 2)) * scale}
                    x2={(x + (dx / len) * (o.width / 2)) * scale}
                    y2={(z + (dz / len) * (o.width / 2)) * scale}
                    stroke={isSel ? "#ef4444" : color}
                    strokeWidth="8"
                    strokeLinecap="square"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onWallClick2D(null, null, { type, id: o.id });
                    }}
                  />
                  {/* Draggable handle when selected */}
                  {isSel && (
                    <circle
                      cx={x * scale}
                      cy={z * scale}
                      r="7"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{ cursor: "grab", filter: "drop-shadow(0 2px 5px rgba(239, 68, 68, 0.4))" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragging({ type, objId: o.id, wallId: wall.id });
                      }}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Electrical & Plumbing Markers */}
          {[
            ["electrical", "#eab308"],
            ["plumbing", "#06b6d4"],
          ].map(([key, color]) =>
            house[key]
              .filter((o) => o.floorId === floorId)
              .map((o) => (
                <g key={o.id} style={{ cursor: "pointer" }}>
                  <circle cx={o.x * scale} cy={o.z * scale} r="8" fill={color} stroke="#0f172a" strokeWidth="1.5" />
                  <text x={o.x * scale + 11} y={o.z * scale - 7} fontSize="10" fontWeight="700" fill="#0f172a">
                    {o.type}
                  </text>
                </g>
              ))
          )}

          {/* Wall Draft Line preview while drawing with mouse */}
          {tool === "wall" && wallDraftStart && hoverPos && (
            <g>
              <line
                x1={wallDraftStart.x * scale}
                y1={wallDraftStart.z * scale}
                x2={hoverPos.x * scale}
                y2={hoverPos.z * scale}
                stroke="#2563eb"
                strokeWidth="4"
                strokeDasharray="6 4"
              />
              <circle cx={wallDraftStart.x * scale} cy={wallDraftStart.z * scale} r="7" fill="#2563eb" />
              <circle cx={hoverPos.x * scale} cy={hoverPos.z * scale} r="7" fill="#10b981" />
              <text
                x={((wallDraftStart.x + hoverPos.x) / 2) * scale}
                y={((wallDraftStart.z + hoverPos.z) / 2) * scale - 10}
                fontSize="11"
                fontWeight="800"
                fill="#2563eb"
                textAnchor="middle"
              >
                {Math.hypot(hoverPos.x - wallDraftStart.x, hoverPos.z - wallDraftStart.z).toFixed(2)}m
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

function ServiceMarker({ item, color, elevation }) {
  return (
    <mesh position={[item.x, elevation + 0.08, item.z]}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function WallMesh({ w, selected, onClick, onWallClick, elevation = 0, tool, material }) {
  const dx = w.x2 - w.x1,
    dz = w.z2 - w.z1,
    len = Math.hypot(dx, dz),
    ang = Math.atan2(dz, dx);

  const matColor =
    material === "Brick"
      ? "#b45309"
      : material === "Painted Wall"
      ? "#e2e8f0"
      : material === "Glass"
      ? "#93c5fd"
      : "#cbd5e1";

  return (
    <mesh
      position={[(w.x1 + w.x2) / 2, elevation + w.height / 2, (w.z1 + w.z2) / 2]}
      rotation={[0, -ang, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (tool === "door" || tool === "window") {
          const pt = e.point;
          const proj = ((pt.x - w.x1) * dx + (pt.z - w.z1) * dz) / (len * len || 1);
          const pos = Math.max(0.08, Math.min(0.92, Number(proj.toFixed(2))));
          onWallClick(w, pos);
        } else {
          onClick(w.id);
        }
      }}
    >
      <boxGeometry args={[len, w.height, w.thickness]} />
      <meshStandardMaterial
        color={selected ? "#2563eb" : matColor}
        roughness={material === "Glass" ? 0.1 : 0.8}
        transparent={material === "Glass"}
        opacity={material === "Glass" ? 0.6 : 1.0}
      />
    </mesh>
  );
}

function OpeningMesh({ o, wall, type, selected, onClick, elevation = 0 }) {
  const x = wall.x1 + (wall.x2 - wall.x1) * o.position;
  const z = wall.z1 + (wall.z2 - wall.z1) * o.position;
  const dx = wall.x2 - wall.x1,
    dz = wall.z2 - wall.z1,
    ang = Math.atan2(dz, dx);
  const width = o.width;
  const y = elevation + (type === "door" ? o.height / 2 : o.sill + o.height / 2);

  return (
    <mesh
      position={[x, y, z]}
      rotation={[0, -ang, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(o.id, type);
      }}
    >
      <boxGeometry args={[width, o.height, wall.thickness + 0.05]} />
      <meshStandardMaterial
        color={selected ? "#f59e0b" : type === "door" ? "#78350f" : "#38bdf8"}
        transparent
        opacity={type === "door" ? 0.95 : 0.75}
      />
    </mesh>
  );
}

function RoomLabel({ r, elevation = 0 }) {
  return (
    <Html position={[r.x, elevation + 2.95, r.z]} center>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#0f172a",
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(6px)",
          padding: "4px 8px",
          borderRadius: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.06)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {r.name}
      </div>
    </Html>
  );
}

function HouseScene({ house, selected, setSelected, activeFloor, tool, onWallHit, material }) {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[10, 18, 12]} intensity={1.4} castShadow />
      <directionalLight position={[-10, 12, -8]} intensity={0.5} />

      {/* Ground plane with subtle grid feel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[house.width / 2, -0.02, house.depth / 2]}>
        <planeGeometry args={[house.width + 6, house.depth + 6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* Walls */}
      {house.walls
        .filter((w) => w.floorId === activeFloor)
        .map((w) => (
          <WallMesh
            key={w.id}
            w={w}
            elevation={house.floors.find((f) => f.id === w.floorId)?.elevation || 0}
            selected={selected?.id === w.id}
            onClick={(id) => setSelected({ type: "wall", id })}
            onWallClick={(wall, pos) => onWallHit(wall, pos)}
            tool={tool}
            material={material}
          />
        ))}

      {/* Room Labels */}
      {house.rooms
        .filter((r) => r.floorId === activeFloor)
        .map((r) => (
          <RoomLabel key={r.id} r={r} elevation={house.floors.find((f) => f.id === activeFloor)?.elevation || 0} />
        ))}

      {/* Doors */}
      {house.doors.map((o) => {
        const w = house.walls.find((x) => x.id === o.wallId);
        return w && w.floorId === activeFloor ? (
          <OpeningMesh
            key={o.id}
            o={o}
            wall={w}
            elevation={house.floors.find((f) => f.id === activeFloor)?.elevation || 0}
            type="door"
            selected={selected?.id === o.id}
            onClick={(id, t) => setSelected({ type: t, id })}
          />
        ) : null;
      })}

      {/* Windows */}
      {house.windows.map((o) => {
        const w = house.walls.find((x) => x.id === o.wallId);
        return w && w.floorId === activeFloor ? (
          <OpeningMesh
            key={o.id}
            o={o}
            wall={w}
            elevation={house.floors.find((f) => f.id === activeFloor)?.elevation || 0}
            type="window"
            selected={selected?.id === o.id}
            onClick={(id, t) => setSelected({ type: t, id })}
          />
        ) : null;
      })}

      {/* Electrical & Plumbing */}
      {house.electrical
        .filter((o) => o.floorId === activeFloor)
        .map((o) => (
          <ServiceMarker
            key={o.id}
            item={o}
            color="#eab308"
            elevation={house.floors.find((f) => f.id === activeFloor)?.elevation || 0}
          />
        ))}
      {house.plumbing
        .filter((o) => o.floorId === activeFloor)
        .map((o) => (
          <ServiceMarker
            key={o.id}
            item={o}
            color="#06b6d4"
            elevation={house.floors.find((f) => f.id === activeFloor)?.elevation || 0}
          />
        ))}

      <axesHelper args={[3]} />
    </>
  );
}

/* First-person controller */
function WalkthroughController({ house }) {
  const { camera, gl } = useThree();
  const keys = useRef({});
  const yaw = useRef(0),
    pitch = useRef(0);
  const pos = useRef(new THREE.Vector3(house.width / 2, 1.65, house.depth / 2));

  useEffect(() => {
    camera.position.copy(pos.current);
    const down = (e) => {
      keys.current[e.code] = true;
    };
    const up = (e) => {
      keys.current[e.code] = false;
    };
    const click = () => gl.domElement.requestPointerLock?.();
    const move = (e) => {
      if (document.pointerLockElement !== gl.domElement) return;
      yaw.current -= e.movementX * 0.0022;
      pitch.current -= e.movementY * 0.0022;
      pitch.current = Math.max(-1.35, Math.min(1.35, pitch.current));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    gl.domElement.addEventListener("click", click);
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      gl.domElement.removeEventListener("click", click);
      window.removeEventListener("mousemove", move);
    };
  }, [camera, gl]);

  useFrame((_, dt) => {
    const f = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const r = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    const speed = keys.current.ShiftLeft || keys.current.ShiftRight ? 4.5 : 2.8;
    let move = new THREE.Vector3();
    if (keys.current.KeyW || keys.current.ArrowUp) move.add(f);
    if (keys.current.KeyS || keys.current.ArrowDown) move.sub(f);
    if (keys.current.KeyD || keys.current.ArrowRight) move.add(r);
    if (keys.current.KeyA || keys.current.ArrowLeft) move.sub(r);
    if (move.lengthSq()) move.normalize().multiplyScalar(speed * dt);
    const next = pos.current.clone().add(move);
    const margin = 0.35;
    next.x = Math.max(margin, Math.min(house.width - margin, next.x));
    next.z = Math.max(margin, Math.min(house.depth - margin, next.z));
    pos.current.copy(next);
    camera.position.copy(pos.current);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
  });

  return null;
}

function WalkthroughScene({ house, onExit }) {
  return (
    <Canvas
      camera={{ fov: 72, near: 0.05, far: 100 }}
      onCreated={({ camera }) => {
        camera.position.set(house.width / 2, 1.65, house.depth / 2);
      }}
    >
      <color attach="background" args={["#cbd5e1"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 10, 4]} intensity={1.4} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[house.width / 2, 0, house.depth / 2]}>
        <planeGeometry args={[house.width + 2, house.depth + 2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {house.walls.map((w) => (
        <WallMesh key={w.id} w={w} selected={false} onClick={() => {}} onWallClick={() => {}} tool="select" material="Concrete" />
      ))}
      {house.doors.map((o) => {
        const w = house.walls.find((x) => x.id === o.wallId);
        return w ? <OpeningMesh key={o.id} o={o} wall={w} type="door" selected={false} onClick={() => {}} /> : null;
      })}
      {house.windows.map((o) => {
        const w = house.walls.find((x) => x.id === o.wallId);
        return w ? <OpeningMesh key={o.id} o={o} wall={w} type="window" selected={false} onClick={() => {}} /> : null;
      })}
      <WalkthroughController house={house} onExit={onExit} />
    </Canvas>
  );
}

/* Step adjuster control with +/- buttons */
function StepField({ label, value, onChange, step = 0.1, min = 0, max = 50, unit = "" }) {
  const num = Number(value) || 0;
  const dec = step < 0.1 ? 2 : 1;
  const decVal = () => onChange(Math.max(min, Number((num - step).toFixed(dec))));
  const incVal = () => onChange(Math.min(max, Number((num + step).toFixed(dec))));

  return (
    <div className="step-field">
      <label>
        <span>{label}</span>
        {unit && <span style={{ color: "#64748b" }}>({unit})</span>}
      </label>
      <div className="step-controls">
        <button className="step-btn" type="button" onClick={decVal}>
          −
        </button>
        <input
          className="step-input"
          type="number"
          step={step}
          value={num}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        />
        <button className="step-btn" type="button" onClick={incVal}>
          +
        </button>
      </div>
    </div>
  );
}

/* Dedicated Inspector Adjuster Component */
function Adjuster({ selected, selectedObj, house, updateHouse, setSelected, onStartAddDoorOnWall, onStartAddWindowOnWall }) {
  if (!selected || !selectedObj) {
    return (
      <div className="adjust-card">
        <div className="small" style={{ lineHeight: 1.6 }}>
          ✨ <b>Interactive Editing Tips:</b>
          <br />• Select any wall, door, or window to adjust.
          <br />• In <b>2D Blueprint</b>, drag the <b>blue end handles</b> to stretch or rotate walls, and the <b>green center handle</b> to move.
          <br />• Use the <b>Length Controls</b> below for precise CAD dimensions.
        </div>
      </div>
    );
  }

  const edit = (key, val) => {
    let h = JSON.parse(JSON.stringify(house));
    let arr =
      selected.type === "wall"
        ? h.walls
        : selected.type === "door"
        ? h.doors
        : selected.type === "window"
        ? h.windows
        : h[selected.type];
    let obj = arr.find((x) => x.id === selected.id);
    if (obj) {
      obj[key] = typeof val === "number" ? val : val;
      updateHouse(h);
    }
  };

  const nudgeWall = (dx, dz) => {
    let h = JSON.parse(JSON.stringify(house));
    let w = h.walls.find((x) => x.id === selected.id);
    if (!w) return;
    w.x1 = Number((w.x1 + dx).toFixed(2));
    w.x2 = Number((w.x2 + dx).toFixed(2));
    w.z1 = Number((w.z1 + dz).toFixed(2));
    w.z2 = Number((w.z2 + dz).toFixed(2));
    updateHouse(h);
  };

  const rotateWall90 = () => {
    let h = JSON.parse(JSON.stringify(house));
    let w = h.walls.find((x) => x.id === selected.id);
    if (!w) return;
    const cx = (w.x1 + w.x2) / 2,
      cz = (w.z1 + w.z2) / 2;
    const dx = w.x2 - w.x1,
      dz = w.z2 - w.z1;
    w.x1 = Number((cx - dz / 2).toFixed(2));
    w.z1 = Number((cz + dx / 2).toFixed(2));
    w.x2 = Number((cx + dz / 2).toFixed(2));
    w.z2 = Number((cz - dx / 2).toFixed(2));
    updateHouse(h);
  };

  if (selected.type === "door" || selected.type === "window") {
    const parentWall = house.walls.find((w) => w.id === selectedObj.wallId);
    const wallLen = parentWall ? Math.hypot(parentWall.x2 - parentWall.x1, parentWall.z2 - parentWall.z1) : 0;
    const distFromStart = (selectedObj.position * wallLen).toFixed(2);

    return (
      <div className="adjust-card">
        <div className="adjust-title">
          <span>
            {selected.type === "door" ? "🚪 Door Settings" : "🪟 Window Settings"}
          </span>
          <span style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
            {selectedObj.wallId}
          </span>
        </div>

        {/* Position Slider & Nudges */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span>Position in Wall</span>
            <b style={{ color: "#2563eb" }}>
              {Math.round(selectedObj.position * 100)}% ({distFromStart}m / {wallLen.toFixed(1)}m)
            </b>
          </label>
          <input
            type="range"
            min="0.05"
            max="0.95"
            step="0.01"
            value={selectedObj.position}
            onChange={(e) => edit("position", Number(e.target.value))}
          />
          <div className="grid-4" style={{ marginTop: 4 }}>
            <button
              className="btn btn-mini"
              type="button"
              onClick={() => edit("position", Math.max(0.05, Number((selectedObj.position - 0.05).toFixed(2))))}
            >
              ◀ −5%
            </button>
            <button className="btn btn-mini" type="button" onClick={() => edit("position", 0.5)}>
              Center
            </button>
            <button
              className="btn btn-mini"
              type="button"
              onClick={() => edit("position", Math.min(0.95, Number((selectedObj.position + 0.05).toFixed(2))))}
            >
              +5% ▶
            </button>
            <button
              className="btn btn-mini"
              type="button"
              onClick={() => edit("position", selectedObj.position > 0.5 ? 0.2 : 0.8)}
            >
              Flip
            </button>
          </div>
        </div>

        {/* Dimensions */}
        <StepField
          label="Opening Width"
          value={selectedObj.width}
          onChange={(v) => edit("width", v)}
          step={0.1}
          min={0.4}
          max={wallLen || 4}
          unit="m"
        />
        <StepField
          label="Opening Height"
          value={selectedObj.height}
          onChange={(v) => edit("height", v)}
          step={0.1}
          min={0.5}
          max={3.0}
          unit="m"
        />
        {selected.type === "window" && (
          <StepField
            label="Sill Height"
            value={selectedObj.sill ?? 1.0}
            onChange={(v) => edit("sill", v)}
            step={0.1}
            min={0}
            max={2.2}
            unit="m"
          />
        )}

        {/* Re-assign Wall */}
        <div className="field" style={{ marginTop: 10 }}>
          <label>Attach to Different Wall</label>
          <select value={selectedObj.wallId} onChange={(e) => edit("wallId", e.target.value)}>
            {house.walls.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} (Length: {Math.hypot(w.x2 - w.x1, w.z2 - w.z1).toFixed(1)}m)
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (selected.type === "wall") {
    const currentWallLen = Number(Math.hypot(selectedObj.x2 - selectedObj.x1, selectedObj.z2 - selectedObj.z1).toFixed(2));
    const attachedDoors = house.doors.filter((d) => d.wallId === selected.id);
    const attachedWindows = house.windows.filter((w) => w.wallId === selected.id);

    const changeWallLength = (newLen, fromCenter = false) => {
      const targetLen = Math.max(0.3, Number(newLen) || 0.3);
      let h = JSON.parse(JSON.stringify(house));
      let w = h.walls.find((x) => x.id === selected.id);
      if (!w) return;
      const currentLen = Math.hypot(w.x2 - w.x1, w.z2 - w.z1) || 1;
      const dx = (w.x2 - w.x1) / currentLen;
      const dz = (w.z2 - w.z1) / currentLen;

      if (fromCenter) {
        const cx = (w.x1 + w.x2) / 2;
        const cz = (w.z1 + w.z2) / 2;
        w.x1 = Number((cx - (dx * targetLen) / 2).toFixed(2));
        w.z1 = Number((cz - (dz * targetLen) / 2).toFixed(2));
        w.x2 = Number((cx + (dx * targetLen) / 2).toFixed(2));
        w.z2 = Number((cz + (dz * targetLen) / 2).toFixed(2));
      } else {
        w.x2 = Number((w.x1 + dx * targetLen).toFixed(2));
        w.z2 = Number((w.z1 + dz * targetLen).toFixed(2));
      }
      updateHouse(h);
    };

    return (
      <div className="adjust-card">
        <div className="adjust-title">
          <span>🧱 Wall Settings ({selected.id})</span>
          <span style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
            {currentWallLen}m
          </span>
        </div>

        {/* Wall Length Adjustment */}
        <div style={{ marginBottom: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
          <label style={{ fontSize: 11.5, color: "#0f172a", fontWeight: 700, display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>Wall Length</span>
            <span style={{ color: "#2563eb" }}>{currentWallLen} meters</span>
          </label>
          <StepField
            label="Length"
            value={currentWallLen}
            onChange={(v) => changeWallLength(v)}
            step={0.5}
            min={0.5}
            max={40.0}
            unit="m"
          />
          <div className="grid-4" style={{ marginTop: 5 }}>
            <button className="btn btn-mini" type="button" onClick={() => changeWallLength(currentWallLen - 1.0)}>
              −1.0m
            </button>
            <button className="btn btn-mini" type="button" onClick={() => changeWallLength(currentWallLen - 0.5)}>
              −0.5m
            </button>
            <button className="btn btn-mini" type="button" onClick={() => changeWallLength(currentWallLen + 0.5)}>
              +0.5m
            </button>
            <button className="btn btn-mini" type="button" onClick={() => changeWallLength(currentWallLen + 1.0)}>
              +1.0m
            </button>
          </div>
          <div className="grid" style={{ marginTop: 6, gap: 5 }}>
            <button className="btn btn-mini" type="button" onClick={() => changeWallLength(currentWallLen + 1.0, true)}>
              Expand Both (+1m)
            </button>
            <button className="btn btn-mini" type="button" onClick={() => changeWallLength(Math.max(0.5, currentWallLen - 1.0), true)}>
              Shrink Both (−1m)
            </button>
          </div>
        </div>

        {/* Move / Nudge Controls */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11.5, color: "#475569", fontWeight: 600, display: "block", marginBottom: 5 }}>
            Move / Nudge Position
          </label>
          <div className="grid-3" style={{ marginBottom: 5 }}>
            <button className="btn btn-mini" type="button" onClick={() => nudgeWall(-0.5, 0)}>
              ◀ Left 0.5m
            </button>
            <button className="btn btn-mini" type="button" onClick={() => nudgeWall(0, -0.5)}>
              ▲ Up 0.5m
            </button>
            <button className="btn btn-mini" type="button" onClick={() => nudgeWall(0.5, 0)}>
              Right 0.5m ▶
            </button>
          </div>
          <div className="grid" style={{ gap: 5 }}>
            <button className="btn btn-mini" type="button" onClick={() => nudgeWall(0, 0.5)}>
              ▼ Down 0.5m
            </button>
            <button className="btn btn-mini" type="button" onClick={rotateWall90}>
              🔄 Rotate 90°
            </button>
          </div>
        </div>

        {/* Height & Thickness */}
        <StepField
          label="Wall Height"
          value={selectedObj.height}
          onChange={(v) => edit("height", v)}
          step={0.2}
          min={1.5}
          max={6.0}
          unit="m"
        />
        <StepField
          label="Wall Thickness"
          value={selectedObj.thickness}
          onChange={(v) => edit("thickness", v)}
          step={0.02}
          min={0.08}
          max={0.5}
          unit="m"
        />

        {/* Thickness Quick Presets */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>
            Standard Thickness Presets
          </label>
          <div className="grid-4">
            {[0.1, 0.14, 0.18, 0.23].map((t) => (
              <button
                key={t}
                type="button"
                className={"btn btn-mini " + (selectedObj.thickness === t ? "active-tool" : "")}
                onClick={() => edit("thickness", t)}
              >
                {t}m
              </button>
            ))}
          </div>
        </div>

        {/* Quick Add Door/Window on this Wall */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 10 }}>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>
            Attached: {attachedDoors.length} doors, {attachedWindows.length} windows
          </label>
          <div className="grid">
            <button className="btn btn-mini" type="button" onClick={() => onStartAddDoorOnWall(selected.id)}>
              ＋ Door on Wall
            </button>
            <button className="btn btn-mini" type="button" onClick={() => onStartAddWindowOnWall(selected.id)}>
              ＋ Window on Wall
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  const [house, setHouse] = useState(starter);
  const [selected, setSelected] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [mode, setMode] = useState("Design");
  const [tool, setTool] = useState("select");
  const [wallDraftStart, setWallDraftStart] = useState(null);
  const [walkthrough, setWalkthrough] = useState(false);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [cost, setCost] = useState({ wall: 1800, door: 8500, window: 4500, floor: 1600, electrical: 1800, plumbing: 3200 });
  const [material, setMaterial] = useState("Concrete");
  const [activeFloor] = useState("f1");
  const [serviceType, setServiceType] = useState("Light");
  const [view2D, setView2D] = useState(false);

  const updateHouse = (next) => {
    const clean = normalizeHouse(next);
    setHistory((h) => [...h.slice(-49), house]);
    setFuture([]);
    setHouse(clean);
  };

  const flash = (s) => {
    setToast(s);
    setTimeout(() => setToast(""), 2400);
  };

  const generate = async () => {
    if (!prompt.trim()) return flash("Enter an architectural prompt first");
    setBusy(true);
    try {
      const r = await fetch(API + "/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!r.ok) throw Error(await r.text());
      updateHouse(await r.json());
      flash("✨ AI House Plan Generated Successfully!");
    } catch (e) {
      flash("Generation failed — please ensure Ollama is running");
    } finally {
      setBusy(false);
    }
  };

  const modify = async () => {
    if (!prompt.trim()) return flash("Enter modification instructions");
    setBusy(true);
    try {
      const r = await fetch(API + "/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, current_house: house }),
      });
      if (!r.ok) throw Error(await r.text());
      updateHouse(await r.json());
      flash("✨ AI Modification Applied!");
    } catch (e) {
      flash("Modification failed");
    } finally {
      setBusy(false);
    }
  };

  const analyze = async () => {
    setBusy(true);
    try {
      const r = await fetch(API + "/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "analyze", current_house: house }),
      });
      setAnalysis(await r.json());
      flash("Analysis complete!");
    } catch (e) {
      flash("Analysis failed");
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    if (!history.length) return;
    const p = history[history.length - 1];
    setFuture((f) => [house, ...f]);
    setHouse(p);
    setHistory((h) => h.slice(0, -1));
  };

  const redo = () => {
    if (!future.length) return;
    const n = future[0];
    setHistory((h) => [...h, house]);
    setHouse(n);
    setFuture((f) => f.slice(1));
  };

  const save = () => {
    try {
      localStorage.setItem("aiCadHouse", JSON.stringify(house));
      flash("💾 Saved to Local Storage");
    } catch (e) {
      flash("Save failed: " + e.message);
    }
  };

  const load = () => {
    try {
      const x = localStorage.getItem("aiCadHouse");
      if (x) {
        updateHouse(JSON.parse(x));
        flash("📂 Loaded Saved CAD Project");
      } else flash("No saved project found in storage");
    } catch (e) {
      flash("Invalid saved project: " + e.message);
    }
  };

  const exportJSON = () => {
    download("house_plan.json", JSON.stringify(house, null, 2), "application/json");
  };

  const exportCSV = () => {
    const rows = ["type,id,wallId,x1,z1,x2,z2,position,width,height"];
    house.walls.forEach((w) => rows.push(`wall,${w.id},,${w.x1},${w.z1},${w.x2},${w.z2},,,${w.height}`));
    house.doors.forEach((o) => rows.push(`door,${o.id},${o.wallId},,,,,${o.position},${o.width},${o.height}`));
    house.windows.forEach((o) => rows.push(`window,${o.id},${o.wallId},,,,,${o.position},${o.width},${o.height}`));
    download("house_elements.csv", rows.join("\n"), "text/csv");
  };

  const deleteSelected = () => {
    if (!selected) return;
    let h = { ...house };
    if (selected.type === "wall") {
      h.walls = h.walls.filter((x) => x.id !== selected.id);
      h.doors = h.doors.filter((x) => x.wallId !== selected.id);
      h.windows = h.windows.filter((x) => x.wallId !== selected.id);
    } else if (selected.type === "door") h.doors = h.doors.filter((x) => x.id !== selected.id);
    else if (selected.type === "window") h.windows = h.windows.filter((x) => x.id !== selected.id);
    else if (selected.type === "electrical" || selected.type === "plumbing")
      h[selected.type] = h[selected.type].filter((x) => x.id !== selected.id);
    updateHouse(h);
    setSelected(null);
    flash("🗑️ Deleted item");
  };

  const selectedObj = useMemo(() => {
    if (!selected) return null;
    return selected.type === "wall"
      ? house.walls.find((x) => x.id === selected.id)
      : selected.type === "door"
      ? house.doors.find((x) => x.id === selected.id)
      : selected.type === "window"
      ? house.windows.find((x) => x.id === selected.id)
      : house[selected.type]?.find((x) => x.id === selected.id);
  }, [selected, house]);

  const handleToggleWallTool = () => {
    if (tool === "wall") {
      setTool("select");
      setWallDraftStart(null);
    } else {
      setTool("wall");
      setWallDraftStart(null);
      setView2D(true);
      flash("🖱️ Wall Tool: Click start point, then drag/click end point on 2D Plan with mouse!");
    }
  };

  const handleToggleDoorTool = () => {
    if (tool === "door") {
      setTool("select");
    } else {
      setTool("door");
      flash("🚪 Door Tool: Click on any wall in 3D or 2D to attach door!");
    }
  };

  const handleToggleWindowTool = () => {
    if (tool === "window") {
      setTool("select");
    } else {
      setTool("window");
      flash("🪟 Window Tool: Click on any wall in 3D or 2D to attach window!");
    }
  };

  const handleWallHitWithTool = (wall, position = 0.5) => {
    if (!wall) return;
    if (tool === "door") {
      const doorId = uid("door");
      const newDoor = {
        id: doorId,
        wallId: wall.id,
        position: position,
        width: 0.9,
        height: 2.1,
        floorId: activeFloor,
      };
      updateHouse({ ...house, doors: [...house.doors, newDoor] });
      setSelected({ type: "door", id: doorId });
      setTool("select");
      flash(`Door added on ${wall.id}! You can drag it along the wall with mouse.`);
    } else if (tool === "window") {
      const winId = uid("win");
      const newWin = {
        id: winId,
        wallId: wall.id,
        position: position,
        width: 1.4,
        height: 1.2,
        sill: 1.0,
        floorId: activeFloor,
      };
      updateHouse({ ...house, windows: [...house.windows, newWin] });
      setSelected({ type: "window", id: winId });
      setTool("select");
      flash(`Window added on ${wall.id}! You can drag it along the wall with mouse.`);
    } else {
      setSelected({ type: "wall", id: wall.id });
    }
  };

  const quickAddWall = () => {
    const wallId = uid("wall");
    const newWall = {
      id: wallId,
      floorId: activeFloor,
      x1: 2,
      z1: 2,
      x2: 7,
      z2: 2,
      height: 3,
      thickness: 0.14,
    };
    updateHouse({ ...house, walls: [...house.walls, newWall] });
    setSelected({ type: "wall", id: wallId });
    setTool("select");
    setView2D(true);
    flash("🖱️ Wall added! Drag the blue circle endpoints with mouse to stretch, or green center to move.");
  };

  const quickAddDoor = (targetWallId) => {
    const wall = (targetWallId && house.walls.find((w) => w.id === targetWallId)) || (selected?.type === "wall" && selectedObj) || house.walls[0];
    if (!wall) return flash("Add a wall first");
    const doorId = uid("door");
    const newDoor = { id: doorId, wallId: wall.id, position: 0.5, width: 0.9, height: 2.1, floorId: activeFloor };
    updateHouse({ ...house, doors: [...house.doors, newDoor] });
    setSelected({ type: "door", id: doorId });
    setTool("select");
    flash(`Door added to ${wall.id}! Adjust it below.`);
  };

  const quickAddWindow = (targetWallId) => {
    const wall = (targetWallId && house.walls.find((w) => w.id === targetWallId)) || (selected?.type === "wall" && selectedObj) || house.walls[0];
    if (!wall) return flash("Add a wall first");
    const winId = uid("win");
    const newWin = { id: winId, wallId: wall.id, position: 0.5, width: 1.4, height: 1.2, sill: 1.0, floorId: activeFloor };
    updateHouse({ ...house, windows: [...house.windows, newWin] });
    setSelected({ type: "window", id: winId });
    setTool("select");
    flash(`Window added to ${wall.id}! Adjust it below.`);
  };

  const handleCanvasClick2D = (x, z) => {
    if (tool === "wall") {
      if (!wallDraftStart) {
        setWallDraftStart({ x, z });
        flash("Start point set! Click second point to complete wall.");
      } else {
        const wallId = uid("wall");
        const newWall = {
          id: wallId,
          floorId: activeFloor,
          x1: wallDraftStart.x,
          z1: wallDraftStart.z,
          x2: x,
          z2: z,
          height: 3,
          thickness: 0.14,
        };
        updateHouse({ ...house, walls: [...house.walls, newWall] });
        setSelected({ type: "wall", id: wallId });
        setWallDraftStart(null);
        setTool("select");
        flash("Wall created! Adjust with mouse or in Inspector.");
      }
    }
  };

  const serviceOptions =
    mode === "Electrical"
      ? ["Light", "Switch", "Socket", "Fan", "AC", "DB"]
      : ["Sink", "Toilet", "Shower", "Tap", "Floor drain", "Water tank"];

  const placeService = (x, z) => {
    if (x < 0 || z < 0 || x > house.width || z > house.depth) return flash("Place inside house footprint");
    const key = mode.toLowerCase();
    if (!["electrical", "plumbing"].includes(key)) return;
    const type = serviceOptions.includes(serviceType) ? serviceType : serviceOptions[0];
    updateHouse({
      ...house,
      [key]: [...house[key], { id: uid(key), floorId: activeFloor, type, x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) }],
    });
    flash(`${serviceType} placed on floor plan`);
  };

  const wallArea = house.walls.reduce((sum, w) => sum + Math.hypot(w.x2 - w.x1, w.z2 - w.z1) * w.height, 0);
  const estimate =
    wallArea * cost.wall +
    house.doors.length * cost.door +
    house.windows.length * cost.window +
    house.width * house.depth * house.floors.length * cost.floor +
    house.electrical.length * cost.electrical +
    house.plumbing.length * cost.plumbing;
  const issues = validateHouse(house);

  return (
    <div className="app">
      {/* Sleek Topbar */}
      <header className="topbar">
        <div className="brand-wrapper">
          <div className="brand-icon">📐</div>
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="brand">AI CAD STUDIO</span>
              <span className="brand-badge">PRO</span>
            </div>
            <div className="sub">Architectural 3D & 2D Workspace</div>
          </div>
        </div>

        <div className="spacer" />

        {/* AI Prompt Input */}
        <div className="prompt-container">
          <span className="prompt-icon">✨</span>
          <input
            className="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generate();
            }}
            placeholder="e.g. 10m x 8m modern 2BHK house with kitchen..."
          />
          <button className="btn primary" onClick={generate} disabled={busy} title="Generate with Ollama AI">
            {busy ? "Generating..." : "Generate AI"}
          </button>
        </div>

        <button className="btn dark-btn" onClick={modify} disabled={busy} title="Apply text modification">
          Modify
        </button>
        <button className="btn dark-btn" onClick={analyze} disabled={busy} title="Analyze architectural integrity">
          Analyze
        </button>
        <button className="btn dark-btn" onClick={undo} title="Undo (Ctrl+Z)">
          ↶
        </button>
        <button className="btn dark-btn" onClick={redo} title="Redo (Ctrl+Y)">
          ↷
        </button>
        <button className="btn walk" onClick={() => setWalkthrough(true)} title="First-person 3D walkthrough">
          🚶 Walkthrough
        </button>
      </header>

      {/* Main Workspace Layout */}
      <div className="layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          {/* Build Tools */}
          <div className="section">
            <h3>
              <span>🔨 Build & Add</span>
              <span className="small">Ground Floor</span>
            </h3>
            <div className="grid">
              <button
                className={"btn " + (tool === "wall" ? "active-tool" : "")}
                onClick={handleToggleWallTool}
                title="Click & drag on 2D plan to draw wall"
              >
                ＋ Wall
              </button>
              <button
                className={"btn " + (tool === "door" ? "active-tool" : "")}
                onClick={handleToggleDoorTool}
                title="Click any wall in 3D/2D to attach door"
              >
                ＋ Door
              </button>
              <button
                className={"btn " + (tool === "window" ? "active-tool" : "")}
                onClick={handleToggleWindowTool}
                title="Click any wall in 3D/2D to attach window"
              >
                ＋ Window
              </button>
              <button className="btn" onClick={quickAddWall} title="Add 5m wall and start dragging">
                ⚡ Quick Wall
              </button>
            </div>
          </div>

          {/* Project Storage & CAD Export */}
          <div className="section">
            <h3>📁 Project & Export</h3>
            <div className="grid">
              <button className="btn" onClick={save}>
                💾 Save
              </button>
              <button className="btn" onClick={load}>
                📂 Load
              </button>
              <button className="btn" onClick={() => window.print()}>
                🖨️ PDF / Print
              </button>
              <button className="btn" onClick={exportJSON}>
                📄 JSON
              </button>
              <button className="btn" onClick={exportCSV}>
                📊 CSV
              </button>
              <button className="btn" onClick={() => downloadDXF(house)}>
                📐 DXF (CAD)
              </button>
            </div>
          </div>

          {/* Workspace Modes */}
          <div className="section">
            <h3>🎯 Workspace Modes</h3>
            <div className="mode-group">
              {[
                { id: "Design", label: "🎨 3D & 2D Design", desc: "Walls, openings & layout" },
                { id: "Electrical", label: "⚡ Electrical Planner", desc: "Lights, switches, sockets" },
                { id: "Plumbing", label: "🚰 Plumbing Planner", desc: "Sinks, toilets, drains" },
                { id: "Cost", label: "💰 Cost Estimator", desc: "Real-time INR budget" },
              ].map((m) => (
                <button
                  key={m.id}
                  className={"mode " + (mode === m.id ? "active" : "")}
                  onClick={() => {
                    setMode(m.id);
                    if (m.id === "Electrical" || m.id === "Plumbing") setView2D(true);
                  }}
                >
                  <div>
                    <div>{m.label}</div>
                    <div style={{ fontSize: "10.5px", opacity: 0.75, marginTop: "2px" }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* House Stats */}
          <div className="section">
            <h3>📊 House Summary</h3>
            <div className="small">
              <b>Footprint:</b> {house.width}m × {house.depth}m ({(house.width * house.depth).toFixed(1)} m²)
            </div>
            <div className="small" style={{ marginTop: 4 }}>
              <b>Rooms:</b> {house.rooms.length} ({house.rooms.map((r) => r.name).join(", ")})
            </div>
            <div className="small" style={{ marginTop: 4 }}>
              <b>Geometry:</b> {house.walls.length} walls · {house.doors.length} doors · {house.windows.length} windows
            </div>
          </div>
        </aside>

        {/* Center Viewport */}
        <main className="viewer">
          {/* Floating Viewport HUD */}
          <div className="viewport-hud">
            <div className="hud-pill">
              <button className={"hud-btn " + (!view2D && !walkthrough ? "active" : "")} onClick={() => setView2D(false)}>
                🏠 3D View
              </button>
              <button className={"hud-btn " + (view2D && !walkthrough ? "active" : "")} onClick={() => setView2D(true)}>
                📐 2D Blueprint
              </button>
            </div>
            <div className="stat-pill">
              <span>{material} Wall</span>
              <span>•</span>
              <span>{(house.width * house.depth).toFixed(0)} m²</span>
            </div>
          </div>

          {/* Tool Active Banner */}
          {tool !== "select" && (
            <div className="tool-banner">
              <span>
                {tool === "wall"
                  ? "🧱 Wall Drawing: Click Point 1, then drag/click Point 2 on the floor plan"
                  : tool === "door"
                  ? "🚪 Door Tool: Click on ANY wall in 3D or 2D to place the door!"
                  : "🪟 Window Tool: Click on ANY wall in 3D or 2D to place the window!"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTool("select");
                  setWallDraftStart(null);
                }}
              >
                Done / Cancel
              </button>
            </div>
          )}

          {/* 3D Scene / 2D Plan / Walkthrough View */}
          {!walkthrough && !view2D ? (
            <Canvas camera={{ position: [14, 12, 14], fov: 45 }}>
              <HouseScene
                house={house}
                selected={selected}
                setSelected={setSelected}
                activeFloor={activeFloor}
                tool={tool}
                onWallHit={handleWallHitWithTool}
                material={material}
              />
              <OrbitControls makeDefault />
            </Canvas>
          ) : !walkthrough ? (
            <Plan2D
              house={house}
              floorId={activeFloor}
              tool={tool}
              setTool={setTool}
              selected={selected}
              setSelected={setSelected}
              wallDraftStart={wallDraftStart}
              setWallDraftStart={setWallDraftStart}
              onPlaceService={placeService}
              onCanvasClick2D={handleCanvasClick2D}
              onUpdateHouse={updateHouse}
              onWallClick2D={(wall, pos, directObj) => {
                if (directObj) setSelected(directObj);
                else if (wall) handleWallHitWithTool(wall, pos);
              }}
            />
          ) : (
            <WalkthroughScene house={house} onExit={() => setWalkthrough(false)} />
          )}

          {/* Walkthrough Guide */}
          {walkthrough && (
            <div className="walkhelp">
              <b>FIRST-PERSON 3D WALKTHROUGH</b>
              <br />
              <b>W A S D</b> or <b>Arrow Keys</b> = Move · <b>Mouse</b> = Look around · <b>Shift</b> = Run · <b>Esc</b> = Release
              <br />
              <button className="btn" style={{ marginTop: 10 }} onClick={() => setWalkthrough(false)}>
                Exit Walkthrough
              </button>
            </div>
          )}

          {/* Toast Notification */}
          {toast && <div className="toast">{toast}</div>}
        </main>

        {/* Right Inspector & Adjuster */}
        <aside className="inspector">
          <div className="section">
            <h3>
              <span>⚙️ Inspector & Adjuster</span>
              {selected && (
                <button className="btn btn-mini danger" onClick={deleteSelected} title="Delete selected object">
                  🗑️ Delete
                </button>
              )}
            </h3>

            {/* Adjuster Component */}
            <Adjuster
              selected={selected}
              selectedObj={selectedObj}
              house={house}
              updateHouse={updateHouse}
              setSelected={setSelected}
              onStartAddDoorOnWall={quickAddDoor}
              onStartAddWindowOnWall={quickAddWindow}
            />
          </div>

          {/* Materials */}
          <div className="section">
            <h3>🎨 Wall Material & Finish</h3>
            <select className="field" value={material} onChange={(e) => setMaterial(e.target.value)}>
              <option>Concrete</option>
              <option>Brick</option>
              <option>Painted Wall</option>
              <option>Glass</option>
            </select>
          </div>

          {/* AI Analysis */}
          {analysis && (
            <div className="section">
              <h3>🤖 AI Architectural Review</h3>
              <div className="analysis">
                <b>{analysis.summary}</b>
                {analysis.issues?.length > 0 && (
                  <>
                    <br />
                    <br />
                    <b style={{ color: "#b91c1c" }}>Issues:</b>
                    <ul>
                      {analysis.issues.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
                {analysis.suggestions?.length > 0 && (
                  <>
                    <br />
                    <b style={{ color: "#1d4ed8" }}>Recommendations:</b>
                    <ul>
                      {analysis.suggestions.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Cost Mode */}
          {mode === "Cost" && (
            <div className="section">
              <h3>💰 Budget & Cost Estimator (INR)</h3>
              {Object.entries({
                wall: "Wall / m²",
                door: "Door / unit",
                window: "Window / unit",
                floor: "Floor / m²",
                electrical: "Electrical point",
                plumbing: "Plumbing fixture",
              }).map(([key, label]) => (
                <StepField
                  key={key}
                  label={label}
                  value={cost[key]}
                  onChange={(v) => setCost((c) => ({ ...c, [key]: Math.max(0, Number(v) || 0) }))}
                  step={100}
                  unit="₹"
                />
              ))}
              <div className="analysis" style={{ marginTop: 12 }}>
                <div>Wall Area: {wallArea.toFixed(1)} m²</div>
                <div>Floor Area: {(house.width * house.depth).toFixed(1)} m²</div>
                <div>Doors: {house.doors.length} · Windows: {house.windows.length}</div>
                <div>Electrical: {house.electrical.length} · Plumbing: {house.plumbing.length}</div>
                <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  Estimated Subtotal: ₹{estimate.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          )}

          {/* Electrical & Plumbing Mode */}
          {(mode === "Electrical" || mode === "Plumbing") && (
            <div className="section">
              <h3>{mode === "Electrical" ? "⚡ Electrical Points" : "🚰 Plumbing Fixtures"}</h3>
              <div className="small" style={{ marginBottom: 8 }}>
                Select fixture type below and click inside the 2D blueprint to place:
              </div>
              <select
                className="field"
                value={serviceOptions.includes(serviceType) ? serviceType : serviceOptions[0]}
                onChange={(e) => setServiceType(e.target.value)}
              >
                {serviceOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button className="btn full" style={{ marginTop: 6 }} onClick={() => setView2D(true)}>
                📐 Open 2D Placement Plan
              </button>
              <div className="analysis" style={{ marginTop: 10, maxHeight: 160, overflowY: "auto" }}>
                {house[mode.toLowerCase()].filter((o) => o.floorId === activeFloor).length === 0 ? (
                  <div className="small">No {mode.toLowerCase()} fixtures placed yet.</div>
                ) : (
                  house[mode.toLowerCase()]
                    .filter((o) => o.floorId === activeFloor)
                    .map((o) => (
                      <div key={o.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>
                          {o.type} ({o.x}m, {o.z}m)
                        </span>
                        <button
                          className="btn btn-mini danger"
                          onClick={() =>
                            updateHouse({
                              ...house,
                              [mode.toLowerCase()]: house[mode.toLowerCase()].filter((x) => x.id !== o.id),
                            })
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Geometry Validation */}
          <div className="section">
            <h3>📐 Geometry Health Check</h3>
            <div className="analysis">
              {issues.length ? (
                issues.map((x, i) => (
                  <div key={i} style={{ color: "#b91c1c", marginBottom: 3 }}>
                    ⚠ {x}
                  </div>
                ))
              ) : (
                <div style={{ color: "#15803d", fontWeight: 600 }}>✓ All CAD wall & opening geometries valid</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function download(name, data, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

export default App;
