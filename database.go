package main

import (
	"database/sql"
	"fmt"
	"os"
)

// Only index what's searchable; uri is stored unindexed for retrieval.
// content="articles" lets highlight() and snippet() read original text.
// porter+unicode61 gives stemming and diacritic-insensitive matching.
// prefix='2 3 4' pre-builds prefix indexes so term* queries are O(1).
// No trigger: articles_fts is populated via 'rebuild' after all inserts,
// which is far faster than N individual trigger-driven inserts.
const setupStatement string = `
PRAGMA page_size = 8192;

CREATE TABLE IF NOT EXISTS articles (
  id       TEXT NOT NULL UNIQUE,
  content  TEXT,
  modified TEXT NOT NULL,
  title    TEXT NOT NULL,
  uri      TEXT NOT NULL
);

CREATE VIRTUAL TABLE articles_fts USING fts5(
  title,
  content,
  uri UNINDEXED,
  content="articles",
  tokenize='porter unicode61 remove_diacritics 2',
  prefix='2 3 4'
);
`

// Set up the database and schema. Assumed that the output folder exists.
func makeDatabase(config *BockConfig) *sql.DB {
	dbPath := config.outputFolder + "/" + DATABASE_NAME

	fmt.Println("Creating database", dbPath)

	os.Remove(dbPath)

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		fmt.Println("ERROR: Could not open", dbPath, ":", err)
		os.Exit(EXIT_DATABASE_ERROR)
	}

	// Single connection so pragmas apply to all operations.
	db.SetMaxOpenConns(1)

	// File is rebuilt from scratch each time; skip durability for speed.
	for _, pragma := range []string{
		"PRAGMA journal_mode = OFF",
		"PRAGMA synchronous = OFF",
		"PRAGMA temp_store = MEMORY",
		"PRAGMA cache_size = -65536", // 64 MiB
	} {
		if _, err = db.Exec(pragma); err != nil {
			fmt.Printf("ERROR: %s: %q\n", pragma, err)
			os.Exit(EXIT_DATABASE_ERROR)
		}
	}

	if _, err = db.Exec(setupStatement); err != nil {
		fmt.Printf("ERROR: Could not set up database: %q\n", err)
		os.Exit(EXIT_DATABASE_ERROR)
	}

	return db
}

// Populate FTS from content table, merge shadow tables, compact. Call after all inserts.
func finalizeDatabase(db *sql.DB) {
	db.Exec("INSERT INTO articles_fts(articles_fts) VALUES('rebuild')")
	db.Exec("INSERT INTO articles_fts(articles_fts) VALUES('optimize')")
	db.Exec("VACUUM")
}
