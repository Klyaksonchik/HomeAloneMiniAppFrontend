import { useEffect, useMemo, useRef, useState } from "react";

const BACKEND_BASE = "https://homealoneminiapp.onrender.com"; // твой Render

// Сколько секунд показывать обратный отсчёт на экране мини-аппа.
// ВНИМАНИЕ: сейчас бэкенд присылает напоминание через 30 сек (TEST_MODE=True).
// Здесь ставлю 30, чтобы фронт и бэк совпадали. Когда переведёшь бэк на 60 — поменяешь тут на 60.
const COUNTDOWN_SECONDS = 30;

export default function App() {
  // Telegram user_id (chat_id). Внутри Telegram он есть в initDataUnsafe.
  const [userId, setUserId] = useState(null);

  // UI состояние
  const [status, setStatus] = useState("дома"); // "дома" | "не дома"
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);

  // Экстренный контакт
  const [contactInput, setContactInput] = useState("");
  const [savedContact, setSavedContact] = useState("");
  const [loadingContact, setLoadingContact] = useState(false);

  // Фон экрана (зелёный/красный)
  const bgStyle = useMemo(() => {
    return status === "дома"
      ? { background: "linear-gradient(180deg, #d8f3dc 0%, #b7e4c7 100%)" }
      : { background: "linear-gradient(180deg, #ffd1d1 0%, #ffb1b1 100%)" };
  }, [status]);

  // Пробуем взять userId из Telegram WebApp. Для локальной проверки ничего не подставляем.
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    try {
      if (tg?.initDataUnsafe?.user?.id) {
        setUserId(tg.initDataUnsafe.user.id);
      }
      tg?.expand?.();
    } catch (e) {}
  }, []);

  // При старте — загрузить сохранённый контакт
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const resp = await fetch(`${BACKEND_BASE}/contact?user_id=${userId}`);
        const data = await resp.json();
        if (data?.emergency_contact) {
          setSavedContact(data.emergency_contact);
        }
      } catch (e) {
        // тихо игнорируем
      }
    })();
  }, [userId]);

  // Локальный обратный отсчёт (чисто для UX). Бэкенд свой таймер считает сам.
  useEffect(() => {
    if (status !== "не дома" || !timerRunning) return;
    setCountdown((prev) => (prev === COUNTDOWN_SECONDS ? prev : COUNTDOWN_SECONDS)); // защита
    const id = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status, timerRunning]);

  // Отправка статуса на бэкенд
  const sendStatus = async (newStatus) => {
    if (!userId) return;
    try {
      await fetch(`${BACKEND_BASE}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: newStatus }),
      });
    } catch (e) {}
  };

  // Сохранение экстренного контакта
  const saveContact = async () => {
    if (!userId) return;
    const value = contactInput.trim();
    if (!/^@[a-zA-Z0-9_]{5,}$/.test(value)) return; // простая валидация @username
    setLoadingContact(true);
    try {
      const resp = await fetch(`${BACKEND_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, contact: value }),
      });
      const ok = (await resp.json())?.success;
      if (ok) {
        setSavedContact(value);
        setContactInput("");
      }
    } catch (e) {
    } finally {
      setLoadingContact(false);
    }
  };

  // Переключение слайдера
  const toggleStatus = () => {
    const newStatus = status === "дома" ? "не дома" : "дома";
    setStatus(newStatus);
    sendStatus(newStatus);
    if (newStatus === "не дома") {
      setCountdown(COUNTDOWN_SECONDS);
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
      setCountdown(COUNTDOWN_SECONDS);
    }
  };

  // Картинка по состоянию
  const imageSrc =
    status === "дома"
      ? "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png"
      : "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png";

  return (
    <div className="app" style={bgStyle}>
      <div className="screen">
        <div className="header">
          <div className="title">HomeAlone</div>
          <div className="status-badge">
            {status === "дома" ? "🏡 Дома" : "🚶 Не дома"}
          </div>
        </div>

        <div className="card hero">
            <img src={imageSrc} alt={status === "дома" ? "happy dog" : "sad dog"} />
        </div>

        {status === "не дома" ? (
          <div className="card timer">
            Обратный отсчёт: {countdown} сек
          </div>
        ) : (
          <div className="hint">Переведи переключатель, когда уходишь из дома.</div>
        )}

        <div className="card slider-wrap" aria-label="Переключатель дома/не дома">
          <label className="toggle">
            <input
              type="checkbox"
              checked={status === "дома"}
              onChange={toggleStatus}
              aria-checked={status === "дома"}
              aria-label={status === "дома" ? "Сейчас дома" : "Сейчас не дома"}
            />
            <span className="track"></span>
            <span className="thumb"></span>
          </label>
        </div>

        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}>
            <input
              className="input"
              type="text"
              inputMode="text"
              placeholder="@экстренный_контакт"
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
            />
            <button
              className="button"
              onClick={saveContact}
              disabled={!/^@[a-zA-Z0-9_]{5,}$/.test(contactInput) || loadingContact || !userId}
            >
              {loadingContact ? "Сохраняю..." : "Сохранить"}
            </button>
          </div>
          <div className="hint">
            {savedContact
              ? <>Экстренный контакт: <b>{savedContact}</b>. Он получит уведомление, если ты не ответишь.</>
              : <>Укажи @username контакта, чтобы мы могли его предупредить.</>}
          </div>
        </div>

        {!userId && (
          <div className="hint">
            Открой мини-приложение **внутри Telegram**, чтобы всё работало (нужен твой user_id).
          </div>
        )}
      </div>
    </div>
  );
}
