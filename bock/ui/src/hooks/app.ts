import useAPI from "./api";
import { UPSTREAM_ENDPOINT } from "../constants";
import {
  BaseEntity,
  Revision,
  SearchResults,
  SimpleArticle,
  SimpleListOfArticles,
  Statistics,
} from "../types";

export const useArticles = () =>
  useAPI<SimpleListOfArticles>(`${UPSTREAM_ENDPOINT}/api/articles/all`);

export const useStatistics = () =>
  useAPI<Statistics>(`${UPSTREAM_ENDPOINT}/api/articles/stats`);

export const useSearch = (term: string) =>
  useAPI<SearchResults>(`${UPSTREAM_ENDPOINT}/api/search/${term}`);

export const useEntity = (title: string) =>
  useAPI<BaseEntity>(`${UPSTREAM_ENDPOINT}/api/articles/${title}`);

export const useRevision = (title: string, revisionId: string) =>
  useAPI<Revision>(
    `${UPSTREAM_ENDPOINT}/api/articles/${title}/revisions/${revisionId}`
  );

export const useCompare = (title: string, shaA: string, shaB: string) =>
  useAPI<string>(
    `${UPSTREAM_ENDPOINT}/api/articles/${title}/compare?a=${shaA}&b=${shaB}`
  );

export const useRandom = () =>
  useAPI<SimpleArticle>(`${UPSTREAM_ENDPOINT}/api/articles/random`);
