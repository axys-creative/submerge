import './style.css';
import { Game } from './game/game';

const game = new Game(document.getElementById('game') as HTMLCanvasElement);
game.start();

if (import.meta.env.DEV) (window as unknown as { game: Game }).game = game;

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
