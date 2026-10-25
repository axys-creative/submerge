import './style.css';
import { Game } from './game/game';

const game = new Game(document.getElementById('game') as HTMLCanvasElement);
game.start();

if (import.meta.env.DEV) (window as unknown as { game: Game }).game = game;
