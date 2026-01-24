// src/pages/ResetPasswordPage.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "../styles/pages/LoginPage.module.css";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const navigate = useNavigate();
  const { resetPassword, loading, error } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!token) {
      setLocalError(
        "Token inválido o ausente. Vuelve a solicitar la recuperación."
      );
      return;
    }

    if (password.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const message = await resetPassword(token, password);
      setSuccessMsg(message);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch {
      // Error global ya en `error`
    }
  };

  return (
    <div className={styles.container}>
      {/* Izquierda - Logo */}
      <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <img
            src="/Assets/images/LOGO_IMEC.png"
            alt="IMEC del Norte"
            className={styles.logo}
          />
          <p className={styles.tagline}>
            Sistema de Gestión de Mantenimiento Industrial
          </p>
        </div>
      </div>

      {/* Derecha - Formulario */}
      <div className={styles.rightSection}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Restablecer contraseña</h1>
          <p className={styles.subtitle}>Ingresa tu nueva contraseña</p>

          {localError && <div className={styles.error}>{localError}</div>}
          {error && <div className={styles.error}>{error}</div>}
          {successMsg && <div className={styles.success}>{successMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Nueva contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Ingresa tu nueva contraseña"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Repite tu nueva contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? "Actualizando..." : "Cambiar contraseña"}
            </button>

            <div className={styles.helpRow}>
              <button
                type="button"
                className={styles.button}
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}