// jest provides jsdom by default; ensure global document/window are available
beforeEach(() => {
  document.body.innerHTML = '';
});

test('confirmMessageSent resolves when input is cleared', async () => {
  const input = document.createElement('input');
  input.value = 'hello world';
  document.body.appendChild(input);

  // load the script to get helpers
  const helpers = require('../../content-enhanced.js');
  const { confirmMessageSent } = helpers;

  // Clear input after 100ms
  setTimeout(() => {
    input.value = '';
  }, 100);

  const result = await confirmMessageSent(input, 'hello world', 1000);
  expect(result).toBe(true);
});

test('confirmMessageSent resolves when message appears in DOM', async () => {
  const input = document.createElement('input');
  input.value = 'hello dom';
  document.body.appendChild(input);

  const helpers = require('../../content-enhanced.js');
  const { confirmMessageSent } = helpers;

  // Simulate message appearing elsewhere after 100ms
  setTimeout(() => {
    const div = document.createElement('div');
    div.className = 'message';
    div.textContent = '... hello dom ...';
    document.body.appendChild(div);
  }, 100);

  const result = await confirmMessageSent(input, 'hello dom', 500);
  expect(result).toBe(true);
});
