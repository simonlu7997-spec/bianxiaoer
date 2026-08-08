import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Modal, Form, Input, message } from 'antd';
import {
  DashboardOutlined, ShopOutlined, PictureOutlined, AppstoreOutlined, TeamOutlined, LogoutOutlined, SettingOutlined, KeyOutlined,
} from '@ant-design/icons';
import { getToken, getAccount, clearAuth, api } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Merchants from './pages/Merchants';
import Ads from './pages/Ads';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Settings from './pages/Settings';

const { Sider, Header, Content } = Layout;

function Shell() {
  const navigate = useNavigate();
  const account = getAccount();
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm] = Form.useForm();

  const changePassword = async () => {
    const v = await pwdForm.validateFields();
    if (v.newPassword !== v.confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }
    try {
      await api.changePassword(v.oldPassword, v.newPassword);
      message.success('密码修改成功，请重新登录');
      setPwdOpen(false);
      pwdForm.resetFields();
      clearAuth();
      navigate('/login');
    } catch (e) {
      message.error(e.message);
    }
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/merchants', icon: <ShopOutlined />, label: '商户管理' },
    { key: '/ads', icon: <PictureOutlined />, label: '广告管理' },
    { key: '/categories', icon: <AppstoreOutlined />, label: '分类管理' },
    { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
    { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
  ];

  const userMenu = {
    items: [
      { key: 'password', icon: <KeyOutlined />, label: '修改密码' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        clearAuth();
        navigate('/login');
      } else if (key === 'password') {
        setPwdOpen(true);
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17 }}>
          🍜 边小二后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.hash.replace('#', '') || '/dashboard']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <Dropdown menu={userMenu}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#2E6BE6' }}>{account?.[0]?.toUpperCase()}</Avatar>
              <span>{account}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 20 }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/merchants" element={<Merchants />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>

      <Modal
        title="修改密码"
        open={pwdOpen}
        onCancel={() => setPwdOpen(false)}
        onOk={changePassword}
        okText="确认修改"
        destroyOnClose
      >
        <Form form={pwdForm} layout="vertical">
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password placeholder="当前密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6, message: '至少 6 位' }]}>
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认新密码" rules={[{ required: true, message: '请再次输入新密码' }]}>
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default function App() {
  // 订阅路由变化：登录/退出后重新计算鉴权状态
  useLocation();
  const authed = !!getToken();

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/*" element={authed ? <Shell /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
