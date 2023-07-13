FROM --platform=$BUILDPLATFORM docker.io/library/golang:1.20.5-alpine as builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o /app/cmd/oras-explorer ./cmd


FROM docker.io/library/alpine:3.17.1
COPY --from=builder /app /app
WORKDIR /app/cmd
EXPOSE 3000
ENTRYPOINT ["/app/cmd/oras-explorer"]
