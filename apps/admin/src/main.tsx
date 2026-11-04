import { useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import type { Persona, WorkspaceState } from '@ai-douyin/shared';
import { api } from './api.js';
import './style.css';

function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [message, setMessage] = useState('');
  const [memory, setMemory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh(): Promise<void> {
    const value = await api<WorkspaceState>('workspace');
    setWorkspace(value);
  }

  useEffect(() => {
    let active = true;
    void api<WorkspaceState>('workspace').then(value => {
      if (active) { setWorkspace(value); setPersona(value.persona); }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : '无法连接本地服务');
    });
    return () => { active = false; };
  }, []);

  async function run(action: () => Promise<void>): Promise<void> {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '操作失败'); }
    finally { setBusy(false); }
  }

  function send(event: FormEvent): void {
    event.preventDefault();
    void run(async () => { await api('chat', 'POST', { content: message }); setMessage(''); });
  }

  return <main>
    <header><div><p className="eyebrow">AI DOUYIN / LOCAL STUDIO</p><h1>热血角色工作台</h1><p>把人格变成持续的对话，让每次记住都有迹可循。</p></div><span className="badge">模拟模式 · 无付费调用</span></header>
    <p className="banner">当前回复来自固定规则，不具备真实模型推理或可靠内容审核能力。这里的聊天不会发送到抖音。</p>
    {error && <p role="alert" className="error">{error} <button onClick={() => { void run(refresh); }}>重试连接</button></p>}
    {notice && <p role="status">{notice}</p>}
    {!workspace && !error && <p role="status">正在连接本地工作区…</p>}
    <div className="layout">
      <section className="panel"><div className="section-heading"><h2>人格档案</h2><span>v{workspace?.persona.version ?? '—'}</span></div>
        {persona && <form onSubmit={event => { event.preventDefault(); void run(async () => {
          const value = await api<Persona>('persona', 'PUT', persona); setPersona(value); setNotice('人格已保存，新对话使用新版本。');
        }); }}>
          <label>角色名称<input required maxLength={40} value={persona.name} onChange={event => setPersona({ ...persona, name: event.target.value })} /></label>
          <label>性格与背景<textarea required maxLength={1000} rows={5} value={persona.description} onChange={event => setPersona({ ...persona, description: event.target.value })} /></label>
          <label>表达方式<textarea required maxLength={1000} rows={5} value={persona.style} onChange={event => setPersona({ ...persona, style: event.target.value })} /></label>
          <button disabled={busy}>保存新版本</button><p className="muted">名称在模拟回复中生效，完整性格与表达方式需接入真实模型后验证。</p>
        </form>}
      </section>
      <section className="panel chat"><div className="section-heading"><h2>本地聊天</h2><button className="secondary" disabled={busy || !workspace?.messages.length} onClick={() => {
        if (window.confirm('清空对话记录？独立保存的记忆不会删除。')) void run(async () => { await api('messages', 'DELETE'); });
      }}>清空对话</button></div>
        <div className="messages" aria-live="polite">{workspace?.messages.length === 0 && <p className="muted">试着说“今天失败了”，或在添加记忆后问“你记得什么？”</p>}
          {workspace?.messages.map(item => <article key={item.id} className={`message ${item.role}`}><small>{item.role === 'user' ? '你' : workspace.persona.name} · 人格 v{item.personaVersion}</small><p>{item.content}</p></article>)}
        </div>
        <form className="composer" onSubmit={send}><label>发送消息<textarea required maxLength={2000} rows={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="和角色聊一聊…" /></label><button disabled={busy || !workspace || !message.trim()}>{busy ? '处理中…' : '发送'}</button></form>
      </section>
      <section className="panel"><h2>明确保存的记忆 <span className="muted">{workspace?.memories.length ?? 0}/200</span></h2><p className="muted">对话不会自动变成长期记忆。这里只保存你明确添加的内容，模拟检索使用最近 20 条。</p>
        <form onSubmit={event => { event.preventDefault(); void run(async () => { await api('memories', 'POST', { content: memory }); setMemory(''); }); }}><label>添加记忆<textarea required maxLength={500} rows={3} value={memory} onChange={event => setMemory(event.target.value)} placeholder="例如：我喜欢晚饭后散步" /></label><button disabled={busy || !workspace || !memory.trim()}>保存记忆</button></form>
        <ul className="memory-list">{workspace?.memories.map(item => <li key={item.id}><p>{item.content}</p><button className="secondary" disabled={busy} onClick={() => {
          if (window.confirm('删除这条记忆？已生成的历史对话不随之删除，可另行清空。')) void run(async () => { await api(`memories/${item.id}`, 'DELETE'); });
        }}>删除</button></li>)}</ul>
      </section>
    </div>
    <footer>仅保存在本机 · 最近 100 条聊天消息 · 视频逐条确认 · 抖音尚未接入</footer>
  </main>;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing root element');
createRoot(rootElement).render(<App />);
