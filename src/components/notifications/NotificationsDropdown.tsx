// src/components/notifications/NotificationsDropdown.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // 👈 IMPORTANTE
import styles from "../../styles/components/notifications/NotificationsDropdown.module.css";
import {
  moduleConfig,
  getNotificationModule,
  getFormattedMessage,
} from "../../utils/notificationUtils";
import {
  NotificationModule,
  type Notification,
} from "../../interfaces/NotificationInterfaces";

interface NotificationsDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  // No necesitas onViewOrder ni nada, solo navigate
}

type FilterType = "all" | NotificationModule;

export function NotificationsDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationsDropdownProps) {
  const navigate = useNavigate(); // 👈 USA ESTO
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [expandedModule, setExpandedModule] =
    useState<NotificationModule | null>(null);

  const groupedNotifications = useMemo(() => {
    const groups = new Map<NotificationModule, Notification[]>();

    notifications.forEach((notif) => {
      const module = getNotificationModule(notif.tipo);
      if (!groups.has(module)) {
        groups.set(module, []);
      }
      groups.get(module)?.push(notif);
    });

    return Array.from(groups.entries())
      .map(([module, notifs]) => ({
        module,
        notifications: notifs.sort(
          (a, b) =>
            new Date(b.fechaCreacion).getTime() -
            new Date(a.fechaCreacion).getTime(),
        ),
        unreadCount: notifs.filter((n) => !n.leida).length,
      }))
      .sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return b.notifications.length - a.notifications.length;
      });
  }, [notifications]);

  const filteredGroups = useMemo(() => {
    if (selectedFilter === "all") return groupedNotifications;
    return groupedNotifications.filter((g) => g.module === selectedFilter);
  }, [groupedNotifications, selectedFilter]);

  const handleNotificationClick = (notif: Notification) => {
    console.log("🔔 Click en notificación:", {
      id: notif.notificacionId,
      tipo: notif.tipo,
      data: notif.data,
    });

    if (!notif.leida) {
      onMarkAsRead(notif.notificacionId);
    }

    // 🔥 Navegación DIRECTA como en tu ejemplo
    if (notif.tipo.startsWith("WORK_ORDER")) {
      const id = notif.data?.workOrderId ?? notif.data?.ordenId;
      if (id) {
        console.log("📦 Navegando a orden:", id);
        navigate(`/orders/?ordenId=${id}`); // 👏 IGUAL QUE EN TU EJEMPLO
      } else {
        navigate("/orders");
      }
    } else if (notif.tipo.startsWith("STOCK")) {
      navigate("/inventory");
    } else if (notif.tipo.startsWith("USER")) {
      navigate("/users");
    } else if (notif.tipo.startsWith("SST")) {
      navigate("/sg-sst");
    } else if (notif.tipo.startsWith("PAYMENT")) {
      navigate("/payments");
    }

    onClose();
  };

  const toggleModule = (module: NotificationModule) => {
    setExpandedModule(expandedModule === module ? null : module);
  };

  const totalUnreadInFilter = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.unreadCount, 0);
  }, [filteredGroups]);

  return (
    <div className={styles.dropdown}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>Notificaciones</h3>
          {unreadCount > 0 && (
            <button
              className={styles.markAllReadButton}
              onClick={onMarkAllAsRead}
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Filtros por módulo */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${
              selectedFilter === "all" ? styles.filterButtonActive : ""
            }`}
            onClick={() => setSelectedFilter("all")}
          >
            Todas
            {unreadCount > 0 && (
              <span className={styles.filterBadge}>{unreadCount}</span>
            )}
          </button>

          {Object.values(NotificationModule).map((module) => {
            const moduleUnread =
              groupedNotifications.find((g) => g.module === module)
                ?.unreadCount || 0;
            const config = moduleConfig[module];

            return (
              <button
                key={module}
                className={`${styles.filterButton} ${
                  selectedFilter === module ? styles.filterButtonActive : ""
                }`}
                style={{
                  backgroundColor:
                    selectedFilter === module ? config.bgColor : "transparent",
                  color: selectedFilter === module ? "#fff" : config.color,
                }}
                onClick={() => setSelectedFilter(module)}
              >
                <span className={styles.filterIcon}>{config.icon}</span>
                {config.name.split(" ")[0]}
                {moduleUnread > 0 && (
                  <span
                    className={styles.filterBadge}
                    style={{ backgroundColor: config.color }}
                  >
                    {moduleUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className={styles.notificationsList}>
        {filteredGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔔</span>
            <p>No hay notificaciones</p>
          </div>
        ) : (
          filteredGroups.map(
            ({ module, notifications, unreadCount: moduleUnread }) => {
              const config = moduleConfig[module];
              const isExpanded =
                expandedModule === module || notifications.length <= 3;

              return (
                <div key={module} className={styles.moduleGroup}>
                  {/* Cabecera del módulo */}
                  <div
                    className={styles.moduleHeader}
                    onClick={() => toggleModule(module)}
                    style={{ backgroundColor: config.lightBg }}
                  >
                    <div className={styles.moduleHeaderLeft}>
                      <span className={styles.moduleIcon}>{config.icon}</span>
                      <span className={styles.moduleName}>{config.name}</span>
                      {moduleUnread > 0 && (
                        <span
                          className={styles.moduleBadge}
                          style={{ backgroundColor: config.color }}
                        >
                          {moduleUnread}
                        </span>
                      )}
                    </div>
                    <span className={styles.moduleCount}>
                      {notifications.length}{" "}
                      {notifications.length === 1
                        ? "notificación"
                        : "notificaciones"}
                    </span>
                  </div>

                  {/* Notificaciones del módulo */}
                  {(isExpanded ? notifications : notifications.slice(0, 3)).map(
                    (notif) => (
                      <div
                        key={notif.notificacionId}
                        className={`${styles.notificationItem} ${
                          !notif.leida ? styles.notificationItemUnread : ""
                        }`}
                        onClick={() => handleNotificationClick(notif)}
                        style={{
                          borderLeftColor: !notif.leida
                            ? config.color
                            : "transparent",
                        }}
                      >
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationHeader}>
                            <span className={styles.notificationTitle}>
                              {notif.titulo}
                            </span>
                            {!notif.leida && (
                              <span
                                className={styles.unreadDot}
                                style={{ backgroundColor: config.color }}
                              />
                            )}
                          </div>
                          <p className={styles.notificationMessage}>
                            {getFormattedMessage(notif)}
                          </p>
                          <div className={styles.notificationFooter}>
                            <span className={styles.notificationTime}>
                              {new Date(notif.fechaCreacion).toLocaleString()}
                            </span>
                            {!notif.leida && (
                              <button
                                className={styles.markReadButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(notif.notificacionId);
                                }}
                              >
                                Marcar como leída
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ),
                  )}

                  {/* Botón "Ver más" */}
                  {!isExpanded && notifications.length > 3 && (
                    <button
                      className={styles.viewMoreButton}
                      onClick={() => setExpandedModule(module)}
                    >
                      Ver {notifications.length - 3} notificaciones más
                    </button>
                  )}
                </div>
              );
            },
          )
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className={styles.footer}>
          <span className={styles.footerText}>
            {totalUnreadInFilter} no leídas •{" "}
            {filteredGroups.reduce((acc, g) => acc + g.notifications.length, 0)}{" "}
            total
          </span>
        </div>
      )}
    </div>
  );
}
