import { isParentChild } from "./relationships.ts";
import { siblingsOf } from "./relatives.ts";
import type { FamilyData, PersonId, RelationshipFamilial } from "./types.ts";

export const MIN_GENERATIONS = 2;
export const MAX_GENERATIONS = 6;
export const DEFAULT_GENERATIONS = 4;

export interface PedigreeNode {
  /** Unique per position in the chart (a person can appear several times). */
  key: string;
  personId: PersonId;
  /** 0 = root, 1 = parents (or children), 2 = grandparents (or grandchildren)... */
  generation: number;
  /** True for the root's siblings (drawn on the root's row); never the root itself. */
  sibling?: boolean;
  /** Vertical level, 0 = top. Ancestors sit above the root, descendants below it. */
  level: number;
  /** Horizontal slot, 0 = leftmost; fractional because parents are centred on their children. */
  slot: number;
}

export type PedigreeDirection = "ancestors" | "descendants" | "hourglass";

export interface PedigreeEdge {
  fromKey: string; // the node nearer the root
  toKey: string; // the node further from the root (parent or child)
  nature: RelationshipFamilial["nature"];
}

export interface Pedigree {
  nodes: PedigreeNode[];
  edges: PedigreeEdge[];
  /** Number of levels (rows of boxes) used. */
  levels: number;
  /** Number of leaf slots used (width of the chart in boxes). */
  slots: number;
}

export function clampGenerations(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_GENERATIONS;
  return Math.min(MAX_GENERATIONS, Math.max(MIN_GENERATIONS, Math.round(value)));
}

/**
 * Lays out `rootId` and its ancestors (or descendants). Pure and framework-free. Stops at
 * `maxGenerations` and never revisits a person already on the current path,
 * so cyclic or hand-edited data cannot loop forever.
 */
export function buildPedigree(
  data: FamilyData,
  rootId: PersonId,
  maxGenerations: number = DEFAULT_GENERATIONS,
  direction: PedigreeDirection = "ancestors",
  options: PedigreeOptions = {},
): Pedigree {
  if (direction !== "hourglass") return layout(data, rootId, maxGenerations, direction, options);
  return hourglass(data, rootId, maxGenerations, options);
}

export interface PedigreeOptions {
  /** Also draw the root's siblings on the root's row (ancestors and hourglass only). */
  siblings?: boolean;
}

/** Ancestors above the root, descendants below it, roots aligned. */
function hourglass(
  data: FamilyData,
  rootId: PersonId,
  maxGenerations: number,
  options: PedigreeOptions,
): Pedigree {
  const up = layout(data, rootId, maxGenerations, "ancestors", options);
  const down = layout(data, rootId, maxGenerations, "descendants");
  const upRoot = up.nodes.find((n) => n.generation === 0 && !n.sibling);
  const downRoot = down.nodes.find((n) => n.generation === 0 && !n.sibling);
  if (!upRoot || !downRoot) return { nodes: [], edges: [], levels: 0, slots: 0 };

  const rootLevel = up.levels - 1;
  const shift = upRoot.slot - downRoot.slot;
  const nodes = [
    ...up.nodes,
    ...down.nodes
      .filter((n) => n.generation > 0)
      .map((n) => ({ ...n, level: rootLevel + n.generation, slot: n.slot + shift })),
  ];
  // Descendant slots may now sit left of slot 0; move everything right so the left edge is 0.
  const top = Math.min(...nodes.map((n) => n.slot));
  const placed = nodes.map((n) => ({ ...n, slot: n.slot - top }));
  const bottom = Math.max(...placed.map((n) => n.slot));
  return {
    nodes: placed,
    edges: [...up.edges, ...down.edges],
    levels: up.levels + down.levels - 1,
    slots: Math.ceil(bottom) + 1,
  };
}

function layout(
  data: FamilyData,
  rootId: PersonId,
  maxGenerations: number,
  direction: "ancestors" | "descendants",
  options: PedigreeOptions = {},
): Pedigree {
  const limit = clampGenerations(maxGenerations);
  const known = new Set(data.people.map((p) => p.id));
  const parentLinks = data.relationships.filter(isParentChild);

  const nodes: PedigreeNode[] = [];
  const edges: PedigreeEdge[] = [];
  let nextSlot = 0;
  let deepest = 0;

  const ancestors = direction === "ancestors";

  function place(personId: PersonId, generation: number, path: PersonId[], key: string): number {
    deepest = Math.max(deepest, generation);
    const otherSlots: number[] = [];
    if (generation < limit) {
      const links = parentLinks
        .map((link) => ({ link, otherId: ancestors ? link.parentId : link.childId }))
        .filter(
          ({ link, otherId }) =>
            (ancestors ? link.childId : link.parentId) === personId &&
            known.has(otherId) &&
            !path.includes(otherId),
        );
      links.forEach(({ link, otherId }, index) => {
        const otherKey = `${key}/${index}:${otherId}`;
        const slot = place(otherId, generation + 1, [...path, otherId], otherKey);
        otherSlots.push(slot);
        edges.push({ fromKey: key, toKey: otherKey, nature: link.nature });
      });
    }

    let slot: number;
    if (otherSlots.length === 0) {
      slot = nextSlot++;
    } else {
      const first = otherSlots[0] as number;
      const last = otherSlots[otherSlots.length - 1] as number;
      slot = (first + last) / 2;
    }
    nodes.push({ key, personId, generation, level: generation, slot });
    return slot;
  }

  if (known.has(rootId)) place(rootId, 0, [rootId], `0:${rootId}`);

  // Ancestors are drawn above the root, so flip their levels; descendants hang below it.
  if (ancestors) for (const node of nodes) node.level = deepest - node.generation;

  if (ancestors && options.siblings) addSiblings(data, rootId, nodes, edges);

  const widest = nodes.reduce((max, n) => Math.max(max, Math.ceil(n.slot) + 1), 0);
  return {
    nodes,
    edges,
    levels: nodes.length ? deepest + 1 : 0,
    slots: Math.max(nextSlot, widest),
  };
}

function birthYear(data: FamilyData, id: PersonId): number | null {
  const born = data.people.find((p) => p.id === id)?.born?.birthDate;
  return born?.yearKnown ? Number(born.raw.slice(0, 4)) : null;
}

/**
 * Puts the root's siblings on the root's row, beside the root: older ones (earlier known
 * birth year) to the left, younger or unknown ones to the right, nearest first, one slot
 * apart. Each is linked to the root's parent boxes it shares. Slots may go below 0; the
 * caller shifts them.
 */
function addSiblings(
  data: FamilyData,
  rootId: PersonId,
  nodes: PedigreeNode[],
  edges: PedigreeEdge[],
): void {
  const root = nodes.find((n) => n.generation === 0);
  if (!root) return;
  const parentBoxes = nodes.filter((n) => n.generation === 1);
  const siblings = siblingsOf(data, rootId).filter((s) =>
    parentBoxes.some((box) => s.sharedParents.includes(box.personId)),
  );
  if (siblings.length === 0) return;

  const rootYear = birthYear(data, rootId);
  const older: typeof siblings = [];
  const younger: typeof siblings = [];
  for (const sibling of siblings) {
    const year = birthYear(data, sibling.personId);
    (rootYear !== null && year !== null && year < rootYear ? older : younger).push(sibling);
  }
  const byYear = (a: (typeof siblings)[number], b: (typeof siblings)[number]) =>
    (birthYear(data, a.personId) ?? Infinity) - (birthYear(data, b.personId) ?? Infinity);
  older.sort((a, b) => byYear(b, a)); // nearest to the root first
  younger.sort(byYear);

  const place = (sibling: (typeof siblings)[number], slot: number) => {
    const key = `sib:${sibling.personId}`;
    nodes.push({
      key,
      personId: sibling.personId,
      generation: 0,
      level: root.level,
      slot,
      sibling: true,
    });
    for (const box of parentBoxes) {
      if (!sibling.sharedParents.includes(box.personId)) continue;
      const link = data.relationships.find(
        (r) => isParentChild(r) && r.parentId === box.personId && r.childId === sibling.personId,
      );
      if (link && isParentChild(link)) {
        edges.push({ fromKey: key, toKey: box.key, nature: link.nature });
      }
    }
  };
  older.forEach((s, i) => place(s, root.slot - (i + 1)));
  younger.forEach((s, i) => place(s, root.slot + (i + 1)));

  // Shift everything right so the leftmost box is at slot 0.
  const left = Math.min(...nodes.map((n) => n.slot));
  if (left < 0) for (const n of nodes) n.slot -= left;
}

const MAX_NAME_LENGTH = 22;

export function truncateName(name: string, max: number = MAX_NAME_LENGTH): string {
  return name.length <= max ? name : `${name.slice(0, max - 1)}…`;
}
