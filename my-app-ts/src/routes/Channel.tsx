import React, { useState, useEffect } from "react";
import "./Channel.css";
import { fireAuth } from "../firebase";

import { onAuthStateChanged } from "firebase/auth";



//チャンネルごとに叩くデータベースを変える
//チャンネル名を一番上に書く
function Channel() {

  type Comment = {
    id: string;
    channelid: string;
    userid: string;
    username: string;
    comment: string;
    good: number;
  };


  const [loginUser, setLoginUser] = useState(fireAuth.currentUser);
  
  // ログイン状態を監視して、stateをリアルタイムで更新する
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, user => {
      setLoginUser(user);
    });
    
    return unsubscribe; // Unsubscribe on component unmount
  }, []);

  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [goods, setGoods] = useState<number>(0);


  const fetchUsers = async () => {
    try {
      const res = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel?channelid=00000000000000000000000001");
      if (!res.ok) {
        throw Error(`Failed to fetch users: ${res.status}`);
      }

      const comments = await res.json();
      setComments(comments);
      console.log(comments);
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();


    try {
      const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel", {
        method: "POST",
        body: JSON.stringify({
            channelid: "00000000000000000000000001",
            userid: loginUser?.uid,
            username: loginUser?.displayName,
            comment: comment,
        }),
      });
      if (!result.ok) {
        throw Error(`Failed to create user: ${result.status}`);
      }

      setComment("");
      fetchUsers();//ここで再度データを取得している
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGood = async (id: string) => {  
        try {
            const res = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/good?channelid=00000000000000000000000001&commentid=${id}`);
            if (!res.ok) {
                throw Error(`Failed to fetch users: ${res.status}`);
            }
            const good = await res.json();
            setGoods(good);
            setGoods(goods + 1);
            console.log(good);
            {/*const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/good", {
                method: "PUT",
                body: JSON.stringify({
                    channelid: "00000000000000000000000001",
                    commentid: id,
                    good: goods,
                }),
            });
            if (!result.ok) {
                throw Error(`Failed to create user: ${result.status}`);
            }*/}
            fetchUsers();//ここで再度データを取得している
            //console.log(result);
        } catch (err) {
            console.error(err);
        }
  };


  useEffect(() => {
    fetchUsers();}
    , []);//ここでデータを取得している
 
  return (
    <div className="main-container">
      <header className = "header">Channel1</header>
      <div>
      <ul className = "container">
      {comments.map((comment) => (
        <div className="item" key={comment.id}>
          <p>user:{comment.username}</p>
          <p>comment:{comment.comment}</p>
          <button
            onClick={() => {
                fetchGood(comment.id);
            }}
            >
            good
            </button>
            <p>
            {goods}</p>
            <p>
            {comment.good}</p>
          <p>reply</p>{/*ここに返信ボタンを作る*/}
          <p>edit</p>{/*ここに編集ボタンを作る*/}
          <p>delete</p>{/*ここに削除ボタンを作る*/}
        </div>
      ))}
      </ul>
      </div>
      <div className = 'header'>
          <h1>Comment</h1>
      </div>
      <div className = 'comment-container'>
      <form style={{ display: "flex", flexDirection: "column" }} onSubmit={onSubmit}>
        <label>Comment: </label>
        <input
            type={"text"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
        ></input>
        <button type={"submit"}>send</button>
      </form>
      </div>
    </div>
  );
}

export default Channel;