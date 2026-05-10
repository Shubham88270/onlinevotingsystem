import { io } from 'socket.io-client';
import { API_ORIGIN } from './api/config.js';

const SOCKET_URL = API_ORIGIN;
const socket = io(SOCKET_URL, { autoConnect: false });
export default socket;
