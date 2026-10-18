import type { Relatives } from "./relatives.ts";
import type { PersonId, RelationshipFamilial } from "./types.ts";

export type MiniRole = "self" | "parent" | "partner" | "child";

export interface MiniNode {
  key: string;
  personId: PersonId;
  role: MiniRole;
  /** Row: 0 = parents, 1 = the person and partners, 2 = children (rows without people are skipped). */
  row: number;
  /** Horizontal slot, fractional because rows are centred. */
  slot: number;
  /** Set for parents and children whose link is not confirmed biological. */
  nature?: RelationshipFamilial["nature"];
}

export interface MiniEdge {
  fromKey: string;
  toKey: string;
  /** "partner" edges are horizontal; family edges run from the upper box down to the lower. */
  kind: "family" | "partner";
  dashed: boolean;
}

export interface MiniTree {
  nodes: MiniNode[];
  edges: MiniEdge[];
  rows: number;
  /** Width in slots (the widest row). */
  slots: number;
}

const centred = (count: number, width: number): number => (width - count) / 2;

/**
 * Lays out the immediate family of `personId`: parents above, the person with their partners
 * beside them, children below. Pure; the caller turns slots and rows into pixels.
 */
export function miniTreeOf(personId: PersonId, relatives: Relatives): MiniTree | null {
  const { parents, partners, children } = relatives;
  if (parents.length + partners.length + children.length === 0) return null;

  // A person can be listed twice (two links to the same person); draw each once.
  const uniqueBy = <T extends { personId: PersonId }>(list: T[]) =>
    list.filter((x, i) => list.findIndex((y) => y.personId === x.personId) === i);
  const ps = uniqueBy(parents);
  const qs = uniqueBy(partners);
  const cs = uniqueBy(children);

  const middle = 1 + qs.length;
  const width = Math.max(ps.length, middle, cs.length);
  const nodes: MiniNode[] = [];
  const edges: MiniEdge[] = [];

  // Rows without anybody are skipped so the picture stays compact.
  const rowOf = { parents: 0, middle: ps.length > 0 ? 1 : 0, children: 0 };
  rowOf.children = rowOf.middle + 1;

  const selfSlot = centred(middle, width);
  const self: MiniNode = {
    key: `self:${personId}`,
    personId,
    role: "self",
    row: rowOf.middle,
    slot: selfSlot,
  };
  nodes.push(self);

  qs.forEach((q, i) => {
    const node: MiniNode = {
      key: `partner:${q.personId}`,
      personId: q.personId,
      role: "partner",
      row: rowOf.middle,
      slot: selfSlot + i + 1,
    };
    nodes.push(node);
    edges.push({
      // Each partner is joined to the box on their left, so lines never run through a box.
      fromKey: i === 0 ? self.key : `partner:${(qs[i - 1] as (typeof qs)[number]).personId}`,
      toKey: node.key,
      kind: "partner",
      dashed: q.link.status !== "ongoing",
    });
  });

  const parentStart = centred(ps.length, width);
  ps.forEach((p, i) => {
    const node: MiniNode = {
      key: `parent:${p.personId}`,
      personId: p.personId,
      role: "parent",
      row: rowOf.parents,
      slot: parentStart + i,
      ...(p.nature !== "biological-confirmed" ? { nature: p.nature } : {}),
    };
    nodes.push(node);
    edges.push({
      fromKey: node.key,
      toKey: self.key,
      kind: "family",
      dashed: p.nature !== "biological-confirmed",
    });
  });

  const childStart = centred(cs.length, width);
  cs.forEach((c, i) => {
    const node: MiniNode = {
      key: `child:${c.personId}`,
      personId: c.personId,
      role: "child",
      row: rowOf.children,
      slot: childStart + i,
      ...(c.nature !== "biological-confirmed" ? { nature: c.nature } : {}),
    };
    nodes.push(node);
    edges.push({
      fromKey: self.key,
      toKey: node.key,
      kind: "family",
      dashed: c.nature !== "biological-confirmed",
    });
  });

  const rows = cs.length > 0 ? rowOf.children + 1 : rowOf.middle + 1;
  return { nodes, edges, rows, slots: width };
}
