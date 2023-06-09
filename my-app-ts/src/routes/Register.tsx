import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { fireAuth } from "../firebase";
/* 「Link」をimport↓ */
import { Navigate, Link } from "react-router-dom";
import { Avatar } from '@mantine/core';

const Register = () => {
  const [registerEmail, setRegisterEmail] = useState<string>("");
  const [registerPassword, setRegisterPassword] = useState<string>("");

  const handleSubmit = async (e :React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await createUserWithEmailAndPassword(
        fireAuth,
        registerEmail,
        registerPassword
      );
    } catch(error) {
      alert("正しく入力してください");
    }

    try {
        const result = await fetch("https://uttc-hackathon-tiu8.vercel.app/edit", {
            method: "POST",
            body: JSON.stringify({
            userid: fireAuth.currentUser?.uid,
            name: "no name",
            icon: "https://renote.net/files/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMGdhSUE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--7f5ee05bb7008f18830a3c495181c81c9b1eeada/1636062031.jpg",
            }),
        });
        if (!result.ok) {
            throw Error(`Failed to create user: ${result.status}`);
        }
    }
    catch (err) {
        console.error(err);
    }
  };


  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthStateChanged(fireAuth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: "#3c99cd", backgroundSize: "cover", height: "100vh", width: "100vw" }}>
      {user ? (
        <Navigate to={`/`} />
      ) : (
        <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Avatar radius="lg" size="lg" src="https://firebasestorage.googleapis.com/v0/b/term3-keito-mitome.appspot.com/o/ShareU-logos.jpeg?alt=media&token=cd6f6fd3-fe80-401f-939f-fcf28c3a58ba&_gl=1*ay5u3m*_ga*MTI1Nzc5ODgwMy4xNjg1NjQ1MDI3*_ga_CW55HF8NVT*MTY4NjI5MzMyNS4xMy4xLjE2ODYyOTMzNjQuMC4wLjA." alt="Logo" style={{ width: '300px', height: '300px' }}/>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' , marginLeft:"100px"}}>
          <h1 style={{ color: "white" }}>新規登録</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label style={{ color: "white" }}>メールアドレス</label>
              <input
                name="email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ color: "white" }}>パスワード</label>
              <input
                name="password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
            </div>
            <button style={{  background: "linear-gradient(135deg, #8a2be2, #ff8c00)"}}>登録する</button>
            {/* ↓リンクを追加 */}
            <p style={{ color: "white" }}>ログインは<Link to={`/login/`} style={{ color: "white" }}>こちら</Link></p>
          </form>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Register;