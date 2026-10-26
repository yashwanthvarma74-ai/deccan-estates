# Build from the repo root: docker build -f infra/docker/verification.Dockerfile -t deccan-verification .
FROM golang:1.27 AS build
WORKDIR /src
COPY services/verification/go.mod services/verification/go.sum ./
RUN go mod download
COPY services/verification ./
RUN CGO_ENABLED=0 go build -o /verification ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /verification /verification
EXPOSE 4200
ENTRYPOINT ["/verification"]
