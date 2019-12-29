import ky from "ky";

export const UPSTREAM_API = "http://wiki.nikhil.io/api";

export enum ServiceState {
  Loading = 1,
  Error = 3,
}

export interface IArticleList {
  articles: Array<{
    title: string;
    uncommitted: boolean;
  }>;
}

export interface IArticle {
  html: string;
  modified: string;
  modified_humanized: string;
  raw: string;
  title: string;
  uncommitted: string;
}

export const getArticles = async () => {
  try {
    return await ky.get(`${UPSTREAM_API}/articles`).json<IArticleList>();
  } catch (e) {
    return ServiceState.Error;
  }
};

export const getArticle = async (articleTitle: string | undefined) => {
  try {
    return await ky.get(`${UPSTREAM_API}/articles/${articleTitle}`).json<IArticle>();
  } catch (e) {
    return ServiceState.Error;
  }
};
