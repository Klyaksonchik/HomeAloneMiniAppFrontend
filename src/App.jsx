import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [status, setStatus] = useState("дома");
  const [contact, setContact] = useState("");
  const [savedContact, setSavedContact] = useState("");
  const [isEditing, setIsEditing] = useState(true);

  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 12345;
  const API_URL = "https://homealoneminiapp.onrender.com"; // твой бекенд

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

  // Меняем статус
  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      await axios.post(`${API_URL}/status`, {
        user_id: userId,
        status: newStatus,
      });
    } catch (err) {
      console.error("Ошибка изменения статуса:", err);
    }
  };

  return (
    <div className="app">
      <div className="screen">
        {/* Заголовок */}
        <div className="header">
          <h1 className="title">🏠 Home Alone MiniApp</h1>
        </div>

        {/* Статус */}
        <div className="card">
          <h3>Статус:</h3>
          <div className="row">
            <button
              className="button"
              style={{
                background: status === "дома" ? "#8dd19a" : "#1f6feb",
              }}
              onClick={() => handleStatusChange("дома")}
            >
              Дома
            </button>
            <button
              className="button"
              style={{
                background: status === "не дома" ? "#f87171" : "#1f6feb",
              }}
              onClick={() => handleStatusChange("не дома")}
            >
              Не дома
            </button>
          </div>
        </div>

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

        {/* Подсказка */}
        <p className="hint">
          Таймер работает даже если приложение закрыто 🚀
        </p>
      </div>
    </div>
  );
}

export default App;
