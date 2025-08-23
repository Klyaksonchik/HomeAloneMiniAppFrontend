import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [status, setStatus] = useState("дома");
  const [contact, setContact] = useState("");
  const [savedContact, setSavedContact] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  // ID пользователя из MiniApp (в Telegram он всегда есть); fallback только для локальных тестов
  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 12345;

  // ТВОЙ бэкенд на Render
  const API_URL = "https://homealoneminiapp.onrender.com";

  // Загружаем сохранённый экстренный контакт при старте
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

  // Сохранить/обновить экстренный контакт
  const handleSaveContact = async () => {
    try {
      const res = await axios.post(`${API_URL}/contact`, {
        user_id: userId,
        contact,
      });
      if (res.data.success) {
        setSavedContact(contact);
        setIsEditing(false);
      } else {
        alert(res.data.error || "Не удалось сохранить контакт");
      }
    } catch (err) {
      console.error("Ошибка сохранения контакта:", err);
      alert("Ошибка сохранения контакта");
    }
  };

  // Переключение статуса через слайдер
  // ВАЖНО: checked === "дома" (зелёный), unchecked === "не дома" (красный)
  const handleToggle = async (checked) => {
    const newStatus = checked ? "дома" : "не дома";
    setStatus(newStatus);

    try {
      await axios.post(`${API_URL}/status`, {
        user_id: userId,
        status: newStatus,
      });
    } catch (err) {
      console.error("Ошибка изменения статуса:", err);
    }

    // Локальный обратный отсчёт (только отображение). Серверный таймер — в app.py
    if (newStatus === "не дома") {
      const duration = 30; // сек в тестовом режиме
      setTimeLeft(duration);
      const t = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) clearInterval(t);
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
    } else {
      setTimeLeft(null);
    }
  };

  return (
    <div
      className="app"
      style={{
        background: status === "дома" ? "#E9F8EC" : "#FFE6E6",
        minHeight: "100vh",
        paddingTop: "56px", // чтобы заголовок не уезжал под шторку Telegram
      }}
    >
      <div className="screen">
        <h1 className="title">🏠 Home Alone MiniApp</h1>

        <div className="card">
          <h3>Статус:</h3>
          <div className="slider-wrap">
            <label className="toggle">
              <input
                type="checkbox"
                checked={status === "дома"}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <div className="track"></div>
              <div className="thumb"></div>
              <div className="labels">
                <span className="left">Дома</span>
                <span className="right">Не дома</span>
              </div>
            </label>
          </div>
        </div>

        {/* Картинка по статусу */}
        <div className="hero">
          <img
            src={
              status === "дома"
                ? "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png" // счастливый пёс
                : "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png" // грустный пёс
            }
            alt="dog"
          />
        </div>

        {/* Таймер виден только в "не дома" */}
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
