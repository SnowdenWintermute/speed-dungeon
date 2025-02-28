export function playBeep(frequency: number = 440, duration: number = 500) {
  // Create an audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Create an oscillator
  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine"; // You can change this to 'square', 'sawtooth', etc.
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequency in Hz

  // Connect the oscillator to the audio context's destination (speakers)
  oscillator.connect(audioContext.destination);

  // Start the oscillator
  oscillator.start();

  // Stop the oscillator after the specified duration
  setTimeout(() => {
    oscillator.stop();
  }, duration);
}
