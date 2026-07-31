FROM golang:1.25-alpine

RUN apk add --no-cache gcc musl-dev bash nodejs npm

WORKDIR /project

ENV CGO_ENABLED=1
ENV CGO_LDFLAGS="-static"

CMD ["/project/.scripts/build.sh"]
