# The archived upstream no longer publishes the community registry image.
# Build its last security release from the official Go module, for disposable tests only.
FROM golang:1.25-alpine AS build
RUN CGO_ENABLED=0 GOBIN=/out go install github.com/minio/minio@RELEASE.2025-10-15T17-29-55Z
FROM alpine:3.22
RUN apk add --no-cache ca-certificates && adduser -D -u 10001 fixture && mkdir /data && chown fixture /data
COPY --from=build /out/minio /usr/local/bin/minio
USER fixture
ENTRYPOINT ["minio"]
CMD ["server", "/data"]
