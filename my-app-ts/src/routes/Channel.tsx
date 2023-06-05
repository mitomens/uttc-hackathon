
import React, { useState, useEffect } from "react";
import "./Channel.css";
import { fireAuth } from "../firebase";

import { onAuthStateChanged } from "firebase/auth";
import Modal from 'react-modal';




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

  const [editId, setEditId] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editComment, setEditComment] = useState<string>("");
  const [replyId, setReplyId] = useState<string>("");
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyidComment, setReplyidComment] = useState<string>("");
  const [replyidUser, setReplyidUser] = useState<string>("");
  const [replyComment, setReplyComment] = useState<string>("");
  const [replys, setReplys] = useState<Comment[]>([]);

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

  const fetchReply = async (id:string) => {
    try {
      const res = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/reply?channelid=00000000000000000000000001&&commentid=${id}`);
      if (!res.ok) {
        throw Error(`Failed to fetch users: ${res.status}`);
      }

      const replys = await res.json();
      setReplys(replys);
      console.log(replys);
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
//ここからgoodの処理
  const fetchGood = async (id: string) => {  
        try {
            const res = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/good?commentid=${id}`);
            if (!res.ok) {
                throw Error(`Failed to fetch users: ${res.status}`);
            }
            const good = await res.json();
            const good2:number = good[0].good + 1;
            console.log(good);
            const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/good", {
                method: "PATCH",
                body: JSON.stringify({
                    commentid: id,
                    good: good2,
                }),
            });
            if (!result.ok) {
                throw Error(`Failed to create user: ${result.status}`);
            }
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
          {isEditing && comment.userid === loginUser?.uid ? (
            <Modal 
            isOpen={isEditing}
            onRequestClose={() => setIsEditing(false)}
            contentLabel="Edit Comment"
            >
            <h2>Edit Comment</h2>
            <form
                style={{ display: "flex", flexDirection: "column" }}
                onSubmit={async (e) => {
                e.preventDefault();
                try {
                    const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel", {
                    method: "PATCH",
                    body: JSON.stringify({
                        id: editId,
                        comment: editComment+"(編集済み)",
                    }),
                    });
                    if (!result.ok) {
                    throw Error(`Failed to create user: ${result.status}`);
                    }
                    setIsEditing(false);
                    fetchUsers();//ここで再度データを取得している
                    console.log(result);
                } catch (err) {
                    console.error(err);
                }
                }}>
                <label>Comment: </label>
                <input
                type={"text"}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                ></input>
                <button type={"submit"}>update</button>
                </form>
                <button onClick={() => setIsEditing(false)}>cancel</button>
            </Modal>
            ) : (
            <p>comment:{comment.comment}</p>
            )}
            {comment.userid ===  loginUser?.uid && (
              <button onClick={() => {
                setEditId(comment.id);
                setEditComment(comment.comment);
                setIsEditing(true);
            }}>編集</button>
            )}
          <button
            onClick={() => {
                fetchGood(comment.id);
            }}
            >
            good
          </button>
          <p>
          {comment.good}
          </p>
          {isReplying && (
            <Modal 
            isOpen={isReplying}
            onRequestClose={() => setIsReplying(false)}
            contentLabel="Reply Comment"
            >
            <h2>Reply Comment</h2>
            <h3>返信先:{replyidUser}</h3>
            <h3>返信内容:{replyidComment}</h3>
            <p>
            {replys.map((reply) => (
              <div className="item" key={reply.id}>
                <p>user:{reply.username}</p>
                <p>comment:{reply.comment}</p>
                <p>good:{reply.good}</p>
              </div>
            ))}
            </p>
            <form
                style={{ display: "flex", flexDirection: "column" }}
                onSubmit={async (e) => {
                e.preventDefault();
                try {
                    const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/reply", {
                    method: "POST",
                    body: JSON.stringify({
                        channelid: "00000000000000000000000001",
                        commentid: replyId,
                        userid: loginUser?.uid,
                        username: loginUser?.displayName,
                        comment: replyComment,
                    }),
                    });
                    if (!result.ok) {
                    throw Error(`Failed to create user: ${result.status}`);
                    }
                    setReplyComment("");
                    setIsReplying(false);
                    fetchUsers();//ここで再度データを取得している
                    console.log(result);
                } catch (err) {
                    console.error(err);
                }
                }}>
                <label>Comment: </label>
                <input
                type={"text"}
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                ></input>
                <button type={"submit"}>reply</button>
                </form>
                <button onClick={() => setIsReplying(false)}>cancel</button>
            </Modal>
            ) }
            <button onClick={() => {
              setReplyId(comment.id);
              setReplyidUser(comment.username);
              setReplyidComment(comment.comment);
              setIsReplying(true);
              fetchReply(comment.id);
            }}>返信</button>
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