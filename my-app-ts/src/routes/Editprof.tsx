import React, { useState, useEffect} from 'react';
import Modal from 'react-modal';
import { fireAuth , storage} from "../firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {Avatar} from '@mantine/core';
import { onAuthStateChanged } from "firebase/auth";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCamera } from '@fortawesome/free-solid-svg-icons';

import { UserContext } from "../App";

type User = {
  id: string;
  name: string;
  icon: string;
}


function Editprof() {

  const userContext = React.useContext(UserContext);

  if(!userContext) {
    throw new Error("UserContext is not set");
  }

  const { username, icon, setUsername, setIcon } = userContext;

    // ※デフォルトで表示する画像を初期値で指定(この例ではpublicフォルダのdefault-profile.pngを指定)
  const [profileImage, setProfileImage] = useState('default-profile.png');
  const [file, setFile] = useState<FileList | null>(null);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
  
      // React.ChangeEvent<HTMLInputElement>よりファイルを取得
      const fileObject = e.target.files[0];
      setFile(e.target.files);
      // オブジェクトURLを生成し、useState()を更新
      setProfileImage(window.URL.createObjectURL(fileObject));
      setImageUrl(window.URL.createObjectURL(fileObject));
   };

  type UserData = {
    id: string;
    name: string;
    icon: string;
  };

  const [loginUser, setLoginUser] = useState(fireAuth.currentUser);
  
  // ログイン状態を監視して、stateをリアルタイムで更新する
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, user => {
      setLoginUser(user);
    });
    
    return unsubscribe; // Unsubscribe on component unmount
  }, []);
  
  const [userData, setUserData] = useState<UserData[]>([]);
  const [name, setName] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditIconOpen, setIsEditIconOpen] = useState(false);

  const fetchUserDatas = async () => {
    try {
      const res = await fetch(`https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/edit?userid=${loginUser?.uid}`);
      if (!res.ok) {
        throw Error(`Failed to fetch users: ${res.status}`);
      }

      const userdata = await res.json();
      setUserData(userdata);
      console.log(userdata);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNameChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
      try {
          const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/edit", {
          method: "PUT",
           body: JSON.stringify({
              userid: loginUser?.uid,
              name: name,
           }),
          });
          if (!result.ok) {
          throw Error(`Failed to create user: ${result.status}`);
          }
          setUsername(name);
          setName("");
          setIsEditNameOpen(false);
          //fetchUserDatas();//ここで再度データを取得している
          console.log(result);
      } catch (err) {
          console.error(err);
      }
  };

  const handleIconChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    //const imgs = document.querySelector('input[type="file"]') as HTMLInputElement;
    //const files = imgs?.files;
    
    if (!file) {
      console.error("Files not found");
      return;
    }
    
    const uploads = Array.from(file).map((file: File) => {
      const storageRef = ref(storage, 'form-uploaded/' + file.name);
      return uploadBytesResumable(storageRef, file);
    });
  
    try {
      // アップロードを待つ
      await Promise.all(uploads);
  
      alert('アップロード完了');

      console.log(file[0].name)
      console.log(loginUser?.uid)
  
      // 最初の画像のURLを取得する
      const imagePath = 'form-uploaded/' + file[0].name;
      const imageRef = ref(storage, imagePath);
      const url = await getDownloadURL(imageRef);
      
      // ユーザー情報を更新する
      const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/edit", {
        method: "PATCH",
        body: JSON.stringify({
          userid: loginUser?.uid,
          icon: url,
        }),
      });
  
      if (!result.ok) {
        throw new Error(`Failed to update user: ${result.status}`);
      }

      // 成功したらステートをクリアする
      setIcon(imageUrl);
      setImageUrl("");
      setIsEditIconOpen(false);
  
  
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  };
  

  

  useEffect(() => {
    const fetchAndSetUserData = async () => {
      await fetchUserDatas();
      if(userData[0]) {
        setIcon(userData[0].icon);
        setUsername(userData[0].name);
      }
    };
  
    fetchAndSetUserData();
  }, [userData]);

  return (
    <div>
    <header style={{ fontSize: '24px', background:"#d4dcde", width:"100%", textAlign:"center",height: "20%", font:"bold"}}>プロフィール</header>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="user" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop:"50px"}}>
        <h2 style={{ fontSize: '30px' }}>名前</h2>
        <p style={{ fontSize: '40px' }}>{username}</p>
        <button onClick={() => { setName(username); setIsEditNameOpen(true) }}>
          <FontAwesomeIcon icon={faPencilAlt} />名前を編集
        </button>
        <h2 style={{ fontSize: '20px', marginTop: '40px', marginBottom:'20px'}}>アイコン</h2>
        <Avatar radius="xl" size="lg" src={icon} style={{ width: '200px', height: '200px',border:"1px solid black"}} />
        <button onClick={() => { setIsEditIconOpen(true) }} style={{ marginTop:"20px"}}>
          <FontAwesomeIcon icon={faCamera} />画像を編集
        </button>
      </div>
      <Modal
        isOpen={isEditNameOpen}
        onRequestClose={() => setIsEditNameOpen(false)}
        contentLabel="Edit Name"
        className="modal-channel"
      >
        <h2>名前変更</h2>
        <form onSubmit={handleNameChange}>
          <label>
            Name:
            <input type="text" value={name ?? ""} onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="submit">保存</button>
        </form>
        <button onClick={() => setIsEditNameOpen(false)}>Cancel</button>
      </Modal>
      <Modal
        isOpen={isEditIconOpen}
        onRequestClose={() => setIsEditIconOpen(false)}
        contentLabel="Edit Icon"
      >
        <h2>写真アップロード</h2>
        <form onSubmit={handleIconChange}>
          <div className="flex justify-center items-center mt-8">
            <img src={profileImage} className="h-64 w-64 rounded-full" alt="Profile" />
            <input type="file" accept="image/*" onChange={onFileInputChange} className="pl-4" />
          </div>
          <button type="submit">保存</button>
        </form>
        <button onClick={() => {
          setIsEditIconOpen(false);
          setProfileImage('default-profile.png');
        }}>Cancel</button>
      </Modal>
    </div>
    </div>
  )
}  

export default Editprof;