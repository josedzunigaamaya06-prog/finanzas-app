# Lógica financiera real de FinanzasPro

Este documento describe cómo funciona **de verdad** la lógica de dinero en el backend de FinanzasPro (`backend/src/`), extraída directamente del código. Úsalo como fuente de verdad antes de opinar sobre si un cálculo está bien o mal — no asumas fórmulas de un libro de finanzas genérico sin confirmar primero contra el código real, porque los nombres de archivo o líneas exactas pueden haber cambiado desde que se escribió este documento.

## Índice
1. Deudas — tasas, riesgo, estrategias de pago
2. Score financiero (dos motores distintos)
3. Wallets — sincronización de balance
4. Presupuestos y alertas
5. Motor de recomendaciones
6. Categorización automática
7. Inconsistencias y bugs ya conocidos (revisar primero aquí)

---

## 1. Deudas (`src/services/debtService.js`, `src/controllers/debtController.js`)

**Conversión mensual ↔ anual (EA):** usa interés efectivo compuesto, no multiplicación simple:
- Anual efectiva desde mensual: `(1+r)^12 - 1`
- Mensual desde anual: `(1+r)^(1/12) - 1`

Esto es correcto para Colombia — los bancos reportan tasas en **EA (efectiva anual)**, no en "tasa nominal ×12" como en otros países.

**`interestType` (SIMPLE/COMPOUND):** existe en el schema pero el servicio de cálculo mensual (`calculateMonthlyInterest`) aplica la misma fórmula en ambas ramas — ver sección 7.

**Payoff (tiempo/total pagado):** simulación mes a mes, máx. 600 meses. Si `pagoMensual <= interésDelMes`, retorna `null` (la deuda nunca se paga con esa cuota — señal de alerta que vale la pena mostrar explícitamente al usuario).

**Nivel de riesgo (`riskLevel`)** — sobre la tasa anual efectiva, reglas por categoría:
- `INFORMAL` / `THIRD_PARTY_INTEREST` (gota a gota, tercero con interés): `>50%`→CRITICAL, si no siempre `HIGH` (nunca baja de HIGH — refleja que este tipo de deuda es intrínsecamente riesgosa sin importar la tasa exacta)
- `CREDIT_CARD`: `>35%`→CRITICAL, `>25%`→HIGH, si no→MEDIUM
- Otras categorías: `>50%`→CRITICAL, `>25%`→HIGH, `>15%`→MEDIUM, si no→LOW

**Estrategia "inteligente" (plan óptimo):** no es avalanche puro ni snowball puro. Prioriza por tabla de categoría (`INFORMAL:100, THIRD_PARTY_INTEREST:95, CREDIT_CARD:80, STORE_CREDIT:70, TELECOM:65, BANK_LOAN:50, VEHICLE:40, STUDENT_LOAN:35, MORTGAGE:30, THIRD_PARTY:20`) sumado a `min(tasaAnual, 50)`. Todo el excedente mensual disponible se destina íntegro a la deuda con mayor score; el resto recibe solo su cuota mínima. Esto significa que una deuda gota a gota pequeña se prioriza sobre una hipoteca grande con tasa baja — es una decisión de producto defendible (el riesgo de la deuda informal no es solo la tasa) pero debe explicarse así al usuario si pregunta "por qué esta y no la otra".

**Comparación de estrategias (`smart` / `avalanche` / `snowball`):** simulación mes a mes independiente por estrategia — `avalanche` ordena por tasa anual efectiva descendente, `snowball` por saldo ascendente, `smart` por la tabla de categoría. Todas aplican intereses a **todas** las deudas cada mes y destinan el excedente a la deuda prioritaria del momento.

---

## 2. Score financiero — DOS motores independientes (importante)

Hay **dos sistemas de "salud financiera" que no están unificados** y pueden dar lecturas distintas para el mismo usuario:

**A) `scoreController.getScore` (endpoint `/score`)** — aditivo sobre 100, suma 5 factores con techos: ahorro (25), presupuesto (20), fijos/variables (15), metas (20), deudas (20). Clasificación: `≥80` Excelente, `≥60` Bueno, `≥40` Regular, si no Crítico.

**B) `financialService.calculateFinancialScore` (usado en el Dashboard)** — empieza en 100 y **resta** penalizaciones por ahorro bajo, carga de deuda, tasa de interés promedio de deudas. Grade: `<40`F, `<55`D, `<70`C, `<85`B, si no A.

Si el usuario pregunta por qué su "score" o "salud financiera" parece contradictorio entre dos pantallas, esta es la razón — son dos cálculos distintos, no un bug de sincronización. Vale la pena señalarlo como oportunidad de unificación si el usuario está tocando esta parte de la app.

**Nota sobre B):** el promedio de tasas de interés que usa para penalizar mezcla tasas mensuales y anuales sin convertir todas a la misma base (usa el campo crudo `interestRate`) — ver bug en sección 7.

---

## 3. Wallets (`src/controllers/walletController.js` + `expenseController.js`/`incomeController.js`)

El balance de una wallet **no se recalcula por agregación** — es un contador incremental. Cada gasto/ingreso con `walletId` mueve el balance vía `prisma.$transaction` (crear gasto → `decrement`; crear ingreso → `increment`; editar revierte el efecto viejo y aplica el nuevo; eliminar revierte). Esto ya está bien hecho (atómico), pero significa que si algún día se permite editar un registro sin pasar por estos controllers (ej. un script de migración manual), el balance queda desincronizado sin que nada lo detecte — no hay reconciliación periódica.

---

## 4. Presupuestos y alertas

Un `Budget` no genera alertas por sí mismo. Dos mecanismos separados sí lo hacen:
1. **`checkBudgetAlert`** — se dispara (sin bloquear la respuesta) tras crear/editar/eliminar un gasto. `≥100%` del presupuesto → `BUDGET_EXCEEDED` (CRITICAL); `≥80%` → `SPENDING_ALERT` (HIGH); `<80%` → borra alertas viejas de esa categoría.
2. **`recommendationService.generateRecommendations`** — recalcula lo mismo cada vez que el usuario abre la pantalla de recomendaciones, y **puede pisar** la alerta puntual creada por el mecanismo anterior.

---

## 5. Motor de recomendaciones (`recommendationService.generateRecommendations`)

Se ejecuta completo cada vez que el usuario pide `GET /recommendations` — **borra todas** las recomendaciones existentes del usuario y las **recrea** desde cero (no es un historial acumulativo, es un cálculo on-demand). Tipos que sí se generan: `SPENDING_ALERT`, `CASH_FLOW_RISK`, `SAVINGS_OPPORTUNITY`, `EXPENSE_REDUCTION`, `DEBT_STRATEGY`, `BUDGET_EXCEEDED`, `GOAL_PROGRESS`, `DEBT_NEGOTIATION`, `PAYMENT_METHOD_INSIGHT`, `WALLET_LOW_BALANCE`. Los tipos `INCOME_GROWTH` y `GENERAL` existen en el enum del schema pero **ningún código los genera todavía** — son terreno libre si el usuario quiere agregar una recomendación nueva sin tener que crear un tipo desde cero.

Umbrales ya definidos que vale la pena conocer: gasto de categoría sube `>25%` mes a mes → alerta; `savingsRate<0` → riesgo de flujo crítico; `0≤savingsRate<10%` → oportunidad de ahorro; suscripciones `>5%` del ingreso → reducción de gasto; deuda con carga `totalMinimumPayment/ingreso>40%` → riesgo crítico; wallet con saldo `<$50.000 COP` (y no es efectivo) → saldo bajo.

---

## 6. Categorización automática

Tres sistemas independientes, sin retroalimentación cruzada entre sí:
- **`AutoRule`** (reglas manuales o aprendidas): coincidencia por palabra clave (`contains`/`starts_with`/`ends_with`/`equals`), primera regla activa que haga match gana (ordenadas por `priority`).
- **`CategoryPattern`** (aprendizaje): tras 3 gastos con la misma palabra clave (≥4 letras, sin stopwords en español) asociados a la misma categoría, se crea automáticamente una `AutoRule` nueva.
- **IA (`aiService.suggestCategory`)**: llamada en vivo a Claude Haiku, sugiere categoría antes de guardar. No aprende ni crea reglas — es un asistente puntual independiente de los otros dos sistemas.

---

## 7. Inconsistencias y bugs ya conocidos (revisar aquí primero)

Antes de asumir que un comportamiento raro es nuevo, confirma si es uno de estos (ya presentes en el código, no introducidos por una sesión reciente):

1. **SIMPLE vs COMPOUND no se diferencian en el cálculo real.** `calculateMonthlyInterest` aplica la misma fórmula (`saldo × tasaMensual`) en ambas ramas del `if`. La diferenciación matemática entre interés simple y compuesto solo tendría sentido acumulada mes a mes sobre el saldo creciente, y el código ya hace eso implícitamente en la simulación de payoff — pero el campo `interestType` en sí no cambia el resultado numérico en ningún punto. Si el usuario pregunta "¿por qué mi deuda simple se comporta igual que la compuesta?", esta es la causa raíz.

2. **`DEBT_STRATEGY` en el motor de recomendaciones usa la tasa cruda sin convertir a anual efectiva** (`interestRate > 0.25` directo), mientras que `DEBT_NEGOTIATION` sí usa `toAnnualRate` correctamente. Si una deuda tiene `interestPeriod: MONTHLY`, una tasa mensual de 2.5% (`0.025`) nunca activaría esta alerta aunque su equivalente anual (34%) sí debería — o al revés, si alguien guarda una tasa ya en formato "porcentaje entero /100" mal escalado. Vale la pena unificar ambos bloques para que usen la misma conversión.

3. **El registro de pago de deuda (`addPayment`) no usa `$transaction`** — son dos operaciones separadas (crear `DebtPayment` + actualizar `currentBalance`), a diferencia del patrón ya establecido en wallets/gastos/ingresos que sí es atómico. Riesgo bajo pero real de balance de deuda desincronizado si una de las dos falla a mitad de camino.

4. **Dos motores de score no unificados** (ver sección 2) — no es un bug per se, pero puede confundir al usuario si los compara.

5. **Las recomendaciones se borran y recalculan en cada `GET`** — un endpoint de lectura con efecto secundario de escritura completa. Funciona, pero no es el patrón más limpio si en el futuro se quiere agregar historial o marcar recomendaciones descartadas de forma persistente (hoy `isDismissed` se pierde en el próximo recálculo si la condición que la generó sigue activa).
