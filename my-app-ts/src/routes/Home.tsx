import { signInWithPopup, GoogleAuthProvider, signOut, AuthError, UserCredential, onAuthStateChanged  } from "firebase/auth";
import { fireAuth } from "../firebase";
import React, { FC, useState } from 'react';

export const LoginUser: FC = () => {
    const [loginUser, setLoginUser] = useState(fireAuth.currentUser);
    
    // ログイン状態を監視して、stateをリアルタイムで更新する
    onAuthStateChanged(fireAuth, user => {
        setLoginUser(user);
    });
    
    return (
        <div>
        <h1>ログインユーザー: {loginUser?.displayName}</h1>
        <h1>ログインユーザー: {loginUser?.email}</h1>
        <h1>ログインユーザー: {loginUser?.uid}</h1>
        </div>
    );
};

const App = () => {
  // stateとしてログイン状態を管理する。ログインしていないときはnullになる。
  const [loginUser, setLoginUser] = useState(fireAuth.currentUser);
  
  // ログイン状態を監視して、stateをリアルタイムで更新する
  onAuthStateChanged(fireAuth, user => {
    setLoginUser(user);
  });
  
  return (
    <>
      <LoginForm />
      {/* ログインしていないと見られないコンテンツは、loginUserがnullの場合表示しない */}
      {loginUser ? <LoginUser /> : null}
    </>
  );
};

export const LoginForm: FC = () => {
  /**
   * googleでログインする
   */
  const signInWithGoogle = (): void => {
    // Google認証プロバイダを利用する
    const provider = new GoogleAuthProvider();

    // ログイン用のポップアップを表示
    signInWithPopup(fireAuth, provider)
      .then((res: UserCredential) => {
        const user = res.user;
        alert("ログインユーザー: " + user.displayName);
      })
      .catch((err: AuthError) => {
        const errorMessage = err.message;
        alert(errorMessage);
      });
  };

  /**
   * ログアウトする
   */
  const signOutWithGoogle = (): void => {
    signOut(fireAuth).then(() => {
      alert("ログアウトしました");
    }).catch((err: AuthError) => {
      alert(err.message);
    });
  };

  return (
    <div>
      <button onClick={signInWithGoogle}>
        Googleでログイン
      </button>
      <button onClick={signOutWithGoogle}>
        ログアウト
      </button>
    </div>
  );
};

function Home(){
    return (
        <div>
        <h1>Home</h1>
        <App />
        </div>
    );
}

export default Home;
