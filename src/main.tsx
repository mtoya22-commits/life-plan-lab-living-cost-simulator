import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initIframeResize } from './lib/iframeResize';
import './styles/shared-tokens.css';
import './styles/app.css';

// 埋め込み時は is-embedded を先に付けてレイアウトのちらつきを防ぎ、高さ送信を開始する。
initIframeResize();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
