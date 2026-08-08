import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Button, Popconfirm, Space, Tag, message } from 'antd';
import { api } from '../api';

export default function Users() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.users()); } catch (e) { message.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Card title="用户管理（APP 注册用户）">
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'ID', dataIndex: 'id' },
          { title: '姓名', dataIndex: 'name', render: (v) => v || <Tag>未填写</Tag> },
          { title: '手机号', dataIndex: 'phone' },
          { title: '注册时间', dataIndex: 'created_at' },
          { title: '操作', render: (_, r) => (
            <Space>
              <Popconfirm title="确认删除该用户？" onConfirm={async () => { await api.deleteUser(r.id); message.success('已删除'); load(); }}>
                <Button size="small" danger>删除</Button>
              </Popconfirm>
            </Space>
          )},
        ]}
      />
      <p style={{ color: '#8A94A6', marginTop: 12 }}>
        说明：APP 端注册/登录接口已预留（POST /api/users/register），当前用户数据由 APP 写入，此页为查看与管理。
      </p>
    </Card>
  );
}
