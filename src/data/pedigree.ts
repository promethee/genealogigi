import { isParentChild } from "./relationships.ts";
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
  /** Horizontal slot, 0 = leftmost. Equals `generation` except in hourglass charts. */
  column: number;
  /** Vertical slot; fractional because parents are centred on their children. */
  row: number;
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
  /** Number of columns actually used (deepest generation + 1). */
  columns: number;
  /** Number of leaf rows used. */
  rows: number;
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
): Pedigree {
  if (direction !== "hourglass") return layout(data, rootId, maxGenerations, direction);
  return hourglass(data, rootId, maxGenerations);
}

/** Ancestors to the left of the root, descendants to the right, roots aligned. */
function hourglass(data: FamilyData, rootId: PersonId, maxGenerations: number): Pedigree {
  const up = layout(data, rootId, maxGenerations, "ancestors");
  const down = layout(data, rootId, maxGenerations, "descendants");
  const upRoot = up.nodes.find((n) => n.generation === 0);
  const downRoot = down.nodes.find((n) => n.generation === 0);
  if (!upRoot || !downRoot) return { nodes: [], edges: [], columns: 0, rows: 0 };

  const ancestorColumns = up.columns - 1;
  const shift = upRoot.row - downRoot.row;
  const nodes = [
    ...up.nodes.map((n) => ({ ...n, column: ancestorColumns - n.generation })),
    ...down.nodes
      .filter((n) => n.generation > 0)
      .map((n) => ({ ...n, column: ancestorColumns + n.generation, row: n.row + shift })),
  ];
  // Descendant rows may now sit above row 0; move everything down so the top is 0.
  const top = Math.min(...nodes.map((n) => n.row));
  const placed = nodes.map((n) => ({ ...n, row: n.row - top }));
  const bottom = Math.max(...placed.map((n) => n.row));
  return {
    nodes: placed,
    edges: [...up.edges, ...down.edges],
    columns: up.columns + down.columns - 1,
    rows: Math.ceil(bottom) + 1,
  };
}

function layout(
  data: FamilyData,
  rootId: PersonId,
  maxGenerations: number,
  direction: "ancestors" | "descendants",
): Pedigree {
  const limit = clampGenerations(maxGenerations);
  const known = new Set(data.people.map((p) => p.id));
  const parentLinks = data.relationships.filter(isParentChild);

  const nodes: PedigreeNode[] = [];
  const edges: PedigreeEdge[] = [];
  let nextRow = 0;
  let deepest = 0;

  const ancestors = direction === "ancestors";

  function place(personId: PersonId, generation: number, path: PersonId[], key: string): number {
    deepest = Math.max(deepest, generation);
    const parentRows: number[] = [];
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
        const row = place(otherId, generation + 1, [...path, otherId], otherKey);
        parentRows.push(row);
        edges.push({ fromKey: key, toKey: otherKey, nature: link.nature });
      });
    }

    let row: number;
    if (parentRows.length === 0) {
      row = nextRow++;
    } else {
      const first = parentRows[0] as number;
      const last = parentRows[parentRows.length - 1] as number;
      row = (first + last) / 2;
    }
    nodes.push({ key, personId, generation, column: generation, row });
    return row;
  }

  if (known.has(rootId)) place(rootId, 0, [rootId], `0:${rootId}`);

  return { nodes, edges, columns: nodes.length ? deepest + 1 : 0, rows: nextRow };
}

const MAX_NAME_LENGTH = 22;

export function truncateName(name: string): string {
  return name.length <= MAX_NAME_LENGTH ? name : `${name.slice(0, MAX_NAME_LENGTH - 1)}…`;
}
