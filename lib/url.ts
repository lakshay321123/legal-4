import { isIP } from 'node:net';

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0);
}

const privateRanges: Array<[number, number]> = [
  [ipToLong('10.0.0.0'), ipToLong('10.255.255.255')],
  [ipToLong('127.0.0.0'), ipToLong('127.255.255.255')],
  [ipToLong('169.254.0.0'), ipToLong('169.254.255.255')],
  [ipToLong('172.16.0.0'), ipToLong('172.31.255.255')],
  [ipToLong('192.168.0.0'), ipToLong('192.168.255.255')],
];

function isPrivateIPv4(ip: string): boolean {
  const long = ipToLong(ip);
  return privateRanges.some(([start, end]) => long >= start && long <= end);
}

function isPrivateIPv6(ip: string): boolean {
  const h = ip.toLowerCase();
  return h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80');
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost') return false;

    const nakedHost = hostname.startsWith('[') && hostname.endsWith(']')
      ? hostname.slice(1, -1)
      : hostname;
    const ipVersion = isIP(nakedHost);
    if (ipVersion === 4 && isPrivateIPv4(nakedHost)) return false;
    if (ipVersion === 6 && isPrivateIPv6(nakedHost)) return false;

    return true;
  } catch {
    return false;
  }
}
