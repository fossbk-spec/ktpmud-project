import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const farms = sqliteTable('farm_documents', {
  farmId: text('farm_id').primaryKey(),
  payload: text('payload').notNull(),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
});
export const users=sqliteTable('auth_users',{
 id:text('id').primaryKey(),farmId:text('farm_id').notNull(),username:text('username').notNull(),passwordHash:text('password_hash').notNull(),fullName:text('full_name').notNull(),role:text('role').notNull(),workerId:text('worker_id'),
},t=>[uniqueIndex('users_farm_username').on(t.farmId,t.username),index('users_worker').on(t.farmId,t.workerId)]);
export const sessions=sqliteTable('auth_sessions',{
 tokenHash:text('token_hash').primaryKey(),userId:text('user_id').notNull(),expiresAt:integer('expires_at').notNull(),
},t=>[index('sessions_user').on(t.userId)]);
export const attempts=sqliteTable('auth_attempts',{
 attemptKey:text('attempt_key').primaryKey(),failures:integer('failures').notNull(),resetAt:integer('reset_at').notNull(),
});
export const accessCodes=sqliteTable('farm_access_codes',{
 farmCode:text('farm_code').primaryKey(),farmId:text('farm_id').notNull(),
},t=>[uniqueIndex('codes_farm').on(t.farmId)]);
