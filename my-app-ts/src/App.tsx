import React ,{ useState, useEffect }from "react";
import { BrowserRouter, Route, Routes, Link, Navigate ,useNavigate,} from 'react-router-dom';
import Login from "./routes/Login";
import Register from "./routes/Register";
import Editprof from "./routes/Editprof";
import Channel from "./routes/Channel";
import { fireAuth } from "./firebase";
import { onAuthStateChanged, signOut} from "firebase/auth";
import { Avatar } from '@mantine/core';
import Modal from 'react-modal';
import "./App.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';


type UserData = {
  username: string ,
  setUsername: (username: string) => void
  icon: string ,
  setIcon: (icon: string ) => void
};

type  Channels = {
  id: string,
  name: string,
};

export const UserContext = React.createContext<UserData | undefined>(undefined);

const Sidebar = () => {
  const [loginUser, setLoginUser] = useState(fireAuth.currentUser);
  
  // ログイン状態を監視して、stateをリアルタイムで更新する
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, user => {
      setLoginUser(user);
    });
  
    return unsubscribe; // Unsubscribe on component unmount
  }, []);


  const navigate = useNavigate();
  const logout = async () => {
    await signOut(fireAuth);
    navigate("/Login");
  }

  
  const [channels, setChannels] = useState<Channels[]>([]);


  const fetchChannels = async () => {
    try {
      const res = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/allchannels");
      if (!res.ok) {
        throw Error(`Failed to fetch users: ${res.status}`);
      }

      const channels = await res.json();
      setChannels(channels);
      console.log(channels);
    } catch (err) {
      console.error(err);
    }
  };


  const userContext = React.useContext(UserContext);
  if(!userContext) {
    throw new Error("UserContext is not set");
  }

  const { username, icon} = userContext;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelName, setChannelName] = useState("");


  const handleAddChannel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/allchannels", {
        method: "POST",
        body: JSON.stringify({
          name: channelName,
        }),
      });
      if (!result.ok) {
        throw Error(`Failed to create user: ${result.status}`);
      }

      setChannelName("");
      fetchChannels();//ここで再度データを取得している
      setIsModalOpen(false);
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  };





  useEffect(() => {
    fetchChannels();}
    , []);//ここでデータを取得している

  return (
    <nav style={{ flex:'1',padding: '16px', backgroundColor: "#4a8d96" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',borderBottom: '1px solid #fff' }}>
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <h1 style={{ fontSize: '45px', fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center' }}>
      <img src="https://firebasestorage.googleapis.com/v0/b/term3-keito-mitome.appspot.com/o/ShareU-logos.jpeg?alt=media&token=cd6f6fd3-fe80-401f-939f-fcf28c3a58ba&_gl=1*ay5u3m*_ga*MTI1Nzc5ODgwMy4xNjg1NjQ1MDI3*_ga_CW55HF8NVT*MTY4NjI5MzMyNS4xMy4xLjE2ODYyOTMzNjQuMC4wLjA." alt="Logo" style={{ width: '50px', height: '50px', marginRight: '10px' }} />
      ShareU
    </h1>
  </div>
  <div style={{marginLeft:'auto'}}>
  <span style={{ fontWeight: '600'}}>v4.3.2</span>
  </div>
</div>

      <div style={{ flexGrow: 1, overflowY: 'scroll', paddingTop: '32px', paddingBottom: '32px' }}>
        {channels.map((channel) => (
            <div className="item-channel" key={channel.id}>
            <Link to={`/channel?channelId=${channel.id}&&channelName=${channel.name}`}>
              <h2 style={{ display: 'flex', alignItems: 'center', background:"#d4dcde"}}>
                {channel.name}
              </h2>
            </Link>
            </div>

        ))}
        <div>
      {/* チャンネル追加ボタン */}
      <button onClick={() => setIsModalOpen(true)} style={{marginLeft:"20px", background:"#d4dcde"}}>＋チャンネル追加</button>
      <div >
        <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="チャンネル追加"
        className="modal-channel"
      >
        <h2>Create a channel</h2>
        <form onSubmit={handleAddChannel}>
          <label>
            名前:
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
          </label>
          <button type="submit">作成</button>
        </form>
        <button onClick={() => setIsModalOpen(false)}>キャンセル</button>
      </Modal>
      </div>
  
    </div>
      </div>
      <Link to="/edit-profile">
        <div  style={{borderTop: '1px solid #fff' }}>
          <p>
            <span style={{ fontWeight: '700' }}><FontAwesomeIcon icon={faCog} />プロフィールを編集</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: '700' }}>
            <Avatar radius="xl" size="lg" color="blue" src={icon} alt="User" />
           </span>
          <span style={{ marginLeft: '10px' }}>{username}</span>
          </p>

        </div>
      </Link>
      {loginUser && (
    <ul>
      <button onClick={logout} className="logoutbutton"><FontAwesomeIcon icon={faSignOutAlt} />ログアウト</button>
    </ul>
  )}
    </nav>
  );
}


function Main() {
  const [username, setUsername] = useState<string>("");
  const [icon, setIcon] = useState<string >("");


  const [loginUser, setLoginUser] = useState(fireAuth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, user => {
      setLoginUser(user);
    });

    return unsubscribe; // Unsubscribe on component unmount
  }, []);


  return (
    <UserContext.Provider value={{ username, setUsername, icon, setIcon }}>
      <BrowserRouter> 
        <div style={{ display: 'flex' }}>
          {loginUser && (
            <div className="Sidebar" style={{ position: 'fixed', width: '25%', height: '100vh', overflowY: 'auto' }}>
              <Sidebar />
            </div>
          )}
          <div className="Main" style={{ width: loginUser ? '75%' : '100%', marginLeft: loginUser ? '25%' : '0' }}>
            <Routes>
              <Route path="/" element={loginUser ? <Editprof /> : <Login />} />{/*Login画面*/}
              <Route path="/register" element={<Register />} />{/*新規登録画面*/}
              <Route path="/Login" element={loginUser ? <Editprof />  : <Login />} />
              <Route path="/edit-profile" element={loginUser ? <Editprof />  : <Navigate to="/Login" />} />{/*プロフィール編集画面*/}
              <Route path="/channel" element={loginUser ? <Channel />  : <Navigate to="/Login" />} />{/*チャンネル画面*/}
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </UserContext.Provider>
  );
}
  

export default Main;


