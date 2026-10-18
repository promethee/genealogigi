import { isParentChild } from "./relationships.ts";
import type { FamilyData, PersonId, RelationshipFamilial } from "./types.ts";

export const MIN_GENERATIONS = 2;
export const MAX_GENERATIONS = 6;
export const DEFAULT_GENERATIONS = 4;

export interface PedigreeNode {
  /** Unique per position in the chart (a person can appear several times). */
  key: string;
  personId: PersonId;
  /** 0 = root, 1 = parents, 2 = grandparents... */
  generation: number;
  /** Vertical slot; fractional because parents are centred on their children. */
  row: number;
}

export interface PedigreeEdge {
  fromKey: string; // the child's node
  toKey: string; // the parent's node
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
 * Lays out `rootId` and its ancestors. Pure and framework-free. Stops at
 * `maxGenerations` and never revisits a person already on the current path,
 * so cyclic or hand-edited data cannot loop forever.
 */
export function buildPedigree(
  data: FamilyData,
  rootId: PersonId,
  maxGenerations: number = DEFAULT_GENERATIONS,
): Pedigree {
  const limit = clampGenerations(maxGenerations);
  const known = new Set(data.people.map((p) => p.id));
  const parentLinks = data.relationships.filter(isParentChild);

  const nodes: PedigreeNode[] = [];
  const edges: PedigreeEdge[] = [];
  let nextRow = 0;
  let deepest = 0;

  function place(personId: PersonId, generation: number, path: PersonId[], key: string): number {
    deepest = Math.max(deepest, generation);
    const parentRows: number[] = [];
    if (generation < limit) {
      const links = parentLinks.filter(
        (r) => r.childId === personId && known.has(r.parentId) && !path.includes(r.parentId),
      );
      links.forEach((link, index) => {
        const parentKey = `${key}/${index}:${link.parentId}`;
        const row = place(link.parentId, generation + 1, [...path, link.parentId], parentKey);
        parentRows.push(row);
        edges.push({ fromKey: key, toKey: parentKey, nature: link.nature });
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
    nodes.push({ key, personId, generation, row });
    return row;
  }

  if (known.has(rootId)) place(rootId, 0, [rootId], `0:${rootId}`);

  return { nodes, edges, columns: nodes.length ? deepest + 1 : 0, rows: nextRow };
}

const MAX_NAME_LENGTH = 22;

export function truncateName(name: string): string {
  return name.length <= MAX_NAME_LENGTH ? name : `${name.slice(0, MAX_NAME_LENGTH - 1)}…`;
}
