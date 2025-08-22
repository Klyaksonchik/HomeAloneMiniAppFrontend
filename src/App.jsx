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
          setIsEditing(false); // если контакт уже есть — сразу показываем "Изменить"
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

  // Меняем статус (дома / не дома)
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
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🏠 Home Alone MiniApp</h1>

      <div>
        <h3>Статус:</h3>
        <button onClick={() => handleStatusChange("дома")}>Дома</button>
        <button onClick={() => handleStatusChange("не дома")}>Не дома</button>
      </div>

      <div style={{ marginTop: "20px" }}>
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

      <p style={{ marginTop: "30px" }}>
        Таймер работает даже если приложение закрыто 🚀
      </p>
    </div>
  );
}

export default App;
