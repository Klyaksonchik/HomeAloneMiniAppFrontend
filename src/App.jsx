import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://homealoneminiapp.onrender.com"; // замените при необходимости
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

  // Инициализация Telegram WebApp
  useEffect(() => {
    try {
      tg?.ready?.();
      tg?.expand?.();
      tg?.MainButton?.hide?.();
    } catch {}
  }, [tg]);

  // Подтянуть статус и признак наличия контакта с бэка
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

  // Подтянуть контакт: приоритет — бэк; если пусто/ошибка — берем из localStorage
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
          // Бэк вернул пусто: попробуем локальный кэш
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

  // Локальный таймер отображения (демо 30 сек)
  useEffect(() => {
    if (!timeLeft) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const toggleStatus = async () => {
    if (!userId) {
      alert("Откройте мини‑апп из Telegram после команды /start боту.");
      return;
    }
    if (busy) return;

    // запрет “не дома” без контакта
    const contactTrimmed = (contact || "").trim();
    const contactValid = contactTrimmed.startsWith("@") && contactTrimmed.length > 1;
    if (isHome && !contactValid) {
      alert("Укажите экстренный контакт (@username), прежде чем уходить из дома.");
      return;
    }

    setBusy(true);
    const username = usernameFromTG;

    try {
      if (isHome) {
        setIsHome(false);
        setTimeLeft(30);
        await axios.post(`${BACKEND_URL}/status`, {
          user_id: Number(userId),
          status: "не дома",
          username,
        });
      } else {
        setIsHome(true);
        setTimeLeft(null);
        await axios.post(`${BACKEND_URL}/status`, {
          user_id: Number(userId),
          status: "дома",
          username,
        });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Ошибка запроса";
      if (msg === "contact_required") {
        alert("Сначала укажите экстренный контакт (@username).");
      } else {
        alert(msg);
      }
      // Откатываем визуально к серверному состоянию
      try {
        const r = await axios.get(`${BACKEND_URL}/status`, { params: { user_id: userId } });
        const serverStatus = r?.data?.status;
        setIsHome(serverStatus === "не дома" ? false : true);
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  // Кнопка “Изменить/Сохранить” экстренного контакта
  const onContactAction = async () => {
    if (!userId) {
      alert("Откройте мини‑апп из Telegram после команды /start боту.");
      return;
    }
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
      const msg = e?.response?.data?.error || e?.message || "Ошибка сохранения контакта";
      alert(msg);
    }
  };

  const isTelegramReady = !!userId;
  const toggleDisabled = !isTelegramReady || busy || !(contact && contact.trim().length > 1);

  return (
    <div className="app" style={{ backgroundColor: isHome ? "#d4f7d4" : "#f7d4d4" }}>
      <h1>Home Alone App</h1>

      {!isTelegramReady && (
        <div style={{ marginBottom: 12, color: "#a00", fontWeight: "bold" }}>
          Откройте мини‑апп из меню бота после команды /start
        </div>
      )}

      {/* Слайдер состояния */}
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

      {/* Таймер */}
      {!isHome && timeLeft !== null && (
        <div className="timer">Осталось: {timeLeft} сек.</div>
      )}

      {/* Картинка */}
      <img src={isHome ? happyDog : sadDog} alt="dog" className="dog-image" />

      {/* Экстренный контакт — внизу */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <input
          className="contact-input"
          placeholder="@username экстренного контакта"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          disabled={!isTelegramReady || !editingContact}
        />
        <button onClick={onContactAction} disabled={!isTelegramReady}>
          {editingContact ? "Сохранить" : "Изменить"}
        </button>
        {!hasServerContact && (
          <div style={{ marginTop: 8, color: "#a00" }}>
            Укажите экстренный контакт, чтобы включить режим “не дома”.
          </div>
        )}
      </div>
    </div>
  );
}
