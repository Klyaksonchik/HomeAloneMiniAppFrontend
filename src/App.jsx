import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://homealoneminiapp.onrender.com"; // при необходимости замените

export default function App() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
  const userId = useMemo(() => tg?.initDataUnsafe?.user?.id ?? null, [tg]);

  const [isHome, setIsHome] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [busy, setBusy] = useState(false);

  const [contact, setContact] = useState("");
  const [editingContact, setEditingContact] = useState(false);

  const happyDog = "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png";
  const sadDog = "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png";

  useEffect(() => {
    try {
      tg?.ready?.();
      tg?.expand?.();
      tg?.MainButton?.hide?.();
    } catch {}
  }, [tg]);

  // подтягиваем сохранённый экстренный контакт
  useEffect(() => {
    if (!userId) return;
    axios
      .get(`${BACKEND_URL}/contact`, { params: { user_id: userId } })
      .then((r) => setContact(r?.data?.emergency_contact || ""))
      .catch(() => {});
  }, [userId]);

  const toggleStatus = async () => {
    if (!userId) {
      alert("Откройте мини‑апп из Telegram после команды /start боту.");
      return;
    }
    if (busy) return;

    setBusy(true);
    const username =
      tg?.initDataUnsafe?.user?.username
        ? `@${tg.initDataUnsafe.user.username}`
        : null;

    try {
      if (isHome) {
        setIsHome(false);
        setTimeLeft(30); // локальный тестовый таймер отображения
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
      alert(msg);
    } finally {
      setBusy(false);
    }
  };

  // локальный таймер отображения
  useEffect(() => {
    if (!timeLeft) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  // обработчик для кнопки Изменить/Сохранить контакт
  const onContactAction = async () => {
    if (!userId) {
      alert("Откройте мини‑апп из Telegram после команды /start боту.");
      return;
    }
    if (!editingContact) {
      setEditingContact(true);
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/contact`, {
        user_id: Number(userId),
        contact,
      });
      setEditingContact(false);
      alert("Контакт сохранён");
    } catch (e) {
      const msg =
        e?.response?.data?.error || e?.message || "Ошибка сохранения контакта";
      alert(msg);
    }
  };

  const isTelegramReady = !!userId;

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
            disabled={!isTelegramReady || busy}
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
      </div>
    </div>
  );
}
