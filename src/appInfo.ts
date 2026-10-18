export const APP_NAME = "Genealogigi";
export const APP_VERSION: string = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.0.0";
/** What the window title shows, e.g. "Genealogigi 0.1.0". */
export const APP_TITLE = `${APP_NAME} ${APP_VERSION}`;

export const RELEASES_API = "https://api.github.com/repos/promethee/genealogigi/releases/latest";
export const RELEASES_PAGE = "https://github.com/promethee/genealogigi/releases";
