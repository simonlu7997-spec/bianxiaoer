import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';

const theme = {
  token: {
    colorPrimary: '#2E6BE6', // 伊犁蓝
    borderRadius: 8,
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConfigProvider locale={zhCN} theme={theme}>
    <HashRouter>
      <App />
    </HashRouter>
  </ConfigProvider>
);
