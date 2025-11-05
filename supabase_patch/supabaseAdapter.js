// supabase_patch/supabaseAdapter.js
// High-level adapter functions used by the App.
// These functions expect `supabase` from supabaseClient.js to be available.
import { supabase } from './supabaseClient';

/**
 * loadAll()
 * returns an object: { bikes, clients, rentals, payments, money }
 */
export async function loadAll() {
  if (!supabase) throw new Error('Supabase not configured');
  const [{ data: bikesData, error: e1 }, { data: clientsData, error: e2 }, { data: rentalsData, error: e3 }, { data: paymentsData, error: e4 }, { data: moneyData, error: e5 }] =
    await Promise.all([
      supabase.from('bikes').select('*').order('id', { ascending: true }),
      supabase.from('clients').select('*').order('id', { ascending: true }),
      supabase.from('rentals').select('*').order('id', { ascending: true }),
      supabase.from('payments').select('*').order('created_at', { ascending: true }),
      supabase.from('money_records').select('*').order('date', { ascending: false }),
    ]);
  if (e1 || e2 || e3 || e4 || e5) {
    console.warn('Supabase loadAll warnings', e1, e2, e3, e4, e5);
  }
  return {
    bikes: bikesData || [],
    clients: clientsData || [],
    rentals: (rentalsData || []).map(r => ({ ...r, paymentsHistory: (paymentsData || []).filter(p => p.rental_id === r.id) })),
    payments: paymentsData || [],
    money: moneyData || [],
  };
}

export async function addBikeSupabase(bike) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('bikes').insert([{ name: bike.name, model: bike.model, price_per_day: bike.pricePerDay, status: bike.status || 'free' }]).select().single();
  if (error) throw error;
  return data;
}

export async function addClientIfNeededSupabase(client) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: existing } = await supabase.from('clients').select('*').match({ phone: client.phone, name: client.name }).limit(1);
  if (existing && existing.length) return existing[0].id;
  const { data, error } = await supabase.from('clients').insert([{ name: client.name, phone: client.phone }]).select().single();
  if (error) throw error;
  return data.id;
}

export async function rentBikeSupabase({ bikeId, client, deposit, startDate }) {
  if (!supabase) throw new Error('Supabase not configured');
  const clientId = await addClientIfNeededSupabase(client);
  const start = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
  const { data, error } = await supabase.from('rentals').insert([{ bike_id: bikeId, client_id: clientId, start, deposit: Number(deposit || 0) }]).select().single();
  if (error) throw error;
  await supabase.from('bikes').update({ status: 'rented' }).eq('id', bikeId);
  return data;
}

export async function addPaymentSupabase(rentalId, amount, note) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('payments').insert([{ rental_id: rentalId, amount: Number(amount), note }]).select().single();
  if (error) throw error;
  // Optionally update rentals.paid field in DB (we avoid race conditions here; could re-fetch)
  return data;
}

export async function processReturnSupabase(rentalId, extraPaid = 0, bikes, rentals) {
  if (!supabase) throw new Error('Supabase not configured');
  const rental = rentals.find(r => r.id === rentalId);
  if (!rental) throw new Error('Rental not found');
  const bike = bikes.find(b => b.id === (rental.bike_id || rental.bikeId));
  const start = new Date(rental.start);
  const now = new Date();
  const MS_PER_DAY = 24 * 3600 * 1000;
  const days = Math.max(1, Math.ceil((now - start) / MS_PER_DAY));
  const priceTotal = (bike?.price_per_day ?? bike?.pricePerDay ?? 0) * days;
  const paidBefore = rental.paid || 0;
  const paidNow = paidBefore + Number(extraPaid || 0);
  const { error } = await supabase.from('rentals').update({ end: now.toISOString(), price_total: priceTotal, paid: paidNow }).eq('id', rentalId);
  if (error) throw error;
  await supabase.from('bikes').update({ status: 'free' }).eq('id', rental.bike_id || rental.bikeId);
  return { end: now.toISOString(), priceTotal, paidNow };
}

export async function addMoneyRecordSupabase(type, record) {
  if (!supabase) throw new Error('Supabase not configured');
  const { date, name, amount } = record;
  const { data, error } = await supabase.from('money_records').insert([{ kind: type, date, name, amount: Number(amount) }]).select().single();
  if (error) throw error;
  return data;
}
