import { useState, useEffect } from "react";

export default function App() {
  const [status, setStatus] = useState("дома");
  const [contact, setContact] = useState("");
  const [savedContact, setSavedContact] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  const [userId, setUserId] = useState(null);

  // При монтировании получаем user_id из Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      setUserId(window.Telegram.WebApp.initDataUnsafe.user.id);
    }
  }, []);

  // Таймер обратного отсчёта
  useEffect(() => {
    let interval;
    if (status === "не дома" && timerRunning) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, timerRunning]);

  // Отправляем статус на бэк
  const sendStatus = async (newStatus) => {
    if (!userId) return;
    try {
      await fetch("https://ТВОЙ-БЭК.render.com/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: newStatus }),
      });
    } catch (e) {
      console.error("Ошибка отправки статуса", e);
    }
  };

  // Сохраняем контакт
  const saveContact = async () => {
    if (!userId || !contact) return;
    try {
      await fetch("https://ТВОЙ-БЭК.render.com/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, contact }),
      });
      setSavedContact(contact);
      setContact("");
    } catch (e) {
      console.error("Ошибка сохранения контакта", e);
    }
  };

  // Переключение слайдера
  const toggleStatus = () => {
    const newStatus = status === "дома" ? "не дома" : "дома";
    setStatus(newStatus);
    sendStatus(newStatus);

    if (newStatus === "не дома") {
      setCountdown(30);
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
      setCountdown(30);
    }
  };

  return (
    <div
      className={`w-screen h-screen flex flex-col items-center justify-center transition-colors duration-500 ${
        status === "дома" ? "bg-green-200" : "bg-red-200"
      }`}
    >
      <div className="text-2xl font-bold mb-4">
        {status === "дома" ? "🏡 Дома" : "🚶 Не дома"}
      </div>

      <img
        src={
          status === "дома"
            ? "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png"
            : "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png"
        }
        alt="dog"
        className="w-64 h-64 object-contain mb-6"
      />

      {/* Таймер */}
      {status === "не дома" && (
        <div className="text-xl font-mono mb-6">
          Обратный отсчёт: {countdown} сек
        </div>
      )}

      {/* Слайдер */}
      <div className="flex items-center mb-6">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={status === "дома"}
              onChange={toggleStatus}
              className="sr-only"
            />
            <div className="w-16 h-8 bg-gray-300 rounded-full shadow-inner"></div>
            <div
              className={`absolute w-8 h-8 bg-white rounded-full shadow -left-1 -top-1 transition-transform duration-300 ${
                status === "дома" ? "translate-x-8" : ""
              }`}
            ></div>
          </div>
        </label>
      </div>

      {/* Экстренный контакт */}
      <div className="flex flex-col items-center">
        <input
          type="text"
          placeholder="@экстренный_контакт"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="border p-2 rounded mb-2"
        />
        <button
          onClick={saveContact}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Сохранить контакт
        </button>
        {savedContact && (
          <div className="mt-2 text-gray-700">
            Экстренный контакт: <b>{savedContact}</b>
          </div>
        )}
      </div>
    </div>
  );
}
