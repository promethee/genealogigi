import type { Pedigree } from "./pedigree.ts";
import type { PersonId, RelationshipFamilial } from "./types.ts";

export const FAN_ROOT_RADIUS = 44;
export const FAN_RING_WIDTH = 96;
export const FAN_PADDING = 16;
const MAX_LABEL_LENGTH = 14;

export interface FanWedge {
  key: string;
  personId: PersonId;
  generation: number;
  path: string;
  /** Label position and rotation (degrees). */
  labelX: number;
  labelY: number;
  labelRotation: number;
  nature?: RelationshipFamilial["nature"];
}

export interface Fan {
  width: number;
  height: number;
  /** Centre of the root circle. */
  cx: number;
  cy: number;
  rootKey: string | null;
  wedges: FanWedge[];
}

export function truncateLabel(name: string): string {
  return name.length <= MAX_LABEL_LENGTH ? name : `${name.slice(0, MAX_LABEL_LENGTH - 1)}…`;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Point at radius `r` and angle `theta` (0 = left, PI = right, sweeping over the top). */
function point(cx: number, cy: number, r: number, theta: number): [number, number] {
  return [cx - r * Math.cos(theta), cy - r * Math.sin(theta)];
}

/** SVG path of a ring segment between two radii and two angles. */
export function wedgePath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  from: number,
  to: number,
): string {
  const [x1, y1] = point(cx, cy, inner, from);
  const [x2, y2] = point(cx, cy, outer, from);
  const [x3, y3] = point(cx, cy, outer, to);
  const [x4, y4] = point(cx, cy, inner, to);
  const large = to - from > Math.PI ? 1 : 0;
  const f = (n: number) => round(n);
  return (
    `M ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)} ` +
    `A ${outer} ${outer} 0 ${large} 1 ${f(x3)} ${f(y3)} ` +
    `L ${f(x4)} ${f(y4)} A ${inner} ${inner} 0 ${large} 0 ${f(x1)} ${f(y1)} Z`
  );
}

/** Turns an ancestors pedigree into fan wedges. Pure; the root is returned as `rootKey`. */
export function buildFan(pedigree: Pedigree): Fan {
  const deepest = Math.max(0, ...pedigree.nodes.map((n) => n.generation));
  const radius = FAN_ROOT_RADIUS + deepest * FAN_RING_WIDTH;
  const cx = FAN_PADDING + radius;
  const cy = FAN_PADDING + radius;
  const fan: Fan = {
    width: 2 * cx,
    height: cy + FAN_ROOT_RADIUS + FAN_PADDING,
    cx,
    cy,
    rootKey: null,
    wedges: [],
  };
  if (pedigree.nodes.length === 0) return fan;

  const children = new Map<string, { key: string; nature: RelationshipFamilial["nature"] }[]>();
  for (const e of pedigree.edges) {
    const list = children.get(e.fromKey) ?? [];
    list.push({ key: e.toKey, nature: e.nature });
    children.set(e.fromKey, list);
  }
  const natureOf = new Map(pedigree.edges.map((e) => [e.toKey, e.nature]));
  const byKey = new Map(pedigree.nodes.map((n) => [n.key, n]));

  // Leaf-row span covered by each node's ancestry.
  const spans = new Map<string, [number, number]>();
  const spanOf = (key: string): [number, number] => {
    const known = spans.get(key);
    if (known) return known;
    const node = byKey.get(key);
    const next = children.get(key) ?? [];
    let span: [number, number] = [node?.row ?? 0, node?.row ?? 0];
    if (next.length > 0) {
      const parts = next.map((c) => spanOf(c.key));
      span = [Math.min(...parts.map((p) => p[0])), Math.max(...parts.map((p) => p[1]))];
    }
    spans.set(key, span);
    return span;
  };

  const unit = Math.PI / Math.max(1, pedigree.rows);
  for (const node of pedigree.nodes) {
    if (node.generation === 0) {
      fan.rootKey = node.key;
      continue;
    }
    const [first, last] = spanOf(node.key);
    const from = first * unit;
    const to = (last + 1) * unit;
    const inner = FAN_ROOT_RADIUS + (node.generation - 1) * FAN_RING_WIDTH;
    const outer = inner + FAN_RING_WIDTH;
    const mid = (from + to) / 2;
    const [labelX, labelY] = point(cx, cy, (inner + outer) / 2, mid);
    // Radial direction on screen; flip on the left half so text is never upside down.
    const radial = (Math.atan2(-Math.sin(mid), -Math.cos(mid)) * 180) / Math.PI;
    fan.wedges.push({
      key: node.key,
      personId: node.personId,
      generation: node.generation,
      path: wedgePath(cx, cy, inner, outer, from, to),
      labelX: round(labelX),
      labelY: round(labelY),
      labelRotation: round(Math.cos(mid) > 0 ? radial + 180 : radial),
      nature: natureOf.get(node.key),
    });
  }
  return fan;
}
