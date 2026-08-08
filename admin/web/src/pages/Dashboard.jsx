import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import { ShopOutlined, PictureOutlined, TeamOutlined, RiseOutlined } from '@ant-design/icons';
import { api } from '../api';

const cityColors = { 霍尔果斯: 'blue', 喀什: 'gold' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.stats().then(setStats).catch(() => {}); }, []);

  const cityData = (stats?.cities || []).map((c) => ({ key: c.city, city: c.city, count: c.c }));

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>仪表盘</h2>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="商户总数" value={stats?.merchants ?? '-'} prefix={<ShopOutlined style={{ color: '#2E6BE6' }} />} suffix={stats ? `（上架 ${stats.merchantsOn}）` : ''} /></Card></Col>
        <Col span={6}><Card><Statistic title="广告位" value={stats?.ads ?? '-'} prefix={<PictureOutlined style={{ color: '#F5B301' }} />} suffix={stats ? `（启用 ${stats.adsOn}）` : ''} /></Card></Col>
        <Col span={6}><Card><Statistic title="注册用户" value={stats?.users ?? '-'} prefix={<TeamOutlined style={{ color: '#22C55E' }} />} /></Card></Col>
        <Col span={6}><Card><Statistic title="重点企业" value={stats?.merchantsOn ?? '-'} prefix={<RiseOutlined style={{ color: '#EF4444' }} />} /></Card></Col>
      </Row>

      <Card title="城市分布" style={{ marginTop: 16 }}>
        <Table
          dataSource={cityData}
          pagination={false}
          columns={[
            { title: '城市', dataIndex: 'city', render: (v) => <Tag color={cityColors[v] || 'default'}>{v}</Tag> },
            { title: '商户数', dataIndex: 'count' },
          ]}
          size="middle"
        />
      </Card>
    </div>
  );
}
