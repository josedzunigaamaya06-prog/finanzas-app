# Contexto financiero colombiano

Conocimiento general (no específico del código) para que las sugerencias tengan sentido para un usuario colombiano promedio, que es el público de FinanzasPro. Úsalo como lente al evaluar copys, defaults, umbrales y ejemplos — no como fórmulas a implementar literalmente sin verificar contra el código.

## Tasas de interés
- En Colombia el estándar legal y bancario es la **EA (efectiva anual)** — es lo que aparece en el contrato de una tarjeta de crédito o crédito de consumo, no una "tasa nominal". Si una sugerencia habla de tasas, debe hablar en EA por defecto, no en APR ni en "tasa nominal mensual ×12".
- La Superintendencia Financiera publica una **tasa de usura** (límite legal) que cambia trimestralmente; créditos de consumo suelen rondar 25-40% EA, tarjetas de crédito con tasas altas pueden acercarse al límite de usura. No hace falta un número exacto y actualizado para dar una recomendación de producto, pero si el usuario pide un número preciso y actual, acláralo como aproximado y sugiere verificar la tasa vigente.
- El **"gota a gota" o préstamo informal** no es solo "una tasa alta" — suele operar fuera del sistema financiero regulado, con cobros diarios y a veces coacción. Un mensaje sobre este tipo de deuda debe priorizar salir de ella (aunque implique un crédito formal más caro) por encima de la comparación matemática pura de tasas.

## Medios de pago y hábitos
- **Nequi, Daviplata, Bancolombia a la mano** y billeteras digitales similares son el equivalente colombiano a "dinero en cuenta" para buena parte de la población, incluida gente sin cuenta bancaria tradicional — tenlo en cuenta al hablar de "billeteras digitales" vs "efectivo".
- Ciclos de pago comunes: **quincenal** (15 y 30) es tan común como mensual, especialmente en salarios operativos/no ejecutivos. Una sugerencia de presupuesto o fecha de pago que asuma "un solo ingreso mensual" puede no encajar con el usuario real.
- El **salario mínimo** y el auxilio de transporte son referencias culturales comunes al hablar de "gastos fijos razonables" — no hace falta el valor exacto vigente, pero sí evitar ejemplos con cifras que claramente no correspondan a la realidad económica colombiana (ej. usar cifras de gasto mensual en dólares o con órdenes de magnitud de otro país).

## Moneda y formato
- Moneda: **COP**. Formato de número colombiano usa punto como separador de miles y coma para decimales (ej. `$1.250.000,50`), al contrario de EE.UU. — aunque en la práctica muchas apps colombianas simplifican mostrando solo el separador de miles sin decimales para montos grandes (`$1.250.000`). Si sugieres un formato de número, prioriza que se vea "familiar" para un usuario colombiano.

## Tono financiero
- La educación financiera formal no es universal — evita asumir que el usuario conoce términos técnicos (EA, amortización, capitalización) sin una breve aclaración la primera vez que aparecen en la interfaz.
- Habla de dinero en pesos con montos realistas: usar "$50.000" o "$2.000.000" como ejemplo se siente más creíble que "$1.234,56" (que suena a ejemplo genérico traducido de otro país).
