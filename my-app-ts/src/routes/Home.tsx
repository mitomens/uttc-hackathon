import { signInWithPopup, GoogleAuthProvider, signOut, AuthError, UserCredential } from "firebase/auth";
import { fireAuth } from "../firebase";
import React, { FC } from 'react';

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
        <LoginForm />
        </div>
    );
}

export default Home;
