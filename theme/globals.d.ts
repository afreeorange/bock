// Auto-generated from types.go and renderers.go — do not edit by hand.
// Regenerate with: go run ./cmd/gentypes

// Data model types (from types.go, using Go field names)

interface Revision {
  AuthorEmail: string;
  AuthorName: string;
  Date: string;
  Id: string;
  ShortId: string;
  Subject: string;
  Content: string;
}

interface HierarchicalEntity {
  Name: string;
  Type: string;
  URI: string;
}

interface Children {
  Articles: HierarchicalEntity[];
  Folders: HierarchicalEntity[];
}

interface Article {
  Created: string;
  Hierarchy: HierarchicalEntity[];
  Html: string;
  ID: string;
  Modified: string;
  Revisions: Revision[];
  Size: number;
  Source: string;
  Title: string;
  Untracked: boolean;
  URI: string;
  RelativePath: string;
}

interface Folder {
  Children: Children;
  Hierarchy: HierarchicalEntity[];
  ID: string;
  README: string;
  Title: string;
  URI: string;
}

interface Entity {
  Children: Entity[] | null;
  IsFolder: boolean;
  Modified: string;
  Name: string;
  RelativePath: string;
  SizeInBytes: number;
  Title: string;
  URI: string;
}

interface Meta {
  Architecture: string;
  ArticleCount: number;
  BuildDate: string;
  CPUCount: number;
  FolderCount: number;
  GenerateJSON: boolean;
  GenerateRaw: boolean;
  GenerateRevisions: boolean;
  GenerationTime: string;
  GenerationTimeRounded: string;
  MemoryInGB: number;
  Platform: string;
  RevisionCount: number;
}

// Page props (from renderers.go Render calls)

interface IndexProps {
  type: string;
  version: string;
}

interface NotFoundProps {
  type: string;
  version: string;
}

interface RandomProps {
  list: Entity[];
  type: string;
  version: string;
}

interface ArticleProps {
  created: string;
  hierarchy: HierarchicalEntity[];
  html: string;
  id: string;
  modified: string;
  revisions: Revision[];
  sizeInBytes: number;
  source: string;
  title: string;
  untracked: boolean;
  uri: string;
  relativePath: string;
  meta: Meta;
  type: string;
  version: string;
}

interface FolderProps {
  children: Children;
  hierarchy: HierarchicalEntity[];
  readme: string;
  title: string;
  uri: string;
  type: string;
  version: string;
}

interface ArchiveProps {
  title: string;
  tree: Entity[];
  uri: string;
  meta: Meta;
  type: string;
  version: string;
}

interface RevisionListProps {
  revisions: Revision[];
  hierarchy: HierarchicalEntity[];
  title: string;
  uri: string;
  type: string;
  version: string;
}

interface RevisionProps {
  html: string;
  hierarchy: HierarchicalEntity[];
  revision: Revision;
  source: string;
  title: string;
  uri: string;
  type: string;
  version: string;
}

interface RevisionRawProps {
  hierarchy: HierarchicalEntity[];
  revision: Revision;
  source: string;
  title: string;
  uri: string;
  type: string;
  version: string;
}

// Global helpers injected by the engine

declare function formatDate(date: string, layout: string): string;
declare function humanizeNumber(n: number): string;
