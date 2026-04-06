import { useEffect, useRef, useState } from "react";
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

type ReadyPayload = {
  jobId?: string | number;
  token?: string;
  fileName?: string;
  reportType?: "internal" | "client";
  ordenId?: number;
  orderIds?: number[];
};

type ErrorPayload = {
  jobId?: string | number;
  message?: string;
};

type SentPayload = {
  jobId?: string | number;
  totalClientsNotified?: number;
};

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

  // Track del último job que esperamos (para no reaccionar a eventos viejos)
  const pendingJobIdRef = useRef<string | number | null>(null);
  const pendingKindRef = useRef<"download" | "email" | "clients" | null>(null);

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

  const isSamePendingJob = (jobId?: string | number) => {
    if (!pendingJobIdRef.current) return true; // si no hay pending, no filtramos
    return String(pendingJobIdRef.current) === String(jobId ?? "");
  };

  useSocketEvent<ReadyPayload>(socket, "workOrders.report.ready", (payload) => {
    if (!isSamePendingJob(payload?.jobId)) return;

    setDownloading(false);
    pendingJobIdRef.current = null;
    pendingKindRef.current = null;


    const token = payload?.token as string | undefined;
    const fileName = payload?.fileName || "reporte.pdf";
    const isZip = fileName.toLowerCase().endsWith(".zip");

    showModal({
      type: "success",
      title: "Archivo listo",
      message: isZip
        ? "El lote de informes se generó correctamente. Se descargará un .zip."
        : "El PDF se generó correctamente. Presiona 'Descargar' para guardarlo.",
      buttons: [
        { text: "Cerrar", variant: "secondary" },
        {
          text: "Descargar",
          variant: "primary",
          autoClose: true,
          onClick: async () => {
            try {
              if (!token) return;

              const { blob, fileName } = await downloadWorkOrderReportByTokenRequest(token, {
                fallbackFileName: payload?.fileName || "informes.zip",
              });

              triggerBrowserDownload(blob, fileName);
            } catch (err) {
              console.error("Error descargando por token:", err);
              showModal({
                type: "error",
                title: "Error descargando",
                message:
                  "No se pudo descargar el archivo. Intenta nuevamente (si el archivo era grande puede tardar).",
              });
            }
          },
        },
      ],
    });
  });

  useSocketEvent<SentPayload>(socket, "workOrders.report.sent", (payload) => {
    if (!isSamePendingJob(payload?.jobId)) return;

    setSendingToSelf(false);
    setSendingToClients(false);
    pendingJobIdRef.current = null;
    pendingKindRef.current = null;

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

  useSocketEvent<ErrorPayload>(socket, "workOrders.report.error", (payload) => {
    if (!isSamePendingJob(payload?.jobId)) return;

    setDownloading(false);
    setSendingToSelf(false);
    setSendingToClients(false);
    pendingJobIdRef.current = null;
    pendingKindRef.current = null;

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
      pendingJobIdRef.current = null;
      pendingKindRef.current = null;
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
      pendingKindRef.current = "download";

      showModal({
        type: "info",
        title: "Generando archivo",
        message:
          selectedOrderIds.length === 1
            ? "Estamos generando el informe en segundo plano. Te avisaremos cuando esté listo."
            : "Estamos generando el lote de informes (ZIP) en segundo plano. Te avisaremos cuando esté listo.",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });

      if (selectedOrderIds.length === 1) {
        const id = selectedOrderIds[0];
        const { jobId } = await enqueueWorkOrderReportRequest(id, {
          reportType: "internal",
          action: "download",
        });
        pendingJobIdRef.current = jobId;
      } else {
        const { jobId } = await enqueueBatchWorkOrderReportsRequest({
          orderIds: selectedOrderIds,
          reportType: "internal",
          action: "download",
        });
        pendingJobIdRef.current = jobId;
      }
    } catch (err) {
      console.error("Error generando informes internos:", err);
      setDownloading(false);
      pendingJobIdRef.current = null;
      pendingKindRef.current = null;

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
      pendingKindRef.current = "email";

      showModal({
        type: "info",
        title: "Enviando archivo",
        message:
          selectedOrderIds.length === 1
            ? "Se está generando y enviando el PDF en segundo plano. Te avisaremos cuando se envíe."
            : "Se está generando y enviando el lote (ZIP) en segundo plano. Te avisaremos cuando se envíe.",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });

      if (selectedOrderIds.length === 1) {
        const id = selectedOrderIds[0];

        const { jobId } = await enqueueWorkOrderReportRequest(id, {
          reportType: "internal",
          action: "email",
          toEmail,
        });
        pendingJobIdRef.current = jobId;
      } else {
        const { jobId } = await enqueueBatchWorkOrderReportsRequest({
          orderIds: selectedOrderIds,
          reportType: "internal",
          action: "email",
          toEmail,
        });
        pendingJobIdRef.current = jobId;
      }
    } catch (err) {
      console.error("Error enviando informes internos por correo:", err);
      setSendingToSelf(false);
      pendingJobIdRef.current = null;
      pendingKindRef.current = null;

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
      pendingKindRef.current = "clients";

      showModal({
        type: "info",
        title: "Enviando a clientes",
        message:
          "Se está procesando el envío en segundo plano. Te avisaremos cuando finalice.",
        buttons: [{ text: "Entendido", variant: "primary" }],
      });

      const { jobId } = await enqueueClientReportsRequest();
      pendingJobIdRef.current = jobId;
    } catch (err) {
      console.error("Error enviando informes a clientes:", err);
      setSendingToClients(false);
      pendingJobIdRef.current = null;
      pendingKindRef.current = null;

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