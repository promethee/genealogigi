import { t } from "../i18n/index.ts";
import type { PersonId } from "./types.ts";

export class PersonNotFoundError extends Error {
  constructor(id: PersonId) {
    super(t("err.personNotFound", { id }));
    this.name = "PersonNotFoundError";
  }
}
