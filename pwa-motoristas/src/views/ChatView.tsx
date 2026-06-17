import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRidesStore } from "@/stores/rides";
import { useAuthStore } from "@/stores/auth";

interface Message {
  id: number;
  message: string;
  is_driver: boolean;
  created_at: string;
  avatar?: string;
  sender_name?: string;
}

export default function ChatView() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const ridesStore = useRidesStore();
  const authStore = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [passengerName, setPassengerName] = useState("Passageiro");
  const [driverAvatar, setDriverAvatar] = useState<string | null>(null);

  const messagesContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    setupSocketListener();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!rideId) return
    try {
      const result = await ridesStore.getMessages(rideId);

      if (result.success) {
        setMessages(result.messages || []);

        const passenger = result.messages?.find((m: any) => !m.is_driver);

        if (passenger) {
          setPassengerName(passenger.sender_name);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const setupSocketListener = () => {
    // socket já tratado globalmente
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainer.current) {
        messagesContainer.current.scrollTop =
          messagesContainer.current.scrollHeight;
      }
    }, 50);
  };

  const sendMessage = async () => {
    if (!rideId || !newMessage.trim() || sending) return;

    setSending(true);

    const messageText = newMessage;

    setNewMessage("");

    const tempMsg: Message = {
      id: Date.now(),
      message: messageText,
      is_driver: true,
      created_at: new Date().toISOString(),
      avatar: driverAvatar || undefined,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const result = await ridesStore.sendMessage(rideId, messageText);

      if (!result.success) {
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="screen active"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header className="screen-header">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate(`/ride/${rideId}`)}
        >
          Voltar
        </button>

        <div
          style={{
            flex: 1,
            textAlign: "center",
          }}
        >
          <h1
            className="screen-title"
            style={{
              fontSize: "1rem",
            }}
          >
            {passengerName}
          </h1>

          <span
            className="badge badge-success"
            style={{
              fontSize: "0.625rem",
            }}
          >
            Online
          </span>
        </div>
      </header>

      <div
        ref={messagesContainer}
        className="screen-content"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.is_driver ? "own" : ""}`}
          >
            {!msg.is_driver && (
              <img
                src={msg.avatar || "/default-avatar.png"}
                alt=""
                className="chat-message-avatar"
              />
            )}

            <div
              className="chat-message-content"
              style={{
                maxWidth: "70%",
              }}
            >
              {!msg.is_driver && (
                <div
                  style={{
                    fontSize: "0.625rem",
                  }}
                >
                  {msg.sender_name}
                </div>
              )}

              <div
                className="chat-message-bubble"
                style={{
                  background: msg.is_driver
                    ? "var(--primary)"
                    : "var(--gray-100)",
                  color: msg.is_driver ? "#fff" : "var(--gray-900)",
                }}
              >
                {msg.message}
              </div>

              <div className="chat-message-time">
                {formatTime(msg.created_at)}
              </div>
            </div>

            {msg.is_driver && (
              <img
                src={driverAvatar || "/default-avatar.png"}
                alt=""
                className="chat-message-avatar"
              />
            )}
          </div>
        ))}
      </div>

      <div
        className="screen-footer"
        style={{
          padding: "1rem",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          style={{
            display: "flex",
            gap: ".5rem",
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="form-control"
            placeholder="Digite uma mensagem..."
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newMessage.trim() || sending}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
