import axios from 'axios';

const userAgent = process.env.USER_AGENT;

if (!userAgent) {
  throw new Error('env.USER_AGENT is not set');
}

export const api = axios.create({
  headers: {
    'User-Agent': userAgent,
  },
});
