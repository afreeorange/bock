package main

import (
	"database/sql"
	"fmt"
	"os"
)

const setupStatement string = `
CREATE TABLE IF NOT EXISTS articles (
  id              TEXT NOT NULL UNIQUE,
  content         TEXT,
  modified        TEXT NOT NULL,
  title           TEXT NOT NULL,
  uri             TEXT NOT NULL
);

CREATE VIRTUAL TABLE articles_fts USING fts5(
  id,
  content,
  modified,
  title,
  uri,
  content="articles"
);

CREATE TRIGGER fts_update AFTER INSERT ON articles
  BEGIN
    INSERT INTO articles_fts (
      id,
      content,
      modified,
      title,
      uri
    )
    VALUES (
      new.id,
      new.content,
      new.modified,
      new.title,
      new.uri
    );
END;
`

// Set up the database and schema. Assumed that the output folder exists.
func makeDatabase(config *BockConfig) *sql.DB {
	dbPath := config.outputFolder + "/" + DATABASE_NAME

	fmt.Println("Creating database", dbPath)

	// Recreate the database from scratch. TODO: Do this intelligently.
	os.Remove(dbPath)

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		fmt.Println("ERROR: Could not open", dbPath, ":", err)
		os.Exit(EXIT_DATABASE_ERROR)
	}

	_, err = db.Exec(setupStatement)
	if err != nil {
		fmt.Printf("ERROR: Could not set up database: %q\n", err)
		os.Exit(EXIT_DATABASE_ERROR)
	}

	return db
}
