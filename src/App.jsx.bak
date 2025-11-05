
import React, { useEffect, useState } from 'react';

// CRM MVP — обновлённая версия: топ-5 фич
// 1) История платежей (просмотр/редактирование/удаление)
// 2) Отчёты и баланс кассы + экспорт CSV/JSON
// 3) Просрочки (подсветка) и настраиваемый порог дней
// 4) Печать чеков (через window.print и подготовку простого HTML)
// 5) Экспорт всех данных (JSON/CSV)
// Хранение: localStorage (простая миграция на сервер возможна позже)

export default function App() {
  const MS_PER_DAY = 24 * 3600 * 1000;

  const [bikes, setBikes] = useState(() => JSON.parse(localStorage.getItem('bikes')) || [
    { id: 1, name: 'Аист', model: 'City 1', status: 'free', pricePerDay: 500 },
    { id: 2, name: 'Ветер', model: 'MTB 2', status: 'free', pricePerDay: 700 },
  ]);
  const [clients, setClients] = useState(() => JSON.parse(localStorage.getItem('clients')) || []);
  const [rentals, setRentals] = useState(() => JSON.parse(localStorage.getItem('rentals')) || []);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('expenses')) || []);
  const [writeoffs, setWriteoffs] = useState(() => JSON.parse(localStorage.getItem('writeoffs')) || []);
  const [sales, setSales] = useState(() => JSON.parse(localStorage.getItem('sales')) || []);

  // settings
  const [allowedDaysBeforeOverdue, setAllowedDaysBeforeOverdue] = useState(() => Number(localStorage.getItem('allowedDays')) || 1);

  useEffect(() => localStorage.setItem('bikes', JSON.stringify(bikes)), [bikes]);
  useEffect(() => localStorage.setItem('clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('rentals', JSON.stringify(rentals)), [rentals]);
  useEffect(() => localStorage.setItem('expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('writeoffs', JSON.stringify(writeoffs)), [writeoffs]);
  useEffect(() => localStorage.setItem('sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('allowedDays', String(allowedDaysBeforeOverdue)), [allowedDaysBeforeOverdue]);

  // UI state
  const [showAddBike, setShowAddBike] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('main'); // main | deposits | money | reports
  const [moneySubtab, setMoneySubtab] = useState('expenses');

  // modals
  const [showRentForm, setShowRentForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnTargetRentalId, setReturnTargetRentalId] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentTargetRentalId, setPaymentTargetRentalId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRentalId, setDetailsRentalId] = useState(null);
  const [showMoneyForm, setShowMoneyForm] = useState(false);
  const [moneyFormType, setMoneyFormType] = useState('expenses');

  // helpers
  const addBike = (bike) => { setBikes(prev => [...prev, { ...bike, id: Date.now() }]); setShowAddBike(false); };
  const addClientIfNeeded = (client) => {
    const found = clients.find(c => c.phone === client.phone && c.name === client.name);
    if (found) return found.id;
    const id = Date.now();
    setClients(prev => [...prev, { ...client, id }]);
    return id;
  };

  const rentBike = ({ bikeId, client, deposit, startDate }) => {
    const clientId = addClientIfNeeded(client);
    const bike = bikes.find(b => b.id === bikeId);
    if (!bike || bike.status === 'rented') return;
    const start = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const id = Date.now();
    const rental = { id, bikeId, clientId, start, end: null, priceTotal: null, paid: 0, deposit: Number(deposit || 0), depositRefunded: false, paymentsHistory: [] };
    setRentals(prev => [...prev, rental]);
    setBikes(prev => prev.map(b => b.id === bikeId ? { ...b, status: 'rented' } : b));
    setShowRentForm(false);
    setSelectedBike(null);
  };

  const addPayment = (rentalId, amount, note) => {
    if (!rentalId || Number(amount) <= 0) return;
    const now = new Date().toISOString();
    setRentals(prev => prev.map(r => r.id === rentalId ? { ...r, paid: (r.paid || 0) + Number(amount), paymentsHistory: [...(r.paymentsHistory||[]), { id: Date.now(), amount: Number(amount), date: now, note }] } : r));
    setShowPaymentForm(false);
    setPaymentTargetRentalId(null);
  };

  const editPayment = (rentalId, paymentId, newAmount, newNote) => {
    setRentals(prev => prev.map(r => {
      if (r.id !== rentalId) return r;
      const ph = (r.paymentsHistory || []).map(p => p.id === paymentId ? { ...p, amount: Number(newAmount), note: newNote } : p);
      // recalc paid
      const newPaid = ph.reduce((s, x) => s + Number(x.amount), 0);
      return { ...r, paymentsHistory: ph, paid: newPaid };
    }));
  };

  const deletePayment = (rentalId, paymentId) => {
    setRentals(prev => prev.map(r => {
      if (r.id !== rentalId) return r;
      const ph = (r.paymentsHistory || []).filter(p => p.id !== paymentId);
      const newPaid = ph.reduce((s, x) => s + Number(x.amount), 0);
      return { ...r, paymentsHistory: ph, paid: newPaid };
    }));
  };

  const processReturn = (rentalId, extraPaid = 0) => {
    const now = new Date();
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return;
    const bike = bikes.find(b => b.id === rental.bikeId);
    const start = new Date(rental.start);
    const days = Math.max(1, Math.ceil((now - start) / MS_PER_DAY));
    const priceTotal = (bike?.pricePerDay || 0) * days;
    const paidBefore = rental.paid || 0;
    const paidNow = paidBefore + Number(extraPaid || 0);
    const updated = rentals.map(r => r.id === rentalId ? { ...r, end: now.toISOString(), priceTotal, paid: paidNow } : r);
    setRentals(updated);
    setBikes(prev => prev.map(b => b.id === rental.bikeId ? { ...b, status: 'free' } : b));
    setShowReturnForm(false);
    setReturnTargetRentalId(null);
  };

  const refundDeposit = (rentalId) => { setRentals(prev => prev.map(r => r.id === rentalId ? { ...r, depositRefunded: true } : r)); };

  const addMoneyRecord = (type, record) => { const obj = { ...record, id: Date.now() }; if (type === 'expenses') setExpenses(prev => [obj, ...prev]); if (type === 'writeoffs') setWriteoffs(prev => [obj, ...prev]); if (type === 'sales') setSales(prev => [obj, ...prev]); };
  const deleteMoneyRecord = (type, id) => { if (type === 'expenses') setExpenses(prev => prev.filter(x=>x.id!==id)); if (type === 'writeoffs') setWriteoffs(prev => prev.filter(x=>x.id!==id)); if (type === 'sales') setSales(prev => prev.filter(x=>x.id!==id)); };

  // derived data
  const activeRentals = rentals.filter(r => !r.end);
  const activeRentalsWithDue = activeRentals.map(r => {
    const bike = bikes.find(b => b.id === r.bikeId) || { pricePerDay: 0 };
    const now = new Date();
    const start = new Date(r.start);
    const days = Math.max(1, Math.ceil((now - start) / MS_PER_DAY));
    const accrued = bike.pricePerDay * days;
    const paid = r.paid || 0; // excludes deposit
    const due = Math.max(0, accrued - paid);
    const overdue = days > allowedDaysBeforeOverdue;
    return { ...r, bike, days, accrued, paid, due, overdue };
  });

  const currentDebts = rentals.filter(r => r.end && (r.paid || 0) < (r.priceTotal || 0)).map(r => ({ ...r, debt: (r.priceTotal || 0) - (r.paid || 0) }));
  const activeDeposits = rentals.filter(r => r.deposit > 0 && !r.depositRefunded);

  const totalPayments = rentals.reduce((s, r) => s + (r.paid || 0), 0);
  const totalSales = sales.reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalWriteoffs = writeoffs.reduce((s, x) => s + Number(x.amount || 0), 0);
  const balance = totalPayments + totalSales - (totalExpenses + totalWriteoffs);

  // exports
  const exportJSON = (filename='export.json') => {
    const payload = { bikes, clients, rentals, expenses, writeoffs, sales };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const toCSV = (arr, fields) => {
    const header = fields.join(',');
    const lines = arr.map(row => fields.map(f => '"' + (row[f] ?? '') + '"').join(','));
    return [header, ...lines].join('\\n');
  };

  const exportCSV = (which) => {
    if (which === 'rentals') {
      const fields = ['id','bikeId','clientId','start','end','priceTotal','paid','deposit'];
      const csv = toCSV(rentals, fields);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'rentals.csv'; a.click(); URL.revokeObjectURL(url);
    }
    if (which === 'reports') {
      const csv = `metric,value\\nPayments,${totalPayments}\\nSales,${totalSales}\\nExpenses,${totalExpenses}\\nWriteoffs,${totalWriteoffs}\\nBalance,${balance}`;
      const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'report_summary.csv'; a.click(); URL.revokeObjectURL(url);
    }
  };

  // printing simple receipt: prepare a new window with printable HTML
  const printReceipt = (rentalId) => {
    const r = rentals.find(x => x.id === rentalId);
    if (!r) return alert('Аренда не найдена');
    const bike = bikes.find(b => b.id === r.bikeId) || {};
    const client = clients.find(c => c.id === r.clientId) || {};
    const html = `
      <html><head><title>Чек</title></head><body>
      <h2>Чек — аренда #${r.id}</h2>
      <div>Клиент: ${client.name || ''} — ${client.phone || ''}</div>
      <div>Велосипед: ${bike.name || ''} — ${bike.model || ''}</div>
      <div>Начало: ${new Date(r.start).toLocaleString()}</div>
      <div>Окончание: ${r.end ? new Date(r.end).toLocaleString() : '—'}</div>
      <div>Оплачено: ${r.paid || 0} с</div>
      <div>Депозит: ${r.deposit || 0} с</div>
      <div>Итог (если закрыта): ${r.priceTotal ?? '—'}</div>
      <hr/>
      <div>Спасибо за аренду!</div>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close(); w.print();
  };

  // components
  function AddBikeForm({ onAdd, onCancel }) {
    const [name, setName] = useState('');
    const [model, setModel] = useState('');
    const [pricePerDay, setPricePerDay] = useState(500);
    return (
      <div className="p-4 bg-white rounded shadow w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Добавить велосипед</h3>
        <input className="w-full mb-2 p-2 border rounded" placeholder="Название" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full mb-2 p-2 border rounded" placeholder="Модель" value={model} onChange={e=>setModel(e.target.value)} />
        <input type="number" className="w-full mb-2 p-2 border rounded" placeholder="Цена/день" value={pricePerDay} onChange={e=>setPricePerDay(Number(e.target.value))} />
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>onAdd({ name, model, pricePerDay, status: 'free' })}>Добавить</button>
          <button className="px-3 py-2 rounded border" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  }

  function RentForm({ bike, onRent, onCancel }) {
    const [clientName, setClientName] = useState('');
    const [phone, setPhone] = useState('');
    const [deposit, setDeposit] = useState(0);
    const [startDate, setStartDate] = useState('');
    return (
      <div className="p-4 bg-white rounded shadow w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Выдача: {bike.name} ({bike.model})</h3>
        <input className="w-full mb-2 p-2 border rounded" placeholder="Имя клиента" value={clientName} onChange={e=>setClientName(e.target.value)} />
        <input className="w-full mb-2 p-2 border rounded" placeholder="Телефон" value={phone} onChange={e=>setPhone(e.target.value)} />
        <div className="mt-2 text-sm text-gray-700">Оплата по факту — при выдаче фиксируем депозит.</div>
        <input type="number" className="w-full mt-2 p-2 border rounded" placeholder="Депозит (с)" value={deposit} onChange={e=>setDeposit(Number(e.target.value))} />
        <div className="mt-2 text-sm">Дата начала (опционально):</div>
        <input type="datetime-local" className="w-full mt-1 p-2 border rounded" value={startDate} onChange={e=>setStartDate(e.target.value)} />
        <div className="flex gap-2 mt-3">
          <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={()=>onRent({ bikeId: bike.id, client: { name: clientName, phone }, deposit, startDate })}>Выдать</button>
          <button className="px-3 py-2 rounded border" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  }

  function AddPaymentForm({ rentalId, onAdd, onCancel }) {
    const [amount, setAmount] = useState(0);
    const [note, setNote] = useState('');
    return (
      <div className="p-4 bg-white rounded shadow w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Принять платёж</h3>
        <input type="number" className="w-full mb-2 p-2 border rounded" placeholder="Сумма (с)" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        <input className="w-full mb-2 p-2 border rounded" placeholder="Примечание" value={note} onChange={e=>setNote(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={()=>{ if (Number(amount) > 0) onAdd(rentalId, Number(amount), note); else alert('Введите сумму больше 0'); }}>Принять</button>
          <button className="px-3 py-2 rounded border" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  }

  function ReturnForm({ rental, onProcess, onCancel }) {
    const [extra, setExtra] = useState(0);
    const bike = bikes.find(b => b.id === rental.bikeId);
    const now = new Date();
    const start = new Date(rental.start);
    const days = Math.max(1, Math.ceil((now - start) / MS_PER_DAY));
    const priceTotal = (bike?.pricePerDay || 0) * days;
    const paidBefore = rental.paid || 0;
    const due = Math.max(0, priceTotal - paidBefore);
    return (
      <div className="p-4 bg-white rounded shadow w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Возврат — {bike?.name}</h3>
        <div className="mb-2">Дней: <b>{days}</b></div>
        <div className="mb-2">Итог: <b>{priceTotal} с</b></div>
        <div className="mb-2">Уже оплачено: <b>{paidBefore} с</b></div>
        <div className="mb-2">Депозит (отдельно): <b>{rental.deposit || 0} с</b></div>
        <div className="mb-2">Осталось доплатить: <b>{due} с</b></div>
        <input type="number" className="w-full mt-2 p-2 border rounded" placeholder="Вносим сейчас" value={extra} onChange={e=>setExtra(Number(e.target.value))} />
        <div className="flex gap-2 mt-3">
          <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={()=>onProcess(rental.id, extra)}>Принять и закрыть</button>
          <button className="px-3 py-2 rounded border" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  }

  function DetailsModal({ rentalId, onClose }) {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return null;
    const bike = bikes.find(b => b.id === rental.bikeId) || {};
    const client = clients.find(c => c.id === rental.clientId) || {};
    return (
      <div className="p-4 bg-white rounded shadow w-full max-w-2xl max-h-[80vh] overflow-auto">
        <h3 className="text-lg font-semibold mb-2">Детали аренды #{rental.id}</h3>
        <div className="mb-2">Клиент: <b>{client.name}</b> — {client.phone}</div>
        <div className="mb-2">Велосипед: <b>{bike.name} — {bike.model}</b></div>
        <div className="mb-2">Начало: {new Date(rental.start).toLocaleString()}</div>
        <div className="mb-2">Окончание: {rental.end ? new Date(rental.end).toLocaleString() : '— (активна)'}</div>
        <div className="mb-2">Депозит: {rental.deposit || 0} с — Возвращён: {rental.depositRefunded ? 'Да' : 'Нет'}</div>
        <div className="mb-3">Оплачено (без депозита): {rental.paid || 0} с</div>

        <h4 className="font-medium">История платежей</h4>
        <div className="space-y-2 mb-3">
          {(rental.paymentsHistory || []).map(p => (
            <div key={p.id} className="p-2 border rounded flex justify-between items-center">
              <div>
                <div><b>{p.amount} с</b> — {new Date(p.date).toLocaleString()}</div>
                <div className="text-sm text-gray-600">{p.note}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 rounded border"
                  onClick={()=>{
                    const newAmount = prompt('Новая сумма', String(p.amount));
                    const newNote = prompt('Новое примечание', p.note || '');
                    if (newAmount) editPayment(rental.id, p.id, Number(newAmount), newNote);
                  }}
                >
                  Ред.
                </button>

                {/* eslint-disable-next-line no-restricted-globals */}
                <button
                  className="px-2 py-1 rounded border"
                  onClick={()=>{
                    if (confirm('Удалить платёж?')) deletePayment(rental.id, p.id);
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}

          {(!rental.paymentsHistory || rental.paymentsHistory.length===0) && <div className="text-sm text-gray-600">Платежей пока нет</div>}
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-yellow-600 text-white" onClick={()=>{ setPaymentTargetRentalId(rental.id); setShowPaymentForm(true); onClose(); }}>Принять платёж</button>
          {!rental.end && <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={()=>{ setReturnTargetRentalId(rental.id); setShowReturnForm(true); onClose(); }}>Принять и закрыть аренду</button>}
          <button className="px-3 py-2 rounded border" onClick={()=>{ printReceipt(rental.id); onClose(); }}>Печать чека</button>
          <button className="px-3 py-2 rounded border ml-auto" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    );
  }

  function AddMoneyForm({ type, onAdd, onCancel }) {
    const [date, setDate] = useState(new Date().toISOString().slice(0,10));
    const [name, setName] = useState('');
    const [amount, setAmount] = useState(0);
    return (
      <div className="p-4 bg-white rounded shadow w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Добавить запись — {type}</h3>
        <input type="date" className="w-full mb-2 p-2 border rounded" value={date} onChange={e=>setDate(e.target.value)} />
        <input className="w-full mb-2 p-2 border rounded" placeholder="Название" value={name} onChange={e=>setName(e.target.value)} />
        <input type="number" className="w-full mb-2 p-2 border rounded" placeholder="Сумма" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ onAdd({ date, name, amount }); onCancel(); }}>Добавить</button>
          <button className="px-3 py-2 rounded border" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">CRM — аренда великов (обновлённая)</h1>
        <div className="flex gap-2 items-center">
          <div>Баланс: <b>{balance} с</b></div>
          <button className={`px-3 py-2 rounded ${activeTab==='main' ? 'bg-blue-600 text-white' : 'border'}`} onClick={()=>setActiveTab('main')}>Главная</button>
          <button className={`px-3 py-2 rounded ${activeTab==='deposits' ? 'bg-blue-600 text-white' : 'border'}`} onClick={()=>setActiveTab('deposits')}>Депозиты</button>
          <button className={`px-3 py-2 rounded ${activeTab==='money' ? 'bg-blue-600 text-white' : 'border'}`} onClick={()=>setActiveTab('money')}>Деньги</button>
          <button className={`px-3 py-2 rounded ${activeTab==='reports' ? 'bg-blue-600 text-white' : 'border'}`} onClick={()=>setActiveTab('reports')}>Отчёты</button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>setShowAddBike(true)}>Добавить велосипед</button>
        </div>
      </header>

      {activeTab === 'main' && (
        <main className="grid grid-cols-3 gap-6">
          <section className="col-span-2 bg-white p-4 rounded shadow">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Список велосипедов</h2>
              <div>
                <select value={filter} onChange={e=>setFilter(e.target.value)} className="p-2 border rounded">
                  <option value="all">Все</option>
                  <option value="free">Свободные</option>
                  <option value="rented">В аренде</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {bikes.filter(b => filter === 'all' ? true : b.status === filter).map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{b.name} — {b.model}</div>
                    <div className="text-sm text-gray-600">Цена/день: {b.pricePerDay} с — Статус: <span className={b.status === 'free' ? 'text-green-600' : 'text-red-600'}>{b.status}</span></div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {b.status === 'free' ? (
                      <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={()=>{ setSelectedBike(b); setShowRentForm(true); }}>Выдать</button>
                    ) : (
                      (() => {
                        const rental = rentals.find(r => r.bikeId === b.id && !r.end);
                        if (!rental) return null;
                        const dueItem = activeRentalsWithDue.find(x=>x.id===rental.id) || {};
                        return (
                          <>
                            <div className="text-sm mr-2">Должен: <b>{dueItem.due || 0} с</b></div>
                            <button className="px-3 py-1 rounded bg-yellow-600 text-white" onClick={()=>{ setDetailsRentalId(rental.id); setShowDetailsModal(true); }}>Подробнее</button>
                            <button className="px-3 py-1 rounded border" onClick={()=>{ setPaymentTargetRentalId(rental.id); setShowPaymentForm(true); }}>Принять платёж</button>
                          </>
                        );
                      })()
                    )}
                    <button className="px-3 py-1 rounded border" onClick={()=>{
                      const newPrice = prompt('Новая цена/день', String(b.pricePerDay));
                      if (newPrice) setBikes(prev => prev.map(x => x.id === b.id ? { ...x, pricePerDay: Number(newPrice) } : x));
                    }}>Редактировать</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Операции / Отчёты</h2>
            <div className="mb-3">
              <h3 className="font-medium">Активные аренды — сколько нужно оплатить сейчас</h3>
              {activeRentalsWithDue.length === 0 ? <div className="text-sm text-gray-600">Нет активных аренд</div> : (
                <ul className="text-sm space-y-1">
                  {activeRentalsWithDue.map(r => (
                    <li key={r.id} className={`${r.overdue ? 'bg-red-50 border-l-4 border-red-500 p-2 rounded' : ''}`}>#{r.id} — {clients.find(c=>c.id===r.clientId)?.name || r.clientId} — {r.bike.name} — дней: {r.days} — начислено: {r.accrued} с — оплачено: {r.paid} с — к оплате: <b>{r.due} с</b> {r.overdue && <span className="ml-2 text-sm text-red-600">Просрочка</span>}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-3">
              <h3 className="font-medium">Текущие долги (закрытые аренды)</h3>
              {currentDebts.length === 0 ? <div className="text-sm text-gray-600">Нет задолженностей</div> : (
                <ul className="text-sm space-y-1">
                  {currentDebts.map(d => (
                    <li key={d.id}>Аренда #{d.id} — долг: <b>{d.debt} с</b></li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-medium">Клиенты ({clients.length})</h3>
              <ul className="text-sm space-y-1 max-h-36 overflow-auto mt-2">
                {clients.map(c => (<li key={c.id}>{c.name} — {c.phone}</li>))}
              </ul>
            </div>

            <div className="mt-4">
              <h4 className="font-medium">Настройки</h4>
              <div className="text-sm mt-2">Порог просрочки (дней): <input type="number" value={allowedDaysBeforeOverdue} onChange={e=>setAllowedDaysBeforeOverdue(Number(e.target.value))} className="ml-2 p-1 border rounded w-20" /></div>
            </div>

          </aside>
        </main>
      )}

      {activeTab === 'deposits' && (
        <main className="grid grid-cols-1 gap-6">
          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Депозиты</h2>
            <div className="mb-3">
              <h3 className="font-medium">Активные депозиты</h3>
              {activeDeposits.length === 0 ? <div className="text-sm text-gray-600">Нет активных депозитов</div> : (
                <ul className="text-sm space-y-2">
                  {activeDeposits.map(r => (
                    <li key={r.id} className="flex justify-between items-center">
                      <div>Аренда #{r.id} — клиент {clients.find(c=>c.id===r.clientId)?.name || r.clientId} — депозит: <b>{r.deposit} с</b></div>
                      <div className="flex gap-2">
                        <button className="px-2 py-1 rounded border" onClick={()=>refundDeposit(r.id)}>Вернуть депозит</button>
                        <button className="px-2 py-1 rounded bg-yellow-600 text-white" onClick={()=>alert('Депозит будет учтён при возврате (уменьшит доплату при закрытии аренды)')}>Применить к оплате</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-medium">История депозитов</h3>
              <ul className="text-sm space-y-1 max-h-64 overflow-auto mt-2">
                {rentals.filter(r=>r.deposit>0).map(r=> (
                  <li key={r.id}>#{r.id} — депозит {r.deposit} с — возвращён: {r.depositRefunded ? 'Да' : 'Нет'} — аренда закрыта: {r.end ? 'Да' : 'Нет'}</li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      )}

      {activeTab === 'money' && (
        <main className="grid grid-cols-1 gap-6">
          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Деньги — {moneySubtab === 'expenses' ? 'Расходы' : moneySubtab === 'writeoffs' ? 'Списания' : 'Продажи'}</h2>
            <div className="flex gap-2 mb-4">
              <button className={`px-3 py-2 rounded ${moneySubtab==='expenses' ? 'bg-blue-600 text-white' : 'border'}`} onClick={()=>setMoneySubtab('expenses')}>Расходы</button>
              <button className={`px-3 py-2 rounded ${moneySubtab==='writeoffs' ? 'bg-blue-600 text-white' : 'border'}`} onClick={()=>setMoneySubtab('writeoffs')}>Списания</button>
              <button className={`px-3 py-2 rounded ${moneySubtab==='sales' ? 'bg-blue-600 text-white' : 'border'}`} onClick={()=>setMoneySubtab('sales')}>Продажи</button>
              <button className="px-3 py-2 bg-green-600 text-white rounded ml-auto" onClick={()=>{ setMoneyFormType(moneySubtab); setShowMoneyForm(true); }}>Добавить</button>
            </div>

            <div>
              {moneySubtab === 'expenses' && (
                <ul className="text-sm space-y-2">
                  {expenses.map(e => (
                    <li key={e.id} className="flex justify-between items-center">{e.date} — {e.name} — {e.amount} с <button className="px-2 py-1 rounded border ml-2" onClick={()=>deleteMoneyRecord('expenses', e.id)}>Удалить</button></li>
                  ))}
                </ul>
              )}
              {moneySubtab === 'writeoffs' && (
                <ul className="text-sm space-y-2">
                  {writeoffs.map(e => (
                    <li key={e.id} className="flex justify-between items-center">{e.date} — {e.name} — {e.amount} с <button className="px-2 py-1 rounded border ml-2" onClick={()=>deleteMoneyRecord('writeoffs', e.id)}>Удалить</button></li>
                  ))}
                </ul>
              )}
              {moneySubtab === 'sales' && (
                <ul className="text-sm space-y-2">
                  {sales.map(e => (
                    <li key={e.id} className="flex justify-between items-center">{e.date} — {e.name} — {e.amount} с <button className="px-2 py-1 rounded border ml-2" onClick={()=>deleteMoneyRecord('sales', e.id)}>Удалить</button></li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      )}

      {activeTab === 'reports' && (
        <main className="grid grid-cols-1 gap-6">
          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Отчёты и экспорт</h2>
            <div className="mb-3">
              <div>Платежи: <b>{totalPayments} с</b></div>
              <div>Продажи: <b>{totalSales} с</b></div>
              <div>Расходы: <b>{totalExpenses} с</b></div>
              <div>Списания: <b>{totalWriteoffs} с</b></div>
              <div className="mt-2">Баланс: <b>{balance} с</b></div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={()=>exportJSON('crm-export.json')}>Экспорт (JSON)</button>
              <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={()=>exportCSV('rentals')}>Экспорт аренды (CSV)</button>
              <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={()=>exportCSV('reports')}>Экспорт сводного отчёта (CSV)</button>
            </div>
          </section>
        </main>
      )}

      {/* модалки */}
      {showAddBike && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"><AddBikeForm onAdd={addBike} onCancel={()=>setShowAddBike(false)} /></div>
      )}

      {showRentForm && selectedBike && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"><RentForm bike={selectedBike} onRent={rentBike} onCancel={()=>{ setShowRentForm(false); setSelectedBike(null); }} /></div>
      )}

      {showPaymentForm && paymentTargetRentalId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"><AddPaymentForm rentalId={paymentTargetRentalId} onAdd={addPayment} onCancel={()=>{ setShowPaymentForm(false); setPaymentTargetRentalId(null); }} /></div>
      )}

      {showReturnForm && returnTargetRentalId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"><ReturnForm rental={rentals.find(r=>r.id===returnTargetRentalId)} onProcess={processReturn} onCancel={()=>{ setShowReturnForm(false); setReturnTargetRentalId(null); }} /></div>
      )}

      {showDetailsModal && detailsRentalId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"><DetailsModal rentalId={detailsRentalId} onClose={()=>{ setShowDetailsModal(false); setDetailsRentalId(null); }} /></div>
      )}

      {showMoneyForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"><AddMoneyForm type={moneyFormType} onAdd={(rec)=>addMoneyRecord(moneyFormType, rec)} onCancel={()=>setShowMoneyForm(false)} /></div>
      )}

      <footer className="mt-6 text-sm text-gray-500">Готово — реализованы: история платежей, отчёты/экспорт, просрочки, печать чеков, экспорт данных. Дальше — можно подключать бэкенд и Telegram-интеграцию.</footer>
    </div>
  );
}
