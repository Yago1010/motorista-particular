import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useToast } from '@/composables/useToast'

interface Earnings {
  total: number;
  week: number;
  today: number;
  rides_count: number;
  total_distance: number;
  total_time: number;
  avg_rating: number;
  available_balance: number;
}

interface EarningsDetail {
  id: number;
  date: string;
  rides_count: number;
  distance: number;
  amount: number;
}

export default function EarningsView() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [earnings, setEarnings] = useState<Earnings>({
    total: 0,
    week: 0,
    today: 0,
    rides_count: 0,
    total_distance: 0,
    total_time: 0,
    avg_rating: 5,
    available_balance: 0,
  });

  const [earningsDetails, setEarningsDetails] = useState<EarningsDetail[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);

  const [filterPeriod, setFilterPeriod] = useState<"week" | "month" | "year">(
    "week",
  );

  useEffect(() => {
    loadEarnings();
  }, [filterPeriod]);

  const loadEarnings = async () => {
    setEarningsLoading(true);

    try {
      const [summaryRes, detailsRes] = await Promise.all([
        api.get("/api/driver/earnings/summary"),
        api.get("/api/driver/earnings/details", {
          params: { period: filterPeriod },
        }),
      ]);

      setEarnings((prev) => ({
        ...prev,
        ...summaryRes.data,
      }));

      setEarningsDetails(detailsRes.data || []);
    } catch (error) {
      showToast("Erro ao carregar ganhos", "error");
    } finally {
      setEarningsLoading(false);
    }
  };

  const requestWithdrawal = async () => {
    try {
      const result = await api.post("/api/driver/earnings/withdraw");

      if (result.data.success) {
        showToast("Saque solicitado com sucesso!", "success");
        loadEarnings();
      } else {
        showToast(result.data.message || "Erro ao solicitar saque", "error");
      }
    } catch {
      showToast("Erro ao solicitar saque", "error");
    }
  };

  const formatDistance = (meters: number) => {
    if (!meters) return "0 km";
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "0h";

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${mins}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="screen active">
      <header className="screen-header">
        <h1 className="screen-title">Ganhos</h1>
      </header>

      <div className="screen-content">
        {/* Cards resumo */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="card">
            <div className="card-body">
              <small>Total Ganho</small>
              <h2>{formatCurrency(earnings.total)}</h2>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <small>Esta Semana</small>
              <h2>{formatCurrency(earnings.week)}</h2>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <small>Hoje</small>
              <h2>{formatCurrency(earnings.today)}</h2>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <small>Corridas</small>
              <h2>{earnings.rides_count}</h2>
            </div>
          </div>
        </div>

        {/* Estatísticas */}

        <div className="card">
          <div className="card-header">Estatísticas</div>

          <div className="card-body">
            <p>Distância: {formatDistance(earnings.total_distance)}</p>

            <p>Tempo Online: {formatTime(earnings.total_time)}</p>

            <p>Avaliação: {earnings.avg_rating?.toFixed(1) || "5.0"}</p>
          </div>
        </div>

        {/* Filtro */}

        <div className="card">
          <div className="card-header">
            <select
              value={filterPeriod}
              onChange={(e) =>
                setFilterPeriod(e.target.value as "week" | "month" | "year")
              }
            >
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
            </select>
          </div>

          <div className="card-body">
            {earningsLoading && <div>Carregando ganhos...</div>}

            {!earningsLoading && earningsDetails.length === 0 && (
              <div>Nenhum ganho neste período</div>
            )}

            {!earningsLoading &&
              earningsDetails.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "1rem",
                    borderBottom: "1px solid var(--gray-200)",
                  }}
                >
                  <div>
                    <strong>{formatDate(item.date)}</strong>

                    <div>
                      {item.rides_count} corridas •{" "}
                      {formatDistance(item.distance)}
                    </div>
                  </div>

                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
              ))}
          </div>
        </div>

        <div style={{ padding: "1rem" }}>
          <button
            className="btn btn-primary btn-block"
            onClick={requestWithdrawal}
          >
            Solicitar Saque ({formatCurrency(earnings.available_balance)})
          </button>
        </div>
      </div>

      <nav className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate("/")}>
          Início
        </button>

        <button className="bottom-nav-item" onClick={() => navigate("/trips")}>
          Corridas
        </button>

        <button
          className="bottom-nav-item"
          onClick={() => navigate("/taxmeter")}
        >
          Taxímetro
        </button>

        <button
          className="bottom-nav-item active"
          onClick={() => navigate("/earnings")}
        >
          Ganhos
        </button>

        <button
          className="bottom-nav-item"
          onClick={() => navigate("/profile")}
        >
          Perfil
        </button>
      </nav>
    </div>
  );
}
