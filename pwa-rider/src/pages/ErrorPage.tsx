import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError() as Error;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Erro</h1>
      <p>Algo deu errado.</p>
      <p>{error?.message}</p>
    </div>
  );
}