.PHONY: bundle

bundle:
	npx esbuild tsx/preact-entry.js \
		--bundle --format=iife --global-name=__preact \
		--target=es2015 --platform=neutral --outfile=tsx/preact.js
	echo '// Expose as goja globals' >> tsx/preact.js
	echo 'var h=__preact.h,Fragment=__preact.Fragment,renderToString=__preact.renderToString;' >> tsx/preact.js
