package main

import (
	"context"
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

// `startup` is called when the app starts. The context is saved
// so we can call the runtime methods
func (app *App) startup(ctx context.Context) {
	app.ctx = ctx
}

/* */

func openDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite", "data.db")
	if err != nil {
		fmt.Println("Failed to open a database ( (main).openDB ).", err)
		return db, err
	}

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS Data (Id INTEGER PRIMARY KEY, Text TEXT)")
	if err != nil {
		fmt.Println("Failed to create a table ( (main).openDB ).", err)
		return db, err
	}

	return db, nil
}

type ToDoEntry struct {
	Id   int    `json:"id"`
	Text string `json:"text"`
}

func (app *App) DBGetEntries() ([]ToDoEntry, error) {
	db, err := openDB()
	if err != nil {
		fmt.Println("Failed to open a database ( (main.App).DBGetEntries ).", err)
		return []ToDoEntry{}, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT * FROM Data")
	if err != nil {
		fmt.Println("Failed to select a rows in table ( (main.App).DBGetEntries ).", err)
		return []ToDoEntry{}, err
	}
	defer rows.Close()

	entries := []ToDoEntry{}

	fmt.Println("Reading selected rows...")
	for rows.Next() {
		entry := ToDoEntry{}

		err := rows.Scan(&entry.Id, &entry.Text)
		if err != nil {
			fmt.Println(err)
			continue
		}

		entries = append(entries, entry)
	}

	return entries, nil
}

func (app *App) DBSetEntry(id int, s string) error {
	db, err := openDB()
	if err != nil {
		fmt.Println("Failed to open a database ( (main.App).DBSetEntry ).", err)
		return err
	}
	defer db.Close()

	_, err = db.Exec("INSERT INTO Data (Id, Text) VALUES ($1, $2)", id, s)
	if err != nil {
		fmt.Println("Failed to insert data in to table ( (main.App).DBSetEntry ).", err)
		return err
	}

	return nil
}

func (app *App) DBDeleteEntry(id int) error {
	db, err := openDB()
	if err != nil {
		fmt.Println("Failed to open a database ( (main.App).DBDeleteEntry ).", err)
		return err
	}
	defer db.Close()

	_, err = db.Exec("DELETE FROM Data WHERE Id = $1", id)
	if err != nil {
		fmt.Println("Failed delete data from the table ( (main.App).DBDeleteEntry ).", err)
		return err
	}

	return nil
}
