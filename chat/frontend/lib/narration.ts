export interface NarrationProvider {
  available(): boolean;
  speak(text: string, onEnd: () => void, onError: () => void): void;
  pause(): void;
  resume(): void;
  cancel(): void;
}
export class BrowserNarration implements NarrationProvider {
  available() { return typeof window !== "undefined" && "speechSynthesis" in window; }
  speak(text: string, onEnd: () => void, onError: () => void) {
    if (!this.available()) return onError();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.96;
    const voice = window.speechSynthesis.getVoices().find(v => v.localService && v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.onend = onEnd;
    utterance.onerror = e => { if (e.error !== "canceled" && e.error !== "interrupted") onError(); };
    window.speechSynthesis.speak(utterance);
  }
  pause() { if (this.available()) window.speechSynthesis.pause(); }
  resume() { if (this.available()) window.speechSynthesis.resume(); }
  cancel() { if (this.available()) window.speechSynthesis.cancel(); }
}
