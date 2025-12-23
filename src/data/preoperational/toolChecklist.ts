// Tipos básicos
export interface ChecklistParameter {
  id: string;
  parameter: string;
  description?: string;
  category: 'safety' | 'functional' | 'visual' | 'operational' | 'electrical';
  required: boolean;
  critical: boolean;
}

export interface ToolChecklist {
  toolType: string;
  toolCategory: string;
  parameters: ChecklistParameter[];
  additionalInstructions?: string;
  requiresTools?: string[];
  estimatedTime: number;
}

// Checklists basados en tus documentos
export const TOOL_CHECKLISTS: ToolChecklist[] = [
  {
    toolType: 'ESCALERA',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 10,
    parameters: [
      { id: 'ESC-001', parameter: '¿Bisagra con seguro, para fijar, funcional/firme?', category: 'safety', required: true, critical: true },
      { id: 'ESC-002', parameter: '¿Fisuras o golpes?', category: 'visual', required: true, critical: true },
      { id: 'ESC-003', parameter: '¿Peldaños en buen estado?', category: 'safety', required: true, critical: true },
      { id: 'ESC-004', parameter: '¿Topes antideslizantes, instalados y en buen estado?', category: 'safety', required: true, critical: true },
      { id: 'ESC-005', parameter: '¿Manchas de pintura o cemento?', category: 'visual', required: false, critical: false },
      { id: 'ESC-006', parameter: '¿Tramos completamente funcionales?', category: 'functional', required: true, critical: true }
    ]
  },
  {
    toolType: 'ESCALERA PLEGABLE',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 8,
    parameters: [
      { id: 'ESCP-001', parameter: '¿Estado de los peldaños? Sin fisuras ni abolladuras', category: 'safety', required: true, critical: true },
      { id: 'ESCP-002', parameter: '¿Estado del mecanismo de bloqueo?', category: 'functional', required: true, critical: true },
      { id: 'ESCP-003', parameter: '¿Estado de aspecto y limpieza?', category: 'visual', required: false, critical: false },
      { id: 'ESCP-004', parameter: '¿Estado de las patas antideslizantes?', category: 'safety', required: true, critical: true },
      { id: 'ESCP-005', parameter: '¿Estado de los puntos de apoyo antideslizantes?', category: 'safety', required: true, critical: true },
      { id: 'ESCP-006', parameter: '¿Presencia de óxido?', category: 'visual', required: false, critical: false },
      { id: 'ESCP-007', parameter: '¿Presencia de partes sueltas?', category: 'safety', required: true, critical: true }
    ]
  },
  {
    toolType: 'ESCALERA TIPO TIJERA',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 8,
    parameters: [
      { id: 'ESCT-001', parameter: '¿Estado de la estructura?', category: 'safety', required: true, critical: true },
      { id: 'ESCT-002', parameter: '¿Estado de antideslizante?', category: 'safety', required: true, critical: true },
      { id: 'ESCT-003', parameter: '¿Estado de los escalones?', category: 'safety', required: true, critical: true },
      { id: 'ESCT-004', parameter: '¿Estado de las bisagras?', category: 'functional', required: true, critical: true },
      { id: 'ESCT-005', parameter: '¿Estado del seguro?', category: 'safety', required: true, critical: true },
      { id: 'ESCT-006', parameter: '¿Estado de los puntos de apoyo antideslizantes?', category: 'safety', required: true, critical: true },
      { id: 'ESCT-007', parameter: '¿Estado de las etiquetas de carga?', category: 'safety', required: true, critical: true },
      { id: 'ESCT-008', parameter: '¿Estado de aspecto y limpieza?', category: 'visual', required: false, critical: false }
    ]
  },
  {
    toolType: 'TALADRO ROTOMARTILLO',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 8,
    parameters: [
      { id: 'TAL-001', parameter: '¿Cable de alimentación en buen estado?', category: 'electrical', required: true, critical: true },
      { id: 'TAL-002', parameter: '¿Interruptor funciona correctamente?', category: 'functional', required: true, critical: true },
      { id: 'TAL-003', parameter: '¿Porta brocas seguro y sin desgaste?', category: 'functional', required: true, critical: true },
      { id: 'TAL-004', parameter: '¿Aislamiento eléctrico intacto?', category: 'electrical', required: true, critical: true },
      { id: 'TAL-005', parameter: '¿Ventilación libre de obstrucciones?', category: 'functional', required: false, critical: false }
    ]
  },
  {
    toolType: 'PULIDORA',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 12,
    parameters: [
      { id: 'PUL-001', parameter: 'Estado de conexiones eléctricas (extensiones, cables, toma)', category: 'electrical', required: true, critical: true },
      { id: 'PUL-002', parameter: 'Estado de instalación del disco (inserción)', category: 'safety', required: true, critical: true },
      { id: 'PUL-003', parameter: 'Acoples adecuados para los accesorios', category: 'functional', required: true, critical: true },
      { id: 'PUL-004', parameter: 'Estado e instalación del mango', category: 'functional', required: true, critical: false },
      { id: 'PUL-005', parameter: 'Estado del disco', category: 'safety', required: true, critical: true },
      { id: 'PUL-006', parameter: 'Uso de EPP adecuados para la labor', category: 'safety', required: true, critical: true },
      { id: 'PUL-007', parameter: 'Estado general de la pulidora (fisuras, roturas, aseo, etc)', category: 'visual', required: true, critical: false },
      { id: 'PUL-008', parameter: 'Estado de la guía del disco', category: 'safety', required: true, critical: true },
      { id: 'PUL-009', parameter: 'Se utiliza accesorios apropiados para las RPM(8500-15000)', category: 'safety', required: true, critical: true },
      { id: 'PUL-010', parameter: 'Estado del interruptor de encendido y su seguro', category: 'functional', required: true, critical: true },
      { id: 'PUL-011', parameter: 'Cualquier comisión a tierra', category: 'electrical', required: true, critical: true },
      { id: 'PUL-012', parameter: 'Cuenta con guarda de seguridad', category: 'safety', required: true, critical: true }
    ]
  },
  {
    toolType: 'BOMBA DE VACIO',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 10,
    parameters: [
      { id: 'BOM-001', parameter: 'Tapon de carga de aceite con fito de expulsión', category: 'functional', required: true, critical: true },
      { id: 'BOM-002', parameter: 'Tapon de protección con O´ring', category: 'functional', required: true, critical: false },
      { id: 'BOM-003', parameter: 'Manija de transporte', category: 'functional', required: true, critical: false },
      { id: 'BOM-004', parameter: 'Interruptor de encendido', category: 'functional', required: true, critical: true },
      { id: 'BOM-005', parameter: 'Visor del nivel de aceite', category: 'visual', required: true, critical: true },
      { id: 'BOM-006', parameter: 'Carcasa', category: 'visual', required: true, critical: false },
      { id: 'BOM-007', parameter: 'Cable de alimentación', category: 'electrical', required: true, critical: true },
      { id: 'BOM-008', parameter: 'Motor eléctrico con protector térmico', category: 'electrical', required: true, critical: true },
      { id: 'BOM-009', parameter: 'Bases antideslizantes', category: 'safety', required: true, critical: false }
    ]
  },
  {
    toolType: 'HIDROLAVADORA',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 10,
    parameters: [
      { id: 'HID-001', parameter: '¿Estado de las mangueras?', category: 'functional', required: true, critical: true },
      { id: 'HID-002', parameter: '¿Estado de las conexiones? Firmes y sin corrosión.', category: 'functional', required: true, critical: true },
      { id: 'HID-003', parameter: '¿Estado del motor?', category: 'functional', required: true, critical: true },
      { id: 'HID-004', parameter: '¿Presenta ruido anormal?', category: 'functional', required: true, critical: true },
      { id: 'HID-005', parameter: '¿Estado del interruptor?', category: 'functional', required: true, critical: true },
      { id: 'HID-006', parameter: '¿Estado del cable eléctrico?', category: 'electrical', required: true, critical: true },
      { id: 'HID-007', parameter: '¿Estado de Aseo externo?', category: 'visual', required: false, critical: false }
    ]
  },
  {
    toolType: 'ANDAMIOS',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 15,
    parameters: [
      { id: 'AND-001', parameter: '¿Estado de la estructura metálica? Sin deformaciones ni óxido.', category: 'safety', required: true, critical: true },
      { id: 'AND-002', parameter: '¿Estado de las plataformas? Firmes, completas y antideslizantes.', category: 'safety', required: true, critical: true },
      { id: 'AND-003', parameter: '¿Estado de las barandillas?', category: 'safety', required: true, critical: true },
      { id: 'AND-004', parameter: '¿Estado de los rodapiés?', category: 'safety', required: true, critical: true },
      { id: 'AND-004', parameter: '¿Estado de los anclajes?', category: 'safety', required: true, critical: true },
      { id: 'AND-004', parameter: '¿Estado de elementos de protección?', category: 'safety', required: true, critical: true },
      { id: 'AND-005', parameter: '¿Estado de Aseo externo?', category: 'visual', required: false, critical: false }
    ]
  },
  {
    toolType: 'ANEMOMETRO',
    toolCategory: 'INSTRUMENTOS',
    estimatedTime: 5,
    parameters: [
      { id: 'ANE-001', parameter: '¿Estado de la estructura?', category: 'visual', required: true, critical: false },
      { id: 'ANE-002', parameter: '¿Estado de la pantalla?', category: 'functional', required: true, critical: true },
      { id: 'ANE-003', parameter: '¿Estado de las etiquetas?', category: 'visual', required: false, critical: false },
      { id: 'ANE-004', parameter: '¿Estado del cableado?', category: 'electrical', required: true, critical: true },
      { id: 'ANE-005', parameter: '¿Estado de la batería?', category: 'functional', required: true, critical: true },
      { id: 'ANE-006', parameter: '¿Estado de Aseo externo?', category: 'visual', required: false, critical: false }
    ]
  },
  {
    toolType: 'PINZA VOLTIAMPERIMETRICA',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 5,
    parameters: [
      { id: 'PIN-001', parameter: '¿Estado de la estructura?', category: 'visual', required: true, critical: false },
      { id: 'PIN-002', parameter: '¿Estado de los cables?', category: 'electrical', required: true, critical: true },
      { id: 'PIN-003', parameter: '¿Estado de botones de función claros y accesibles?', category: 'functional', required: true, critical: true },
      { id: 'PIN-004', parameter: '¿Estado de la pantalla?', category: 'functional', required: true, critical: true },
      { id: 'PIN-005', parameter: '¿Estado de las puntas de prueba?', category: 'functional', required: true, critical: true },
      { id: 'PIN-006', parameter: '¿Estado de la batería?', category: 'functional', required: true, critical: true },
      { id: 'PIN-007', parameter: '¿Estado de aspecto y limpieza?', category: 'visual', required: false, critical: false }
    ]
  },
  {
    toolType: 'TERMOMETRO',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 5,
    parameters: [
      { id: 'TER-001', parameter: '¿Estado de la estructura?', category: 'visual', required: true, critical: false },
      { id: 'TER-002', parameter: '¿Estado de la pantalla?', category: 'functional', required: true, critical: true },
      { id: 'TER-003', parameter: '¿Estado de los botones?', category: 'functional', required: true, critical: true },
      { id: 'TER-004', parameter: '¿Estado de la carcasa?', category: 'visual', required: true, critical: false },
      { id: 'TER-005', parameter: '¿Estado nivel de batería?', category: 'functional', required: true, critical: true },
      { id: 'TER-006', parameter: '¿Estado de aspecto y limpieza?', category: 'visual', required: false, critical: false }
    ]
  },
  {
    toolType: 'EXTENSION ELECTRICA',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 3,
    parameters: [
      { id: 'EXT-001', parameter: '¿Estado del cable?', category: 'electrical', required: true, critical: true },
      { id: 'EXT-002', parameter: '¿Estado del enchufe y conector?', category: 'electrical', required: true, critical: true },
      { id: 'EXT-003', parameter: '¿Estado de terminales?', category: 'electrical', required: true, critical: true }
    ]
  },
  {
    toolType: 'SEGURO BREAKER',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 5,
    parameters: [
      { id: 'SEG-001', parameter: '¿Estado el mecanismo de sujeción?', category: 'functional', required: true, critical: true },
      { id: 'SEG-002', parameter: '¿Estado el orificio para candado?', category: 'functional', required: true, critical: true },
      { id: 'SEG-003', parameter: '¿Estado etiquetas o tags?', category: 'visual', required: false, critical: false },
      { id: 'SEG-004', parameter: '¿Sin grietas, deformaciones, piezas sueltas o rotas?', category: 'safety', required: true, critical: true },
      { id: 'SEG-005', parameter: 'Dispositivo limpio, sin restos de aceite, grasa o polvo que impidan su uso.', category: 'visual', required: false, critical: false },
      { id: 'SEG-006', parameter: '¿Estado de Aseo externo?', category: 'visual', required: false, critical: false }
    ]
  },
  {
    toolType: 'CAJA DE HERRAMIENTAS',
    toolCategory: 'HERRAMIENTAS',
    estimatedTime: 5,
    parameters: [
      { id: 'CAJ-001', parameter: '¿Cierre funcional/firme?', category: 'functional', required: true, critical: true },
      { id: 'CAJ-002', parameter: '¿Fisuras o golpes?', category: 'visual', required: true, critical: false },
      { id: 'CAJ-003', parameter: '¿Herramientas ordenadas?', category: 'visual', required: false, critical: false },
      { id: 'CAJ-004', parameter: '¿Estado de las herramienta? Sin deterioro ni oxido', category: 'functional', required: true, critical: true },
      { id: 'CAJ-005', parameter: '¿Estado del etiquetado?', category: 'visual', required: false, critical: false },
      { id: 'CAJ-006', parameter: '¿Estado de Aseo externo?', category: 'visual', required: false, critical: false }
    ]
  }
];

// Checklist por defecto
export function getDefaultChecklist(): ToolChecklist {
  return {
    toolType: 'HERRAMIENTA GENERAL',
    toolCategory: 'GENERAL',
    estimatedTime: 10,
    parameters: [
      { id: 'GEN-001', parameter: '¿Estado general del herramienta?', category: 'visual', required: true, critical: true },
      { id: 'GEN-002', parameter: '¿Funcionamiento básico operativo?', category: 'functional', required: true, critical: true },
      { id: 'GEN-003', parameter: '¿Condiciones de seguridad aceptables?', category: 'safety', required: true, critical: true }
    ]
  };
}

// Mapeo de tipos de herramienta
export const TOOL_TYPE_MAPPINGS: Record<string, string> = {
  'ESCALERA': 'ESCALERA',
  'ESCALERA PLEGABLE': 'ESCALERA PLEGABLE',
  'ESCALERA TIPO TIJERA': 'ESCALERA TIPO TIJERA',
  'TALADRO': 'TALADRO ROTOMARTILLO',
  'ROTOMARTILLO': 'TALADRO ROTOMARTILLO',
  'TALADRO ROTOMARTILLO': 'TALADRO ROTOMARTILLO',
  'PULIDORA': 'PULIDORA',
  'BOMBA DE VACIO': 'BOMBA DE VACIO',
  'HIDROLAVADORA': 'HIDROLAVADORA',
  'ANDAMIOS': 'ANDAMIOS',
  'ANDAMIO': 'ANDAMIOS',
  'ANEMOMETRO': 'ANEMOMETRO',
  'PINZA VOLTIAMPERIMETRICA': 'PINZA VOLTIAMPERIMETRICA',
  'TERMOMETRO': 'TERMOMETRO',
  'EXTENSION ELECTRICA': 'EXTENSION ELECTRICA',
  'EXTENSION': 'EXTENSION ELECTRICA',
  'SEGURO BREAKER': 'SEGURO BREAKER',
  'SEGURO PARA BLOQUEO DE BREAKER': 'SEGURO BREAKER',
  'CAJA DE HERRAMIENTAS': 'CAJA DE HERRAMIENTAS'
};

// Obtener checklist para un tipo de herramienta
export function getChecklistForTool(toolType: string): ToolChecklist {
  const normalizedType = toolType.toUpperCase().trim();

  // Buscar mapeo
  const mappedType = TOOL_TYPE_MAPPINGS[normalizedType];
  const searchType = mappedType || normalizedType;

  // Buscar checklist
  const checklist = TOOL_CHECKLISTS.find(
    checklist => checklist.toolType === searchType
  );

  // Si no encuentra, usar checklist por defecto
  return checklist || getDefaultChecklist();
}

// Exportar tipos
// ChecklistParameter is already exported where it is declared; redundant re-export removed.

