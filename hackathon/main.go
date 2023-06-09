
package main

import (
"database/sql"
"encoding/json"
"fmt"
_ "github.com/go-sql-driver/mysql"
ulid "github.com/oklog/ulid/v2"
"log"
"math/rand"
"net/http"
"os"
"os/signal"
"syscall"
"time"
_ "time/tzdata"
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

type ChannelPost struct {
	Name string `json:"name"`
}

type CommentGet struct {
	Id        string  `json:"id"`
	ChannelId string  `json:"channelid"`
	UserId    string  `json:"userid"`
	UserName  string  `json:"username"`
	Comment   string  `json:"comment"`
	Good      int     `json:"good"`
	Icon      string  `json:"icon"`
	Time      string  `json:"time"`
	Photo     *string `json:"photo"`
}

type CommentPost struct {
	ChannelId string  `json:"channelid"`
	UserId    string  `json:"userid"`
	UserName  string  `json:"username"`
	Comment   string  `json:"comment"`
	Icon      string  `json:"icon"`
	Photo     *string `json:"photo"`
}

type CommentPatch struct {
	Comment string `json:"comment"`
}

type GoodGet struct {
	Good int `json:"good"`
}

type GoodPut struct {
	CommentId string `json:"commentid"`
	Good      int    `json:"good"`
}
type GoodPut2 struct {
	CommentId string `json:"replyid"`
	Good      int    `json:"good"`
}
type ReplyPost struct {
	ChannelId string  `json:"channelid"`
	CommentId string  `json:"commentid"`
	UserId    string  `json:"userid"`
	UserName  string  `json:"username"`
	Comment   string  `json:"comment"`
	Icon      string  `json:"usericon"`
	Photo     *string `json:"photo"`
}

type UserDataGet struct {
	Id   string `json:"userid"`
	Name string `json:"name"`
	Icon string `json:"icon"`
}

type UserDataPost struct {
	Id   string `json:"userid"`
	Name string `json:"name"`
	Icon string `json:"icon"`
}

type UserNameChange struct {
	Id   string `json:"userid"`
	Name string `json:"name"`
}

type UserIconChange struct {
	Id   string `json:"userid"`
	Icon string `json:"icon"`
}

// ① GoプログラムからMySQLへ接続
var db *sql.DB

func init() {
	// DB接続のための準備
	mysqlUser := os.Getenv("MYSQL_USER")
	mysqlPassword := os.Getenv("MYSQL_PWD")
	mysqlHost := os.Getenv("MYSQL_HOST")
	mysqlDatabase := os.Getenv("MYSQL_DATABASE")

	//mysqlUser := "test_user"
	//mysqlPassword := "password"
	//mysqlHost := "(localhost:3306)"
	//mysqlDatabase := "test_database"

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
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
	switch r.Method {
	case http.MethodGet:

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

	case http.MethodPost:
		entropy := rand.New(rand.NewSource(time.Now().UnixNano()))
		ms := ulid.Timestamp(time.Now())
		Id, err := ulid.New(ms, entropy)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: ulid, %v\n", err)
			return
		}

		var body ChannelPost

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", err)
			return
		}

		if body.Name == "" {
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

		query := "INSERT INTO channeldb(id, name) VALUE(?, ?)"
		_, er := tx.Exec(query, Id.String(), body.Name)
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

	default:
		log.Printf("fail: HTTP Method is %s\n", r.Method)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}
func handler4(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	switch r.Method {
	case http.MethodGet:

		channelid := r.URL.Query().Get("channelid") // To be filled
		if channelid == "" {
			log.Println("fail: name err")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// ②-2
		rows, err := db.Query("SELECT id, channelid, userid, username, comment, good, icon, datetime, photo FROM commentdb WHERE channelid = ?", channelid)
		if err != nil {
			log.Printf("fail: db.Query, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// ②-3
		comments := make([]CommentGet, 0)
		for rows.Next() {
			var u CommentGet
			if err := rows.Scan(&u.Id, &u.ChannelId, &u.UserId, &u.UserName, &u.Comment, &u.Good, &u.Icon, &u.Time, &u.Photo); err != nil {
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

		if body.Comment == "" && body.Photo == nil {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Comment")
			return
		}

		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}

		t := time.Now()
		formattedTime := t.Format("01/02 15:04")

		query := "INSERT INTO commentdb(id, channelid, userid, username, comment, good, icon, datetime, photo) VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?)"
		_, er := tx.Exec(query, Id.String(), body.ChannelId, body.UserId, body.UserName, body.Comment, 0, body.Icon, formattedTime, body.Photo)
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
	case http.MethodPatch:
		commentid := r.URL.Query().Get("commentid") // To be filled
		replyid := r.URL.Query().Get("replyid")

		var body CommentPatch

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", e)
			return
		}

		if body.Comment == "" {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Comment is null")
			return
		}
		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		var er error

		if commentid != "" {
			_, er = tx.Exec("UPDATE commentdb SET comment = ? WHERE id = ?", body.Comment, commentid)
		} else {
			_, er = tx.Exec("UPDATE replydb SET comment = ? WHERE id = ?", body.Comment, replyid)
		}
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
		var p CommentId
		if commentid != "" {
			p = CommentId{Id: commentid}
		} else {
			p = CommentId{Id: replyid}
		}
		s, err := json.Marshal(p)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(s)

	case http.MethodDelete:
		commentid := r.URL.Query().Get("commentid") // To be filled
		replyid := r.URL.Query().Get("replyid")

		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		var er error

		if commentid != "" {
			_, er = tx.Exec("DELETE FROM commentdb WHERE id = ?", commentid)
		} else {
			_, er = tx.Exec("DELETE FROM replydb WHERE id = ?", replyid)
		}
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
		w.WriteHeader(http.StatusOK)
		var p CommentId
		if commentid != "" {
			p = CommentId{Id: commentid}
		} else {
			p = CommentId{Id: replyid}
		}
		s, err := json.Marshal(p)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(s)

	default:
		log.Printf("fail: HTTP Method is %s\n", r.Method)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}
func handler5(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	switch r.Method {
	case http.MethodGet:
		commentid := r.URL.Query().Get("commentid") // To be filled
		replyid := r.URL.Query().Get("replyid")

		log.Printf(commentid)
		// ②-2
		var rows *sql.Rows
		var err error

		if commentid != "" {
			rows, err = db.Query("SELECT good FROM commentdb WHERE id = ?", commentid)
		} else {
			rows, err = db.Query("SELECT good FROM replydb WHERE id = ?", replyid)
		}

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

	case http.MethodPut:

		var body GoodPut2

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", e)
			return
		}
		log.Printf(string(body.Good))

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
		query := "UPDATE replydb SET good = ? WHERE id = ?"
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

	case http.MethodPatch:

		var body GoodPut

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", e)
			return
		}
		log.Printf(string(body.Good))

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
func handler6(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	switch r.Method {
	case http.MethodGet:

		channelid := r.URL.Query().Get("channelid") // To be filled
		if channelid == "" {
			log.Println("fail: name err")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		commentid := r.URL.Query().Get("commentid") // To be filled
		if commentid == "" {
			log.Println("fail: name err")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// ②-2
		rows, err := db.Query("SELECT id, channelid, userid, username, comment, good, icon, datetime, photo FROM replydb WHERE channelid = ? AND commentid = ?", channelid, commentid)
		if err != nil {
			log.Printf("fail: db.Query, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// ②-3
		comments := make([]CommentGet, 0)
		for rows.Next() {
			var u CommentGet
			if err := rows.Scan(&u.Id, &u.ChannelId, &u.UserId, &u.UserName, &u.Comment, &u.Good, &u.Icon, &u.Time, &u.Photo); err != nil {
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
		entropy := rand.New(rand.NewSource(time.Now().UnixNano()))
		ms := ulid.Timestamp(time.Now())
		Id, err := ulid.New(ms, entropy)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: ulid, %v\n", err)
			return
		}

		var body ReplyPost

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", err)
			return
		}

		if body.Comment == "" && body.Photo == nil {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Comment")
			return
		}

		t := time.Now()
		formattedTime := t.Format("01/02 15:04")

		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		query := "INSERT INTO replydb(id, channelid, commentid, userid, username, comment, good, icon, datetime, photo) VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
		_, er := tx.Exec(query, Id.String(), body.ChannelId, body.CommentId, body.UserId, body.UserName, body.Comment, 0, body.Icon, formattedTime, body.Photo)
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

	default:
		log.Printf("fail: HTTP Method is %s\n", r.Method)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
}

func handler7(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "https://uttc-hackathon-tiu8.vercel.app")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	switch r.Method {
	case http.MethodGet:

		userid := r.URL.Query().Get("userid") // To be filled
		if userid == "" {
			log.Println("fail: id err")
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		log.Println(userid)

		// ②-2
		rows, err := db.Query("SELECT id, name, icon FROM user WHERE id = ?", userid)
		if err != nil {
			log.Printf("fail: db.Query, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		// ②-3
		username := make([]UserDataGet, 0)
		for rows.Next() {
			var u UserDataGet
			if err := rows.Scan(&u.Id, &u.Name, &u.Icon); err != nil {
				log.Printf("fail: rows.Scan, %v\n", err)

				if err := rows.Close(); err != nil { // 500を返して終了するが、その前にrowsのClose処理が必要
					log.Printf("fail: rows.Close(), %v\n", err)
				}
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			username = append(username, u)
		}

		// ②-4
		bytes, err := json.Marshal(username)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)
	case http.MethodPost:

		var body UserDataPost

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", e)
			return
		}

		if body.Id == "" {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Id is null")
			return
		}
		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		query := "INSERT INTO user(id, name, icon ) VALUE(?, ?, ?)"
		_, er := tx.Exec(query, body.Id, body.Name, body.Icon)
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
		p := CommentId{Id: body.Id}
		s, err := json.Marshal(p)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(s)

	case http.MethodPut:
		var body UserNameChange

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", e)
			return
		}

		if body.Name == "" {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Name is null")
			return
		}
		fmt.Println(body.Name)
		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		_, er := tx.Exec("UPDATE user SET name = ? WHERE id = ?", body.Name, body.Id)
		if er != nil {
			tx.Rollback()
			if err := tx.Rollback(); err != nil {
				log.Printf("fail: tx.Rollback, %v\n", err)
			}
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Exec, %v\n", er)
			return
		}

		_, er = tx.Exec("UPDATE commentdb SET username = ? WHERE userid = ?", body.Name, body.Id)
		if er != nil {
			tx.Rollback()
			if err := tx.Rollback(); err != nil {
				log.Printf("fail: tx.Rollback, %v\n", err)
			}
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Exec, %v\n", er)
			return
		}

		_, er = tx.Exec("UPDATE replydb SET username = ? WHERE userid = ?", body.Name, body.Id)
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
		p := CommentId{Id: body.Id}
		s, err := json.Marshal(p)
		if err != nil {
			log.Printf("fail: json.Marshal, %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(s)
	case http.MethodPatch:
		var body UserIconChange

		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: json.Decoder.Decode, %v\n", e)
			return
		}

		if body.Icon == "" {
			w.WriteHeader(http.StatusBadRequest)
			log.Printf("fail: Icon is null")
			return
		}
		fmt.Println(body.Id)
		tx, err := db.Begin()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Begin, %v\n", err)
			return
		}
		_, er := tx.Exec("UPDATE user SET icon = ? WHERE id = ?", body.Icon, body.Id)
		if er != nil {
			tx.Rollback()
			if err := tx.Rollback(); err != nil {
				log.Printf("fail: tx.Rollback, %v\n", err)
			}
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Exec, %v\n", er)
			return
		}

		_, er = tx.Exec("UPDATE commentdb SET icon = ? WHERE userid = ?", body.Icon, body.Id)
		if er != nil {
			tx.Rollback()
			if err := tx.Rollback(); err != nil {
				log.Printf("fail: tx.Rollback, %v\n", err)
			}
			w.WriteHeader(http.StatusInternalServerError)
			log.Printf("fail: Exec, %v\n", er)
			return
		}

		_, er = tx.Exec("UPDATE replydb SET icon = ? WHERE userid = ?", body.Icon, body.Id)
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
		p := CommentId{Id: body.Id}
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
	http.HandleFunc("/reply", handler6)
	http.HandleFunc("/edit", handler7)

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










