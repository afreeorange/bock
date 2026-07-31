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

//go:embed dom.js
var domPolyfill string

// Engine compiles and caches TSX templates, renders them via goja + NanoJSX.
type Engine struct {
	compiled    map[string]string // page name → compiled JS
	domProgram  *goja.Program     // pre-compiled DOM polyfill
	nanoProgram *goja.Program     // pre-compiled NanoJSX
}

// NewFromFS compiles all .tsx under components/ and pages/ from the given FS.
// Reads NanoJSX from static/js/nano.full.min.js in the same FS.
func NewFromFS(themeFS fs.FS) (*Engine, error) {
	// Pre-compile DOM polyfill
	domProg, err := goja.Compile("dom.js", domPolyfill, false)
	if err != nil {
		return nil, fmt.Errorf("compiling DOM polyfill: %w", err)
	}

	// Read and pre-compile NanoJSX from theme static assets
	nanoSource, err := fs.ReadFile(themeFS, "static/js/nano.full.min.js")
	if err != nil {
		return nil, fmt.Errorf("reading NanoJSX: %w", err)
	}
	nanoProg, err := goja.Compile("nano.js", string(nanoSource), false)
	if err != nil {
		return nil, fmt.Errorf("compiling NanoJSX: %w", err)
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

	return &Engine{compiled: compiled, domProgram: domProg, nanoProgram: nanoProg}, nil
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
		JSXFactory:  "nanoJSX.h",
		JSXFragment: "nanoJSX.Fragment",
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
	// Render via NanoJSX into a root element and extract innerHTML.
	js := string(result.OutputFiles[0].Contents)
	wrapped := js + "\nvar __root = document.createElement(\"div\");\nnanoJSX.render(__module.default(__props), __root);\nvar __html = __root.innerHTML;\n"

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

	// Inject DOM polyfill (must come before NanoJSX)
	if _, err := vm.RunProgram(e.domProgram); err != nil {
		return "", fmt.Errorf("injecting DOM polyfill: %w", err)
	}

	// Inject NanoJSX
	if _, err := vm.RunProgram(e.nanoProgram); err != nil {
		return "", fmt.Errorf("injecting NanoJSX: %w", err)
	}

	// Inject helper functions
	vm.Set("formatDate", func(call goja.FunctionCall) goja.Value {
		isoStr := call.Argument(0).String()
		layout := call.Argument(1).String()

		t, err := time.Parse(time.RFC3339, isoStr)
		if err != nil {
			// Try parsing as RFC3339Nano too
			t, err = time.Parse(time.RFC3339Nano, isoStr)
			if err != nil {
				return vm.ToValue(isoStr)
			}
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

	return result.String(), nil
}

// Pages returns the list of compiled page names.
func (e *Engine) Pages() []string {
	pages := make([]string, 0, len(e.compiled))
	for k := range e.compiled {
		pages = append(pages, k)
	}
	return pages
}
