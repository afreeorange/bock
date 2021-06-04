export type EntityType = "file" | "folder";

export type HierarchyAtom = {
  name: string;
  type: EntityType;
};

export type Hierarchy = HierarchyAtom[];

export type BaseEntity = {
  created: string;
  hierarchy: Hierarchy;
  key: string;
  modified: string;
  name: string;
  path: string;
  size_in_bytes: number;
  type: EntityType;
};

export type Revision = {
  committed: string;
  hierarchy: Hierarchy;
  html: string;
  name: string;
  text: string;
};

export type RevisionMeta = {
  author: string;
  committed: string;
  email: string;
  id: string;
  message: string;
};

export type Article = BaseEntity & {
  html: string;
  text: string;
  uncommitted: boolean;
  revisions: RevisionMeta[];
};

export type Folder = BaseEntity & {
  children: {
    count: number;
    folders: {
      name: string;
      path: string;
      key: string;
    }[];
    articles: {
      name: string;
      path: string;
      key: string;
    }[];
  };
  folder_readme: {
    present: boolean;
    text: string;
    html: string;
  };
};

export type SearchResult = {
  name: string;
  path: string;
  content_matches: string;
};

export type SearchResults = {
  term: string;
  count: number;
  results: SearchResult[];
};

export type Statistics = {
  count: number;
  latest: BaseEntity[];
};

export type SimpleArticle = {
  name: string;
  key: string;
};

export type SimpleListOfArticles = {
  articles: SimpleArticle[];
  count: number;
};

export type State = "Idle" | "Loading" | "Loaded" | "Error";

export type MaybePath = {
  maybeArticlePath?: string;
};
