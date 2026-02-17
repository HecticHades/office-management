// Re-export getSession from session module for backwards compatibility
// Some files import from '@/lib/auth/middleware', others from '@/lib/auth/session'
export { getSession } from './session';
