// import { eq } from 'drizzle-orm';
// The 'pool' export will only exist for WebSocket and node-postgres drivers
// import { db, pool } from './db/db.js';
// import { demoUsers } from './schema.js';
import  express from "express";
import  {matchRouter} from "./routes/matches.js";

const app = express();

const port = 8000;

app.use(express.json());

app.use('/matches', matchRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
// async function main() {
//   try {
//     console.log('Performing CRUD operations...');
//
//     // CREATE: Insert a new user
//     const [newUser] = await db
//       .insert(demoUsers)
//       .values({ name: 'Admin User', email: 'admin@example.com' })
//       .returning();
//
//     if (!newUser) {
//       throw new Error('Failed to create user');
//     }
//
//     console.log('✅ CREATE: New user created:', newUser);
//
//     // READ: Select the user
//     const foundUser = await db.select().from(demoUsers).where(eq(demoUsers.id, newUser.id));
//     console.log('✅ READ: Found user:', foundUser[0]);
//
//     // UPDATE: Change the user's name
//     const [updatedUser] = await db
//       .update(demoUsers)
//       .set({ name: 'Super Admin' })
//       .where(eq(demoUsers.id, newUser.id))
//       .returning();
//
//     if (!updatedUser) {
//       throw new Error('Failed to update user');
//     }
//
//     console.log('✅ UPDATE: User updated:', updatedUser);
//
//     // DELETE: Remove the user
//     await db.delete(demoUsers).where(eq(demoUsers.id, newUser.id));
//     console.log('✅ DELETE: User deleted.');
//
//     console.log('\nCRUD operations completed successfully.');
//   } catch (error) {
//     console.error('❌ Error performing CRUD operations:', error);
//     process.exit(1);
//   } finally {
//     // If the pool exists, end it to close the connection
//     if (pool) {
//       await pool.end();
//       console.log('Database pool closed.');
//     }
//   }
// }
//
// main();
