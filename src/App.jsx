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
    <div className="app-container">
      <h1>🏠 Home Alone MiniApp</h1>

      <div className="block">
        <h3>Статус:</h3>
        <button
          className={status === "дома" ? "active" : ""}
          onClick={() => handleStatusChange("дома")}
        >
          Дома
        </button>
        <button
          className={status === "не дома" ? "active" : ""}
          onClick={() => handleStatusChange("не дома")}
        >
          Не дома
        </button>
      </div>

      <div className="block">
        <h3>Экстренный контакт:</h3>
        <input
          type="text"
          value={contact}
          disabled={!isEditing}
          onChange={(e) => setContact(e.target.value)}
          placeholder="@username"
        />
        {isEditing ? (
          <button onClick={handleSaveContact}>Сохранить</button>
        ) : (
          <button onClick={() => setIsEditing(true)}>Изменить</button>
        )}
      </div>

      <p className="note">
        Таймер работает даже если приложение закрыто 🚀
      </p>
    </div>
  );
}

export default App;
