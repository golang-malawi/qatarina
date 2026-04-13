# Stage 1: Build the UI (Frontend)
FROM node:20-alpine AS ui-builder
WORKDIR /app/ui

COPY ui/package.json ui/package-lock.json* ./
RUN npm ci

COPY ui/ ./
COPY docs/ ../docs/

RUN npx vite build

# Stage 2: Build the Go Binary (Backend)
FROM golang:1.25.1-alpine AS go-builder
RUN apk add --no-cache git

WORKDIR /go/qatarina

COPY go.mod go.sum ./
RUN go mod download

COPY . .

COPY --from=ui-builder /app/ui/dist ./ui/dist

ENV CGO_ENABLED=0
RUN go build -o /bin/qatarina ./main.go

FROM alpine:3.19
WORKDIR /app

COPY --from=go-builder /bin/qatarina /bin/qatarina
COPY qatarina.example.yaml /opt/qatarina.yaml

VOLUME     ["/opt/", "/data/" ]

ENTRYPOINT [ "/bin/qatarina" ]
CMD        [ "server", "--config", "/opt/qatarina.yaml" ]
