# Build from the repo root: docker build -f infra/docker/notifier.Dockerfile -t deccan-notifier .
FROM golang:1.27 AS build
WORKDIR /src
COPY services/notifier/go.mod services/notifier/go.sum ./
RUN go mod download
COPY services/notifier ./
RUN CGO_ENABLED=0 go build -o /notifier ./cmd/notifier

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /notifier /notifier
ENTRYPOINT ["/notifier"]
