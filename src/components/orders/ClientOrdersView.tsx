import { useState } from "react";
import OrderList from "./OrderList";
import CreateOrderForm from "./CreateOrderForm";
import OrderDetail from "./OrderDetail";
import type { Order } from "../../interfaces/OrderInterfaces";
import {
  downloadBatchReportsRequest,
  downloadClientReportRequest,
  sendWorkOrderReportsByEmailRequest,
} from "../../api/orders";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import styles from "../../styles/components/orders/ClientOrdersView.module.css";

interface Props {
  activeView: "list" | "create" | "detail";
  setActiveView: (view: "list" | "create" | "detail") => void;
  onBackToList: () => void;
  initialOrderId?: number;
}

export default function ClientOrdersView({
  activeView,
  setActiveView,
  onBackToList,
  initialOrderId,
}: Props) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { showModal } = useModal();

  const handleCreateOrder = () => {
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

  if (activeView === "create") {
    return <CreateOrderForm onSuccess={onBackToList} onCancel={onBackToList} />;
  }

  if (activeView === "detail" && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={handleBack}
        userRole="cliente"
      />
    );
  }

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

  // Descargar informes cliente (solo seleccionadas)
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
        const id = selectedOrderIds[0];
        const { blob, fileName } = await downloadClientReportRequest(id);
        triggerBrowserDownload(blob, fileName);
      } else {
        const { blob, fileName } = await downloadBatchReportsRequest({
          orderIds: selectedOrderIds,
          reportType: "client",
        });
        triggerBrowserDownload(blob, fileName);
      }

      showModal({
        type: "success",
        title: "Descarga completa",
        message:
          selectedOrderIds.length === 1
            ? "Se descargó el informe para cliente."
            : `Se descargó el archivo con ${selectedOrderIds.length} informes para cliente.`,
      });
    } catch (err) {
      console.error("Error descargando informes cliente:", err);
      showModal({
        type: "error",
        title: "Error al generar informes",
        message: "Ocurrió un error al generar los informes para cliente.",
      });
    } finally {
      setDownloading(false);
    }
  };

  // Enviar informes cliente al correo del usuario logueado
  const handleSendReportsByEmail = async (): Promise<void> => {
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
      setSending(true);

      await sendWorkOrderReportsByEmailRequest({
        orderIds: selectedOrderIds,
        reportType: "client",
        toEmail,
      });

      showModal({
        type: "success",
        title: "Informes enviados",
        message: `Se enviaron ${selectedOrderIds.length} informe(s) al correo ${toEmail}.`,
      });
    } catch (err) {
      console.error("Error enviando informes cliente por correo:", err);
      showModal({
        type: "error",
        title: "Error al enviar informes",
        message: "Ocurrió un error al enviar los informes.",
      });
    } finally {
      setSending(false);
    }
  };

  const hasSelection = selectedOrderIds.length > 0;
  const anyBusy = downloading || sending;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mis Solicitudes de Servicio</h1>
        <div className={styles.actions}>
          {/* Descargar informes cliente */}
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!hasSelection || anyBusy}
            onClick={handleDownloadReports}
          >
            {downloading
              ? "Generando informes cliente..."
              : `Descargar informes (${selectedOrderIds.length})`}
          </button>

          {/* Enviar informes cliente por correo */}
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!hasSelection || anyBusy}
            onClick={handleSendReportsByEmail}
          >
            {sending
              ? "Enviando informes por correo..."
              : `Enviar por correo (${selectedOrderIds.length})`}
          </button>

          <button className={styles.createButton} onClick={handleCreateOrder}>
            + Nueva Solicitud
          </button>
        </div>
      </div>

      <OrderList
        userRole="cliente"
        onViewOrder={handleViewOrder}
        initialOrderId={initialOrderId}
        selectable
        selectedOrderIds={selectedOrderIds}
        onSelectionChange={setSelectedOrderIds}
      />
    </div>
  );
}
