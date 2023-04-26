// What's a decent project without its kitchen junk-drawer? 🤷‍♂️🤗

package main

import (
	"bytes"
	"encoding/json"
	"path/filepath"
	"strings"
	"time"

	uuid "github.com/satori/go.uuid"
)

// TODO: Finish this.
// func runConcurrently(wg *sync.WaitGroup, function func) {}

// The JSON marshaller in Golang's STDLIB cannot be configured to disable HTML
// escaping. That's what this function does.
func jsonMarshal(t interface{}) ([]byte, error) {
	buffer := &bytes.Buffer{}

	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")

	err := encoder.Encode(t)
	return buffer.Bytes(), err
}

func makeURI(path string, articleRoot string) string {
	uri := strings.ReplaceAll(strings.Replace(path, articleRoot, "", -1), " ", "_")
	return strings.TrimSuffix(uri, filepath.Ext(uri))
}

func makeRelativePath(path string, articleRoot string) string {
	return strings.TrimPrefix(strings.Replace(path, articleRoot, "", -1), "/")
}

func makeId(path string) string {
	return uuid.NewV5(uuid.NamespaceURL, path).String()
}

func removeExtensionFrom(path string) string {
	return strings.TrimSuffix(path, filepath.Ext(path))
}

func uniqueStringsInList(list []string) []string {
	var uniqueList []string
	tempMap := make(map[string]bool)

	for _, e := range list {
		if _, ok := tempMap[e]; !ok {
			tempMap[e] = true
			uniqueList = append(uniqueList, e)
		}
	}

	return uniqueList
}

// Ascertain that we don't have ANY dotfolders or dotfiles in a given path
// whatsoever. So for example, this will not return a valid path:
//
//	/article/root/Tech Notes/Linux/.hidden/My Article.md
func hasDotEntities(relativePath string) bool {
	fragments := strings.Split(relativePath, "/")

	if len(fragments) > 1 {
		for _, f := range strings.Split(relativePath, "/") {
			if strings.HasPrefix(f, ".") {
				return true
			}
		}
	} else {
		// Note that `path.Dir` will return "." instead of an empty "" if you have
		// an article at the basedir.
		if strings.HasPrefix(relativePath, ".") && relativePath != "." {
			return true
		}
	}

	return false
}

// Round the given duration. If it takes milliseconds to generate this wiki
// (e.g. when revision-generation is turned off), the `Round()` function will
// show "0s". Be a little smart about this.
func roundDuration(duration time.Duration) time.Duration {
	roundingFactor := time.Millisecond

	if duration.Milliseconds() >= 1000 {
		roundingFactor = time.Second
	}

	return duration.Round(roundingFactor)
}

func makeID(path string) string {
	return uuid.NewV5(uuid.NamespaceURL, path).String()
}

// Return the array index of entity with the given name if exists in another
// entity's list of children. If it doesn't exist, return -1. Helper function
// for `makeEntityTree`.
func findChildWithName(children *[]Entity, name string) int {
	for index, c := range *children {
		if c.Name == name {
			return index
		}
	}

	return -1
}
