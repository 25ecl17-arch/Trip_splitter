import { useState, useMemo } from "react";
import {
  Plane, Users, Receipt, Plus, X, Utensils, Car, BedDouble,
  Compass, ShoppingBag, Sparkles, ArrowRight, Trash2
} from "lucide-react";

const INK = "#1C2541";
const SAND = "#EDE4D3";
const PAPER = "#FFFBF2";
const TEAL = "#1E5F5A";
const CORAL = "#F2665E";
const MUSTARD = "#E8A83C";

const CATEGORIES = [
  { id: "food", label: "Food", icon: Utensils, color: CORAL },
  { id: "transport", label: "Transport", icon: Car, color: TEAL },
  { id: "lodging", label: "Lodging", icon: BedDouble, color: MUSTARD },
  { id: "activities", label: "Activities", icon: Compass, color: "#6B7FD7" },
  { id: "other", label: "Other", icon: ShoppingBag, color: "#8C8577" },
];
const CURRENCIES = ["$", "\u20B9", "\u20AC", "\u00A3"];

const catMeta = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[4];
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

function Perforation() {
  return (
    <div className="relative my-5 flex items-center">
      <div className="absolute -left-7 h-5 w-5 rounded-full" style={{ background: SAND }} />
      <div
        className="w-full h-0"
        style={{ borderTop: `2px dashed ${INK}55` }}
      />
      <div className="absolute -right-7 h-5 w-5 rounded-full" style={{ background: SAND }} />
    </div>
  );
}

function computeBalances(people, expenses) {
  const stats = {};
  people.forEach((p) => {
    stats[p.id] = {
      id: p.id,
      name: p.name,
      totalPaid: 0,
      totalShare: 0,
      numPaid: 0,
      catPaid: {},
    };
  });
  expenses.forEach((e) => {
    const payer = stats[e.paidBy];
    if (payer) {
      payer.totalPaid += e.amount;
      payer.numPaid += 1;
      payer.catPaid[e.category] = (payer.catPaid[e.category] || 0) + e.amount;
    }
    const among = e.splitAmong.length ? e.splitAmong : people.map((p) => p.id);
    const share = e.amount / among.length;
    among.forEach((pid) => {
      if (stats[pid]) stats[pid].totalShare += share;
    });
  });
  Object.values(stats).forEach((s) => {
    s.net = s.totalPaid - s.totalShare;
    let top = null;
    Object.entries(s.catPaid).forEach(([cat, amt]) => {
      if (!top || amt > top.amt) top = { cat, amt };
    });
    s.topCategory = top;
  });
  return stats;
}

function settleUp(stats) {
  const creditors = [];
  const debtors = [];
  Object.values(stats).forEach((s) => {
    if (s.net > 0.005) creditors.push({ id: s.id, name: s.name, amt: s.net });
    else if (s.net < -0.005) debtors.push({ id: s.id, name: s.name, amt: -s.net });
  });
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);
  const txns = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const amt = Math.min(d.amt, c.amt);
    if (amt > 0.005) txns.push({ from: d.name, to: c.name, amt });
    d.amt -= amt; c.amt -= amt;
    if (d.amt <= 0.005) i++;
    if (c.amt <= 0.005) j++;
  }
  return txns;
}

const BADGES = {
  ghost: { title: "The Ghost Payer", tag: "Never once picked up the tab.", color: "#8C8577" },
  food: { title: "The Foodie", tag: "Fueled the whole trip, one bill at a time.", color: CORAL },
  transport: { title: "The Uber Enthusiast", tag: "Kept everyone moving \u2014 for a price.", color: TEAL },
  lodging: { title: "The Jetsetter", tag: "Covered the roof over everyone's head.", color: MUSTARD },
  activities: { title: "The Adventurer", tag: "Booked the fun, billed the group.", color: "#6B7FD7" },
  other: { title: "The Wildcard", tag: "Paid for the stuff no one saw coming.", color: "#8C8577" },
  bigSpender: { title: "The Big Spender", tag: "Highest total on the books.", color: CORAL },
  generous: { title: "The Generous One", tag: "Covered the most individual bills.", color: TEAL },
  even: { title: "Even Steven", tag: "Paid in, took out, nearly perfectly balanced.", color: MUSTARD },
  debtor: { title: "The Runaway Debtor", tag: "Owes the group the most right now.", color: "#8C8577" },
  bank: { title: "Bank of the Trip", tag: "Everyone quietly owes this person.", color: "#6B7FD7" },
  steady: { title: "The Steady Splitter", tag: "Reliable, unremarkable, appreciated.", color: "#8C8577" },
};

function assignPersonalities(people, stats, hasExpenses) {
  const assigned = {};
  const used = new Set();
  const take = (personId, key) => {
    if (personId && !used.has(personId) && !assigned[personId]) {
      assigned[personId] = key;
      used.add(personId);
      return true;
    }
    return false;
  };

  if (hasExpenses) {
    const ghost = people.find((p) => stats[p.id].numPaid === 0);
    if (ghost) take(ghost.id, "ghost");

    CATEGORIES.forEach((cat) => {
      let leader = null;
      people.forEach((p) => {
        const amt = stats[p.id].catPaid[cat.id] || 0;
        if (amt > 0 && (!leader || amt > leader.amt)) leader = { id: p.id, amt };
      });
      if (leader) take(leader.id, cat.id);
    });

    const byPaid = [...people].sort((a, b) => stats[b.id].totalPaid - stats[a.id].totalPaid);
    for (const p of byPaid) if (take(p.id, "bigSpender")) break;

    const byCount = [...people].sort((a, b) => stats[b.id].numPaid - stats[a.id].numPaid);
    for (const p of byCount) if (take(p.id, "generous")) break;

    const byEven = [...people].sort((a, b) => Math.abs(stats[a.id].net) - Math.abs(stats[b.id].net));
    for (const p of byEven) if (take(p.id, "even")) break;

    const byDebt = [...people].sort((a, b) => stats[a.id].net - stats[b.id].net);
    for (const p of byDebt) if (stats[p.id].net < -0.005 && take(p.id, "debtor")) break;

    const byCredit = [...people].sort((a, b) => stats[b.id].net - stats[a.id].net);
    for (const p of byCredit) if (stats[p.id].net > 0.005 && take(p.id, "bank")) break;
  }

  people.forEach((p) => {
    if (!assigned[p.id]) assigned[p.id] = "steady";
  });
  return assigned;
}

export default function TripSplitter() {
  const [tripName, setTripName] = useState("Goa Weekend");
  const [currency, setCurrency] = useState("$");
  const [step, setStep] = useState(0);
  const [people, setPeople] = useState([{ id: uid(), name: "You" }]);
  const [nameInput, setNameInput] = useState("");
  const [expenses, setExpenses] = useState([]);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState([]);

  const stats = useMemo(() => computeBalances(people, expenses), [people, expenses]);
  const txns = useMemo(() => settleUp(stats), [stats]);
  const personalities = useMemo(
    () => assignPersonalities(people, stats, expenses.length > 0),
    [people, stats, expenses.length]
  );

  const addPerson = () => {
    const n = nameInput.trim();
    if (!n) return;
    setPeople([...people, { id: uid(), name: n }]);
    setNameInput("");
  };
  const removePerson = (id) => {
    setPeople(people.filter((p) => p.id !== id));
    setExpenses(expenses.filter((e) => e.paidBy !== id));
  };

  const toggleSplit = (id) => {
    setSplitAmong((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const addExpense = () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || !amt || amt <= 0 || !paidBy) return;
    const among = splitAmong.length ? splitAmong : people.map((p) => p.id);
    setExpenses([
      ...expenses,
      { id: uid(), description: desc.trim(), category, amount: amt, paidBy, splitAmong: among },
    ]);
    setDesc(""); setAmount(""); setSplitAmong([]);
  };
  const removeExpense = (id) => setExpenses(expenses.filter((e) => e.id !== id));

  const tabs = [
    { label: "People", icon: Users },
    { label: "Expenses", icon: Receipt },
    { label: "Settle Up", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen w-full flex justify-center p-4 md:p-8" style={{ background: SAND }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .font-display { font-family: 'Archivo Black', sans-serif; }
        .font-body { font-family: 'IBM Plex Sans', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="w-full max-w-2xl font-body">
        {/* Ticket header */}
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{ background: PAPER, border: `2px solid ${INK}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane size={22} style={{ color: TEAL }} />
              <span className="font-display text-sm tracking-wide" style={{ color: INK }}>
                TRIP SPLIT
              </span>
            </div>
            <div className="flex gap-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className="w-8 h-8 rounded-full font-mono text-sm"
                  style={{
                    background: currency === c ? TEAL : "transparent",
                    color: currency === c ? PAPER : INK,
                    border: `1px solid ${INK}33`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="font-mono text-xs tracking-widest" style={{ color: `${INK}99` }}>
              DESTINATION / TRIP NAME
            </label>
            <input
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="w-full mt-1 bg-transparent font-display text-2xl outline-none"
              style={{ color: INK }}
            />
          </div>

          <Perforation />

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((t, i) => {
              const Icon = t.icon;
              const active = step === i;
              return (
                <button
                  key={t.label}
                  onClick={() => setStep(i)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-mono text-xs tracking-wide transition"
                  style={{
                    background: active ? INK : "transparent",
                    color: active ? PAPER : INK,
                    border: `1px solid ${INK}`,
                  }}
                >
                  <Icon size={14} /> {t.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 0: People */}
        {step === 0 && (
          <div className="rounded-2xl p-6 mt-4 shadow-lg" style={{ background: PAPER, border: `2px solid ${INK}` }}>
            <h2 className="font-display text-lg mb-3" style={{ color: INK }}>WHO'S GOING?</h2>
            <div className="flex gap-2 mb-4">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPerson()}
                placeholder="Add a name"
                className="flex-1 px-3 py-2 rounded-lg font-body outline-none"
                style={{ border: `1px solid ${INK}55`, background: SAND, color: INK }}
              />
              <button
                onClick={addPerson}
                className="px-4 rounded-lg font-mono text-sm flex items-center gap-1"
                style={{ background: TEAL, color: PAPER }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full font-mono text-sm"
                  style={{ background: SAND, border: `1px solid ${INK}33`, color: INK }}
                >
                  {p.name}
                  <button onClick={() => removePerson(p.id)} style={{ color: `${INK}77` }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            {people.length === 0 && (
              <p className="font-mono text-xs mt-2" style={{ color: `${INK}77` }}>
                Add at least two people to start splitting.
              </p>
            )}
          </div>
        )}

        {/* STEP 1: Expenses */}
        {step === 1 && (
          <div className="rounded-2xl p-6 mt-4 shadow-lg" style={{ background: PAPER, border: `2px solid ${INK}` }}>
            <h2 className="font-display text-lg mb-3" style={{ color: INK }}>LOG AN EXPENSE</h2>

            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What was it for?"
              className="w-full px-3 py-2 rounded-lg mb-2 outline-none"
              style={{ border: `1px solid ${INK}55`, background: SAND, color: INK }}
            />

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Amount (${currency})`}
                type="number"
                className="px-3 py-2 rounded-lg font-mono outline-none"
                style={{ border: `1px solid ${INK}55`, background: SAND, color: INK }}
              />
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="px-3 py-2 rounded-lg outline-none"
                style={{ border: `1px solid ${INK}55`, background: SAND, color: INK }}
              >
                <option value="">Who paid?</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-xs"
                    style={{
                      background: active ? c.color : "transparent",
                      color: active ? PAPER : INK,
                      border: `1px solid ${active ? c.color : INK + "55"}`,
                    }}
                  >
                    <Icon size={12} /> {c.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-3">
              <p className="font-mono text-xs mb-1" style={{ color: `${INK}99` }}>
                SPLIT AMONG (blank = everyone)
              </p>
              <div className="flex flex-wrap gap-2">
                {people.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggleSplit(p.id)}
                    className="px-3 py-1 rounded-full font-mono text-xs"
                    style={{
                      background: splitAmong.includes(p.id) ? INK : "transparent",
                      color: splitAmong.includes(p.id) ? PAPER : INK,
                      border: `1px solid ${INK}55`,
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={addExpense}
              className="w-full py-2 rounded-lg font-mono text-sm flex items-center justify-center gap-1"
              style={{ background: CORAL, color: PAPER }}
            >
              <Plus size={16} /> Add Expense
            </button>

            <Perforation />

            <div className="space-y-2">
              {expenses.length === 0 && (
                <p className="font-mono text-xs" style={{ color: `${INK}77` }}>No expenses logged yet.</p>
              )}
              {expenses.map((e) => {
                const meta = catMeta(e.category);
                const Icon = meta.icon;
                const payer = people.find((p) => p.id === e.paidBy);
                return (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: SAND }}>
                    <div className="flex items-center gap-2">
                      <Icon size={16} style={{ color: meta.color }} />
                      <div>
                        <p className="font-body text-sm" style={{ color: INK }}>{e.description}</p>
                        <p className="font-mono text-xs" style={{ color: `${INK}77` }}>
                          {payer?.name || "?"} paid \u00b7 split {e.splitAmong.length} ways
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm" style={{ color: INK }}>{currency}{fmt(e.amount)}</span>
                      <button onClick={() => removeExpense(e.id)} style={{ color: `${INK}77` }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Settle Up */}
        {step === 2 && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl p-6 shadow-lg" style={{ background: PAPER, border: `2px solid ${INK}` }}>
              <h2 className="font-display text-lg mb-3" style={{ color: INK }}>BALANCES</h2>
              <div className="space-y-2 mb-4">
                {people.map((p) => {
                  const s = stats[p.id];
                  const positive = s.net >= 0;
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="font-body text-sm" style={{ color: INK }}>{p.name}</span>
                      <span
                        className="font-mono text-sm px-2 py-0.5 rounded"
                        style={{ color: positive ? TEAL : CORAL, background: positive ? `${TEAL}1A` : `${CORAL}1A` }}
                      >
                        {positive ? "is owed " : "owes "}{currency}{fmt(Math.abs(s.net))}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Perforation />

              <h3 className="font-display text-sm mb-2" style={{ color: INK }}>WHO PAYS WHOM</h3>
              {txns.length === 0 ? (
                <p className="font-mono text-xs" style={{ color: `${INK}77` }}>Everyone's square. Nice.</p>
              ) : (
                <div className="space-y-2">
                  {txns.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-sm" style={{ color: INK }}>
                      <span>{t.from}</span>
                      <ArrowRight size={14} style={{ color: `${INK}77` }} />
                      <span>{t.to}</span>
                      <span className="ml-auto" style={{ color: MUSTARD }}>{currency}{fmt(t.amt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {expenses.length > 0 && (
              <div>
                <h2 className="font-display text-lg mb-3 flex items-center gap-2" style={{ color: INK }}>
                  <Sparkles size={18} style={{ color: MUSTARD }} /> TRAVEL PERSONALITIES
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  {people.map((p, i) => {
                    const badgeKey = personalities[p.id];
                    const badge = BADGES[badgeKey];
                    const s = stats[p.id];
                    const rotate = i % 2 === 0 ? "-rotate-2" : "rotate-2";
                    return (
                      <div key={p.id} className={`relative ${rotate}`}>
                        <div
                          className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10"
                          style={{ background: PAPER, border: `2px solid ${INK}` }}
                        />
                        <div
                          className="rounded-xl p-4 pt-6 shadow-lg"
                          style={{ background: PAPER, border: `2px solid ${INK}` }}
                        >
                          <p className="font-mono text-xs tracking-widest mb-1" style={{ color: `${INK}88` }}>
                            {p.name.toUpperCase()}
                          </p>
                          <p className="font-display text-base leading-tight mb-1" style={{ color: badge.color }}>
                            {badge.title}
                          </p>
                          <p className="font-body text-xs mb-3" style={{ color: `${INK}AA` }}>
                            {badge.tag}
                          </p>
                          <div
                            className="flex justify-between font-mono text-xs pt-2"
                            style={{ borderTop: `1px dashed ${INK}44`, color: INK }}
                          >
                            <span>Paid {currency}{fmt(s.totalPaid)}</span>
                            <span>{s.numPaid} bill{s.numPaid === 1 ? "" : "s"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="font-mono text-xs text-center mt-5" style={{ color: `${INK}66` }}>
                  screenshot the cards \u00b7 send to the group chat
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
