// ─── Segment vs. AABB (boolean) ────────────────────────────────────────────
// Used for bullet/wall collision and for simple "can A see B" line-of-sight
// checks. Returns true if the segment (x1,y1)->(x2,y2) crosses the given
// axis-aligned rectangle at all.
export function segmentIntersectsAABB(x1, y1, x2, y2, bx, by, bw, bh) {
  const minX = Math.min(x1, x2),
    maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2),
    maxY = Math.max(y1, y2);
  if (maxX < bx || minX > bx + bw || maxY < by || minY > by + bh) return false;

  const dx = x2 - x1,
    dy = y2 - y1;
  const tMinX = dx !== 0 ? (bx - x1) / dx : -Infinity;
  const tMaxX = dx !== 0 ? (bx + bw - x1) / dx : Infinity;
  const tMinY = dy !== 0 ? (by - y1) / dy : -Infinity;
  const tMaxY = dy !== 0 ? (by + bh - y1) / dy : Infinity;

  const tEnter = Math.max(Math.min(tMinX, tMaxX), Math.min(tMinY, tMaxY));
  const tExit = Math.min(Math.max(tMinX, tMaxX), Math.max(tMinY, tMaxY));
  return tExit >= 0 && tEnter <= 1 && tEnter <= tExit;
}

// ─── Ray vs. AABB (distance) ───────────────────────────────────────────────
// (ox,oy) + t*(dx,dy) for t in [0, maxDist], dx/dy assumed a unit vector.
// Returns the entry distance if the ray hits the box within maxDist, else
// null.
function rayVsAABBDistance(ox, oy, dx, dy, maxDist, bx, by, bw, bh) {
  let tmin = 0;
  let tmax = maxDist;

  if (dx !== 0) {
    let tx1 = (bx - ox) / dx;
    let tx2 = (bx + bw - ox) / dx;
    if (tx1 > tx2) [tx1, tx2] = [tx2, tx1];
    tmin = Math.max(tmin, tx1);
    tmax = Math.min(tmax, tx2);
  } else if (ox < bx || ox > bx + bw) {
    return null;
  }

  if (dy !== 0) {
    let ty1 = (by - oy) / dy;
    let ty2 = (by + bh - oy) / dy;
    if (ty1 > ty2) [ty1, ty2] = [ty2, ty1];
    tmin = Math.max(tmin, ty1);
    tmax = Math.min(tmax, ty2);
  } else if (oy < by || oy > by + bh) {
    return null;
  }

  if (tmin > tmax || tmax < 0) return null;
  return tmin;
}

/**
 * Distance from (originX, originY) to the nearest wall along the given
 * angle, capped at maxDistance.
 */
function castRay(originX, originY, angle, maxDistance, boundaries) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let closest = maxDistance;

  for (const b of boundaries) {
    const hit = rayVsAABBDistance(
      originX,
      originY,
      dx,
      dy,
      closest,
      b.position.x,
      b.position.y,
      b.width,
      b.height,
    );
    if (hit !== null && hit < closest) closest = hit;
  }

  return closest;
}

/**
 * Casts a full 360° sweep of rays from (originX, originY) and returns the
 * resulting visibility polygon (in world space) — everything a player
 * standing at that point could see before a wall blocks the view.
 *
 * `minRadius` guarantees a small always-visible bubble around the origin
 * regardless of nearby walls — without it, standing next to a wall (which
 * is most of the time in a tight corridor map like this one) can shrink
 * the polygon to almost nothing, leaving you unable to see your own
 * character. It's fine for this bubble to peek slightly past an adjacent
 * wall; it's a deliberate "always see yourself" allowance, not a bug.
 */
export function computeVisibilityPolygon(
  originX,
  originY,
  boundaries,
  maxDistance,
  rayCount = 240,
  minRadius = 0,
) {
  const points = [];
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    let dist = castRay(originX, originY, angle, maxDistance, boundaries);
    if (dist < minRadius) dist = minRadius;
    points.push({
      x: originX + Math.cos(angle) * dist,
      y: originY + Math.sin(angle) * dist,
    });
  }
  return points;
}

/**
 * Simple, precise "can I directly see that point" check — used to decide
 * whether an opponent should be rendered at all (as opposed to the coarser
 * visibility-polygon used for the fog overlay).
 */
export function hasLineOfSight(x1, y1, x2, y2, boundaries, maxDistance) {
  const dx = x2 - x1,
    dy = y2 - y1;
  if (Math.sqrt(dx * dx + dy * dy) > maxDistance) return false;

  for (const b of boundaries) {
    if (
      segmentIntersectsAABB(
        x1,
        y1,
        x2,
        y2,
        b.position.x,
        b.position.y,
        b.width,
        b.height,
      )
    ) {
      return false;
    }
  }
  return true;
}
