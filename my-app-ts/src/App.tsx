import React from "react";
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import Home from "./routes/Home";
import Editprof from "./routes/Editprof";
import Channel from "./routes/Channel";

const mockdata = [
  { label: 'Channel1', icon: '📊' },
  { label: 'Channel2', icon: '🗞️'},
  { label: 'Channel3', icon: '📅'},
  { label: 'Channel4', icon: '📈' },
  { label: 'Channel5', icon: '📄' },
  { label: 'Channel6', icon: '⚙️' },
  { label: 'Channel7', icon: '🔒'},
];

const Sidebar = () => {
  return (
    <nav style={{ width: '300px', height: '800px', padding: '16px', backgroundColor: '#FFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CCC' }}>
        <h1 style={{ fontSize: '40px' }}>Slack</h1>
        <span style={{ fontWeight: '700' }}>v3.1.2</span>
        <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        </ul>
      </div>
      <div style={{ flexGrow: 1, overflowY: 'scroll', paddingTop: '32px', paddingBottom: '32px' }}>
        {mockdata.map((item) => (
          <ul>
          <li>
          <Link to="/channel">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>{item.icon}</span>
                {item.label}
              </h2>
            </div>
          </Link>
          </li>
          </ul>
        ))}
      </div>
      <ul>
      <li>
      <Link to="/edit-profile">
        <div style={{ borderTop: '1px solid #CCC' }}>
          <img
            src="https://www.google.com/imgres?imgurl=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F1490531496394104835%2FwVwvKArD_400x400.jpg&tbnid=q2kBPAlQpjUEMM&vet=12ahUKEwi16Kq3mqL_AhVU-mEKHVpMDQMQMygAegUIARC5AQ..i&imgrefurl=https%3A%2F%2Ftwitter.com%2Finiesta_japan&docid=iNRVXd5P2znZ_M&w=400&h=400&q=イニエスタの画像%20https&client=safari&ved=2ahUKEwi16Kq3mqL_AhVU-mEKHVpMDQMQMygAegUIARC5AQ"
            alt="Keito"
            style={{ width: '50px', height: '50px', borderRadius: '25px' }}
          />
          <p>Name</p>
          <p>gmail</p>
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
            <Route path="/" element={<Home />}/>{/*main画面*/}
            <Route path="/edit-profile" element={<Editprof />}/>{/*プロフィール編集画面*/}
            {/*<Route path="/:channelId">*/}
            <Route path="/channel" element={<Channel />}/>{/*チャンネル画面*/}
          </Routes>
          </div>
      </div>
    </BrowserRouter>
  );
}

export default Main;

