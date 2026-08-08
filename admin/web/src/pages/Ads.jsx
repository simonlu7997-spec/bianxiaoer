import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Switch, Popconfirm, Modal, Form, Input, Select, InputNumber, message, Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '../api';

export default function Ads() {
  const [list, setList] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await api.ads());
      setMerchants(await api.merchants());
    } catch (e) { message.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const merchantOptions = merchants.map((m) => ({ value: m.id, label: m.name?.zh }));

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ bg: '#2E6BE6', sortOrder: 0, enabled: true });
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    form.setFieldsValue({
      title_zh: a.title?.zh, title_en: a.title?.en, title_ru: a.title?.ru,
      merchant_id: a.merchantId, bg: a.bg, sortOrder: a.sortOrder, enabled: a.enabled,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const v = await form.validateFields();
    try {
      if (editing) { await api.updateAd(editing.id, v); message.success('已保存'); }
      else { await api.createAd(v); message.success('已创建'); }
      setModalOpen(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const toggleAd = async (ad, enabled) => {
    await api.updateAd(ad.id, {
      title_zh: ad.title?.zh, title_en: ad.title?.en, title_ru: ad.title?.ru,
      merchant_id: ad.merchantId, bg: ad.bg, sortOrder: ad.sortOrder, enabled,
    });
    message.success(enabled ? '已启用' : '已停用');
    load();
  };

  const columns = [
    { title: '标题', dataIndex: 'title', render: (t) => (
      <Space direction="vertical" size={0}>
        <span style={{ fontWeight: 600 }}>{t?.zh}</span>
        <span style={{ color: '#8A94A6', fontSize: 12 }}>{t?.ru || t?.en}</span>
      </Space>
    )},
    { title: '跳转商户', dataIndex: 'merchantId', render: (v) => {
      const m = merchants.find((x) => x.id === v);
      return m ? m.name?.zh : <Tag>无</Tag>;
    }},
    { title: '颜色', dataIndex: 'bg', render: (v) => <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, background: v, verticalAlign: 'middle' }} /> },
    { title: '排序', dataIndex: 'sortOrder' },
    { title: '状态', dataIndex: 'enabled', render: (v, r) => <Switch checked={v} onChange={(e) => toggleAd(r, e)} /> },
    { title: '操作', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除该广告？" onConfirm={async () => { await api.deleteAd(r.id); message.success('已删除'); load(); }}>
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <Card title="广告管理（重点企业推荐位）" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增广告</Button>}>
      <Table rowKey="id" loading={loading} dataSource={list} columns={columns} pagination={false} />

      <Modal title={editing ? '编辑广告' : '新增广告'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={save} okText="保存" destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title_zh" label="标题（中文）" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="title_en" label="标题（English）"><Input /></Form.Item>
          <Form.Item name="title_ru" label="标题（Русский）"><Input /></Form.Item>
          <Form.Item name="merchant_id" label="跳转商户"><Select options={merchantOptions} allowClear placeholder="选择要推广的商户" /></Form.Item>
          <Space size="large">
            <Form.Item name="bg" label="背景色"><Input style={{ width: 130 }} /></Form.Item>
            <Form.Item name="sortOrder" label="排序"><InputNumber min={0} /></Form.Item>
            <Form.Item name="enabled" label="启用" valuePropName="checked"><Switch /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
