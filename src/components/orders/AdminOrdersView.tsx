import { useEffect, useState } from "react";
import OrderList from "./OrderList";
import CreateOrderForm from "./CreateOrderForm";
import OrderDetail from "./OrderDetail";
import type { Order } from "../../interfaces/OrderInterfaces";
import {
  enqueueWorkOrderReportRequest,
  enqueueBatchWorkOrderReportsRequest,
  enqueueClientReportsRequest,
  downloadWorkOrderReportByTokenRequest,
} from "../../api/orders";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import styles from "../../styles/components/orders/AdminOrdersView.module.css";
import { useSocket } from "../../context/SocketContext";
import { useSocketEvent } from "../../hooks/useSocketEvent";

interface Props {
  activeView: "list" | "create" | "detail";
  setActiveView: (view: "list" | "create" | "detail") => void;
  onBackToList: () => void;
  userRole: "admin" | "secretaria";
  initialOrderId?: number;
}

export default function AdminOrdersView({
  activeView,
  setActiveView,
  onBackToList,
  userRole,
  initialOrderId,
}: Props) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [sendingToSelf, setSendingToSelf] = useState(false);
  const [sendingToClients, setSendingToClients] = useState(false);

  const socket = useSocket();
  const { user } = useAuth();
  const { showModal } = useModal();

  const isAdmin = userRole === "admin";

  const triggerBrowserDownload = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  useSocketEvent<any>(socket, "workOrders.report.ready", (payload) => {
    setDownloading(false);

    showModal({
      type: "success",
      title: "Reporte listo",
      message:
        "El PDF se generó correctamente. Presiona 'Descargar' para guardarlo.",
      buttons: [
        { text: "Cerrar", variant: "secondary" },
        {
          text: "Descargar",
          variant: "primary",
          autoClose: true,
          onClick: async () => {
            try {
              const token = payload?.token as string | undefined;
              if (!token) return;

              const { blob, fileName } =
                await downloadWorkOrderReportByTokenRequest(token);

              triggerBrowserDownload(blob, fileName);
            } catch (err) {
              console.error("Error descargando por token:", err);
              showModal({
                type: "error",
                title: "Error descargando",
                message:
                  "No se pudo descargar el archivo. El token pudo haber expirado.",
              });
            }
          },
        },
      ],
    });
  });

  useSocketEvent<any>(socket, "workOrders.report.sent", (payload) => {
    setSendingToSelf(false);
    setSendingToClients(false);

    if (payload?.totalClientsNotified !== undefined) {
      showModal({
        type: "success",
        title: "Informes enviados a clientes",
        message:
          payload.totalClientsNotified > 0
            ? `Se enviaron informes a ${payload.totalClientsNotified} cliente(s).`
            : "No se encontró ningún cliente con correos configurados para enviar informes.",
      });
      return;
    }

    showModal({
      type: "success",
      title: "Correo enviado",
      message: "El informe se envió correctamente.",
    });
  });

  useSocketEvent<any>(socket, "workOrders.report.error", (payload) => {
    setDownloading(false);
    setSendingToSelf(false);
    setSendingToClients(false);

    showModal({
      type: "error",
      title: "Error generando informe",
      message: payload?.message || "Ocurrió un error generando el informe.",
    });
  });

  useEffect(() => {
    return () => {
      setDownloading(false);
      setSendingToSelf(false);
      setSendingToClients(false);
    };
  }, []);

  const handleCreateOrder = () => {
    if (!isAdmin) return;
    setActiveView("create");
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveView("detail");
  };

  const handleBack = () => {
    setSelectedOrder(null);
    onBackToList();
  };

  const handleDownloadReports = async (): Promise<void> => {
    if (selectedOrderIds.length === 0) {
      showModal({
        type: "warning",
        title: "Selecciona órdenes",
        message: "Selecciona al menos una orden de servicio completada.",
      });
      return;
    }

    try {
      setDownloading(true);

      showModal({
        type: "info",
        title: "Generando PDF",
        message:
          selectedOrderIds.length === 1
            ? "Estamos generando el informe en segundo plano. Te avisaremos cuando esté listo."
            : "Estamos generando el lote de informes en segundo plano. Te avisaremos cuando esté listo.",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });

      if (selectedOrderIds.length === 1) {
        const id = selectedOrderIds[0];

        await enqueueWorkOrderReportRequest(id, {
          reportType: "internal",
          action: "download",
        });
      } else {
        await enqueueBatchWorkOrderReportsRequest({
          orderIds: selectedOrderIds,
          reportType: "internal",
          action: "download",
        });
      }
    } catch (err) {
      console.error("Error generando informes internos:", err);
      setDownloading(false);

      showModal({
        type: "error",
        title: "Error al generar informes",
        message: "Ocurrió un error al generar los informes internos.",
      });
    }
  };

  const handleSendReportsToSelf = async (): Promise<void> => {
    if (selectedOrderIds.length === 0) {
      showModal({
        type: "warning",
        title: "Selecciona órdenes",
        message: "Selecciona al menos una orden de servicio completada.",
      });
      return;
    }

    const toEmail = user?.email;
    if (!toEmail) {
      showModal({
        type: "warning",
        title: "Correo no configurado",
        message:
          "Tu usuario no tiene un correo configurado. Contacta al administrador.",
      });
      return;
    }

    try {
      setSendingToSelf(true);

      showModal({
        type: "info",
        title: "Enviando PDF",
        message:
          selectedOrderIds.length === 1
            ? "Se está generando y enviando el PDF en segundo plano. Te avisaremos cuando se envíe."
            : "Se está generando y enviando el lote de PDFs en segundo plano. Te avisaremos cuando se envíe.",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });

      if (selectedOrderIds.length === 1) {
        const id = selectedOrderIds[0];

        await enqueueWorkOrderReportRequest(id, {
          reportType: "internal",
          action: "email",
          toEmail,
        });
      } else {
        await enqueueBatchWorkOrderReportsRequest({
          orderIds: selectedOrderIds,
          reportType: "internal",
          action: "email",
          toEmail,
        });
      }
    } catch (err) {
      console.error("Error enviando informes internos por correo:", err);
      setSendingToSelf(false);

      showModal({
        type: "error",
        title: "Error al enviar informes",
        message: "Ocurrió un error al enviar los informes internos.",
      });
    }
  };

  const doSendReportsToClients = async (): Promise<void> => {
    try {
      setSendingToClients(true);

      showModal({
        type: "info",
        title: "Enviando a clientes",
        message:
          "Se está procesando el envío en segundo plano. Te avisaremos cuando finalice.",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });

      await enqueueClientReportsRequest();
    } catch (err) {
      console.error("Error enviando informes a clientes:", err);
      setSendingToClients(false);

      showModal({
        type: "error",
        title: "Error al enviar a clientes",
        message: "Ocurrió un error al enviar los informes a los clientes.",
      });
    }
  };

  const handleSendReportsToClients = () => {
    showModal({
      type: "warning",
      title: "Enviar informes a clientes",
      message:
        "Se enviarán informes de TODAS las órdenes de servicio finalizadas a los correos de los usuarios contacto de cada cliente empresa. ¿Deseas continuar?",
      buttons: [
        { text: "Cancelar", variant: "secondary" },
        {
          text: "Enviar",
          variant: "primary",
          onClick: () => void doSendReportsToClients(),
        },
      ],
    });
  };

  if (activeView === "create" && isAdmin) {
    return <CreateOrderForm onSuccess={onBackToList} onCancel={onBackToList} />;
  }

  if (activeView === "detail" && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={handleBack}
        userRole={isAdmin ? "admin" : "secretaria"}
      />
    );
  }

  const hasSelection = selectedOrderIds.length > 0;
  const anyBusy = downloading || sendingToSelf || sendingToClients;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Órdenes de Servicio</h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!hasSelection || anyBusy}
            onClick={handleDownloadReports}
          >
            {downloading
              ? "Generando..."
              : `Descargar internos (${selectedOrderIds.length})`}
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!hasSelection || anyBusy}
            onClick={handleSendReportsToSelf}
          >
            {sendingToSelf
              ? "Enviando..."
              : `Enviar a mi correo (${selectedOrderIds.length})`}
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            disabled={anyBusy}
            onClick={handleSendReportsToClients}
          >
            {sendingToClients ? "Enviando..." : "Enviar informes a clientes"}
          </button>

          {isAdmin && (
            <button className={styles.createButton} onClick={handleCreateOrder}>
              + Crear Orden
            </button>
          )}
        </div>
      </div>

      <OrderList
        userRole="admin"
        onViewOrder={handleViewOrder}
        initialOrderId={initialOrderId}
        selectable
        selectedOrderIds={selectedOrderIds}
        onSelectionChange={setSelectedOrderIds}
      />
    </div>
  );
}
