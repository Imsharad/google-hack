import { Agent } from '@mariozechner/pi-agent-core';

const agent = new Agent();
console.log('Agent keys:', Object.keys(agent));
console.log('Agent prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(agent)));

// Check for "on", "emit", "hooks", "middleware"
if ('on' in agent) console.log('Agent has .on()');
if ('hooks' in agent) console.log('Agent has .hooks');
