import { displayName } from "./people.ts";
import { isParentChild } from "./relationships.ts";
import type { Pedigree, PedigreeNode } from "./pedigree.ts";
import type { FamilyData, PersonId } from "./types.ts";

/**
 * The whole family on one chart: every person exactly once, one row per generation (partners are
 * kept on the same row, side by side), parents above children. Pure and cycle-safe.
 * Node keys are the person ids; edges run from the child up to each parent, like the ancestors
 * view; `partners` lists the couples to join with a horizontal segment.
 */
export function buildFamilyTree(data: FamilyData): Pedigree {
  const people = data.people;
  if (people.length === 0) return { nodes: [], edges: [], levels: 0, slots: 0 };

  const known = new Set(people.map((p) => p.id));
  const name = new Map(people.map((p) => [p.id, displayName(p)]));
  const parents = new Map<PersonId, PersonId[]>();
  const edges: Pedigree["edges"] = [];
  const couples: [PersonId, PersonId][] = [];
  for (const r of data.relationships) {
    if (isParentChild(r)) {
      if (!known.has(r.parentId) || !known.has(r.childId)) continue;
      parents.set(r.childId, [...(parents.get(r.childId) ?? []), r.parentId]);
      edges.push({ fromKey: r.childId, toKey: r.parentId, nature: r.nature });
    } else if (known.has(r.personAId) && known.has(r.personBId) && r.personAId !== r.personBId) {
      couples.push([r.personAId, r.personBId]);
    }
  }

  // Generation rows: below every parent, and a couple shares the lower of its two rows.
  const level = new Map<PersonId, number>(people.map((p) => [p.id, 0]));
  for (let pass = 0; pass <= people.length + 1; pass++) {
    let changed = false;
    for (const p of people) {
      const wanted = Math.max(0, ...(parents.get(p.id) ?? []).map((q) => (level.get(q) ?? 0) + 1));
      if (wanted > (level.get(p.id) ?? 0)) {
        level.set(p.id, wanted);
        changed = true;
      }
    }
    for (const [a, b] of couples) {
      const top = Math.max(level.get(a) ?? 0, level.get(b) ?? 0);
      if ((level.get(a) ?? 0) !== top || (level.get(b) ?? 0) !== top) {
        level.set(a, top);
        level.set(b, top);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const rows: PersonId[][] = [];
  for (const p of people) {
    const row = level.get(p.id) ?? 0;
    (rows[row] ??= []).push(p.id);
  }
  const rowCount = rows.length;
  const widest = Math.max(...rows.map((r) => r?.length ?? 0));

  const partnersOf = new Map<PersonId, PersonId[]>();
  for (const [a, b] of couples) {
    partnersOf.set(a, [...(partnersOf.get(a) ?? []), b]);
    partnersOf.set(b, [...(partnersOf.get(b) ?? []), a]);
  }

  const slot = new Map<PersonId, number>();
  const byName = (a: PersonId, b: PersonId): number =>
    (name.get(a) ?? "").localeCompare(name.get(b) ?? "");
  const barycentre = (id: PersonId): number | null => {
    const placed = (parents.get(id) ?? []).flatMap((q) => (slot.has(q) ? [slot.get(q) ?? 0] : []));
    return placed.length ? placed.reduce((s, v) => s + v, 0) / placed.length : null;
  };

  for (let row = 0; row < rowCount; row++) {
    const ids = rows[row] ?? [];
    // Units: a person and the partners on the same row travel together.
    const unitOf = new Map<PersonId, PersonId[]>();
    const units: PersonId[][] = [];
    for (const id of [...ids].sort(byName)) {
      if (unitOf.has(id)) continue;
      const unit: PersonId[] = [];
      const queue = [id];
      while (queue.length) {
        const next = queue.shift() as PersonId;
        if (unitOf.has(next) || !ids.includes(next)) continue;
        unitOf.set(next, unit);
        unit.push(next);
        queue.push(...(partnersOf.get(next) ?? []));
      }
      // Blood relatives (with parents on the chart) first, then those who married in.
      unit.sort((a, b) => Number(barycentre(b) !== null) - Number(barycentre(a) !== null));
      units.push(unit);
    }
    const key = (unit: PersonId[]): number => {
      const values = unit.flatMap((id) => {
        const v = barycentre(id);
        return v === null ? [] : [v];
      });
      return values.length ? values.reduce((s, v) => s + v, 0) / values.length : Infinity;
    };
    units.sort((a, b) => key(a) - key(b) || byName(a[0] as PersonId, b[0] as PersonId));
    const ordered = units.flat();
    const offset = (widest - ordered.length) / 2;
    ordered.forEach((id, index) => slot.set(id, offset + index));
  }

  const nodes: PedigreeNode[] = people.map((p) => ({
    key: p.id,
    personId: p.id,
    // Never 0: nobody is "the root" on this chart, so no box gets the root styling.
    generation: 1,
    level: level.get(p.id) ?? 0,
    slot: slot.get(p.id) ?? 0,
  }));
  return {
    nodes,
    edges,
    partners: couples.map(([a, b]) => ({ aKey: a, bKey: b })),
    levels: rowCount,
    slots: widest,
  };
}
