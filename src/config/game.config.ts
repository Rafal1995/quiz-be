import { registerAs } from '@nestjs/config';

export default registerAs('game', () => ({
  roundRevealDelayMs: parseInt(process.env.ROUND_REVEAL_DELAY_MS || '5000', 10),
  maxPlayersDefault: parseInt(process.env.MAX_PLAYERS_DEFAULT || '5', 10),
}));
