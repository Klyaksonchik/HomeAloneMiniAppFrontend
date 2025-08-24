import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = "https://homealoneminiapp.onrender.com"; // замени на свой

export default function App() {
  const [isHome, setIsHome] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [contact, setContact] = useState("");

  // картинки собак
  const happyDog = "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png";
  const sadDog = "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png";

  // обработчик слайдера
  const toggleStatus = () => {
    if (isHome) {
      setIsHome(false);
      setTimeLeft(30); // тестовый таймер
      axios.post(`${BACKEND_URL}/start_timer`, { contact });
    } else {
      setIsHome(true);
      setTimeLeft(null);
      axios.post(`${BACKEND_URL}/cancel_timer`);
    }
  };

  // локальный таймер отображения
  useEffect(() => {
    if (!timeLeft) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  return (
    <div
      className="app"
      style={{ backgroundColor: isHome ? "#d4f7d4" : "#f7d4d4" }}
    >
      <h1>Home Alone App</h1>

      {/* Слайдер */}
      <div className="slider-container">
        <span className="status-label">🏠 Дома</span>
        <label className="switch">
          <input type="checkbox" checked={!isHome} onChange={toggleStatus} />
          <span className="slider round"></span>
        </label>
        <span className="status-label">🚶 Не дома</span>
      </div>

      {/* Таймер */}
      {!isHome && timeLeft !== null && (
        <div className="timer">Осталось: {timeLeft} сек.</div>
      )}

      {/* Ввод контакта */}
      <input
        className="contact-input"
        placeholder="@username экстренного контакта"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      <button
        onClick={() => axios.post(`${BACKEND_URL}/save_contact`, { contact })}
      >
        Сохранить экстренный контакт
      </button>

      {/* Картинка */}
      <img
        src={isHome ? happyDog : sadDog}
        alt="dog"
        className="dog-image"
      />
    </div>
  );
}
