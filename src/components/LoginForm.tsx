// src/components/LoginForm.tsx

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import styles from "../styles/pages/LoginPage.module.css";

export default function LoginForm() {
  const { login, loading, error, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.mustChangePassword) {
        navigate("/profile", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      // La redirección la maneja el useEffect según mustChangePassword
    } catch (err) {
      console.error("❌ [ERROR] En handleSubmit:", err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Sección izquierda - Logo */}
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

      {/* Sección derecha - Formulario */}
      <div className={styles.rightSection}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Bienvenido</h1>
          <p className={styles.subtitle}>Ingresa a tu cuenta para continuar</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                Usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className={styles.input}
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
            <div className={styles.helpRow}>
              <button
                type="button"
                className={styles.button}
                onClick={() => navigate("/recovery")}
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Tu sistema de gestión confiable
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}