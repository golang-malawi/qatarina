FROM golang:1.22-alpine as go-builder
RUN apk add --no-cache git
WORKDIR /go/qatarina
COPY . .
ENV CGO_ENABLED=0
RUN go generate -x -v
RUN go build -o /bin/qatarina
RUN chmod +x /bin/qatarina

FROM alpine
COPY --from=go-builder /bin/qatarina /bin/qatarina
VOLUME     ["/opt/", "/data/" ]
ENTRYPOINT [ "/bin/qatarina" ]
CMD        [ "server", "--config", "/opt/qatarina.yaml" ]
