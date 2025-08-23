import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // сюда пойдёт стиль слайдера

function App() {
  const [status, setStatus] = useState("дома");
  const [contact, setContact] = useState("");
  const [savedContact, setSavedContact] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 12345;
  const API_URL = "https://homealoneminiapp.onrender.com";

  useEffect(() => {
    axios
      .get(`${API_URL}/contact`, { params: { user_id: userId } })
      .then((res) => {
        if (res.data.emergency_contact) {
          setContact(res.data.emergency_contact);
          setSavedContact(res.data.emergency_contact);
          setIsEditing(false);
        }
      })
      .catch((err) => console.error("Ошибка загрузки контакта:", err));
  }, [userId]);

  const handleSaveContact = async () => {
    try {
      const res = await axios.post(`${API_URL}/contact`, {
        user_id: userId,
        contact,
      });
      if (res.data.success) {
        setSavedContact(contact);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Ошибка сохранения:", err);
    }
  };

  const handleToggle = async (checked) => {
    const newStatus = checked ? "не дома" : "дома";
    setStatus(newStatus);

    try {
      await axios.post(`${API_URL}/status`, {
        user_id: userId,
        status: newStatus,
      });
    } catch (err) {
      console.error("Ошибка изменения статуса:", err);
    }

    if (newStatus === "не дома") {
      const duration = 60; // секунд
      setTimeLeft(duration);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) clearInterval(timer);
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);

      try {
        await axios.post(`${API_URL}/start-timer`, {
          user_id: userId,
          contact: savedContact,
          duration,
        });
      } catch (err) {
        console.error("Ошибка запуска таймера:", err);
      }
    } else {
      setTimeLeft(null);
    }
  };

  return (
    <div
      className="app"
      style={{
        background: status === "дома" ? "#d9f9d9" : "#ffd9d9",
        minHeight: "100vh",
        paddingTop: "48px",
      }}
    >
      <div className="screen">
        <h1 className="title">🏠 Home Alone MiniApp</h1>

        <div className="card">
          <h3>Статус:</h3>
          <div className="toggle-container">
            <input
              type="checkbox"
              id="status-toggle"
              checked={status === "не дома"}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            <label htmlFor="status-toggle" className="toggle-label">
              <span className="toggle-text on">Дома</span>
              <span className="toggle-text off">Не дома</span>
              <span className="toggle-ball"></span>
            </label>
          </div>
        </div>

        <div className="hero">
          <img
            src={
              status === "дома"
                ? "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png"
                : "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png"
            }
            alt="dog"
          />
        </div>

        {status === "не дома" && (
          <div className="timer">⏳ Осталось: {timeLeft ?? "..."} сек</div>
        )}

        <div className="card">
          <h3>Экстренный контакт:</h3>
          <div className="row">
            <input
              className="input"
              type="text"
              value={contact}
              disabled={!isEditing}
              onChange={(e) => setContact(e.target.value)}
              placeholder="@username"
            />
            {isEditing ? (
              <button className="button" onClick={handleSaveContact}>
                Сохранить
              </button>
            ) : (
              <button className="button" onClick={() => setIsEditing(true)}>
                Изменить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
