FROM cimg/go:1.18

# TODO: Can you just fetch/cache `go get .` so that dependencies not re-fetched
# at each build? You cannot `RUN pushd /project && go get . && popd` for
# obvious reasons...

CMD \
  pushd /project \
  && /project/.scripts/build.sh \
  && popd
