import React ,{ FC, useState, useEffect }from "react";
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import Login from "./routes/Login";
import Editprof from "./routes/Editprof";
import Channel from "./routes/Channel";
import { fireAuth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut ,AuthError, UserCredential, onAuthStateChanged } from "firebase/auth";

const Sidebar = () => {
  const [loginUser, setLoginUser] = useState(fireAuth.currentUser);
  
  // ログイン状態を監視して、stateをリアルタイムで更新する
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, user => {
      setLoginUser(user);
    });
  
    return unsubscribe; // Unsubscribe on component unmount
  }, []);

  //channeldbからデータを取得する
  type Channel = {
    id: string;
    name: string;
  };
  
  
  const [channels, setChannels] = useState<Channel[]>([]);


  const fetchUsers = async () => {
    try {
      const res = await fetch("https://uttc-hackathon2-dbofxfl7wq-uc.a.run.app/allchannels");
      if (!res.ok) {
        throw Error(`Failed to fetch users: ${res.status}`);
      }

      const channels = await res.json();
      setChannels(channels);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();}
    , []);//ここでデータを取得している

  return (
    <nav style={{ width: '300px', height: '800px', padding: '16px', backgroundColor: '#FFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CCC' }}>
        <h1 style={{ fontSize: '50px' }}>Slack</h1>
        <span style={{ fontWeight: '700' }}>v4.3.2</span>
        <ul>
        <li>
          <Link to="/">Log in</Link>
        </li>
        </ul>
      </div>
      <div style={{ flexGrow: 1, overflowY: 'scroll', paddingTop: '32px', paddingBottom: '32px' }}>
        {channels.map((channel) => (
            <div className="item" key={channel.id}>
            <ul>
            <li>
            {/*<Link to={`${channel.id}`}>*/}
            <Link to="/channel1">
              <h2 style={{ display: 'flex', alignItems: 'center' }}>
                {channel.name}
              </h2>
            </Link>
            </li>
            </ul>
            </div>

        ))}
      </div>
      <ul>
      <li>
      <Link to="/edit-profile">
        <div style={{ borderTop: '1px solid #CCC' }}>
          <img
            src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=255&q=80"
            alt="Keito"
            style={{ width: '50px', height: '50px', borderRadius: '25px' }}
          />
          <p>{loginUser?.displayName}</p> {/* ログインユーザー名 */}
          <p>{loginUser?.email}</p> {/* ログインメール */}
        </div>
      </Link>
      </li>
      </ul>
    </nav>
  );
}


function Main() {
  return (
    <BrowserRouter> 
      <div className="Main" style={{display: 'flex'}}>
        <Sidebar />
          <div style={{width: '100%'}}>
          <Routes >
            <Route path="/" element={<Login />}/>{/*Login画面*/}
            <Route path="/edit-profile" element={<Editprof />}/>{/*プロフィール編集画面*/}
            <Route path="/channel1" element={<Channel />}/>{/*チャンネル画面*/}
          </Routes>
          </div>
      </div>
    </BrowserRouter>
  );
}

export default Main;

