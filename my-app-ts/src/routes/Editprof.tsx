import React, { useState } from 'react';



function Editprof(){

   
  type User = {
        name: string;
        imageUrl: string;
  };
    
  const [user, setUser] = useState<User>({
    name: '',
    imageUrl: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ここで状態を保存または更新します
    console.log(user);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={user.name}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Image URL:
          <input
            type="text"
            name="imageUrl"
            value={user.imageUrl}
            onChange={handleInputChange}
          />
        </label>
        <button type="submit">Update Profile</button>
      </form>
      <div>
        <h2>Preview:</h2>
        <h3>{user.name}</h3>
        {user.imageUrl && <img src={user.imageUrl} alt={user.name} />}
      </div>
    </div>
  );
};

export default Editprof;