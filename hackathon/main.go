package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	ulid "github.com/oklog/ulid/v2"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type UserResForHTTPGet struct {
	Id      string `json:"id"`
	Name    string `json:"name"`
	Comment string `json:"comment"`
}

type UserPost struct {
	Name    string `json:"name"`
	Comment string `json:"comment"`
}

type CommentId struct {
	Id string `json:"id"`
}

type ChannelGet struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

type CommentGet struct {
	Id        string `json:"id"`
	ChannelId string `json:"channelid"`
	UserId    string `json:"userid"`
	UserName  string `json:"username"`
	Comment   string `json:"comment"`
	Good      int    `json:"good"`
}

type CommentPost struct {
	ChannelId string `json:"channelid"`
	UserId    string `json:"userid"`
	UserName  string `json:"username"`
	Comment   string `json:"comment"`
}

type GoodGet struct {
	Good int `json:"good"`
}

type GoodPut struct {
	CommentId string `json:"commentid"`
	Good      int    `json:"good"`
}

// ① GoプログラムからMySQLへ接続
var db *sql.DB

func init() {
	// DB接続のための準備
	mysqlUser := os.Getenv("MYSQL_USER")
	mysqlPassword := os.Getenv("MYSQL_PWD")
	mysqlHost := os.Getenv("MYSQL_HOST")
	mysqlDatabase := os.Getenv("MYSQL_DATABASE")

	connStr := fmt.Sprintf("%s:%s@%s/%s", mysqlUser, mysqlPassword, mysqlHost, mysqlDatabase)
	_db, err := sql.Open("mysql", connStr)
	if err != nil {
		log.Fatalf("fail: sql.Open, %v\n", err)
	}
	// ①-3
	if err := _db.Ping(); err != nil {
		log.Fatalf("fail: _db.Ping, %v\n", err)
	}
	db = _db
}

// ② /userでリクエストされたらnameパラメーターと一致する名前を持つレコードをJSON形式で返す
func handler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		// ②-1

		name := r.URL.Query().Get("name") // To be filled
		if name == "" {
			log.Println("fail: name err")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// ②-2
		rows, err := db.Query("SELECT id, name, comment FROM comment WHERE name = ?", name)
		if err != nil {
			log.Printf("fail: db.Query, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// ②-3
		users := make([]UserResForHTTPGet, 0)
		for rows.Next() {
			var u UserResForHTTPGet
			if err := rows.Scan(&u.Id, &u.Name, &u.Comment); err != nil {
				log.Printf("fail: rows.Scan, %v\n", err)

				if err := rows.Close(); err != nil { // 500を返して終了するが、その前にrowsのClose処理が必要
					log.Printf("fail: rows.Close(), %v\n", err)
				}
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			users = append(users, u)
		}

		// ②-4
		bytes, err := json.Marshal(users)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)

	case http.MethodPost:
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		entropy := rand.New(rand.NewSource(time.Now().UnixNano()))
		ms := ulid.Timestamp(time.Now())
		Id, err := ulid.New(ms, entropy)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: ulid, %v\n", err)
			return
		}

		var body UserPost

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", err)
			return
		}

		if body.Name == "" {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Name, %v\n", err)
			return
		}
		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		query := "INSERT INTO comment(id, name, comment) VALUE(?, ?, ?)"
		_, er := tx.Exec(query, Id.String(), body.Name, body.Comment)
		if er != nil {
			tx.Rollback()
			if err := tx.Rollback(); err != nil {
				log.Printf("fail: tx.Rollback, %v\n", err)
			}
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Exec, %v\n", er)
			return
		}

		if err := tx.Commit(); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Commit, %v\n", err)
			return
		}

		//成功したら
		w.WriteHeader(http.StatusOK)
		p := CommentId{Id: Id.String()}
		s, err := json.Marshal(p)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(s)

		//log.Println("{id : " + Id.String() + "}")

	default:
		log.Printf("fail: HTTP Method is %s\n", r.Method)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

}

func handler2(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// ②-2
		rows, err := db.Query("SELECT id, name, comment FROM comment ")
		if err != nil {
			log.Printf("fail: db.Query, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// ②-3
		users := make([]UserResForHTTPGet, 0)
		for rows.Next() {
			var u UserResForHTTPGet
			if err := rows.Scan(&u.Id, &u.Name, &u.Comment); err != nil {
				log.Printf("fail: rows.Scan, %v\n", err)

				if err := rows.Close(); err != nil { // 500を返して終了するが、その前にrowsのClose処理が必要
					log.Printf("fail: rows.Close(), %v\n", err)
				}
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			users = append(users, u)
		}

		// ②-4
		bytes, err := json.Marshal(users)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)
	default:
		log.Printf("fail: HTTP Method is %s\n", r.Method)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}

func handler3(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// ②-2
		rows, err := db.Query("SELECT id, name FROM channeldb")
		if err != nil {
			log.Printf("fail: db.Query, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// ②-3
		channels := make([]ChannelGet, 0)
		for rows.Next() {
			var u ChannelGet
			if err := rows.Scan(&u.Id, &u.Name); err != nil {
				log.Printf("fail: rows.Scan, %v\n", err)

				if err := rows.Close(); err != nil { // 500を返して終了するが、その前にrowsのClose処理が必要
					log.Printf("fail: rows.Close(), %v\n", err)
				}
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			channels = append(channels, u)
		}

		// ②-4
		bytes, err := json.Marshal(channels)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)

	default:
		log.Printf("fail: HTTP Method is %s\n", r.Method)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}
func handler4(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		channelid := r.URL.Query().Get("channelid") // To be filled
		if channelid == "" {
			log.Println("fail: name err")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// ②-2
		rows, err := db.Query("SELECT id, channelid, userid, username, comment, good FROM commentdb WHERE channelid = ?", channelid)
		if err != nil {
			log.Printf("fail: db.Query, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// ②-3
		comments := make([]CommentGet, 0)
		for rows.Next() {
			var u CommentGet
			if err := rows.Scan(&u.Id, &u.ChannelId, &u.UserId, &u.UserName, &u.Comment, &u.Good); err != nil {
				log.Printf("fail: rows.Scan, %v\n", err)

				if err := rows.Close(); err != nil { // 500を返して終了するが、その前にrowsのClose処理が必要
					log.Printf("fail: rows.Close(), %v\n", err)
				}
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			comments = append(comments, u)
		}

		// ②-4
		bytes, err := json.Marshal(comments)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)

	case http.MethodPost:
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		entropy := rand.New(rand.NewSource(time.Now().UnixNano()))
		ms := ulid.Timestamp(time.Now())
		Id, err := ulid.New(ms, entropy)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: ulid, %v\n", err)
			return
		}

		var body CommentPost

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", err)
			return
		}

		if body.Comment == "" {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Comment, %v\n", err)
			return
		}
		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		query := "INSERT INTO commentdb(id, channelid, userid, username, comment, good ) VALUE(?, ?, ?, ?, ?, ?)"
		_, er := tx.Exec(query, Id.String(), body.ChannelId, body.UserId, body.UserName, body.Comment, 0)
		if er != nil {
			tx.Rollback()
			if err := tx.Rollback(); err != nil {
				log.Printf("fail: tx.Rollback, %v\n", err)
			}
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Exec, %v\n", er)
			return
		}

		if err := tx.Commit(); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Commit, %v\n", err)
			return
		}

		//成功したら
		w.WriteHeader(http.StatusOK)
		p := CommentId{Id: Id.String()}
		s, err := json.Marshal(p)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(s)

		//log.Println("{id : " + Id.String() + "}")
	default:
		log.Printf("fail: HTTP Method is %s\n", r.Method)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}
func handler5(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		channelid := r.URL.Query().Get("channelid") // To be filled
		if channelid == "" {
			log.Println("fail: channel err")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		commentid := r.URL.Query().Get("commentid") // To be filled
		if channelid == "" {
			log.Println("fail: commentid err")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// ②-2
		rows, err := db.Query("SELECT good FROM commentdb WHERE channelid = ? AND id = ?", channelid, commentid)
		if err != nil {
			log.Printf("fail: db.Query, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// ②-3
		goods := make([]GoodGet, 0)
		for rows.Next() {
			var u GoodGet
			if err := rows.Scan(&u.Good); err != nil {
				log.Printf("fail: rows.Scan, %v\n", err)

				if err := rows.Close(); err != nil { // 500を返して終了するが、その前にrowsのClose処理が必要
					log.Printf("fail: rows.Close(), %v\n", err)
				}
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			goods = append(goods, u)
		}

		// ②-4
		bytes, err := json.Marshal(goods)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)

	case http.MethodPost:
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		var body GoodPut

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", e)
			return
		}

		if body.CommentId == "" {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Comment is empty")
			return
		}
		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		query := "UPDATE commentdb SET good = ? WHERE id = ?"
		_, er := tx.Exec(query, body.Good, body.CommentId)
		if er != nil {
			tx.Rollback()
			if err := tx.Rollback(); err != nil {
				log.Printf("fail: tx.Rollback, %v\n", err)
			}
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Exec, %v\n", er)
			return
		}

		if err := tx.Commit(); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Commit, %v\n", err)
			return
		}

		//成功したら
		w.WriteHeader(http.StatusOK)
		p := CommentId{Id: body.CommentId}
		s, err := json.Marshal(p)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(s)

		//log.Println("{id : " + Id.String() + "}")
	default:
		log.Printf("fail: HTTP Method is %s\n", r.Method)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}

func main() {
	// ② /userでリクエストされたらnameパラメーターと一致する名前を持つレコードをJSON形式で返す
	http.HandleFunc("/user", handler)
	http.HandleFunc("/users", handler2)
	http.HandleFunc("/allchannels", handler3)
	http.HandleFunc("/channel", handler4)
	http.HandleFunc("/good", handler5)

	// ③ Ctrl+CでHTTPサーバー停止時にDBをクローズする
	closeDBWithSysCall()

	// 8000番ポートでリクエストを待ち受ける
	log.Println("Listening...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

// ③ Ctrl+CでHTTPサーバー停止時にDBをクローズする
func closeDBWithSysCall() {
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		s := <-sig
		log.Printf("received syscall, %v", s)

		if err := db.Close(); err != nil {
			log.Fatal(err)
		}
		log.Printf("success: db.Close()")
		os.Exit(0)
	}()
}
