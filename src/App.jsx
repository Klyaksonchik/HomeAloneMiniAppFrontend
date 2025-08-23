import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [status, setStatus] = useState("дома");
  const [contact, setContact] = useState("");
  const [savedContact, setSavedContact] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 12345;
  const API_URL = "https://homealoneminiapp.onrender.com";

  // Загружаем сохранённый контакт при старте
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

  // Сохраняем контакт
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

  // Переключение статуса
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

    // Если "не дома" → запускаем таймер на сервере
    if (newStatus === "не дома") {
      const duration = 60; // секунд, можно вынести в настройку
      setTimeLeft(duration);

      // локальный обратный отсчёт
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            clearInterval(timer);
          }
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);

      // отправляем на сервер, чтобы по истечении пришло сообщение
      try {
        await axios.post(`${API_URL}/start-timer`, {
          user_id: userId,
          duration, // в секундах
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
        paddingTop: "48px", // чтобы не залезало под шторку
      }}
    >
      <div className="screen">
        {/* Заголовок */}
        <h1 className="title">🏠 Home Alone MiniApp</h1>

        {/* Переключатель */}
        <div className="card">
          <h3>Статус:</h3>
          <label className="toggle">
            <input
              type="checkbox"
              checked={status === "не дома"}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            <span className="track"></span>
            <span className="thumb"></span>
          </label>
        </div>

        {/* Картинка */}
        <div className="hero">
          <img
            src={
              status === "дома"
                ? "https://i.postimg.cc/g2c0nwhz/2025-08-19-16-37-23.png" // счастливая собака
                : "https://i.postimg.cc/pLjFJ5TD/2025-08-19-16-33-44.png" // грустная собака
            }
            alt="dog"
          />
        </div>

        {/* Таймер */}
        {status === "не дома" && (
          <div className="timer">
            ⏳ Осталось: {timeLeft !== null ? timeLeft : "..."} сек
          </div>
        )}

        {/* Экстренный контакт */}
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
