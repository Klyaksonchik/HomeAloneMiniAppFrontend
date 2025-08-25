import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://homealoneminiapp.onrender.com";
const LS_KEY_CONTACT = "homealone_emergency_contact";

export default function App() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
  const userId = useMemo(() => tg?.initDataUnsafe?.user?.id ?? null, [tg]);
  const usernameFromTG = useMemo(() => {
    const u = tg?.initDataUnsafe?.user?.username;
    return u ? `@${u}` : null;
  }, [tg]);

  const [isHome, setIsHome] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState("");
  const [editingContact, setEditingContact] = useState(false);
  const [hasServerContact, setHasServerContact] = useState(false);

  const happyDog = "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png";
  const sadDog = "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png";

  useEffect(() => {
    try {
      tg?.ready?.();
      tg?.expand?.();
      tg?.MainButton?.hide?.();
    } catch {}
  }, [tg]);

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`${BACKEND_URL}/status`, { params: { user_id: userId } })
      .then((r) => {
        const serverStatus = r?.data?.status;
        setIsHome(serverStatus === "не дома" ? false : true);
        setHasServerContact(Boolean(r?.data?.emergency_contact_set));
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`${BACKEND_URL}/contact`, { params: { user_id: userId } })
      .then((r) => {
        const c = r?.data?.emergency_contact || "";
        if (c) {
          setContact(c);
          setHasServerContact(true);
          try {
            localStorage.setItem(LS_KEY_CONTACT, c);
          } catch {}
        } else {
          try {
            const cached = localStorage.getItem(LS_KEY_CONTACT);
            if (cached) setContact(cached);
          } catch {}
        }
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem(LS_KEY_CONTACT);
          if (cached) setContact(cached);
        } catch {}
      });
  }, [userId]);

  useEffect(() => {
    if (!timeLeft) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const toggleStatus = async () => {
    if (!userId || busy) return;
    const contactTrimmed = (contact || "").trim();
    const contactValid = contactTrimmed.startsWith("@") && contactTrimmed.length > 1;
    if (isHome && !contactValid) {  
      alert("Укажите экстренный контакт (@username), прежде чем уходить из дома.");
      return;
    }

    setBusy(true);
    try {
      if (isHome) {
        setIsHome(false);
        setTimeLeft(30);
        await axios.post(`${BACKEND_URL}/status`, {
          user_id: Number(userId),
          status: "не дома",
          username: usernameFromTG,
        });
      } else {
        setIsHome(true);
        setTimeLeft(null);
        await axios.post(`${BACKEND_URL}/status`, {
          user_id: Number(userId),
          status: "дома",
          username: usernameFromTG,
        });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Ошибка запроса";
      if (msg === "contact_required") {
        alert("Сначала укажите экстренный контакт (@username).");
      } else {
        alert(msg);
      }
      try {
        const r = await axios.get(`${BACKEND_URL}/status`, { params: { user_id: userId } });
        const serverStatus = r?.data?.status;
        setIsHome(serverStatus === "не дома" ? false : true);
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  const onContactAction = async () => {
    if (!userId) return;
    if (!editingContact) {
      setEditingContact(true);
      return;
    }
    let value = (contact || "").trim();
    if (value && !value.startsWith("@")) value = `@${value}`;
    if (!value || value === "@") {
      alert("Введите корректный @username экстренного контакта.");
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/contact`, {
        user_id: Number(userId),
        contact: value,
      });
      setContact(value);
      setEditingContact(false);
      setHasServerContact(true);
      try {
        localStorage.setItem(LS_KEY_CONTACT, value);
      } catch {}
      alert("Контакт сохранён");
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Ошибка сохранения контакта");
    }
  };

  const isTelegramReady = !!userId;
  const toggleDisabled = !isTelegramReady || busy || !(contact && contact.trim().length > 1);

  return (
    <div className={`app ${!isHome ? 'not-home' : ''}`}>
      <h1>Home Alone App</h1>

      {!isTelegramReady && (
        <div style={{ marginBottom: 12, color: "#a00", fontWeight: "bold" }}>
          Откройте мини‑апп из меню бота после команды /start
        </div>
      )}

      <div className="slider-container" style={{ opacity: isTelegramReady ? 1 : 0.6 }}>
        <span className="status-label">🏠 Дома</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={!isHome}
            onChange={toggleStatus}
            disabled={toggleDisabled}
          />
          <span className="slider round"></span>
        </label>
        <span className="status-label">🚶 Не дома</span>
      </div>

      <div className="status-hint">
        {isHome 
          ? "Когда уходишь из дома, сдвинь слайдер в положение «Не дома»"
          : "Когда вернёшься домой, сдвинь слайдер в положение «Дома»!"
        }
      </div>

      <img src={isHome ? happyDog : sadDog} alt="dog" className="dog-image" />

      {!isHome && timeLeft !== null && (
        <div className="timer">Осталось: {timeLeft} сек.</div>
      )}

      <div className="contact-section">
        <input
          className="contact-input"
          placeholder="@username экстренного контакта"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          disabled={!isTelegramReady}
          onClick={() => !contact && setEditingContact(true)}
        />
        {contact && (
          <button onClick={onContactAction} disabled={!isTelegramReady}>
            {editingContact ? "Сохранить" : "Изменить"}
          </button>
        )}
        {!hasServerContact && (
          <div className="contact-hint">
            Укажите экстренный контакт, чтобы включить режим «не дома»
          </div>
        )}
      </div>
    </div>
  );
}
