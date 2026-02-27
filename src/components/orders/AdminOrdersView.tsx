import { useState } from "react";
import OrderList from "./OrderList";
import CreateOrderForm from "./CreateOrderForm";
import OrderDetail from "./OrderDetail";
import type { Order } from "../../interfaces/OrderInterfaces";
import {
  downloadBatchReportsRequest,
  downloadInternalReportRequest,
  sendWorkOrderReportsByEmailRequest,
  sendWorkOrderReportsToClientsRequest,
} from "../../api/orders";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import styles from "../../styles/components/orders/AdminOrdersView.module.css";

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
  const { user } = useAuth();
  const { showModal } = useModal();

  const isAdmin = userRole === "admin";

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

  // Descargar informes internos (solo órdenes seleccionadas)
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

      if (selectedOrderIds.length === 1) {
        // Mantener comportamiento existente para 1 orden
        const id = selectedOrderIds[0];
        const { blob, fileName } = await downloadInternalReportRequest(id);
        triggerBrowserDownload(blob, fileName);
      } else {
        // Para varias órdenes → usar endpoint batch y descargar ZIP
        const { blob, fileName } = await downloadBatchReportsRequest({
          orderIds: selectedOrderIds,
          reportType: "internal",
        });
        triggerBrowserDownload(blob, fileName);
      }

      showModal({
        type: "success",
        title: "Descarga completa",
        message:
          selectedOrderIds.length === 1
            ? "Se descargó el informe interno."
            : `Se descargó el archivo con ${selectedOrderIds.length} informes internos.`,
      });
    } catch (err) {
      console.error("Error descargando informes internos:", err);
      showModal({
        type: "error",
        title: "Error al generar informes",
        message: "Ocurrió un error al generar los informes internos.",
      });
    } finally {
      setDownloading(false);
    }
  };

  // Enviar informes internos a MI correo (solo seleccionadas)
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

      await sendWorkOrderReportsByEmailRequest({
        orderIds: selectedOrderIds,
        reportType: "internal",
        toEmail,
      });

      showModal({
        type: "success",
        title: "Informes enviados",
        message: `Se enviaron ${selectedOrderIds.length} informe(s) interno(s) al correo ${toEmail}.`,
      });
    } catch (err) {
      console.error("Error enviando informes internos por correo:", err);
      showModal({
        type: "error",
        title: "Error al enviar informes",
        message: "Ocurrió un error al enviar los informes internos.",
      });
    } finally {
      setSendingToSelf(false);
    }
  };

  // Lógica real de envío automático a clientes (todas las COMPLETED)
  const doSendReportsToClients = async (): Promise<void> => {
    try {
      setSendingToClients(true);

      const resp = await sendWorkOrderReportsToClientsRequest();

      const total = resp?.data?.totalClientsNotified ?? 0;
      showModal({
        type: "success",
        title: "Informes enviados a clientes",
        message:
          total > 0
            ? `Se enviaron informes a ${total} cliente(s).`
            : "No se encontró ningún cliente con correos configurados para enviar informes.",
      });
    } catch (err) {
      console.error("Error enviando informes a clientes:", err);
      showModal({
        type: "error",
        title: "Error al enviar a clientes",
        message: "Ocurrió un error al enviar los informes a los clientes.",
      });
    } finally {
      setSendingToClients(false);
    }
  };

  // Mostrar modal de confirmación antes de enviar a clientes
  const handleSendReportsToClients = () => {
    showModal({
      type: "warning",
      title: "Enviar informes a clientes",
      message:
        "Se enviarán informes de TODAS las órdenes de servicio que estén FINALIZADAS a los correos de los usuarios contacto de cada cliente empresa. ¿Deseas continuar?",
      buttons: [
        {
          text: "Cancelar",
          variant: "secondary",
        },
        {
          text: "Enviar",
          variant: "primary",
          onClick: () => {
            void doSendReportsToClients();
          },
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
          {/* Descargar internos (requiere selección) */}
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!hasSelection || anyBusy}
            onClick={handleDownloadReports}
          >
            {downloading
              ? "Generando informes internos..."
              : `Descargar internos (${selectedOrderIds.length})`}
          </button>

          {/* Enviar internos a mi correo (requiere selección) */}
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!hasSelection || anyBusy}
            onClick={handleSendReportsToSelf}
          >
            {sendingToSelf
              ? "Enviando a mi correo..."
              : `Enviar a mi correo (${selectedOrderIds.length})`}
          </button>

          {/* Enviar a clientes (AUTOMÁTICO, no requiere selección) */}
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={anyBusy}
            onClick={handleSendReportsToClients}
          >
            {sendingToClients
              ? "Enviando a clientes..."
              : "Enviar informes a clientes"}
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
