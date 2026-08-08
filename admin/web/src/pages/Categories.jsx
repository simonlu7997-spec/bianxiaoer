import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, message } from 'antd';
import { api } from '../api';

const CAT_INFO = {
  food: '餐饮', shopping: '商超购物', autorepair: '汽车维修',
  beauty: '美容美发', leisure: '休闲娱乐', logistics: '跨境物流',
};

export default function Categories() {
  const [list, setList] = useState([]);

  useEffect(() => { api.categories().then(setList).catch((e) => message.error(e.message)); }, []);

  return (
    <Card title="分类管理">
      <p style={{ color: '#8A94A6' }}>六大生活服务分类（固定，对应 APP 首页宫格）。分类在数据库中维护，如需调整请联系开发。当前商户分类分布：</p>
      <Row gutter={[16, 16]}>
        {list.map((c) => (
          <Col span={8} key={c.id}>
            <Card size="small" style={{ textAlign: 'center', borderRadius: 12 }}>
              <div style={{ fontSize: 34 }}>{c.emoji}</div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>{CAT_INFO[c.id] || c.id}</div>
              <Tag color="blue" style={{ marginTop: 6 }}>{c.id}</Tag>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
