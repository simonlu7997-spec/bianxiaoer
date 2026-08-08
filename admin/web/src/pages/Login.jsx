import React, { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api, setAuth } from '../api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { token, account } = await api.login(values.account, values.password);
      setAuth(token, account);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2E6BE6 0%, #1F4FB8 60%, #163C8C 100%)' }}>
      <Card style={{ width: 380, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', borderRadius: 14 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 40 }}>🍜</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 2px', color: '#1A1A2E' }}>边小二 · 后台管理系统</h1>
          <p style={{ color: '#8A94A6', fontSize: 13, margin: 0 }}>Bian Xiao Er Admin · 商户 / 广告 / 用户管理</p>
        </div>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined style={{ color: '#8A94A6' }} />} placeholder="管理员账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#8A94A6' }} />} placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 6 }}>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44, fontWeight: 700 }}>
              登 录
            </Button>
          </Form.Item>
          <p style={{ textAlign: 'center', color: '#B0B8C8', fontSize: 12, margin: 0 }}>
            管理员账号登录 · 首次使用默认 admin / admin123
          </p>
        </Form>
      </Card>
    </div>
  );
}
