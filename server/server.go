package server

import (
	_ "embed"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"golang.org/x/net/websocket"
)

//go:embed reload.js
var reloadScript string

// Config for the dev server.
type Config struct {
	OutputDir string
	WatchDirs []string
	Port      int
	OnChange  func(changedPaths []string) // receives accumulated paths from debounce window
}

type wsHub struct {
	mu      sync.Mutex
	clients map[*websocket.Conn]bool
}

func (h *wsHub) add(conn *websocket.Conn) {
	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()
}

func (h *wsHub) remove(conn *websocket.Conn) {
	h.mu.Lock()
	delete(h.clients, conn)
	h.mu.Unlock()
}

func (h *wsHub) broadcast(msg string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for conn := range h.clients {
		if _, err := io.WriteString(conn, msg); err != nil {
			conn.Close()
			delete(h.clients, conn)
		}
	}
}

// htmlHandler serves HTML files with the live-reload script injected.
type htmlHandler struct {
	outputDir string
	reloadTag string
	fallback  http.Handler
}

func (h *htmlHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	var filePath string
	if path == "/" || strings.HasSuffix(path, "/") {
		filePath = filepath.Join(h.outputDir, path, "index.html")
	} else if strings.HasSuffix(path, ".html") {
		filePath = filepath.Join(h.outputDir, path)
	} else {
		candidate := filepath.Join(h.outputDir, path, "index.html")
		if _, err := os.Stat(candidate); err == nil {
			filePath = candidate
		}
	}

	if filePath != "" {
		data, err := os.ReadFile(filePath)
		if err == nil {
			content := string(data)
			if idx := strings.LastIndex(content, "</body>"); idx != -1 {
				content = content[:idx] + h.reloadTag + content[idx:]
			} else {
				content += h.reloadTag
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write([]byte(content))
			return
		}
	}

	h.fallback.ServeHTTP(w, r)
}

func watchRecursive(watcher *fsnotify.Watcher, root string) error {
	return filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			if strings.HasPrefix(filepath.Base(path), ".") && path != root {
				return filepath.SkipDir
			}
			return watcher.Add(path)
		}
		return nil
	})
}

// Serve starts the HTTP server with live-reload support. Blocks until interrupted.
func Serve(cfg Config) error {
	hub := &wsHub{clients: make(map[*websocket.Conn]bool)}

	wsHandler := websocket.Handler(func(conn *websocket.Conn) {
		hub.add(conn)
		defer hub.remove(conn)
		buf := make([]byte, 64)
		for {
			if _, err := conn.Read(buf); err != nil {
				break
			}
		}
	})

	fileServer := http.FileServer(http.Dir(cfg.OutputDir))
	reloadTag := fmt.Sprintf("<script>%s</script>", reloadScript)

	handler := &htmlHandler{
		outputDir: cfg.OutputDir,
		reloadTag: reloadTag,
		fallback:  fileServer,
	}

	mux := http.NewServeMux()
	mux.Handle("/_bock/ws", wsHandler)
	mux.Handle("/", handler)

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("creating watcher: %w", err)
	}
	defer watcher.Close()

	for _, dir := range cfg.WatchDirs {
		if err := watchRecursive(watcher, dir); err != nil {
			return fmt.Errorf("watching %s: %w", dir, err)
		}
	}

	// Accumulate changed paths during debounce window, then dispatch
	go func() {
		var mu sync.Mutex
		var pending []string
		var debounceTimer *time.Timer

		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				if event.Op&(fsnotify.Write|fsnotify.Create) == 0 {
					continue
				}
				base := filepath.Base(event.Name)
				if strings.HasPrefix(base, ".") {
					continue
				}

				mu.Lock()
				// Deduplicate
				found := false
				for _, p := range pending {
					if p == event.Name {
						found = true
						break
					}
				}
				if !found {
					pending = append(pending, event.Name)
				}

				if debounceTimer != nil {
					debounceTimer.Stop()
				}
				debounceTimer = time.AfterFunc(200*time.Millisecond, func() {
					mu.Lock()
					paths := pending
					pending = nil
					mu.Unlock()

					cfg.OnChange(paths)
					hub.broadcast("reload")
				})
				mu.Unlock()

			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				fmt.Println("Watcher error:", err)
			}
		}
	}()

	addr := fmt.Sprintf(":%d", cfg.Port)
	fmt.Printf("Serving on http://localhost:%d\n", cfg.Port)
	fmt.Println("Watching for changes. Press Ctrl+C to stop.")

	return http.ListenAndServe(addr, mux)
}
