import React, { useState, useEffect } from "react";
import "./Channel.css";


//チャンネルごとに叩くデータベースを変える
//チャンネル名を一番上に書く
function Channel() {

  type User = {
    id: string;
    name: string;
    comment: string;
  };

  const [name, setName] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);


  const fetchUsers = async () => {
    try {
      const res = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/users");
      if (!res.ok) {
        throw Error(`Failed to fetch users: ${res.status}`);
      }

      const users = await res.json();
      setUsers(users);
      console.log(users);
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();


    try {
      const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/user", {
        method: "POST",
        body: JSON.stringify({
            name: name,
            comment: comment,
        }),
      });
      if (!result.ok) {
        throw Error(`Failed to create user: ${result.status}`);
      }
      setName("");
      setComment("");
      fetchUsers();//ここで再度データを取得している
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();}
    , []);//ここでデータを取得している
 
  return (
    <div className="main-container">
      <header className = "header">ChennelName</header>
      <div>
      <ul className = "container">
      {users.map((user) => (
        <div className="item" key={user.id}>
          <p>{user.name}</p>
          <p>{user.comment}</p>
          <p>reply</p>{/*ここに返信ボタンを作る*/}
          <p>edit</p>{/*ここに編集ボタンを作る*/}
        </div>
      ))}
      </ul>
      </div>
      <div className = 'header'>
          <h1>Comment</h1>
      </div>
      <div className = 'comment-container'>
      <form style={{ display: "flex", flexDirection: "column" }} onSubmit={onSubmit}>
        <label>Name: </label>
        <input 
            type={"text"}
            value={name}
            onChange={(e) => setName(e.target.value)}
        ></input>
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