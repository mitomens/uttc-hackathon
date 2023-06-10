import React, { useState, useEffect} from "react";
import { useSearchParams } from "react-router-dom";
import "./Channel.css";
import { fireAuth , storage} from "../firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { onAuthStateChanged } from "firebase/auth";
import Modal from 'react-modal';
import { Avatar } from "@mantine/core";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faThumbsUp, faEdit, faReply, faTrash, faArrowLeft, faTimes, faFileImage, faTimesCircle} from '@fortawesome/free-solid-svg-icons';


//チャンネルごとに叩くデータベースを変える
//チャンネル名を一番上に書く
function Channel() {

  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channelId");
  const channelName = searchParams.get("channelName");

  type Comment = {
    id: string;
    channelid: string;
    userid: string;
    username: string;
    comment: string;
    good: number;
    icon: string;
    time: string;
    photo: string | null;
  };

  type User = {
    id: string;
    name: string;
    icon: string;
  }

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
  const [isEditingReply, setIsEditingReply] = useState<boolean>(false);
  const [editComment, setEditComment] = useState<string>("");
  const [replyId, setReplyId] = useState<string>("");
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyidIcon, setReplyidIcon] = useState<string>("");
  const [replyidComment, setReplyidComment] = useState<string>("");
  const [replyidPhoto, setReplyidPhoto] = useState<string | null>("");
  const [replyidUser, setReplyidUser] = useState<string>("");
  const [replyidtime, setReplyidtime] = useState<string>("");
  const [replyComment, setReplyComment] = useState<string>("");
  const [replys, setReplys] = useState<Comment[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [file, setFile] = useState<FileList | null>(null);

  const fetchComments = async () => {
    try {
      const res = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel?channelid=${channelId}`);
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
      const res = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/reply?channelid=${channelId}&&commentid=${id}`);
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
  
    //const imgs = document.querySelector('input[type="file"]') as HTMLInputElement;
    //const files = imgs?.file;
  
    let url = null;
  
    if (!file || file.length === 0) {
      console.log('ファイルが選択されていません');
    } else {
      const uploads = Array.from(file).map((file: File) => {
        const storageRef = ref(storage, 'form-photos/' + file.name);
        return uploadBytesResumable(storageRef, file);
      });
  
      try {
        // アップロードを待つ
        await Promise.all(uploads);
  
        // 最初の画像のURLを取得する
        const imagePath = 'form-photos/' + file[0].name;
        const imageRef = ref(storage, imagePath);
        url = await getDownloadURL(imageRef);
      } catch (err) {
        console.error(err);
      }
    }
  
    try {
      const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel", {
        method: "POST",
        body: JSON.stringify({
          channelid: channelId,
          userid: loginUser?.uid,
          username: user[0].name,
          comment: comment,
          icon: user[0].icon,
          photo: url,
        }),
      });
  
      if (!result.ok) {
        throw Error(`Failed to create user: ${result.status}`);
      }
  
      setComment("");
      setProfileImage('default-profile.png');
      setIsImageSelected(false);
      fetchComments();
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
            fetchComments();//ここで再度データを取得している
            //console.log(result);
        } catch (err) {
            console.error(err);
        }
  };

  const fetchGoodReply = async (id: string) => {
    try {
        const res = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/good?replyid=${id}`);
        if (!res.ok) {
            throw Error(`Failed to fetch users: ${res.status}`);
        }
        const good = await res.json();
        const good2:number = good[0].good + 1;
        console.log(good);
        const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/good", {
            method: "PUT",
            body: JSON.stringify({
                replyid: id,
                good: good2,
            }),
        });
        if (!result.ok) {
            throw Error(`Failed to create user: ${result.status}`);
        }
        fetchReply(replyId);//ここで再度データを取得している
        //console.log(result);
    } catch (err) {
        console.error(err);
    }
};

const fetchDelete = async (id: string) => {
  try {
      const result = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel?commentid=${id}`, {
          method: "DELETE",
      });
      if (!result.ok) {
          throw Error(`Failed to create user: ${result.status}`);
      }
      fetchComments();//ここで再度データを取得している
      console.log(result);
  } catch (err) {
      console.error(err);
  }
};

const fetchDeleteReply = async (id: string) => {
  try {
      const result = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel?replyid=${id}`, {
          method: "DELETE",
      });
      if (!result.ok) {
          throw Error(`Failed to create user: ${result.status}`);
      }
      fetchReply(replyId);//ここで再度データを取得している
      console.log(result);
  } catch (err) {
      console.error(err);
  }
};


  const [user, setUser] = useState<User[]>([]);
  const fetchUserNameandIcon = async () => {
    try {
      const res = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/edit?userid=${loginUser?.uid}`);
      if (!res.ok) {
        throw Error(`Failed to fetch users: ${res.status}`);
      }

      const userdata = await res.json();
      setUser(userdata);
      console.log(userdata);
    } catch (err) {
      console.error(err);
    }
  };

  //写真送信機能を作る
  const [profileImage, setProfileImage] = useState('default-profile.png');
  const [isImageSelected, setIsImageSelected] = useState(false);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
  
      // React.ChangeEvent<HTMLInputElement>よりファイルを取得
      const fileObject = e.target.files[0];
      setFile(e.target.files);
      // オブジェクトURLを生成し、useState()を更新
      setIsImageSelected(true);
      setProfileImage(window.URL.createObjectURL(fileObject));
   };


  const addModalOpenClass = (): void => {
    const mainCenterContainer = document.querySelector<HTMLElement>(".main-center-container");
    mainCenterContainer?.classList.add("modal-open");
    const commentContainer = document.querySelector<HTMLElement>(".comment-container");
    commentContainer?.classList.add("modal-open");
  };

  const removeModalOpenClass = (): void => {
    const mainCenterContainer = document.querySelector<HTMLElement>(".main-center-container");
    mainCenterContainer?.classList.remove("modal-open");
    const commentContainer = document.querySelector<HTMLElement>(".comment-container");
    commentContainer?.classList.remove("modal-open");
  };

    useEffect(() => {
      fetchUserNameandIcon();
      fetchComments();
    }, [channelId]);

return (
  <div className="main-container">
    <div className="main-center-container">
      <div className="main-comment-container">
        <header className="header">{channelName}</header>
        <div>
        <div className="container">
      {comments.map((comment) => (
  <div className="center-item" key={comment.id}>
    <Avatar className="avatar" radius="xl" size="lg" color="blue" src={comment.icon} />
    <p className="name">{comment.username}</p>
    <p className="time">{comment.time}</p>
    <p className="comment">{comment.comment}</p>
    {comment.photo && (
      <img className="photo" src={comment.photo} />
    )}
    <div className="good">
      <p>
      <button
        onClick={() => {
          fetchGood(comment.id);
        }}
        style={{marginRight:"5px"}}
      >
        <FontAwesomeIcon icon={faThumbsUp} />
      </button>
      {comment.good}</p>
    </div>
    <div className="buttons">
      {comment.userid === loginUser?.uid && (
        <div>
        <button
          onClick={() => {
            setEditId(comment.id);
            setEditComment(comment.comment);
            setIsEditing(true);
            addModalOpenClass();
          }}
        >
          <FontAwesomeIcon icon={faEdit} />編集
        </button>
        <div>
        <button
          onClick={() => {
            setIsDeleting(true);
          }}
        >
          <FontAwesomeIcon icon={faTrash} />削除
        </button>
        </div>
        </div>
      )}
       <button
        onClick={() => {
          setReplyId(comment.id);
          setReplyidIcon(comment.icon);
          setReplyidUser(comment.username);
          setReplyidComment(comment.comment);
          setReplyidtime(comment.time);
          setReplyidPhoto(comment.photo);
          setIsReplying(true);
          fetchReply(comment.id);
          addModalOpenClass();
        }}
      >
        <FontAwesomeIcon icon={faReply} />返信
      </button>
    </div>
  </div>
))}
</div>
</div>
</div>



      <div className="comment-container">
        <form style={{ display: "flex", flexDirection: "row" }} onSubmit={onSubmit}>
          <label>Comment: </label>
          <input
            type={"text"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: "80%", marginRight: "10px" }}
          ></input>
          <div className="flex" style={{marginRight:"10px"}}>
            {isImageSelected && (
              <div>
                <img src={profileImage} className="h-32 w-32 rounded-full" />
                <button
                  onClick={() => {
                    setProfileImage('default-profile.png');
                    setIsImageSelected(false);
                  }}
                  className="cancel-btn"
                >
                  <FontAwesomeIcon icon={faTimesCircle} />
                </button>
              </div>
            )}
            {!isImageSelected && (
              <div>
                <input type="file" id="file-input" accept="image/*" onChange={onFileInputChange} className="hidden" />
                <label htmlFor="file-input" className="photomark">
                  <FontAwesomeIcon icon={faFileImage} />
                </label>
              </div>
            )}
          </div>
          <button type={"submit"}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </div>
    </div>
    <Modal
          isOpen={isDeleting}
          onRequestClose={() => setIsDeleting(false)}
          contentLabel="Delete Comment"
          className="modal-delete"
        >
          <h2>
            本当に削除しますか？
          </h2>
          <div className="delete-buttons">
            <button
              onClick={() => {
                fetchDelete(editId);
                setIsDeleting(false);
              }
              }
            >
              削除
            </button>
            <button
              onClick={() => {
                setIsDeleting(false);
              }
              }
            >
              キャンセル
            </button>
          </div>
        </Modal>
    <div className="main-right-container">
      <div className="right-container">
        {isEditing && (
          <Modal
            isOpen={isEditing}
            onRequestClose={() => {
              setIsEditing(false);
              removeModalOpenClass();
            }}
            contentLabel="Edit Comment"
            className="modal"
            ariaHideApp={false}
          >
            <h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  removeModalOpenClass();
                }}
                style={{
                  marginRight: "20px",
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              Edit Comment
            </h2>
            <form
              style={{ display: "flex", flexDirection: "column" }}
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const result = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel?commentid=${editId}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      comment: editComment + "(編集済み)",
                    }),
                  });
                  if (!result.ok) {
                    throw Error(`Failed to create user: ${result.status}`);
                  }
                  setIsEditing(false);
                  fetchComments(); //ここで再度データを取得している
                  console.log(result);
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              <label>Comment: </label>
              <input
                type={"text"}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              ></input>
              <button type={"submit"}>update</button>
            </form>
          </Modal>
        )}
        {isReplying && (
          <Modal
            isOpen={isReplying}
            onRequestClose={() => {
              setIsReplying(false);
              removeModalOpenClass();
            }}
            contentLabel="Reply Comment"
            className="modal"
            ariaHideApp={false}
          >
            <h2>
              <button
                onClick={() => {
                  setIsReplying(false);
                  removeModalOpenClass();
                }}
                style={{
                  marginRight: "20px",
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />{" "}
              </button>
              Reply Comment
            </h2>
            <div className="right-top-item">
              <div  style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems:'center'}}>
                  <p style={{marginRight:"10px"}}><Avatar radius="xl" size="lg" src={replyidIcon}/></p>
                  <p style={{fontWeight: "bold"}}>{replyidUser}</p>
                </div>
              <p>{replyidtime}</p>
              </div>
              <p>{replyidComment}</p>
              { replyidPhoto && (
                <h3><img src={replyidPhoto} style={{width:"20%"}}/></h3>
              )}
            </div>
            <p>
              {replys.map((reply) => (
                <div className="right-item" key={reply.id}>
                  <div  style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems:'center'}}>
                  <p style={{marginRight:"10px"}}><Avatar radius="xl" size="lg" src={reply.icon}/></p>
                  <p style={{fontWeight: "bold"}}>{reply.username}</p>
                </div>
              <p>{reply.time}</p>
              </div>
                  <p className="comment">{reply.comment}</p>
                  {reply.photo && (
                    <img className="photo" src={reply.photo} />
                  )}
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="good">
  <p style={{ marginBottom: 0 }}>
    <button onClick={() => { fetchGoodReply(reply.id); }} style={{ marginRight: "5px" }}>
      <FontAwesomeIcon icon={faThumbsUp} />
    </button>
    {reply.good}
  </p>
</div>
<div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }} className="buttons">
  {reply.userid === loginUser?.uid && (
    <div>
      <button onClick={() => { setEditId(reply.id); setEditComment(reply.comment); setIsEditingReply(true); }}>
        <FontAwesomeIcon icon={faEdit} />編集
      </button>
      <button onClick={() => { fetchDeleteReply(reply.id); }}>
        <FontAwesomeIcon icon={faTrash} />削除
      </button>
    </div>
  )}
</div>


                </div>
              ))}
            </p>
            <form
              style={{ display: "flex", flexDirection: "row", marginBottom: "20px"}}
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/reply", {
                    method: "POST",
                    body: JSON.stringify({
                      channelid: channelId,
                      commentid: replyId,
                      userid: loginUser?.uid,
                      username: user[0].name,
                      usericon: user[0].icon,
                      comment: replyComment,
                    }),
                  });
                  if (!result.ok) {
                    throw Error(`Failed to create user: ${result.status}`);
                  }
                  setReplyComment("");
                  setIsReplying(false);
                  fetchComments(); //ここで再度データを取得している
                  console.log(result);
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              <label>Comment: </label>
              <textarea
                rows={1}
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                style={{
                  width: "80%",
                  marginRight: "10px",
                  overflow: "hidden",
                  resize: "none",
                }}
              />
              <button type={"submit"}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
          </Modal>
        )}
      </div>
    </div>
    <div className="reply-edit-container">
      {isEditingReply && (
        <Modal
          isOpen={isEditingReply}
          onRequestClose={() => setIsEditingReply(false)}
          contentLabel="Edit Comment Reply"
          className="modal-reply"
        >
          <h2>
            Edit Comment
            <button
              onClick={() => setIsEditingReply(false)}
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                zIndex: 9999,
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </h2>
          <form
            style={{ display: "flex", flexDirection: "column" }}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const result = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/channel?replyid=${editId}`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    comment: editComment + "(編集済み)",
                  }),
                });
                if (!result.ok) {
                  throw Error(`Failed to create user: ${result.status}`);
                }
                setIsEditingReply(false);
                fetchReply(replyId); //ここで再度データを取得している
                console.log(result);
              } catch (err) {
                console.error(err);
              }
            }}
          >
            <label>Comment: </label>
            <input
              type={"text"}
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
            ></input>
            <button type={"submit"}>update</button>
          </form>
        </Modal>
      )}
    </div>
  </div>
);
}


export default Channel;