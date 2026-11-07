// Draws the "paper-motion" wordmark (Geist Serif) on a transparent canvas and
// returns it as a PNG data URL. LiquidMetal uses the alpha as the logo shape.
export async function wordmark({ text = 'paper-motion', size = 420, pad = 60 } = {}) {
  await document.fonts.load(`400 ${size}px GSerif`);
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `400 ${size}px GSerif`;
  const m = g.measureText(text);
  c.width = Math.ceil(m.width + pad * 2);
  c.height = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + pad * 2);
  g.font = `400 ${size}px GSerif`;
  g.letterSpacing = '-0.01em';
  g.fillStyle = '#fff';
  g.fillText(text, pad, pad + m.actualBoundingBoxAscent);
  return c.toDataURL('image/png');
}
