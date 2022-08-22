import { parseISO, formatDistanceToNow, format } from "date-fns";
import filesize from "filesize";
import { HierarchyAtom } from "./types";

export const humanReadableRelative = (isoDate: string): string =>
  formatDistanceToNow(parseISO(isoDate));

export const humanReadable = (isoDate: string): string =>
  format(parseISO(isoDate), "h:mmaaa 'on' LLLL do yyyy");

export const humanSize = (bytes: number): string =>
  filesize(bytes, { base: 10 });

export const linkFromHierarchy = (hierarchy: HierarchyAtom[]) =>
  hierarchy
    .slice(1)
    .map((_) => _.name.replaceAll(" ", "_"))
    .join("/");

export const linkFromPath = (path: string) => path.replaceAll(" ", "_");

export const articleNameFromPath = (path: string) =>
  path.split("/").slice(-1)[0].replace(/_/g, " ");

export const classNames = (...classes: string[]) =>
  classes.filter(Boolean).join(" ");
