# ベースイメージを設定
FROM golang:1.18 as build

# 作業ディレクトリを設定
WORKDIR /app

#gomodのダウンロード
COPY go.mod ./

# 依存関係のダウンロード
RUN go mod download

# ソースコードをコピー
COPY . .

# ビルドコマンドを実行
RUN go build -o myapp .

#実行可能なバイナリをエクスポート
FROM gcr.io/distroless/base-debian10
COPY --from=build /app/myapp /app/myapp

# コンテナ起動時に実行
CMD ["/app/myapp"]
