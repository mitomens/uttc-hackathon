import React, { useState, useEffect, FC  } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { fireAuth } from "../firebase";
/* 「Link」をimport↓ */
import { Navigate, Link } from "react-router-dom";
import { Avatar } from '@mantine/core';




const Login = () => {
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");

  const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(
        fireAuth,
        loginEmail,
        loginPassword
      );
    } catch(error) {
      alert("メールアドレスまたはパスワードが間違っています");
    }
  };

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthStateChanged(fireAuth, (currentUser) => {
      setUser(currentUser);
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background:"#4a8d96", backgroundSize: "cover", height: "100vh", width: "100vw" }}>
    {user ? (
      <Navigate to={`/`} />
    ) : (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
          <Avatar radius="lg" size="lg" src="https://firebasestorage.googleapis.com/v0/b/term3-keito-mitome.appspot.com/o/ShareU-logos.jpeg?alt=media&token=cd6f6fd3-fe80-401f-939f-fcf28c3a58ba&_gl=1*ay5u3m*_ga*MTI1Nzc5ODgwMy4xNjg1NjQ1MDI3*_ga_CW55HF8NVT*MTY4NjI5MzMyNS4xMy4xLjE2ODYyOTMzNjQuMC4wLjA." alt="Logo" style={{ width: '300px', height: '300px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft:"100px"}}>
          <h1 style={{ color: "white" }}>ログイン</h1>
          <form onSubmit={handleSubmit}>
          <label style={{ color: "white" }}>メールアドレス</label>
            <div style={{width:"300px"}}>
              <input
                name="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <label style={{ color: "white" }}>パスワード</label>
            <div style={{width:"300px"}}>
              <input
                name="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button style={{ background: "linear-gradient(135deg, #8a2be2, #ff8c00)", width:"300px"}}>ログイン</button>
            <p style={{ color: "white" }}>新規登録は<Link to={`/Register`} style={{ color: "white" }}>こちら</Link></p>
          </form>
        </div>
      </div>
    </div>
    )}
</div>
  );
}

export default Login;
