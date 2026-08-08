import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Input, Select, Tag, Switch, Popconfirm, Modal, Form, Row, Col, InputNumber, Upload, message, Image as AntImage,
} from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { api, toFlat } from '../api';

const CATEGORIES = [
  { value: 'food', label: '🍜 餐饮' }, { value: 'shopping', label: '🛒 商超购物' },
  { value: 'autorepair', label: '🔧 汽车维修' }, { value: 'beauty', label: '💇 美容美发' },
  { value: 'leisure', label: '🎮 休闲娱乐' }, { value: 'logistics', label: '📦 跨境物流' },
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export default function Merchants() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ category: '', city: '', keyword: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [image, setImage] = useState(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.merchants(filters)); } catch (e) { message.error(e.message); }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setImage(null);
    form.resetFields();
    form.setFieldsValue({ category: 'food', city: '霍尔果斯', rating: 4.0, featured: false, status: 1 });
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setImage(m.image || null);
    form.setFieldsValue(toFlat(m));
    setModalOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    const payload = { ...v, image };
    try {
      if (editing) { await api.updateMerchant(editing.id, payload); message.success('已保存'); }
      else { await api.createMerchant(payload); message.success('已创建'); }
      setModalOpen(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const uploadProps = {
    beforeUpload: async (file) => {
      if (!file.type.startsWith('image/')) { message.error('仅支持图片'); return Upload.LIST_IGNORE; }
      try {
        const url = await api.upload(file);
        setImage(url);
        message.success('图片已上传');
      } catch (e) { message.error(e.message); }
      return Upload.LIST_IGNORE;
    },
  };

  const columns = [
    { title: '商户', dataIndex: 'name', render: (n, r) => (
      <Space direction="vertical" size={0}>
        <span style={{ fontWeight: 600 }}>{n?.zh}</span>
        <span style={{ color: '#8A94A6', fontSize: 12 }}>{n?.ru || n?.en}</span>
      </Space>
    )},
    { title: '分类', dataIndex: 'category', render: (v) => CAT_LABEL[v] || v },
    { title: '城市', dataIndex: 'city', render: (v) => <Tag color={v === '霍尔果斯' ? 'blue' : 'gold'}>{v}</Tag> },
    { title: '电话', dataIndex: 'phone', render: (v) => v || '-' },
    { title: '评分', dataIndex: 'rating', render: (v) => <span>⭐ {v?.toFixed(1)}</span> },
    { title: '重点', dataIndex: 'featured', render: (v) => (v ? <Tag color="orange">推广</Tag> : '-') },
    { title: '状态', dataIndex: 'status', render: (v) => (v === 1 ? <Tag color="green">上架</Tag> : <Tag>下架</Tag>) },
    { title: '操作', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除该商户？" onConfirm={async () => { await api.deleteMerchant(r.id); message.success('已删除'); load(); }}>
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <Card
      title="商户管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增商户</Button>}
    >
      <Space wrap style={{ marginBottom: 14 }}>
        <Input placeholder="搜索名称/地址（支持三语）" style={{ width: 240 }} allowClear
          onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))} />
        <Select placeholder="分类" allowClear style={{ width: 150 }}
          options={CATEGORIES}
          onChange={(v) => setFilters((f) => ({ ...f, category: v || '' }))} />
        <Select placeholder="城市" allowClear style={{ width: 130 }}
          options={[{ value: '霍尔果斯', label: '霍尔果斯' }, { value: '喀什', label: '喀什' }]}
          onChange={(v) => setFilters((f) => ({ ...f, city: v || '' }))} />
        <Button onClick={load}>查询</Button>
      </Space>

      <Table rowKey="id" loading={loading} dataSource={list} columns={columns} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />

      <Modal
        title={editing ? '编辑商户' : '新增商户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={save}
        okText="保存"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={8}><Form.Item name="name_zh" label="名称（中文）" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="name_en" label="名称（English）"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="name_ru" label="名称（Русский）"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="category" label="分类" rules={[{ required: true }]}><Select options={CATEGORIES} /></Form.Item></Col>
            <Col span={8}><Form.Item name="city" label="城市"><Select options={[{ value: '霍尔果斯', label: '霍尔果斯' }, { value: '喀什', label: '喀什' }]} /></Form.Item></Col>
            <Col span={8}><Form.Item name="phone" label="电话"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="address_zh" label="地址（中文）"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="address_en" label="地址（English）"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="address_ru" label="地址（Русский）"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="desc_zh" label="简介（中文）"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={8}><Form.Item name="desc_en" label="简介（English）"><Input.TextArea rows={2} /></Form.Item></Col>
            <Col span={8}><Form.Item name="desc_ru" label="简介（Русский）"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}><Form.Item name="rating" label="评分"><InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="lat" label="纬度"><InputNumber step={0.0001} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="lng" label="经度"><InputNumber step={0.0001} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}>
              <Form.Item name="featured" label="重点企业" valuePropName="checked"><Switch checkedChildren="推广" unCheckedChildren="普通" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="商户图片">
                <Upload {...uploadProps} showUploadList={false}>
                  <Button icon={<UploadOutlined />}>上传图片</Button>
                </Upload>
                {image && <AntImage src={image} height={70} style={{ marginTop: 8, borderRadius: 8 }} />}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="上架状态" valuePropName="checked" getValueProps={(v) => ({ checked: v === 1 })} getValueFromEvent={(e) => (e ? 1 : 0)}>
                <Switch checkedChildren="上架" unCheckedChildren="下架" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}
