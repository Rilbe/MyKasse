SUPABASE PATCH - Integration instructions
Place the files in your project and follow these steps.

Files in this patch:
- supabaseClient.js
- supabaseAdapter.js

Steps:
1) Copy `supabaseClient.js` and `supabaseAdapter.js` into your project folder `src/` (or keep them in `src/supabase_patch/` and import with './supabase_patch/...')
2) Install dependency:
   npm install @supabase/supabase-js

3) Add env variables locally:
   Create `.env.local` in project root with:
   REACT_APP_SUPABASE_URL=https://xyzcompany.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJ...anon...

   On Vercel add the same variables under Project → Settings → Environment Variables.

4) Minimal App.jsx changes to enable Supabase (two places):
   a) At the top of App.jsx add imports:
      import { loadAll, addBikeSupabase, addClientIfNeededSupabase, rentBikeSupabase, addPaymentSupabase, processReturnSupabase, addMoneyRecordSupabase } from './supabase_patch/supabaseAdapter';
   b) Add a flag:
      const USE_SUPABASE = Boolean(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);
   c) On initial load (inside useEffect that currently saves localStorage), add a new useEffect to fetch from Supabase if enabled:
      useEffect(() => {
        if (!USE_SUPABASE) return;
        (async () => {
          try {
            const res = await loadAll();
            setBikes(res.bikes);
            setClients(res.clients);
            setRentals(res.rentals);
            setExpenses(res.money.filter(m=>m.kind==='expenses'));
            setWriteoffs(res.money.filter(m=>m.kind==='writeoffs'));
            setSales(res.money.filter(m=>m.kind==='sales'));
          } catch (err) {
            console.error('Supabase load error', err);
          }
        })();
      }, []);

   d) For write operations, find these functions in App.jsx:
      - addBike
      - addClientIfNeeded
      - rentBike
      - addPayment
      - processReturn
      - addMoneyRecord

      Modify each to detect USE_SUPABASE and call the corresponding adapter function, for example:

      const addBike = async (bike) => {
        if (USE_SUPABASE) {
          const data = await addBikeSupabase(bike);
          setBikes(prev => [...prev, data]);
          setShowAddBike(false);
          return;
        }
        // existing localStorage logic here...
      };

   e) After edits, run locally:
      npm install
      npm start

Notes:
- This patch is designed to be minimally invasive. It does not automatically overwrite your App.jsx.
- It provides adapter functions to call Supabase. You still need to wire them into App.jsx where write/read logic lives.
- If you want, I can automatically apply the edits to App.jsx and produce an updated zip; say 'apply' and I'll patch App.jsx for you.
