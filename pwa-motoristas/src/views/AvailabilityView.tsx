import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";

interface ScheduleDay {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

export default function AvailabilityView() {
  const navigate = useNavigate();
  const authStore = useAuthStore();

  const [loading, setLoading] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleDay[]>([
    { day: "Segunda", enabled: false, start: "08:00", end: "18:00" },
    { day: "Terça", enabled: false, start: "08:00", end: "18:00" },
    { day: "Quarta", enabled: false, start: "08:00", end: "18:00" },
    { day: "Quinta", enabled: false, start: "08:00", end: "18:00" },
    { day: "Sexta", enabled: false, start: "08:00", end: "18:00" },
    { day: "Sábado", enabled: false, start: "09:00", end: "14:00" },
    { day: "Domingo", enabled: false, start: "09:00", end: "14:00" },
  ]);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      const response = await api.get("/api/driver/availability");

      if (response.data) {
        setSchedule((prev) =>
          prev.map((day) => {
            const apiDay = response.data.find(
              (item: any) => item.day === day.day,
            );

            return apiDay
              ? {
                  ...day,
                  enabled: apiDay.enabled,
                  start: apiDay.start,
                  end: apiDay.end,
                }
              : day;
          }),
        );
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  }

  async function saveSchedule() {
    setLoading(true);

    try {
      await api.post("/api/driver/availability", schedule);

      alert("Disponibilidade salva!");
    } catch (error) {
      alert("Erro ao salvar disponibilidade");
    } finally {
      setLoading(false);
    }
  }

  async function setQuickSchedule(type: "work" | "weekend") {
    const updated = [...schedule];

    if (type === "work") {
      updated.forEach((day, index) => {
        if (index < 5) {
          day.enabled = true;
          day.start = "08:00";
          day.end = "18:00";
        }
      });
    }

    if (type === "weekend") {
      updated.forEach((day, index) => {
        if (index >= 5) {
          day.enabled = true;
          day.start = "09:00";
          day.end = "14:00";
        }
      });
    }

    setSchedule(updated);
    await saveSchedule();
  }

  function updateDay(index: number, field: keyof ScheduleDay, value: any) {
    const updated = [...schedule];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setSchedule(updated);
  }

  return (
    <div className="screen active">
      <header className="screen-header">
        <h1 className="screen-title">Disponibilidade</h1>
      </header>

      <div className="screen-content">
        {schedule.map((day, index) => (
          <div key={day.day}>
            <label>
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(e) => updateDay(index, "enabled", e.target.checked)}
              />
              {day.day}
            </label>

            {day.enabled && (
              <>
                <input
                  type="time"
                  value={day.start}
                  onChange={(e) => updateDay(index, "start", e.target.value)}
                />

                <input
                  type="time"
                  value={day.end}
                  onChange={(e) => updateDay(index, "end", e.target.value)}
                />
              </>
            )}
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <button onClick={() => setQuickSchedule("work")} disabled={loading}>
            Dias Úteis
          </button>

          <button
            onClick={() => setQuickSchedule("weekend")}
            disabled={loading}
          >
            Fim de Semana
          </button>

          <button onClick={saveSchedule} disabled={loading}>
            Salvar
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <strong>{authStore.isOnline ? "Online" : "Offline"}</strong>
        </div>
      </div>

      <nav className="bottom-nav">
        <button onClick={() => navigate("/")}>Início</button>

        <button onClick={() => navigate("/trips")}>Corridas</button>

        <button onClick={() => navigate("/taxmeter")}>Taxímetro</button>

        <button onClick={() => navigate("/earnings")}>Ganhos</button>

        <button onClick={() => navigate("/profile")}>Perfil</button>
      </nav>
    </div>
  );
}
