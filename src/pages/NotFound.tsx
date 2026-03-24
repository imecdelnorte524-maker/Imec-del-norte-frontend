import { useNavigate } from "react-router-dom";
import styles from "../styles/pages/NotFound.module.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <button
          onClick={() => navigate("/dashboard")}
          className={styles.button}
        >
          Volver al dashboard
        </button>
      </div>
    </div>
  );
}
