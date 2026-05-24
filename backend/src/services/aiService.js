const suggestCategory = async (description, categories) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada');

  const categoryList = categories
    .map((c) => `ID:${c.id} → ${c.icon || ''} ${c.name}`)
    .join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-3-5-haiku-20241022',
      max_tokens: 60,
      messages: [{
        role:    'user',
        content: `Eres un asistente de categorización de gastos financieros personales. Dado el gasto, responde ÚNICAMENTE con el ID exacto de la categoría más apropiada. Si ninguna coincide, responde "none". Sin explicaciones, solo el ID.

Gasto: "${description}"

Categorías disponibles:
${categoryList}`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data     = await response.json();
  const rawId    = data.content?.[0]?.text?.trim() || '';
  const category = categories.find((c) => c.id === rawId);
  return category || null;
};

module.exports = { suggestCategory };
