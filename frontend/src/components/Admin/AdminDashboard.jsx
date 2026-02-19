/**
 * Admin/AdminDashboard.jsx
 * ─────────────────────────
 * Full admin control panel:
 *   📊 Analytics overview
 *   📋 FAQ list with search & filter
 *   ➕ Add single FAQ
 *   ✏️ Edit FAQ (inline)
 *   🗑 Delete FAQ
 *   📁 Bulk file upload (JSON / CSV / TXT)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';
import api from '../../services/api';
import styles from './AdminDashboard.module.css';

/* ── Tiny shared components ────────────────────────────────────── */

function StatCard({ icon, label, value, color }) {
  return (
    <div className={styles.statCard} style={{ '--card-color': color }}>
      <div className={styles.statIcon}>{icon}</div>
      <div>
        <div className={styles.statValue}>{value ?? '—'}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`${styles.toast} ${styles[`toast_${type}`]}`}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('faqs'); // 'faqs' | 'analytics' | 'upload'
  const [faqs, setFaqs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general' });
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Upload state
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ── Load data ──────────────────────────────────────────────────
  async function loadFaqs() {
    setLoading(true);
    try {
      const res = await api.get('/admin/faqs');
      setFaqs(res.data.faqs);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await api.get('/admin/analytics');
      setStats(res.data.stats);
    } catch (_) {}
  }

  useEffect(() => {
    loadFaqs();
    loadStats();
  }, []);

  // ── CRUD ───────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm({ question: '', answer: '', category: 'general' });
    setShowForm(true);
  }

  function openEdit(faq) {
    setEditingId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category || 'general' });
    setShowForm(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setFormLoading(true);
    try {
      if (editingId) {
        await api.put(`/admin/faqs/${editingId}`, form);
        showToast('سوال با موفقیت ویرایش شد.');
      } else {
        await api.post('/admin/faqs', form);
        showToast('سوال جدید اضافه شد.');
      }
      setShowForm(false);
      loadFaqs();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleActive(faq) {
    try {
      await api.put(`/admin/faqs/${faq.id}`, { is_active: !faq.is_active });
      showToast(faq.is_active ? 'سوال غیرفعال شد.' : 'سوال فعال شد.');
      loadFaqs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('آیا از حذف این سوال مطمئن هستید؟')) return;
    try {
      await api.delete(`/admin/faqs/${id}?permanent=true`);
      showToast('سوال حذف شد.');
      loadFaqs();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ── File Upload ────────────────────────────────────────────────
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/admin/faqs/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(res.data.summary);
      showToast(`${res.data.summary.imported} سوال وارد شد.`);
      loadFaqs();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // ── Filtered FAQ list ─────────────────────────────────────────
  const filteredFaqs = faqs.filter(f => {
    const matchSearch = !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      filterActive === 'all' ? true :
      filterActive === 'active' ? f.is_active :
      !f.is_active;
    return matchSearch && matchActive;
  });

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span>💬</span>
          <span>ChatBot Admin</span>
        </div>
        <nav className={styles.sideNav}>
          {[
            { id: 'faqs', icon: '📋', label: 'مدیریت سوالات' },
            { id: 'analytics', icon: '📊', label: 'آمار و تحلیل' },
            { id: 'upload', icon: '📁', label: 'آپلود فایل' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.navActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.sideLink}>🌐 صفحه اصلی</Link>
          <button className={styles.sideLink} onClick={() => { logout(); navigate('/login'); }}>
            🚪 خروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div>
            <h2 className={styles.pageTitle}>
              {activeTab === 'faqs' && '📋 مدیریت سوالات'}
              {activeTab === 'analytics' && '📊 آمار و تحلیل'}
              {activeTab === 'upload' && '📁 آپلود فایل'}
            </h2>
            <p className={styles.pageSubtitle}>خوش آمدید، {user?.username}</p>
          </div>
          <div className={styles.topActions}>
            <ThemeToggle />
          </div>
        </header>

        <div className={styles.content}>

          {/* ══════════ FAQs Tab ══════════ */}
          {activeTab === 'faqs' && (
            <div>
              {/* Stats row */}
              <div className={styles.statsRow}>
                <StatCard icon="📝" label="کل سوالات" value={faqs.length} color="#3b82f6" />
                <StatCard icon="✅" label="فعال" value={faqs.filter(f => f.is_active).length} color="#22c55e" />
                <StatCard icon="⏸" label="غیرفعال" value={faqs.filter(f => !f.is_active).length} color="#f59e0b" />
                <StatCard icon="💬" label="کل مکالمات" value={stats?.totalMessages ?? '…'} color="#8b5cf6" />
              </div>

              {/* Toolbar */}
              <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="جستجو..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <select
                  className={styles.filterSelect}
                  value={filterActive}
                  onChange={e => setFilterActive(e.target.value)}
                >
                  <option value="all">همه</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
                <button className={styles.addBtn} onClick={openAdd}>
                  + افزودن سوال
                </button>
              </div>

              {/* Form modal */}
              {showForm && (
                <div className={styles.formCard}>
                  <div className={styles.formHeader}>
                    <h3>{editingId ? 'ویرایش سوال' : 'افزودن سوال جدید'}</h3>
                    <button className={styles.formClose} onClick={() => setShowForm(false)}>×</button>
                  </div>
                  <form onSubmit={handleFormSubmit} className={styles.faqForm}>
                    <div className={styles.formGroup}>
                      <label>سوال *</label>
                      <textarea
                        value={form.question}
                        onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                        placeholder="متن سوال را وارد کنید..."
                        rows={2}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>پاسخ *</label>
                      <textarea
                        value={form.answer}
                        onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                        placeholder="متن پاسخ را وارد کنید..."
                        rows={4}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>دسته‌بندی</label>
                      <select
                        value={form.category}
                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      >
                        <option value="general">عمومی</option>
                        <option value="support">پشتیبانی</option>
                        <option value="billing">مالی</option>
                        <option value="technical">فنی</option>
                      </select>
                    </div>
                    <div className={styles.formActions}>
                      <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                        انصراف
                      </button>
                      <button type="submit" className={styles.saveBtn} disabled={formLoading}>
                        {formLoading ? '...' : editingId ? 'ذخیره تغییرات' : 'افزودن سوال'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table */}
              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner} /> در حال بارگذاری...
                </div>
              ) : filteredFaqs.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>📭</span>
                  <p>{search ? 'نتیجه‌ای یافت نشد.' : 'هنوز سوالی اضافه نشده است.'}</p>
                  {!search && (
                    <button className={styles.addBtn} onClick={openAdd}>+ افزودن اولین سوال</button>
                  )}
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>سوال</th>
                        <th>پاسخ</th>
                        <th>دسته</th>
                        <th>وضعیت</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFaqs.map((faq, i) => (
                        <tr key={faq.id} className={!faq.is_active ? styles.inactiveRow : ''}>
                          <td className={styles.tdNum}>{i + 1}</td>
                          <td className={styles.tdQ}>{faq.question}</td>
                          <td className={styles.tdA}>{faq.answer.slice(0, 80)}{faq.answer.length > 80 ? '…' : ''}</td>
                          <td>
                            <span className={styles.catBadge}>{faq.category}</span>
                          </td>
                          <td>
                            <button
                              className={`${styles.statusToggle} ${faq.is_active ? styles.statusActive : styles.statusInactive}`}
                              onClick={() => handleToggleActive(faq)}
                              title={faq.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                            >
                              {faq.is_active ? '✅ فعال' : '⏸ غیرفعال'}
                            </button>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className={styles.editBtn}
                                onClick={() => openEdit(faq)}
                                title="ویرایش"
                              >✏️</button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(faq.id)}
                                title="حذف"
                              >🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════ Analytics Tab ══════════ */}
          {activeTab === 'analytics' && (
            <div>
              {!stats ? (
                <div className={styles.loadingState}><div className={styles.spinner} /></div>
              ) : (
                <>
                  <div className={styles.statsRow}>
                    <StatCard icon="💬" label="کل مکالمات" value={stats.totalMessages} color="#3b82f6" />
                    <StatCard icon="✅" label="پاسخ داده شد" value={stats.matchedMessages} color="#22c55e" />
                    <StatCard icon="❌" label="بدون پاسخ" value={stats.unmatchedMessages} color="#ef4444" />
                    <StatCard icon="📈" label="نرخ موفقیت" value={`${stats.matchRate}%`} color="#8b5cf6" />
                  </div>

                  <div className={styles.analyticsGrid}>
                    <div className={styles.analyticsCard}>
                      <h3>🏆 پرتکرارترین سوالات</h3>
                      {stats.topFaqs.length === 0 ? (
                        <p className={styles.noData}>داده‌ای موجود نیست.</p>
                      ) : (
                        <div className={styles.topList}>
                          {stats.topFaqs.map((f, i) => (
                            <div key={i} className={styles.topItem}>
                              <span className={styles.topRank}>#{i + 1}</span>
                              <span className={styles.topQ}>{f.question}</span>
                              <span className={styles.topHit}>{f.hits} بار</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.analyticsCard}>
                      <h3>📅 مکالمات ۷ روز اخیر</h3>
                      {stats.weeklyVolume.length === 0 ? (
                        <p className={styles.noData}>داده‌ای موجود نیست.</p>
                      ) : (
                        <div className={styles.barChart}>
                          {stats.weeklyVolume.map((d, i) => {
                            const max = Math.max(...stats.weeklyVolume.map(x => x.count));
                            return (
                              <div key={i} className={styles.bar}>
                                <div
                                  className={styles.barFill}
                                  style={{ height: `${(d.count / max) * 100}%` }}
                                  title={`${d.count} مکالمه`}
                                />
                                <div className={styles.barLabel}>{d.date.slice(5)}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════ Upload Tab ══════════ */}
          {activeTab === 'upload' && (
            <div>
              <div className={styles.uploadArea}>
                <div className={styles.uploadCard}>
                  <h3>📁 آپلود دسته‌ای سوالات</h3>
                  <p className={styles.uploadDesc}>
                    فایل‌های JSON، CSV یا TXT حاوی سوالات و پاسخ‌ها را آپلود کنید.
                  </p>

                  <div className={styles.uploadFormats}>
                    <div className={styles.formatBox}>
                      <strong>JSON</strong>
                      <code>[{"{"}"question": "...", "answer": "..."{"}"}]</code>
                    </div>
                    <div className={styles.formatBox}>
                      <strong>CSV</strong>
                      <code>question,answer<br/>سوال اول,پاسخ اول</code>
                    </div>
                    <div className={styles.formatBox}>
                      <strong>TXT</strong>
                      <code>سوال اول|پاسخ اول<br/>سوال دوم|پاسخ دوم</code>
                    </div>
                  </div>

                  <div
                    className={styles.dropZone}
                    onClick={() => fileRef.current?.click()}
                  >
                    <span>📤</span>
                    <p>کلیک کنید یا فایل را اینجا بکشید</p>
                    <span className={styles.dropHint}>JSON · CSV · TXT — حداکثر ۵ مگابایت</span>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,.csv,.txt"
                    className={styles.hiddenInput}
                    onChange={handleUpload}
                    disabled={uploading}
                  />

                  {uploading && (
                    <div className={styles.uploadLoading}>
                      <div className={styles.spinner} />
                      در حال پردازش فایل...
                    </div>
                  )}

                  {uploadResult && (
                    <div className={styles.uploadResult}>
                      <h4>📊 نتیجه آپلود</h4>
                      <div className={styles.resultStats}>
                        <span className={styles.resultGood}>✅ وارد شد: {uploadResult.imported}</span>
                        <span className={styles.resultWarn}>⚠️ رد شد: {uploadResult.skipped}</span>
                        <span>📄 کل: {uploadResult.total}</span>
                      </div>
                      {uploadResult.errors?.length > 0 && (
                        <div className={styles.uploadErrors}>
                          <strong>خطاها:</strong>
                          {uploadResult.errors.slice(0, 5).map((e, i) => (
                            <div key={i} className={styles.uploadError}>
                              ردیف {e.row}: {e.reason}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
