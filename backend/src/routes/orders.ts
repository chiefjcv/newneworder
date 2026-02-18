import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { dbGet, dbAll, dbRun } from '../database.js';

const router = express.Router();

// Get all orders
router.get('/', async (req: AuthRequest, res) => {
  try {
    const orders = await dbAll(`
      SELECT 
        o.*,
        u.name as created_by_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.date_created DESC
    `);

    // Get comments for each order
    for (const order of orders) {
      const comments = await dbAll(`
        SELECT 
          c.*,
          u.name as user_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.order_id = $1
        ORDER BY c.created_at DESC
      `, [order.id]);

      order.comments = comments;
    }

    res.json(orders);
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const order = await dbGet(`
      SELECT 
        o.*,
        u.name as created_by_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
    `, [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get comments
    const comments = await dbAll(`
      SELECT 
        c.*,
        u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.order_id = $1
      ORDER BY c.created_at DESC
    `, [order.id]);

    // Get history
    const history = await dbAll(`
      SELECT 
        h.*,
        u.name as user_name
      FROM order_history h
      JOIN users u ON h.user_id = u.id
      WHERE h.order_id = $1
      ORDER BY h.created_at DESC
    `, [order.id]);

    order.comments = comments;
    order.history = history;

    res.json(order);
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { patient_name, patient_rx, due_date, status } = req.body;

    if (!patient_name || !due_date) {
      return res.status(400).json({ error: 'Patient name and due date are required' });
    }

    const result = await dbRun(
      `INSERT INTO orders (patient_name, patient_rx, due_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [patient_name, patient_rx || '', due_date, status || 'Open', req.userId]
    );

    // Log creation in history
    await dbRun(
      `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [result.lastID, req.userId, 'status', null, status || 'Open']
    );

    const order = await dbGet('SELECT * FROM orders WHERE id = $1', [result.lastID]);
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { patient_name, patient_rx, due_date, status } = req.body;
    const orderId = req.params.id;

    // Get current order
    const currentOrder = await dbGet('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order
    await dbRun(
      `UPDATE orders 
       SET patient_name = $1, patient_rx = $2, due_date = $3, status = $4
       WHERE id = $5`,
      [
        patient_name || currentOrder.patient_name,
        patient_rx !== undefined ? patient_rx : currentOrder.patient_rx,
        due_date || currentOrder.due_date,
        status !== undefined ? status : currentOrder.status,
        orderId
      ]
    );

    // Log changes in history
    if (status !== undefined && status !== currentOrder.status) {
      await dbRun(
        `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, req.userId, 'status', currentOrder.status, status]
      );
    }

    if (patient_name !== undefined && patient_name !== currentOrder.patient_name) {
      await dbRun(
        `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, req.userId, 'patient_name', currentOrder.patient_name, patient_name]
      );
    }

    if (due_date !== undefined && due_date !== currentOrder.due_date) {
      await dbRun(
        `INSERT INTO order_history (order_id, user_id, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, req.userId, 'due_date', currentOrder.due_date, due_date]
      );
    }

    const updatedOrder = await dbGet('SELECT * FROM orders WHERE id = $1', [orderId]);
    res.json(updatedOrder);
  } catch (error: any) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const orderId = req.params.id;
    const order = await dbGet('SELECT * FROM orders WHERE id = $1', [orderId]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await dbRun('DELETE FROM orders WHERE id = $1', [orderId]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment
router.post('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const { comment } = req.body;
    const orderId = req.params.id;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const order = await dbGet('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const result = await dbRun(
      'INSERT INTO comments (order_id, user_id, comment) VALUES ($1, $2, $3) RETURNING id',
      [orderId, req.userId, comment]
    );

    const newComment = await dbGet(`
      SELECT 
        c.*,
        u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.lastID]);

    res.status(201).json(newComment);
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

