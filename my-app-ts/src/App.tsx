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
            src="data:image/jpeg;base64,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"
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

