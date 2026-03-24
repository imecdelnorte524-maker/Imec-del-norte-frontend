import { lazy } from "react";

export function lazyWithLoader<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  options?: { message?: string },
) {
  const message = options?.message ?? "Cargando módulo...";

  return lazy(async () => {
    window.dispatchEvent(
      new CustomEvent("globalLoading", {
        detail: { active: true, source: "lazy", message },
      }),
    );

    try {
      return await importer();
    } finally {
      window.dispatchEvent(
        new CustomEvent("globalLoading", {
          detail: { active: false, source: "lazy" },
        }),
      );
    }
  });
}
