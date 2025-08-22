import React, { useEffect, useState } from "react";

export default function App() {
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState("дома");
  const [contact, setContact] = useState("");
  const [savedContact, setSavedContact] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // --- Получаем user_id из Telegram ---
  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setUserId(window.Telegram.WebApp.initDataUnsafe.user.id);
    } else {
      // fallback для теста
      setUserId(123456);
    }
  }, []);

  // --- Загружаем контакт при запуске ---
  useEffect(() => {
    if (!userId) return;
    fetch(`https://homealoneminiapp.onrender.com/contact?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.emergency_contact) {
          setSavedContact(data.emergency_contact);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      })
      .catch((err) => console.error("Ошибка загрузки контакта", err));
  }, [userId]);

  // --- Обновление статуса ---
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    fetch("https://homealoneminiapp.onrender.com/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, status: newStatus }),
    }).catch((err) => console.error("Ошибка обновления статуса", err));
  };

  // --- Сохранение контакта ---
  const handleSaveContact = () => {
    if (!contact.startsWith("@")) {
      alert("Введите username в формате @имя");
      return;
    }
    fetch("https://homealoneminiapp.onrender.com/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, contact }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSavedContact(contact);
          setIsEditing(false);
        }
      })
      .catch((err) => console.error("Ошибка сохранения контакта", err));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-6">🏠 Home Alone MiniApp</h1>

        {/* Слайдер */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">Статус:</label>
          <div className="flex items-center justify-between bg-gray-200 rounded-xl p-2">
            <button
              className={`flex-1 py-2 mx-1 rounded-xl transition ${
                status === "дома"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100"
              }`}
              onClick={() => handleStatusChange("дома")}
            >
              Дома
            </button>
            <button
              className={`flex-1 py-2 mx-1 rounded-xl transition ${
                status === "не дома"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100"
              }`}
              onClick={() => handleStatusChange("не дома")}
            >
              Не дома
            </button>
          </div>
        </div>

        {/* Экстренный контакт */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">
            Экстренный контакт:
          </label>
          {!isEditing ? (
            <div className="flex flex-col items-center">
              <p className="text-lg font-semibold mb-2">{savedContact}</p>
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl shadow"
                onClick={() => setIsEditing(true)}
              >
                Изменить
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="@username"
                className="border p-2 rounded-xl mb-2 w-full text-center"
              />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-xl shadow"
                onClick={handleSaveContact}
              >
                Сохранить
              </button>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500">
          Таймер работает даже если приложение закрыто 🚀
        </p>
      </div>
    </div>
  );
}
