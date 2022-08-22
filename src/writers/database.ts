import { existsSync, readFileSync, unlinkSync } from "fs";

import sqlite3 from "sqlite3";

import { Bock } from "../types";

const database = async (bock: Bock) => {
  const databasePath = `${bock.outputFolder}/entities.db`;

  try {
    if (existsSync(databasePath)) {
      unlinkSync(databasePath);
    }
  } catch (error) {
    console.error(
      `Could not remove existing Database (${databasePath}): ${error}`,
    );

    return;
  }

  const db = new sqlite3.Database(databasePath);

  db.serialize(() => {
    db.run(`
     CREATE TABLE IF NOT EXISTS articles (
        id              TEXT NOT NULL UNIQUE,
        content         TEXT,
        created         TEXT NOT NULL,
        modified        TEXT NOT NULL,
        name            TEXT NOT NULL,
        uri             TEXT NOT NULL,
        path            TEXT NOT NULL
     );`);

    db.run(`
     CREATE VIRTUAL TABLE articles_fts USING fts5(
        id,
        content,
        created,
        modified,
        name,
        uri,
        path,
        content="articles"
     );`);
  });

  db.run(`
    CREATE TRIGGER fts_update AFTER INSERT ON articles
    BEGIN
      INSERT INTO articles_fts (
        id,
        content,
        created,
        modified,
        name,
        uri,
        path
      )
      VALUES (
        new.id,
        new.content,
        new.created,
        new.modified,
        new.name,
        new.uri,
        new.path
      );
    END;`);

  const insertStatement = db.prepare(`
    INSERT INTO articles (
      id,
      content,
      created,
      modified,
      name,
      uri,
      path
    )
    VALUES (
      $id,
      $content,
      $created,
      $modified,
      $name,
      $uri,
      $path
    )
  `);

  bock.listOfEntities.map((e) => {
    if (e.type === "article") {
      const content = readFileSync(`${bock.articleRoot}/${e.path}`).toString();

      insertStatement.run({
        $id: e.id,
        $content: content,
        $created: e.created,
        $modified: e.modified,
        $name: e.name,
        $uri: e.uri,
        $path: e.path,
      });
    }
  });

  insertStatement.finalize();
  db.close();
};

export default database;
