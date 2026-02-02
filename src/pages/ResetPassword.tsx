// src/pages/ResetPasswordPage.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "../styles/pages/LoginPage.module.css";

// Iconos para mostrar/ocultar contraseña (los mismos que en LoginForm)
const EyeOpenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const navigate = useNavigate();
  const { resetPassword, loading, error } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Estados para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            src="/Assets/images/IMEC-DEL-NORTE.jpeg"
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
              <div className={styles.passwordInputContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={styles.passwordInput}
                  placeholder="Ingresa tu nueva contraseña"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  disabled={loading}
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmar contraseña
              </label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={styles.passwordInput}
                  placeholder="Repite tu nueva contraseña"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
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