const suggestCategory = async (description, categories) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada');

  // Usamos índice numérico en vez del ID largo para que Claude no se equivoque
  const categoryList = categories
    .map((c, i) => `${i + 1}. ${c.icon || ''} ${c.name}`)
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
      max_tokens: 10,
      messages: [{
        role:    'user',
        content: `Clasifica este gasto en una de las categorías. Responde SOLO con el número de la categoría más apropiada. Si ninguna aplica, responde 0.

Gasto: "${description}"

Categorías:
${categoryList}`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data  = await response.json();
  const raw   = data.content?.[0]?.text?.trim() || '0';
  const index = parseInt(raw, 10) - 1;

  if (index < 0 || index >= categories.length) return null;
  return categories[index] || null;
};

module.exports = { suggestCategory };
