import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Switch, Button, Space, InputNumber, Divider, message, Alert,
} from 'antd';
import { api } from '../api';

const CITIES = [
  { id: 'khorgos', name: '霍尔果斯', key: 'cities' },
  { id: 'kashgar', name: '喀什', key: 'cities' },
];

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await api.settings();
        let cities = [];
        try { cities = JSON.parse(s.cities || '[]'); } catch (e) { /* ignore */ }
        form.setFieldsValue({
          amap_key: s.amap_key || '',
          use_mock: s.use_mock === 'false' ? false : true,
          default_city: s.default_city || '霍尔果斯',
        });
        cities.forEach((c, i) => {
          form.setFieldsValue({
            [`lat_${c.id}`]: c.center?.latitude,
            [`lng_${c.id}`]: c.center?.longitude,
            [`delta_${c.id}`]: c.delta,
          });
        });
      } catch (e) { message.error(e.message); }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const v = await form.validateFields();
    const cities = CITIES.map((c) => ({
      id: c.id,
      name: c.name,
      center: {
        latitude: v[`lat_${c.id}`] ?? 44.2,
        longitude: v[`lng_${c.id}`] ?? 80.4,
      },
      delta: v[`delta_${c.id}`] ?? 0.06,
    }));
    try {
      await api.saveSettings({
        amap_key: v.amap_key?.trim(),
        use_mock: v.use_mock ? 'true' : 'false',
        default_city: v.default_city,
        cities: JSON.stringify(cities),
      });
      message.success('配置已保存，APP 下次启动生效');
    } catch (e) { message.error(e.message); }
  };

  return (
    <Card title="系统设置（在线配置，APP 启动时自动拉取）" loading={loading}>
      <Alert
        type="info"
        showIcon
        message="这些配置保存在后台数据库中。APP 启动时会请求 /api/config 拉取，无需重新打包即可在线调整。"
        style={{ marginBottom: 18 }}
      />
      <Form form={form} layout="vertical" style={{ maxWidth: 560 }}>
        <Form.Item name="amap_key" label="高德 Web 服务 Key" extra="lbs.amap.com 申请，用于真实 POI 搜索">
          <Input placeholder="高德 Web 服务 Key" />
        </Form.Item>
        <Form.Item name="use_mock" label="使用本地 Mock 数据" valuePropName="checked" extra="关闭后 APP 商户/广告全部走后台数据库">
          <Switch checkedChildren="Mock" unCheckedChildren="后台数据" />
        </Form.Item>
        <Form.Item name="default_city" label="默认城市">
          <Input placeholder="霍尔果斯" />
        </Form.Item>

        <Divider>城市中心点（地图页初始视野）</Divider>
        {CITIES.map((c) => (
          <Space key={c.id} size="middle" style={{ display: 'flex', marginBottom: 10 }}>
            <span style={{ width: 60, fontWeight: 600 }}>{c.name}</span>
            <Form.Item name={`lat_${c.id}`} label="纬度" style={{ marginBottom: 0 }}>
              <InputNumber step={0.0001} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name={`lng_${c.id}`} label="经度" style={{ marginBottom: 0 }}>
              <InputNumber step={0.0001} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name={`delta_${c.id}`} label="缩放" style={{ marginBottom: 0 }}>
              <InputNumber step={0.01} min={0.01} max={1} style={{ width: 90 }} />
            </Form.Item>
          </Space>
        ))}

        <Button type="primary" onClick={save} style={{ marginTop: 8 }}>保存配置</Button>
      </Form>
    </Card>
  );
}
