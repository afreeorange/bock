// Why doesn't this work?

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
