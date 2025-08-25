import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const BACKEND_URL = "https://homealoneminiapp.onrender.com"; // замени на свой

export default function App() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
  const userId = useMemo(() => tg?.initDataUnsafe?.user?.id ?? null, [tg]);
  const [isHome, setIsHome] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [contact, setContact] = useState("");

  const happyDog = "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png";
  const sadDog = "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png";

  useEffect(() => {
    tg?.ready?.();
  }, [tg]);

  // подтянуть сохранённый контакт при наличии userId
  useEffect(() => {
    if (!userId) return;
    axios
      .get(`${BACKEND_URL}/contact`, { params: { user_id: userId } })
      .then((res) => setContact(res?.data?.emergency_contact || ""))
      .catch(() => {});
  }, [userId]);

  const toggleStatus = async () => {
    if (!userId) {
      alert("Открой приложение внутри Telegram (mini app).");
      return;
    }
    try {
      if (isHome) {
        setIsHome(false);
        setTimeLeft(30);
        await axios.post(`${BACKEND_URL}/status`, {
          user_id: Number(userId),
          status: "не дома",
        });
      } else {
        setIsHome(true);
        setTimeLeft(null);
        await axios.post(`${BACKEND_URL}/status`, {
          user_id: Number(userId),
          status: "дома",
        });
      }
    } catch (e) {
      console.error(e);
      alert("Ошибка запроса");
    }
  };

  useEffect(() => {
    if (!timeLeft) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const saveContact = async () => {
    if (!userId) {
      alert("Открой приложение внутри Telegram (mini app).");
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/contact`, {
        user_id: Number(userId),
        contact,
      });
      alert("Контакт сохранён");
    } catch {
      alert("Ошибка сохранения контакта");
    }
  };

  const isTelegram = !!userId;

  return (
    <div className="app" style={{ backgroundColor: isHome ? "#d4f7d4" : "#f7d4d4" }}>
      <h1>Home Alone App</h1>

      {!isTelegram && (
        <div style={{ marginBottom: 12, color: "#a00", fontWeight: "bold" }}>
          Открой приложение внутри Telegram после команды /start
        </div>
      )}

      <div className="slider-container" style={{ opacity: isTelegram ? 1 : 0.6 }}>
        <span className="status-label">🏠 Дома</span>
        <label className="switch">
          <input type="checkbox" checked={!isHome} onChange={toggleStatus} disabled={!isTelegram} />
          <span className="slider round"></span>
        </label>
        <span className="status-label">🚶 Не дома</span>
      </div>

      {!isHome && timeLeft !== null && (
        <div className="timer">Осталось: {timeLeft} сек.</div>
      )}

      <input
        className="contact-input"
        placeholder="@username экстренного контакта"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        disabled={!isTelegram}
      />
      <button onClick={saveContact} disabled={!isTelegram}>
        Сохранить экстренный контакт
      </button>

      <img src={isHome ? happyDog : sadDog} alt="dog" className="dog-image" />
    </div>
  );
}
