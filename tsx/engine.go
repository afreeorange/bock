package tsx

import (
	_ "embed"
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"
	"time"

	"github.com/dop251/goja"
	"github.com/dustin/go-humanize"
	"github.com/evanw/esbuild/pkg/api"
)

//go:embed preact.js
var jsxRuntime string

// Engine compiles and caches TSX templates, renders them via goja.
type Engine struct {
	compiled   map[string]string // page name → compiled JS
	jsxProgram *goja.Program     // pre-compiled JSX runtime
}

// NewFromFS compiles all .tsx under components/ and pages/ from the given FS.
func NewFromFS(themeFS fs.FS) (*Engine, error) {
	// Pre-compile JSX runtime The first arg  is just a filename label for error
	// messages/stack traces — it's stale from the old name. Let me fix that.
	jsxProg, err := goja.Compile("preact.js", jsxRuntime, false)
	if err != nil {
		return nil, fmt.Errorf("compiling JSX runtime: %w", err)
	}

	// Read all tsx source files into memory for the esbuild resolver
	sources := make(map[string]string)
	err = fs.WalkDir(themeFS, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || filepath.Ext(path) != ".tsx" {
			return nil
		}
		data, readErr := fs.ReadFile(themeFS, path)
		if readErr != nil {
			return readErr
		}
		sources[path] = string(data)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("reading theme files: %w", err)
	}

	// Compile each page template
	compiled := make(map[string]string)
	for path, source := range sources {
		if !strings.HasPrefix(path, "pages/") {
			continue
		}

		name := strings.TrimSuffix(filepath.Base(path), ".tsx")
		js, compileErr := compile(source, path, sources)
		if compileErr != nil {
			return nil, fmt.Errorf("compiling %s: %w", path, compileErr)
		}
		compiled[name] = js
	}

	return &Engine{compiled: compiled, jsxProgram: jsxProg}, nil
}

// compile bundles a single page TSX file, resolving imports from sources.
func compile(entrySource string, entryPath string, sources map[string]string) (string, error) {
	// Build a resolver plugin that reads from our in-memory sources
	resolverPlugin := api.Plugin{
		Name: "theme-resolver",
		Setup: func(build api.PluginBuild) {
			build.OnResolve(api.OnResolveOptions{Filter: ".*"}, func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				if args.Kind == api.ResolveEntryPoint {
					return api.OnResolveResult{Path: args.Path, Namespace: "theme"}, nil
				}

				// Resolve relative imports
				importPath := args.Path
				if !strings.HasSuffix(importPath, ".tsx") {
					importPath += ".tsx"
				}

				// Resolve relative to the importer's directory
				dir := filepath.Dir(args.Importer)
				resolved := filepath.Join(dir, importPath)
				resolved = filepath.Clean(resolved)

				if _, ok := sources[resolved]; ok {
					return api.OnResolveResult{Path: resolved, Namespace: "theme"}, nil
				}

				return api.OnResolveResult{}, fmt.Errorf("cannot resolve %q from %q", args.Path, args.Importer)
			})

			build.OnLoad(api.OnLoadOptions{Filter: ".*", Namespace: "theme"}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				content, ok := sources[args.Path]
				if !ok {
					return api.OnLoadResult{}, fmt.Errorf("file not found: %s", args.Path)
				}
				loader := api.LoaderTSX
				return api.OnLoadResult{
					Contents: &content,
					Loader:   loader,
				}, nil
			})
		},
	}

	result := api.Build(api.BuildOptions{
		EntryPoints: []string{entryPath},
		Bundle:      true,
		Write:       false,
		JSX:         api.JSXTransform,
		JSXFactory:  "h",
		JSXFragment: "Fragment",
		Target:      api.ES2015,
		Format:      api.FormatIIFE,
		GlobalName:  "__module",
		Plugins:     []api.Plugin{resolverPlugin},
	})

	if len(result.Errors) > 0 {
		msgs := make([]string, len(result.Errors))
		for i, e := range result.Errors {
			msgs[i] = e.Text
		}
		return "", fmt.Errorf("esbuild errors: %s", strings.Join(msgs, "; "))
	}

	if len(result.OutputFiles) == 0 {
		return "", fmt.Errorf("esbuild produced no output")
	}

	// The compiled JS defines __module with a "default" export.
	// Render the page component to an HTML string via Preact.
	js := string(result.OutputFiles[0].Contents)
	wrapped := js + "\nvar __html = renderToString(h(__module.default, __props));\n"

	return wrapped, nil
}

// Render executes a page template with props, returns HTML string.
func (e *Engine) Render(pageName string, props map[string]any) (string, error) {
	js, ok := e.compiled[pageName]
	if !ok {
		available := make([]string, 0, len(e.compiled))
		for k := range e.compiled {
			available = append(available, k)
		}
		return "", fmt.Errorf("unknown page template %q (available: %s)", pageName, strings.Join(available, ", "))
	}

	vm := goja.New()

	// Inject JSX runtime
	if _, err := vm.RunProgram(e.jsxProgram); err != nil {
		return "", fmt.Errorf("injecting JSX runtime: %w", err)
	}

	// Inject helper functions
	vm.Set("formatDate", func(call goja.FunctionCall) goja.Value {
		arg := call.Argument(0)
		layout := call.Argument(1).String()

		// Props can carry a real time.Time (e.g. meta.BuildDate) or a
		// pre-formatted string. Handle the former without stringifying.
		if t, ok := arg.Export().(time.Time); ok {
			return vm.ToValue(t.Format(layout))
		}

		s := arg.String()
		t, err := parseDate(s)
		if err != nil {
			return vm.ToValue(s)
		}
		return vm.ToValue(t.Format(layout))
	})

	vm.Set("humanizeNumber", func(call goja.FunctionCall) goja.Value {
		n := call.Argument(0).ToInteger()
		return vm.ToValue(humanize.Comma(n))
	})

	// Inject props
	vm.Set("__props", props)

	// Execute the compiled page
	if _, err := vm.RunString(js); err != nil {
		return "", fmt.Errorf("executing %s: %w", pageName, err)
	}

	// Read rendered HTML
	result := vm.Get("__html")
	if result == nil || goja.IsUndefined(result) || goja.IsNull(result) {
		return "", fmt.Errorf("template %s produced no output", pageName)
	}

	html := result.String()
	if strings.HasPrefix(html, "<html") {
		html = "<!DOCTYPE html>" + html
	}
	return html, nil
}

// dateLayouts are what formatDate accepts as input. The last two are what
// time.Time.String() emits, which is how a goja-wrapped time.Time stringifies.
var dateLayouts = []string{
	time.RFC3339Nano,
	time.RFC3339,
	"2006-01-02 15:04:05.999999999 -0700 MST",
	"2006-01-02 15:04:05 -0700 MST",
}

func parseDate(s string) (time.Time, error) {
	for _, layout := range dateLayouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unrecognized date %q", s)
}

// Pages returns the list of compiled page names.
func (e *Engine) Pages() []string {
	pages := make([]string, 0, len(e.compiled))
	for k := range e.compiled {
		pages = append(pages, k)
	}
	return pages
}
