import type { PersonId } from "./types.ts";

export class PersonNotFoundError extends Error {
  constructor(id: PersonId) {
    super(`Person not found: ${id}`);
    this.name = "PersonNotFoundError";
  }
}
