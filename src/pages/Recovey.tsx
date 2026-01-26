// src/pages/RecoveryPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "../styles/pages/LoginPage.module.css";

export default function RecoveryPage() {
  const navigate = useNavigate();
  const { requestPasswordReset, loading, error } = useAuth();

  const [email, setEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    try {
      const message = await requestPasswordReset(email);
      setSuccessMsg(message);
    } catch {
      // El error ya se maneja en el contexto (error)
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
          <h1 className={styles.title}>Recuperar contraseña</h1>
          <p className={styles.subtitle}>
            Ingresa tu correo electrónico para recibir un enlace de recuperación
          </p>

          {error && <div className={styles.error}>{error}</div>}
          {successMsg && <div className={styles.success}>{successMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Ingresa tu correo"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
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
