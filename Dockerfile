FROM golang:1.19-alpine
WORKDIR /app
COPY . .

RUN go mod download
RUN go build -o /app/myapp ./cmd
EXPOSE 3000
CMD ["/app/myapp"]
